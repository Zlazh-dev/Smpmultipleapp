"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface FaceVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onVerified: (coords: { latitude: number; longitude: number }) => void;
}

type Step = "gps" | "camera" | "verifying" | "success" | "failed" | "not-registered";

export function FaceVerifyDialog({
  open,
  onOpenChange,
  userId,
  onVerified,
}: FaceVerifyDialogProps) {
  const [step, setStep] = useState<Step>("gps");
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      stopCamera();
      setStep("gps");
      setGpsCoords(null);
      setModelsLoaded(false);
      setFaceDetected(false);
      setErrorMsg("");
    }
  }, [open, stopCamera]);

  // Step 1: Request GPS
  const requestGPS = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation tidak didukung"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });
      setGpsCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setStep("camera");
      startCamera();
    } catch (err: any) {
      if (err.code === 1) setErrorMsg("Izin lokasi ditolak. Aktifkan GPS.");
      else if (err.code === 2) setErrorMsg("Lokasi tidak tersedia.");
      else if (err.code === 3) setErrorMsg("Timeout mendapatkan lokasi.");
      else setErrorMsg(err.message || "Gagal mendapatkan lokasi");
    }
  };

  // Step 2: Start camera + load models
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 320 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Load face-api models in parallel
      const { loadFaceModels } = await import("@/lib/face-utils");
      await loadFaceModels();
      setModelsLoaded(true);

      // Start face detection loop
      detectFaceLoop();
    } catch (err: any) {
      setErrorMsg("Kamera tidak tersedia: " + (err.message || ""));
      setStep("failed");
    }
  };

  // Continuously detect face in video feed
  const detectFaceLoop = async () => {
    const { getFaceDescriptor } = await import("@/lib/face-utils");

    const loop = async () => {
      if (!videoRef.current || !streamRef.current) return;

      const descriptor = await getFaceDescriptor(videoRef.current);
      setFaceDetected(!!descriptor);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    // Wait a bit for video to stabilize
    setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(loop);
    }, 500);
  };

  // Step 3: Capture and verify
  const handleVerify = async () => {
    if (!videoRef.current) return;
    setStep("verifying");

    try {
      const { getFaceDescriptor } = await import("@/lib/face-utils");
      const descriptor = await getFaceDescriptor(videoRef.current);

      if (!descriptor) {
        setErrorMsg("Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.");
        setStep("camera");
        return;
      }

      // Send to API
      const res = await fetch("/api/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawaiId: userId,
          descriptor: Array.from(descriptor),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.notRegistered) {
          setErrorMsg(data.message);
          setStep("not-registered");
          stopCamera();
          return;
        }
        setErrorMsg(data.error || "Gagal verifikasi");
        setStep("failed");
        stopCamera();
        return;
      }

      if (data.match) {
        setStep("success");
        stopCamera();
        toast.success(`Verifikasi berhasil! Halo, ${data.name}`);

        // Auto-proceed after brief delay
        setTimeout(() => {
          if (gpsCoords) {
            onVerified(gpsCoords);
          }
          onOpenChange(false);
        }, 1500);
      } else {
        setErrorMsg(`Wajah tidak cocok (jarak: ${data.distance}). Coba lagi.`);
        setStep("camera");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal verifikasi");
      setStep("failed");
      stopCamera();
    }
  };

  // Auto-request GPS when dialog opens
  useEffect(() => {
    if (open && step === "gps") {
      requestGPS();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Verifikasi Wajah
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step: GPS */}
          {step === "gps" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">Meminta akses lokasi...</p>
              {errorMsg && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-500">{errorMsg}</p>
                  <Button size="sm" variant="outline" onClick={() => { setErrorMsg(""); requestGPS(); }}>
                    Coba Lagi
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step: Camera / Selfie */}
          {(step === "camera" || step === "verifying") && (
            <div className="space-y-3">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                {/* Face detection overlay */}
                <div
                  className={`absolute inset-0 border-4 rounded-lg transition-colors duration-300 ${
                    faceDetected ? "border-emerald-500" : "border-transparent"
                  }`}
                />
                {/* Center guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`w-48 h-48 rounded-full border-2 border-dashed transition-colors duration-300 ${
                      faceDetected ? "border-emerald-500/50" : "border-white/30"
                    }`}
                  />
                </div>
                {/* Loading models indicator */}
                {!modelsLoaded && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Memuat model AI...</p>
                    </div>
                  </div>
                )}
                {/* Verifying overlay */}
                {step === "verifying" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Memverifikasi wajah...</p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {faceDetected ? (
                  <span className="text-emerald-500 font-medium">✓ Wajah terdeteksi</span>
                ) : (
                  "Posisikan wajah Anda dalam lingkaran"
                )}
              </p>

              {errorMsg && <p className="text-center text-xs text-amber-500">{errorMsg}</p>}

              <Button
                className="w-full cursor-pointer"
                disabled={!faceDetected || !modelsLoaded || step === "verifying"}
                onClick={handleVerify}
              >
                {step === "verifying" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memverifikasi...</>
                ) : (
                  <><Camera className="h-4 w-4 mr-2" /> Verifikasi Wajah</>
                )}
              </Button>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <p className="text-lg font-semibold">Verifikasi Berhasil!</p>
              <p className="text-sm text-muted-foreground">Melanjutkan presensi...</p>
            </div>
          )}

          {/* Step: Failed */}
          {step === "failed" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <p className="text-lg font-semibold">Verifikasi Gagal</p>
              <p className="text-sm text-muted-foreground text-center">{errorMsg}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
                Tutup
              </Button>
            </div>
          )}

          {/* Step: Not Registered */}
          {step === "not-registered" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
              </div>
              <p className="text-lg font-semibold text-center">Wajah Belum Terdaftar</p>
              <p className="text-sm text-muted-foreground text-center">
                Kamu harus registrasi wajah dahulu atau hubungi admin segera.
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
                Tutup
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
