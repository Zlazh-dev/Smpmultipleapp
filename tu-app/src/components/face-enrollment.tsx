"use client";

import { createPortal } from "react-dom";

import { useState, useRef, useEffect } from "react";
import { Camera, RefreshCcw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loadFaceModels, checkFaceQuality, getFaceDescriptor } from "@/lib/face-utils";

export type FaceEnrollmentStatus = "NOT_REGISTERED" | "SUBMITTED" | "APPROVED" | "REJECTED";

interface FaceEnrollmentData {
  id?: string;
  status: FaceEnrollmentStatus;
  approvedPhotoUrl?: string;
  pendingPhotoUrl?: string;
  rejectionReason?: string;
}

export function FaceEnrollment({ initialData }: { initialData: FaceEnrollmentData }) {
  const [data, setData] = useState<FaceEnrollmentData>(initialData);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationMsg, setValidationMsg] = useState("Memuat model kamera...");
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const stableStartTimeRef = useRef<number | null>(null);
  const cameraStartTimeRef = useRef<number>(0);

  const getPhotoUrl = (type: "approved" | "pending") => {
    if (!data.id) return null;
    return `/api/face/enrolled-photo/${data.id}?type=${type}&t=${Date.now()}`;
  };

  const hasApproved = data.status === "APPROVED" && data.approvedPhotoUrl;
  const isPending = data.status === "SUBMITTED" || (data.status === "APPROVED" && data.pendingPhotoUrl);
  const isRejected = data.status === "REJECTED";

  const displayPhotoUrl = (() => {
    if (hasApproved && data.id) return getPhotoUrl("approved");
    if (isPending && data.id) {
      if (data.pendingPhotoUrl) return getPhotoUrl("pending");
      if (data.approvedPhotoUrl) return getPhotoUrl("approved");
    }
    return null;
  })();

  const startCamera = async () => {
    setIsCapturing(true);
    setPreviewUrl(null);
    setValidationMsg("Meminta akses kamera...");
    setIsReady(false);
    setCountdown(null);
    setShowFallback(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setValidationMsg("Memuat model cerdas...");
      await loadFaceModels();
      cameraStartTimeRef.current = Date.now();
      stableStartTimeRef.current = null;
      detectLoop();
    } catch (err) {
      toast.error("Akses kamera ditolak. Harap izinkan akses kamera.");
      setIsCapturing(false);
    }
  };

  const detectLoop = async () => {
    if (!videoRef.current) return;
    const result = await checkFaceQuality(videoRef.current);
    if (Date.now() - cameraStartTimeRef.current > 15000) setShowFallback(true);
    if (result.isValid) {
      if (!stableStartTimeRef.current) {
        stableStartTimeRef.current = Date.now();
        setCountdown(2);
      } else {
        const elapsed = Date.now() - stableStartTimeRef.current;
        if (elapsed > 2000) { stableStartTimeRef.current = null; setCountdown(null); capturePhoto(); return; }
        else if (elapsed > 1000) setCountdown(1);
      }
      setValidationMsg(result.message);
      setIsReady(true);
    } else {
      stableStartTimeRef.current = null;
      setCountdown(null);
      setValidationMsg(result.message);
      setIsReady(false);
    }
    animFrameRef.current = requestAnimationFrame(detectLoop);
  };

  const stopCamera = () => {
    cancelAnimationFrame(animFrameRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current, c = canvasRef.current;
      c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      if (ctx) { ctx.drawImage(v, 0, 0, c.width, c.height); setPreviewUrl(c.toDataURL("image/jpeg", 0.9)); stopCamera(); }
    }
  };

  const submitPhoto = async () => {
    if (!previewUrl) return;
    setIsSubmitting(true);
    try {
      await loadFaceModels();
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(); img.src = previewUrl; });
      const descriptor = await getFaceDescriptor(img);
      if (!descriptor) { toast.error("Wajah tidak terdeteksi. Silakan coba lagi."); setIsSubmitting(false); return; }
      const res = await fetch("/api/profile/face/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoData: previewUrl, descriptor: Array.from(descriptor) }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Gagal mengirim foto"); }
      const result = await res.json();
      const newStatus = data.status === "APPROVED" ? "APPROVED" : "SUBMITTED";
      setData(prev => ({ ...prev, id: result.id, status: newStatus as FaceEnrollmentStatus, pendingPhotoUrl: result.pendingPhotoUrl, rejectionReason: undefined }));
      setPreviewUrl(null);
      toast.success(data.status === "APPROVED" ? "Foto baru dikirim. Presensi tetap aktif." : "Foto telah dikirim untuk divalidasi admin.");
    } catch (err: any) { toast.error(err.message || "Terjadi kesalahan."); }
    finally { setIsSubmitting(false); }
  };

  useEffect(() => { return () => stopCamera(); }, []);

  // ========== CIRCULAR FACE PHOTO ==========
  const renderFaceCircle = () => (
    <div className="relative">
      {/* Outer ring based on status */}
      <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full p-[3px] mx-auto ${
        hasApproved && !data.pendingPhotoUrl
          ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
          : isPending
          ? "bg-gradient-to-br from-amber-400 to-orange-500"
          : isRejected
          ? "bg-gradient-to-br from-red-400 to-red-600"
          : "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700"
      }`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-muted relative">
          {displayPhotoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={displayPhotoUrl} 
                alt="Foto Wajah" 
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isPending && !hasApproved ? "blur-[4px] scale-110" : ""
                }`}
              />
              {/* Pending spinner overlay */}
              {isPending && !hasApproved && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-full">
                  <div className="w-8 h-8 rounded-full border-[2.5px] border-white/30 border-t-white animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
        </div>
      </div>

      {/* Verified badge */}
      {hasApproved && !data.pendingPhotoUrl && (
        <div className="absolute -bottom-1 -right-1 md:bottom-0 md:right-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg ring-[3px] ring-white dark:ring-gray-900">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Pending badge */}
      {isPending && (
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg ring-[3px] ring-white dark:ring-gray-900">
          <RefreshCcw className="w-4 h-4 text-white animate-spin" />
        </div>
      )}
    </div>
  );

  // ========== ACTION BUTTON ==========
  const renderActionButton = () => {
    if (data.status === "SUBMITTED" && !hasApproved) return null; // waiting, no action needed
    
    return (
      <button
        onClick={startCamera}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Camera className="w-3.5 h-3.5" />
        {!displayPhotoUrl ? "Ambil Foto" : data.status === "APPROVED" ? "Perbarui Foto" : "Ambil Foto Baru"}
      </button>
    );
  };

  // ========== BOTTOM SHEET CAMERA (portal) ==========
  const renderSheet = () => {
    if (!isCapturing && !previewUrl) return null;

    const sheetContent = (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 z-[9999] transition-opacity"
          onClick={() => { if (!isSubmitting) { stopCamera(); setPreviewUrl(null); }}}
        />

        {/* Bottom sheet (mobile) / Modal (desktop) */}
        <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-background rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-hidden md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-3xl md:max-h-[90vh]">
          {/* Handle bar (mobile) */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>

          <div className="p-4 pb-6 md:p-6 space-y-4">
            <h3 className="text-center font-semibold text-base">
              {previewUrl ? "Konfirmasi Foto" : "Ambil Foto Wajah"}
            </h3>

            {/* Circular viewfinder / preview */}
            <div className="flex justify-center">
              <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden bg-black">
                {previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                    
                    {/* Guide ring */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <div className={`w-[90%] h-[90%] rounded-full border-[3px] transition-all duration-300 ${
                        isReady ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]" : "border-white/30"
                      }`} />
                      {countdown !== null && (
                        <span className="absolute text-emerald-400 text-5xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-pulse">{countdown}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Status message */}
            {!previewUrl && (
              <div className="text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  isReady ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                }`}>
                  {countdown !== null ? (
                    <><RefreshCcw className="w-3 h-3 animate-spin" /> Tahan posisi... {countdown}</>
                  ) : validationMsg}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {previewUrl ? (
                <>
                  <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => { setPreviewUrl(null); startCamera(); }}>
                    Ulangi
                  </Button>
                  <Button className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={submitPhoto} disabled={isSubmitting}>
                    {isSubmitting ? <><RefreshCcw className="w-4 h-4 mr-1.5 animate-spin" /> Mengirim...</> : "Kirim"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => { stopCamera(); setPreviewUrl(null); }}>
                    Batal
                  </Button>
                  {showFallback && (
                    <Button className="flex-1 h-11 rounded-xl bg-white text-black hover:bg-gray-100 border" onClick={capturePhoto}>
                      Jepret Manual
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );

    if (typeof document !== "undefined") {
      return createPortal(sheetContent, document.body);
    }
    return sheetContent;
  };

  // ========== DEFAULT: always render circular photo + action ==========
  return (
    <div className="flex flex-col items-center">
      {/* Rejection banner */}
      {isRejected && data.rejectionReason && (
        <div className="w-full mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-2.5 flex items-start gap-2">
          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{data.rejectionReason}</p>
        </div>
      )}

      {renderFaceCircle()}
      {renderActionButton()}

      {/* Status text */}
      {isPending && !hasApproved && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">Menunggu validasi admin</p>
      )}
      {hasApproved && data.pendingPhotoUrl && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">Foto baru menunggu validasi</p>
      )}

      {/* Bottom sheet portal */}
      {renderSheet()}
    </div>
  );
}
