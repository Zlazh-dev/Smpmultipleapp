"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Clock, Save, Loader2, Shield, RefreshCw, CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

interface Settings {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  namaLokasi: string;
  jamMasuk: string;
  jamPulang: string;
  hariKerja: string[];
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

  useEffect(() => {
    fetch("/api/geofence")
      .then((r) => r.json())
      .then((data) => {
        // Ensure hariKerja is always an array
        if (!data.hariKerja) {
          data.hariKerja = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
        }
        setSettings(data);
      })
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

      const lat = settings.latitude ?? -7.977438;
      const lng = settings.longitude ?? 112.7467995;

      const marker = L.marker([lat, lng], {
        icon: markerIcon,
        draggable: true,
      }).addTo(map);

      const circle = L.circle([lat, lng], {
        radius: settings.radius ?? 100,
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
    const lat = settings.latitude ?? -7.977438;
    const lng = settings.longitude ?? 112.7467995;
    const radius = settings.radius ?? 100;

    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radius);
    }
    mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
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

  const toggleDay = (day: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      hariKerja: settings.hariKerja.includes(day)
        ? settings.hariKerja.filter((d) => d !== day)
        : [...settings.hariKerja, day],
    });
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

        {/* Jam Kerja & Hari Kerja */}
        <div className="space-y-4">
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
                      <p className="text-xs font-semibold">Sistem Presensi</p>
                      <p className="text-[10px] text-muted-foreground">Master switch check-in, finalisasi & laporan</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}
                    className={cn("relative w-10 h-5 rounded-full transition-colors cursor-pointer", settings.isActive ? "bg-primary" : "bg-muted-foreground/30")}
                  >
                    <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm", settings.isActive && "translate-x-5")} />
                  </button>
                </div>
                {!settings.isActive && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md p-2 border border-amber-500/20">
                    ⚠️ Sistem dinonaktifkan — check-in/check-out ditolak, finalisasi harian dilewati.
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1.5">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Cara Kerja</p>
                <ul className="text-[10px] text-muted-foreground space-y-1 list-disc pl-3">
                  <li>Aktifkan untuk mengizinkan pegawai melakukan check-in/check-out</li>
                  <li>Sistem otomatis menandai ALFA bagi yang tidak hadir (finalisasi harian)</li>
                  <li>GPS geofencing memvalidasi lokasi dalam radius {settings.radius}m</li>
                  <li>Nonaktifkan untuk menangguhkan semua proses presensi</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Hari Kerja */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Hari Kerja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Pilih hari-hari aktif presensi. Presensi hanya berlaku pada hari yang dipilih.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_DAYS.map((day) => {
                  const isActive = settings.hariKerja.includes(day);
                  const isWeekend = day === "Sabtu" || day === "Minggu";
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                        isActive
                          ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center h-4 w-4 rounded-md border transition-colors",
                        isActive
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      )}>
                        {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span>{day}</span>
                      {isWeekend && (
                        <Badge variant="outline" className="text-[8px] ml-auto px-1 py-0 border-amber-500/30 text-amber-500">
                          Weekend
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                <span>{settings.hariKerja.length} hari aktif per minggu</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="h-9 px-6 cursor-pointer">
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
        </Button>
      </div>
    </div>
  );
}
