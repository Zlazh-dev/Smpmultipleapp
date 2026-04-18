"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Clock, Save, Loader2, Shield, RefreshCw, QrCode, Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface Settings {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  namaLokasi: string;
  jamMasuk: string;
  jamPulang: string;
  isActive: boolean;
}

export function GeofenceSettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  // QR code state
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);

  useEffect(() => {
    fetch("/api/geofence")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setLoading(false));
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (loading || !settings || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Load Leaflet CSS via link tag
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        // Wait for CSS to load
        await new Promise((r) => setTimeout(r, 200));
      }

      const map = L.map(mapRef.current!, {
        center: [settings.latitude, settings.longitude],
        zoom: 17,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom marker icon
      const markerIcon = L.divIcon({
        className: "custom-marker",
        html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([settings.latitude, settings.longitude], {
        icon: markerIcon,
        draggable: true,
      }).addTo(map);

      const circle = L.circle([settings.latitude, settings.longitude], {
        radius: settings.radius,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);

      // Fit map to show entire circle
      map.fitBounds(circle.getBounds(), { padding: [20, 20] });

      // Drag marker to update location
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setSettings((s) => s ? { ...s, latitude: pos.lat, longitude: pos.lng } : s);
        circle.setLatLng(pos);
      });

      // Fix map rendering issue after container resize
      setTimeout(() => map.invalidateSize(), 300);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading]);

  // Update map when settings change
  useEffect(() => {
    if (!settings || !mapInstanceRef.current) return;
    const { latitude, longitude, radius } = settings;
    if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
    if (circleRef.current) {
      circleRef.current.setLatLng([latitude, longitude]);
      circleRef.current.setRadius(radius);
    }
    mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
  }, [settings?.latitude, settings?.longitude, settings?.radius]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/geofence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Pengaturan disimpan");
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation tidak didukung browser ini");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings((s) => s ? { ...s, latitude: pos.coords.latitude, longitude: pos.coords.longitude } : s);
        toast.success("Lokasi berhasil diambil");
        setLocating(false);
      },
      (err) => {
        toast.error("Gagal mendapatkan lokasi: " + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Generate single QR code for checkin URL
  const handleGenerateQR = async () => {
    setGeneratingQr(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const checkinUrl = `${window.location.origin}/presensi/checkin`;
      const dataUrl = await QRCode.toDataURL(checkinUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      toast.success("QR Code presensi dibuat");
    } catch {
      toast.error("Gagal generate QR code");
    } finally {
      setGeneratingQr(false);
    }
  };

  const handlePrintQR = () => {
    if (!qrDataUrl) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html>
        <head><title>QR Code Presensi</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px">
          <h1 style="font-size:24px;margin-bottom:4px">${settings?.namaLokasi || "Presensi"}</h1>
          <p style="color:#666;font-size:13px;margin-bottom:24px">Scan QR Code ini untuk Check-in / Check-out</p>
          <img src="${qrDataUrl}" width="300" height="300" style="border:2px solid #eee;border-radius:12px" />
          <p style="color:#999;font-size:11px;margin-top:16px">
            Jam Kerja: ${settings?.jamMasuk || "07:00"} — ${settings?.jamPulang || "16:00"}<br/>
            Sistem Presensi Digital • ${new Date().getFullYear()}
          </p>
        </body>
        </html>
      `);
      win.document.close();
      win.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Geofence Location */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Lokasi Geofence
              </CardTitle>
              <Badge className={cn("text-[10px]", settings.isActive ? "bg-emerald-500/15 text-emerald-500 border-0" : "bg-red-500/15 text-red-500 border-0")}>
                {settings.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Lokasi</Label>
              <Input value={settings.namaLokasi} onChange={(e) => setSettings({ ...settings, namaLokasi: e.target.value })} className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Latitude</Label>
                <Input type="number" step="any" value={settings.latitude} onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) || 0 })} className="h-8 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Longitude</Label>
                <Input type="number" step="any" value={settings.longitude} onChange={(e) => setSettings({ ...settings, longitude: parseFloat(e.target.value) || 0 })} className="h-8 text-sm font-mono" />
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full h-8 text-xs cursor-pointer" onClick={handleGetCurrentLocation} disabled={locating}>
              {locating ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
              {locating ? "Mengambil lokasi..." : "Ambil Lokasi Saat Ini"}
            </Button>

            <div className="space-y-1.5">
              <Label className="text-xs">Radius (meter)</Label>
              <div className="flex items-center gap-2">
                <Input type="range" min={50} max={1000} step={10} value={settings.radius}
                  onChange={(e) => setSettings({ ...settings, radius: parseInt(e.target.value) })}
                  className="flex-1 h-2 cursor-pointer accent-primary" />
                <Input type="number" value={settings.radius} onChange={(e) => setSettings({ ...settings, radius: parseInt(e.target.value) || 0 })}
                  className="h-8 text-sm w-20 text-center" />
                <span className="text-xs text-muted-foreground shrink-0">m</span>
              </div>
            </div>

            {/* Leaflet Map with radius circle */}
            <div ref={mapRef} className="rounded-lg overflow-hidden border border-border aspect-video z-0" />
            <p className="text-[10px] text-muted-foreground text-center">
              Drag marker untuk mengubah lokasi • Lingkaran biru = radius {settings.radius}m
            </p>
          </CardContent>
        </Card>

        {/* Jam Kerja & Toggle */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Jam Kerja & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Jam Masuk</Label>
                <Input type="time" value={settings.jamMasuk} onChange={(e) => setSettings({ ...settings, jamMasuk: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jam Pulang</Label>
                <Input type="time" value={settings.jamPulang} onChange={(e) => setSettings({ ...settings, jamPulang: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-semibold">Geofencing</p>
                    <p className="text-[10px] text-muted-foreground">Validasi lokasi saat presensi</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}
                  className={cn("relative w-10 h-5 rounded-full transition-colors cursor-pointer", settings.isActive ? "bg-primary" : "bg-muted-foreground/30")}
                >
                  <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm", settings.isActive && "translate-x-5")} />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1.5">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Cara Kerja</p>
              <ul className="text-[10px] text-muted-foreground space-y-1 list-disc pl-3">
                <li>Browser meminta izin GPS saat pegawai presensi</li>
                <li>Jarak dihitung dengan formula Haversine</li>
                <li>Jika dalam radius {settings.radius}m → presensi valid</li>
                <li>Jika di luar → presensi ditolak</li>
              </ul>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full h-9 cursor-pointer">
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Generator */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" /> QR Code Presensi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Generate satu QR code yang digunakan semua pegawai untuk check-in dan check-out. 
            Tempel QR ini di pintu masuk sekolah.
          </p>

          <div className="flex items-center gap-2">
            <Button onClick={handleGenerateQR} disabled={generatingQr} className="h-8 cursor-pointer">
              {generatingQr ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5 mr-1.5" />}
              Generate QR Code
            </Button>
            {qrDataUrl && (
              <Button variant="outline" onClick={handlePrintQR} className="h-8 cursor-pointer">
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Cetak
              </Button>
            )}
          </div>

          {/* QR Code Preview */}
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-white dark:bg-card">
              <img src={qrDataUrl} alt="QR Presensi" className="w-48 h-48 sm:w-56 sm:h-56" />
              <div className="text-center">
                <p className="text-sm font-bold">{settings?.namaLokasi}</p>
                <p className="text-[11px] text-muted-foreground">Scan untuk Check-in / Check-out</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Jam Kerja: {settings?.jamMasuk} — {settings?.jamPulang}
                </p>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Alur Presensi</p>
            <ol className="text-[10px] text-muted-foreground space-y-1 list-decimal pl-3">
              <li>Pegawai scan QR code dengan HP → buka halaman check-in</li>
              <li>Sistem verifikasi login & lokasi GPS</li>
              <li><strong>Scan pertama</strong> = Check-in (jam datang tercatat)</li>
              <li><strong>Scan kedua</strong> = Check-out (tersedia 5 menit sebelum jam pulang)</li>
              <li>Jika sudah check-in & check-out → presensi selesai</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
