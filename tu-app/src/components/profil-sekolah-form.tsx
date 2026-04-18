"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  School, MapPin, Phone, Mail, Globe, Save, Loader2, Award,
  User, Calendar, Building, Hash, Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Profil {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  statusSekolah: string;
  tahunBerdiri: string;
  akreditasi: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  latitude: number;
  longitude: number;
}

export function ProfilSekolahForm() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/profil-sekolah")
      .then((r) => r.json())
      .then(setProfil)
      .catch(() => toast.error("Gagal memuat profil"))
      .finally(() => setLoading(false));
  }, []);

  // Map
  useEffect(() => {
    if (loading || !profil || !mapRef.current || mapInstanceRef.current) return;
    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        await new Promise((r) => setTimeout(r, 200));
      }
      const map = L.map(mapRef.current!, { center: [profil.latitude, profil.longitude], zoom: 16 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap', maxZoom: 19,
      }).addTo(map);
      const icon = L.divIcon({
        className: "custom-marker",
        html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7],
      });
      const marker = L.marker([profil.latitude, profil.longitude], { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setProfil((s) => s ? { ...s, latitude: p.lat, longitude: p.lng } : s);
      });
      setTimeout(() => map.invalidateSize(), 300);
      mapInstanceRef.current = map;
    };
    initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [loading]);

  const handleSave = async () => {
    if (!profil) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profil-sekolah", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profil),
      });
      if (!res.ok) throw new Error();
      toast.success("Profil sekolah disimpan");
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Profil, value: string | number) => {
    if (!profil) return;
    setProfil({ ...profil, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profil) return null;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Identitas Sekolah */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <School className="h-4 w-4 text-primary" /> Identitas Sekolah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Sekolah</Label>
              <Input value={profil.namaSekolah} onChange={(e) => update("namaSekolah", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">NPSN</Label>
                <Input value={profil.npsn} onChange={(e) => update("npsn", e.target.value)} placeholder="20xxxxxxx" className="h-8 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tahun Berdiri</Label>
                <Input value={profil.tahunBerdiri} onChange={(e) => update("tahunBerdiri", e.target.value)} placeholder="2005" className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <select value={profil.statusSekolah} onChange={(e) => update("statusSekolah", e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Akreditasi</Label>
                <select value={profil.akreditasi} onChange={(e) => update("akreditasi", e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Belum</option>
                  <option value="A">A (Unggul)</option>
                  <option value="B">B (Baik)</option>
                  <option value="C">C (Cukup)</option>
                </select>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold">{profil.namaSekolah || "—"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[9px]">{profil.statusSekolah}</Badge>
                  {profil.akreditasi && <Badge className="text-[9px] bg-emerald-500/15 text-emerald-500 border-0">Akreditasi {profil.akreditasi}</Badge>}
                  {profil.npsn && <span className="text-[9px] text-muted-foreground font-mono">NPSN: {profil.npsn}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kepala Sekolah */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Kepala Sekolah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Kepala Sekolah</Label>
              <Input value={profil.namaKepalaSekolah} onChange={(e) => update("namaKepalaSekolah", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">NIP Kepala Sekolah</Label>
              <Input value={profil.nipKepalaSekolah} onChange={(e) => update("nipKepalaSekolah", e.target.value)} className="h-8 text-sm font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Kontak */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Telepon</Label>
              <Input value={profil.telepon} onChange={(e) => update("telepon", e.target.value)} placeholder="(031) xxx-xxxx" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={profil.email} onChange={(e) => update("email", e.target.value)} placeholder="info@sekolah.sch.id" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Website</Label>
              <Input value={profil.website} onChange={(e) => update("website", e.target.value)} placeholder="https://sekolah.sch.id" className="h-8 text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Alamat */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Alamat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Alamat Lengkap</Label>
              <Input value={profil.alamat} onChange={(e) => update("alamat", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Kelurahan</Label>
                <Input value={profil.kelurahan} onChange={(e) => update("kelurahan", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Kecamatan</Label>
                <Input value={profil.kecamatan} onChange={(e) => update("kecamatan", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Kabupaten/Kota</Label>
                <Input value={profil.kabupaten} onChange={(e) => update("kabupaten", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Provinsi</Label>
                <Input value={profil.provinsi} onChange={(e) => update("provinsi", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Kode Pos</Label>
                <Input value={profil.kodePos} onChange={(e) => update("kodePos", e.target.value)} className="h-8 text-sm font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" /> Lokasi di Peta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Latitude</Label>
              <Input type="number" step="any" value={profil.latitude}
                onChange={(e) => update("latitude", parseFloat(e.target.value) || 0)}
                className="h-8 text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Longitude</Label>
              <Input type="number" step="any" value={profil.longitude}
                onChange={(e) => update("longitude", parseFloat(e.target.value) || 0)}
                className="h-8 text-sm font-mono" />
            </div>
          </div>
          <div ref={mapRef} className="rounded-lg overflow-hidden border border-border h-64 z-0" />
          <p className="text-[10px] text-muted-foreground text-center">Drag marker untuk mengubah lokasi sekolah</p>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="h-9 px-6 cursor-pointer">
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          {saving ? "Menyimpan..." : "Simpan Profil Sekolah"}
        </Button>
      </div>
    </div>
  );
}
