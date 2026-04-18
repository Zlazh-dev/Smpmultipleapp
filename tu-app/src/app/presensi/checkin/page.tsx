"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Loader2, CheckCircle, XCircle, Clock, LogIn, LogOut, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "locating" | "submitting" | "success_in" | "success_out" | "already_done" | "error" | "too_early";

interface ResultData {
  type: string;
  message?: string;
  error?: string;
  jamDatang?: string;
  jamPulang?: string;
  jamPulangSetting?: string;
  minsRemaining?: number;
  distance?: number;
}

export default function CheckinPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ResultData | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleCheckin = async () => {
    setStatus("locating");
    setResult(null);

    try {
      // Get GPS
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("GPS tidak tersedia"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      setStatus("submitting");

      const res = await fetch("/api/presensi/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      });

      const data = await res.json();
      setResult(data);

      if (res.ok) {
        if (data.type === "CHECK_IN") setStatus("success_in");
        else if (data.type === "CHECK_OUT") setStatus("success_out");
        else if (data.type === "ALREADY_DONE") setStatus("already_done");
      } else {
        if (data.type === "TOO_EARLY") setStatus("too_early");
        else setStatus("error");
      }
    } catch (err: any) {
      if (err.code === 1) {
        setResult({ type: "error", error: "Izin lokasi ditolak. Aktifkan GPS di pengaturan browser." });
      } else if (err.code === 2) {
        setResult({ type: "error", error: "Lokasi tidak tersedia. Pastikan GPS aktif." });
      } else if (err.code === 3) {
        setResult({ type: "error", error: "Timeout mendapatkan lokasi. Coba lagi." });
      } else {
        setResult({ type: "error", error: err.message || "Gagal presensi" });
      }
      setStatus("error");
    }
  };

  const statusConfig = {
    idle: { icon: MapPin, color: "text-primary", bg: "bg-primary/10" },
    locating: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-500/10" },
    submitting: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-500/10" },
    success_in: { icon: LogIn, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    success_out: { icon: LogOut, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    already_done: { icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    too_early: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  const isLoading = status === "locating" || status === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-sm border-border/50 shadow-xl">
        <CardContent className="pt-8 pb-6 px-6 text-center space-y-5">
          {/* Clock */}
          <div>
            <p className="text-4xl font-bold tracking-tight tabular-nums">
              {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {time.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Status Icon */}
          <div className={cn("mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all", config.bg)}>
            <Icon className={cn("h-10 w-10 transition-all", config.color, isLoading && "animate-spin")} />
          </div>

          {/* Status Message */}
          {status === "idle" && (
            <div>
              <p className="text-sm font-semibold">Presensi</p>
              <p className="text-xs text-muted-foreground mt-1">Tekan tombol di bawah untuk check-in / check-out</p>
            </div>
          )}

          {status === "locating" && (
            <p className="text-sm text-muted-foreground">Mengambil lokasi GPS...</p>
          )}

          {status === "submitting" && (
            <p className="text-sm text-muted-foreground">Memverifikasi presensi...</p>
          )}

          {(status === "success_in" || status === "success_out") && result && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{result.message}</p>
              <div className="flex justify-center gap-4 text-xs">
                {result.jamDatang && (
                  <div className="flex items-center gap-1">
                    <LogIn className="h-3 w-3 text-emerald-500" />
                    <span>Masuk: <strong>{result.jamDatang}</strong></span>
                  </div>
                )}
                {result.jamPulang && (
                  <div className="flex items-center gap-1">
                    <LogOut className="h-3 w-3 text-blue-500" />
                    <span>Pulang: <strong>{result.jamPulang}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === "already_done" && result && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{result.message}</p>
              <div className="flex justify-center gap-4 text-xs">
                <span>Masuk: <strong>{result.jamDatang}</strong></span>
                <span>Pulang: <strong>{result.jamPulang}</strong></span>
              </div>
            </div>
          )}

          {status === "too_early" && result && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{result.error}</p>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{result.minsRemaining} menit lagi</span>
              </div>
            </div>
          )}

          {status === "error" && result && (
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{result.error}</p>
          )}

          {/* Action Button */}
          <Button
            onClick={handleCheckin}
            disabled={isLoading}
            className={cn(
              "w-full h-12 text-sm font-semibold cursor-pointer transition-all",
              status === "success_in" || status === "success_out"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : status === "error"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : ""
            )}
            size="lg"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
            ) : status === "idle" ? (
              <><MapPin className="h-4 w-4 mr-2" /> Presensi Sekarang</>
            ) : (
              <><MapPin className="h-4 w-4 mr-2" /> Coba Lagi</>
            )}
          </Button>

          <p className="text-[10px] text-muted-foreground">
            SMPIT Asy-Syadzili • Sistem Presensi Digital
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
