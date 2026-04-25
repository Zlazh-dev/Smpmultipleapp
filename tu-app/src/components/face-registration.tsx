"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  ShieldCheck,
  Trash2,
  Clock,
  ShieldAlert,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface FaceRegistrationProps {
  pegawaiId: string;
  hasFace: boolean;
  facePhoto?: string | null;
  faceVerified?: boolean;
  /** true when the logged-in user is viewing their own profile */
  isSelf?: boolean;
  /** true when the logged-in user is admin (KHUSUS) */
  isAdmin?: boolean;
}

export function FaceRegistration({
  pegawaiId,
  hasFace,
  facePhoto,
  faceVerified = false,
  isSelf = false,
  isAdmin = false,
}: FaceRegistrationProps) {
  const [mode, setMode] = useState<"idle" | "camera" | "uploading" | "processing">("idle");
  const [registered, setRegistered] = useState(hasFace);
  const [verified, setVerified] = useState(faceVerified);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    facePhoto ? `/api/face/photo/${pegawaiId}` : null
  );
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canRegister = isAdmin || isSelf;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    setMode("camera");
    setFaceDetected(false);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 320 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Load models
      const { loadFaceModels } = await import("@/lib/face-utils");
      await loadFaceModels();
      setModelsLoaded(true);

      // Start detection loop
      const { getFaceDescriptor } = await import("@/lib/face-utils");
      const loop = async () => {
        if (!videoRef.current || !streamRef.current) return;
        if (videoRef.current.readyState < 2) {
          if (streamRef.current) requestAnimationFrame(loop);
          return;
        }
        const d = await getFaceDescriptor(videoRef.current);
        setFaceDetected(!!d);
        if (streamRef.current) requestAnimationFrame(loop);
      };
      setTimeout(() => requestAnimationFrame(loop), 500);
    } catch (err: any) {
      toast.error("Kamera tidak tersedia: " + (err.message || ""));
      setMode("idle");
    }
  };

  // Capture photo from video as base64
  const capturePhotoFromVideo = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Mirror the image to match the video display
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  // Register from camera
  const captureAndRegister = async () => {
    if (!videoRef.current) return;

    try {
      const { getFaceDescriptor } = await import("@/lib/face-utils");
      const descriptor = await getFaceDescriptor(videoRef.current);

      if (!descriptor) {
        toast.error("Wajah tidak terdeteksi. Coba lagi.");
        return;
      }

      // Capture the photo before stopping camera
      const photo = capturePhotoFromVideo();
      setCapturedPhoto(photo);

      setMode("processing");
      stopCamera();
      await saveDescriptor(Array.from(descriptor), photo);
    } catch (err: any) {
      toast.error(err.message || "Gagal mendaftarkan wajah");
      setMode("camera");
    }
  };

  // Register from uploaded photo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    setMode("processing");

    try {
      const { loadFaceModels, getFaceDescriptor } = await import("@/lib/face-utils");
      await loadFaceModels();

      const img = new Image();
      img.crossOrigin = "anonymous";
      const url = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gagal memuat gambar"));
        img.src = url;
      });

      const descriptor = await getFaceDescriptor(img);
      URL.revokeObjectURL(url);

      if (!descriptor) {
        toast.error("Wajah tidak terdeteksi dalam foto. Gunakan foto close-up wajah yang jelas.");
        setMode("idle");
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      const photoBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setCapturedPhoto(photoBase64);
      await saveDescriptor(Array.from(descriptor), photoBase64);
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses foto");
      setMode("idle");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveDescriptor = async (descriptor: number[], photo?: string | null) => {
    const res = await fetch("/api/face/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pegawaiId, descriptor, photo }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Gagal mendaftarkan wajah");
      setMode("idle");
      return;
    }

    toast.success(data.message || "Wajah berhasil didaftarkan!");
    setRegistered(true);
    setVerified(data.verified ?? isAdmin);
    setPhotoUrl(`/api/face/photo/${pegawaiId}?t=${Date.now()}`);
    setMode("idle");
  };

  // Admin: approve face
  const handleApprove = async () => {
    try {
      const res = await fetch("/api/face/verify-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pegawaiId, verified: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerified(true);
        toast.success(data.message || "Wajah diverifikasi");
      } else {
        toast.error(data.error || "Gagal verifikasi");
      }
    } catch {
      toast.error("Gagal verifikasi wajah");
    }
  };

  // Admin: reject face
  const handleReject = async () => {
    if (!confirm("Tolak registrasi wajah ini? Pegawai harus mendaftar ulang.")) return;
    try {
      const res = await fetch("/api/face/verify-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pegawaiId, verified: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegistered(false);
        setVerified(false);
        setPhotoUrl(null);
        setCapturedPhoto(null);
        toast.success(data.message || "Registrasi ditolak");
      } else {
        toast.error(data.error || "Gagal menolak");
      }
    } catch {
      toast.error("Gagal menolak registrasi");
    }
  };

  // Admin: delete face
  const handleDeleteFace = async () => {
    if (!confirm("Hapus data wajah? Pegawai tidak bisa presensi sampai didaftarkan ulang.")) return;
    try {
      const res = await fetch("/api/face/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pegawaiId, descriptor: [] }),
      });
      if (res.ok) {
        setRegistered(false);
        setVerified(false);
        setPhotoUrl(null);
        setCapturedPhoto(null);
        toast.success("Data wajah dihapus");
      }
    } catch {
      toast.error("Gagal menghapus data wajah");
    }
  };

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Face Recognition
      </h3>
      <div className="rounded-lg border border-border/50 p-4 space-y-3">
        {/* ── Registered + Verified ── */}
        {registered && verified && mode === "idle" && (
          <div className="space-y-3">
            {/* Photo preview */}
            {photoUrl && (
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-emerald-500/30 shadow-sm">
                  <img
                    src={photoUrl}
                    alt="Foto wajah"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  Wajah terverifikasi
                </span>
              </div>
              {(isAdmin || isSelf) && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs cursor-pointer" onClick={startCamera}>
                    <Camera className="h-3 w-3 mr-1" /> Ganti
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 cursor-pointer" onClick={handleDeleteFace}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Registered + Pending Verification ── */}
        {registered && !verified && mode === "idle" && (
          <div className="space-y-3">
            {/* Photo preview */}
            {photoUrl && (
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-amber-500/30 shadow-sm">
                  <img
                    src={photoUrl}
                    alt="Foto wajah (menunggu verifikasi)"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 text-white text-[9px] font-medium text-center py-0.5">
                    Menunggu Verifikasi
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  Menunggu verifikasi admin
                </span>
              </div>
              {isSelf && !isAdmin && (
                <Button variant="outline" size="sm" className="h-7 text-xs cursor-pointer" onClick={startCamera}>
                  <Camera className="h-3 w-3 mr-1" /> Ganti
                </Button>
              )}
            </div>

            {/* Admin approve/reject buttons */}
            {isAdmin && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  onClick={handleApprove}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Verifikasi
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-red-500 hover:text-red-600 border-red-500/30 hover:bg-red-500/10 cursor-pointer"
                  onClick={handleReject}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" /> Tolak
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Not Registered ── */}
        {!registered && mode === "idle" && (
          <div className="text-center space-y-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 mx-auto">
              {canRegister ? (
                <ShieldCheck className="h-5 w-5 text-amber-500" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {canRegister
                ? "Wajah belum terdaftar. Daftarkan wajah untuk presensi."
                : "Wajah belum terdaftar. Hubungi admin atau daftarkan di profil Anda."
              }
            </p>
            {canRegister && (
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={startCamera}>
                  <Camera className="h-3.5 w-3.5 mr-1.5" /> Kamera
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Foto
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Camera mode */}
        {mode === "camera" && (
          <div className="space-y-2">
            <div className="relative aspect-square max-w-[280px] mx-auto rounded-lg overflow-hidden bg-muted">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div
                className={`absolute inset-0 border-4 rounded-lg transition-colors duration-300 ${
                  faceDetected ? "border-emerald-500" : "border-transparent"
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`w-36 h-36 rounded-full border-2 border-dashed transition-colors duration-300 ${
                    faceDetected ? "border-emerald-500/50" : "border-white/30"
                  }`}
                />
              </div>
              {!modelsLoaded && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                    <p className="text-xs">Memuat model AI...</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {faceDetected ? (
                <span className="text-emerald-500 font-medium">✓ Wajah terdeteksi</span>
              ) : (
                "Posisikan wajah dalam lingkaran"
              )}
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => { stopCamera(); setMode("idle"); }}
              >
                Batal
              </Button>
              <Button
                size="sm"
                className="cursor-pointer"
                disabled={!faceDetected || !modelsLoaded}
                onClick={captureAndRegister}
              >
                <Camera className="h-3.5 w-3.5 mr-1" /> Daftarkan
              </Button>
            </div>
          </div>
        )}

        {/* Processing */}
        {mode === "processing" && (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memproses wajah...</p>
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileUpload}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
