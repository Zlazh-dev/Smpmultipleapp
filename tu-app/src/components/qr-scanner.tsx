"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrScannerDialog({ open, onOpenChange }: QrScannerDialogProps) {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    name?: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      cleanup();
      return;
    }

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        setScanning(true);
        setResult(null);

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            // Stop scanning after first successful read
            await scanner.stop();
            setScanning(false);

            // POST the scan result
            try {
              const res = await fetch("/api/presensi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nip: decodedText, status: "HADIR" }),
              });

              const data = await res.json();

              if (res.ok) {
                setResult({
                  success: true,
                  name: data.pegawai?.namaLengkap || decodedText,
                  message: "Presensi berhasil dicatat!",
                });
                toast.success(`${data.pegawai?.namaLengkap || "Pegawai"} — HADIR`);
              } else {
                setResult({
                  success: false,
                  message: data.error || "Gagal mencatat presensi",
                });
                toast.error(data.error || "Gagal mencatat presensi");
              }
            } catch {
              setResult({ success: false, message: "Network error" });
              toast.error("Gagal terhubung ke server");
            }
          },
          () => {} // ignore errors during scan
        );
      } catch (err) {
        console.error("Scanner error:", err);
        setScanning(false);
        setResult({ success: false, message: "Kamera tidak tersedia" });
      }
    };

    // Small delay to wait for DOM
    const timer = setTimeout(startScanner, 300);
    return () => clearTimeout(timer);
  }, [open]);

  const cleanup = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
    setResult(null);
  };

  const handleScanAgain = async () => {
    setResult(null);
    setScanning(true);

    try {
      const scanner = scannerRef.current;
      if (scanner) {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            await scanner.stop();
            setScanning(false);

            const res = await fetch("/api/presensi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nip: decodedText, status: "HADIR" }),
            });
            const data = await res.json();

            if (res.ok) {
              setResult({
                success: true,
                name: data.pegawai?.namaLengkap || decodedText,
                message: "Presensi berhasil dicatat!",
              });
              toast.success(`${data.pegawai?.namaLengkap || "Pegawai"} — HADIR`);
            } else {
              setResult({ success: false, message: data.error || "Gagal" });
            }
          },
          () => {}
        );
      }
    } catch {
      setResult({ success: false, message: "Kamera tidak tersedia" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            Scan QR Presensi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner viewport */}
          <div
            id="qr-reader"
            ref={containerRef}
            className="w-full aspect-square rounded-lg overflow-hidden bg-muted"
            style={{ display: result ? "none" : "block" }}
          />

          {/* Scanning indicator */}
          {scanning && !result && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Arahkan kamera ke QR Code NIP...
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`flex flex-col items-center gap-3 py-6 px-4 rounded-lg ${
              result.success ? "bg-emerald-500/10" : "bg-red-500/10"
            }`}>
              {result.success ? (
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
              {result.name && (
                <p className="text-lg font-bold">{result.name}</p>
              )}
              <p className="text-sm text-muted-foreground">{result.message}</p>
              {result.success && (
                <Badge className="bg-emerald-500/15 text-emerald-500 border-0">HADIR</Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {result && (
              <Button
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={handleScanAgain}
              >
                Scan Lagi
              </Button>
            )}
            <Button
              variant={result ? "default" : "outline"}
              className="flex-1 cursor-pointer"
              onClick={() => {
                onOpenChange(false);
                // Refresh the page to show updated data
                window.location.reload();
              }}
            >
              {result ? "Selesai" : "Tutup"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
