"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, X, User, AlertCircle, RefreshCcw, ShieldCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EnrollmentData {
  id: string;
  pegawaiId: string;
  status: string;
  hasPendingPhoto: boolean;
  hasApprovedPhoto: boolean;
  submittedAt: string;
  rejectionReason: string | null;
  pegawai: {
    namaLengkap: string;
    nip: string | null;
  };
}

function EnrollmentCard({ 
  item, 
  onApprove, 
  onReject, 
  isProcessing 
}: { 
  item: EnrollmentData; 
  onApprove: (id: string) => void; 
  onReject: (id: string) => void;
  isProcessing: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Lazy load via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Card ref={cardRef} className="overflow-hidden border-border/50 hover:shadow-md transition-shadow">
        {/* Photo area */}
        <div className="aspect-[3/4] relative bg-muted flex items-center justify-center">
          {isVisible && item.hasPendingPhoto ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <RefreshCcw className="w-6 h-6 animate-spin text-muted-foreground/40" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/face/enrolled-photo/${item.id}?type=pending`}
                alt="Wajah"
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Preview button overlay */}
              {imageLoaded && (
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </>
          ) : !isVisible ? (
            <div className="w-full h-full bg-muted animate-pulse" />
          ) : (
            <AlertCircle className="w-8 h-8 text-muted-foreground/30" />
          )}
        </div>

        {/* Info + Actions */}
        <CardContent className="p-3 space-y-3">
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate">{item.pegawai.namaLengkap}</h4>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{item.pegawai.nip || "Tanpa NIP"}</p>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {item.status === "APPROVED" ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <ShieldCheck className="w-3 h-3 mr-0.5" /> Update
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  Menunggu
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">
                {new Date(item.submittedAt).toLocaleDateString("id-ID")}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 text-xs h-8"
              onClick={() => onReject(item.id)}
              disabled={isProcessing}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Tolak
            </Button>
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
              onClick={() => onApprove(item.id)}
              disabled={isProcessing}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Terima
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full-size preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg p-2">
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/face/enrolled-photo/${item.id}?type=pending`}
              alt={`Foto ${item.pegawai.namaLengkap}`}
              className="w-full rounded-lg"
            />
          </div>
          <div className="px-2 pb-2">
            <h4 className="font-semibold">{item.pegawai.namaLengkap}</h4>
            <p className="text-xs text-muted-foreground">{item.pegawai.nip}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function FaceValidationGallery() {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchEnrollments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ops/face-enrollments");
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data);
      }
    } catch (err) {
      toast.error("Gagal memuat data pengajuan wajah.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/ops/face-enrollments/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal");
      }
      toast.success("Foto wajah berhasil disetujui.");
      setEnrollments(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Gagal menyetujui foto wajah.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) {
      toast.error("Alasan wajib diisi");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/ops/face-enrollments/${rejectingId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error();
      toast.success("Penolakan berhasil dikirim ke guru.");
      setEnrollments(prev => prev.filter(e => e.id !== rejectingId));
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      toast.error("Gagal menolak foto wajah.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <div className="aspect-[3/4] bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-8 bg-muted animate-pulse rounded" />
                <div className="h-8 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border rounded-xl bg-card">
        <User className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
        <p className="font-medium">Tidak ada pengajuan</p>
        <p className="text-sm mt-1">Semua foto wajah sudah divalidasi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {enrollments.map((item) => (
          <EnrollmentCard
            key={item.id}
            item={item}
            onApprove={handleApprove}
            onReject={(id) => setRejectingId(id)}
            isProcessing={isProcessing}
          />
        ))}
      </div>

      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Foto Wajah</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan. Alasan ini akan ditampilkan kepada guru.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Contoh: Wajah terpotong, pencahayaan kurang terang, dsb."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectingId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectReason.trim()}>
              {isProcessing ? "Menyimpan..." : "Kirim Penolakan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
