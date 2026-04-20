"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Plus, Pencil, Trash2, X, FileText,
  ClipboardCheck, Award, Briefcase, Layers,
  LayoutGrid, List, Search, ChevronDown, Clock, CalendarDays,
  SortAsc, MoreHorizontal,
} from "lucide-react";

interface Template {
  id: string;
  nama: string;
  kategori: string;
  deskripsi: string | null;
  canvasData: any;
  updatedAt: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: "ALL", label: "Semua Kategori" },
  { value: "SURAT_IZIN", label: "Surat Izin" },
  { value: "LAPORAN_KEHADIRAN", label: "Laporan Kehadiran" },
  { value: "SK", label: "Surat Keputusan" },
  { value: "SURAT_TUGAS", label: "Surat Tugas" },
  { value: "CUSTOM", label: "Custom" },
];

const SORT_OPTIONS = [
  { value: "updated", label: "Terakhir diedit" },
  { value: "created", label: "Terbaru dibuat" },
  { value: "name", label: "Nama A-Z" },
];

const CAT_ICONS: Record<string, any> = {
  SURAT_IZIN: FileText,
  LAPORAN_KEHADIRAN: ClipboardCheck,
  SK: Award,
  SURAT_TUGAS: Briefcase,
  CUSTOM: Layers,
};

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}

function MiniPreview({ canvasData }: { canvasData: any }) {
  if (!canvasData?.elements?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <FileText className="h-10 w-10 text-white/10" />
      </div>
    );
  }

  const scale = 0.22;
  return (
    <div className="w-full h-full overflow-hidden relative flex items-center justify-center">
      <div
        className="bg-white rounded shadow-sm"
        style={{
          width: 595 * scale,
          height: 842 * scale,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 595, height: 842, position: "relative" }}>
          {canvasData.elements.filter((e: any) => e.type !== "group").slice(0, 20).map((el: any, i: number) => {
            if (el.type === "text") {
              return (
                <div key={i} style={{
                  position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h,
                  fontSize: el.style?.fontSize || 14, fontFamily: el.style?.fontFamily || "Times New Roman",
                  fontWeight: el.style?.fontWeight || "normal", color: el.style?.color || "#000",
                  overflow: "hidden", lineHeight: 1.3, whiteSpace: "pre-wrap",
                }}>{el.content}</div>
              );
            }
            if (el.type === "rect") {
              return (
                <div key={i} style={{
                  position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h,
                  border: `${el.style?.borderWidth || 1}px solid ${el.style?.borderColor || "#000"}`,
                  background: el.style?.bgColor === "transparent" ? "transparent" : el.style?.bgColor,
                }} />
              );
            }
            if (el.type === "line") {
              return <div key={i} style={{ position: "absolute", left: el.x, top: el.y, width: el.w, borderTop: `${el.style?.borderWidth || 1}px solid ${el.style?.borderColor || "#000"}` }} />;
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

export function TemplateManager({
  initialTemplates,
  userId,
}: {
  initialTemplates: Template[];
  userId: string;
}) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [templates, setTemplates] = useState(initialTemplates);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("updated");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const filteredTemplates = templates
    .filter((t) => {
      if (activeFilter !== "ALL" && t.kategori !== activeFilter) return false;
      if (searchQuery && !t.nama.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return a.nama.localeCompare(b.nama);
    });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: fd.get("nama"), kategori: fd.get("kategori"), deskripsi: fd.get("deskripsi") || null, createdBy: userId }),
      });
      if (!res.ok) throw new Error();
      const newTpl = await res.json();
      setTemplates((prev) => [newTpl, ...prev]);
      setShowCreate(false);
      toast.success("Template dibuat");
      router.push(`/editor/${newTpl.id}`);
    } catch { toast.error("Gagal membuat template"); }
    finally { setCreating(false); }
  };



  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus template ini?")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template dihapus");
    } catch { toast.error("Gagal"); }
  };

  const catLabel = CATEGORIES.find((c) => c.value === activeFilter)?.label || "Semua";
  const sortLabel = SORT_OPTIONS.find((s) => s.value === sortBy)?.label || "Terakhir diedit";

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap animate-fade-in">
        {/* Category dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowCatDropdown(!showCatDropdown); setShowSortDropdown(false); }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted cursor-pointer transition-colors"
          >
            {catLabel}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {showCatDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCatDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => { setActiveFilter(cat.value); setShowCatDropdown(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors cursor-pointer",
                      activeFilter === cat.value ? "text-primary font-semibold bg-primary/5" : "text-foreground"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowSortDropdown(!showSortDropdown); setShowCatDropdown(false); }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted cursor-pointer transition-colors"
          >
            <Clock className="h-3 w-3 text-muted-foreground" />
            {sortLabel}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 w-44 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors cursor-pointer",
                      sortBy === opt.value ? "text-primary font-semibold bg-primary/5" : "text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Cari template..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 pl-8 text-xs" />
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("p-1.5 transition-colors cursor-pointer", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("p-1.5 transition-colors cursor-pointer", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        <Button size="sm" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shrink-0" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Buat Template
        </Button>
      </div>

      {/* ── Content ── */}
      {filteredTemplates.length === 0 ? (
        <div className="py-24 text-center animate-fade-in">
          <FileText className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{searchQuery ? "Tidak ada template yang cocok" : "Belum ada template"}</p>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View (Figma-style) ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 animate-fade-in-up">
          {filteredTemplates.map((tpl) => {
            const CatIcon = CAT_ICONS[tpl.kategori] || FileText;
            return (
              <div key={tpl.id} className="group cursor-pointer" onClick={() => router.push(`/editor/${tpl.id}`)}>
                {/* Thumbnail */}
                <div className={cn(
                  "aspect-[4/3] rounded-xl overflow-hidden transition-all border-2 bg-[#2c2c2c]",
                  "group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:border-primary/40 group-hover:scale-[1.02]",
                  "border-transparent"
                )}>
                  <MiniPreview canvasData={tpl.canvasData} />
                </div>

                {/* Meta row */}
                <div className="mt-2.5 flex items-start gap-2 px-0.5">
                  <div className="mt-0.5 shrink-0">
                    <div className={cn("h-5 w-5 rounded flex items-center justify-center",
                      tpl.kategori === "SURAT_IZIN" ? "bg-blue-500/20" : tpl.kategori === "LAPORAN_KEHADIRAN" ? "bg-emerald-500/20" : tpl.kategori === "SK" ? "bg-amber-500/20" : tpl.kategori === "SURAT_TUGAS" ? "bg-purple-500/20" : "bg-gray-500/20"
                    )}>
                      <CatIcon className={cn("h-3 w-3",
                        tpl.kategori === "SURAT_IZIN" ? "text-blue-500" : tpl.kategori === "LAPORAN_KEHADIRAN" ? "text-emerald-500" : tpl.kategori === "SK" ? "text-amber-500" : tpl.kategori === "SURAT_TUGAS" ? "text-purple-500" : "text-gray-500"
                      )} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{tpl.nama}</p>
                    <p className="text-[10px] text-muted-foreground">{getTimeAgo(tpl.updatedAt)}</p>
                  </div>

                  {/* Actions overlay */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                    <button onClick={(e) => handleDelete(tpl.id, e)} className="p-1 rounded hover:bg-red-500/10 text-red-500 cursor-pointer" title="Hapus">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="border border-border rounded-lg overflow-hidden bg-card animate-fade-in-up">
          {filteredTemplates.map((tpl, i) => {
            const CatIcon = CAT_ICONS[tpl.kategori] || FileText;
            return (
              <div
                key={tpl.id}
                onClick={() => router.push(`/editor/${tpl.id}`)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group",
                  i > 0 && "border-t border-border"
                )}
              >
                {/* Mini thumbnail */}
                <div className={cn("w-16 h-12 rounded-md overflow-hidden bg-[#2c2c2c] shrink-0 border border-transparent")}>
                  <MiniPreview canvasData={tpl.canvasData} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <CatIcon className={cn("h-3 w-3 shrink-0",
                      tpl.kategori === "SURAT_IZIN" ? "text-blue-500" : tpl.kategori === "LAPORAN_KEHADIRAN" ? "text-emerald-500" : tpl.kategori === "SK" ? "text-amber-500" : tpl.kategori === "SURAT_TUGAS" ? "text-purple-500" : "text-gray-500"
                    )} />
                    <p className="text-xs font-semibold truncate">{tpl.nama}</p>
                  </div>
                  {tpl.deskripsi && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{tpl.deskripsi}</p>}
                </div>

                {/* Category label */}
                <span className="text-[10px] text-muted-foreground hidden sm:block w-24 text-center">
                  {CATEGORIES.find((c) => c.value === tpl.kategori)?.label || tpl.kategori}
                </span>

                {/* Time */}
                <span className="text-[10px] text-muted-foreground w-20 text-right shrink-0">{getTimeAgo(tpl.updatedAt)}</span>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={(e) => handleDelete(tpl.id, e)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500 cursor-pointer" title="Hapus">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Sheet ── */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={isDesktop ? "w-[380px] sm:max-w-[380px] p-0 [&>button]:hidden" : "h-[70vh] rounded-t-2xl p-0 [&>button]:hidden"}
        >
          <form onSubmit={handleCreate} className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold">Buat Template Baru</h2>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Template *</Label>
                <Input name="nama" required placeholder="Surat Izin Cuti" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Kategori *</Label>
                <select name="kategori" required className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  {CATEGORIES.filter((c) => c.value !== "ALL").map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Deskripsi</Label>
                <Input name="deskripsi" placeholder="Deskripsi template..." className="h-8 text-sm" />
              </div>
              <div className="p-3 rounded-md bg-muted/50 text-[10px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Penempatan Template:</p>
                <p>• <strong>Surat Izin</strong> → Cetak dari halaman Cuti</p>
                <p>• <strong>Kehadiran</strong> → Cetak dari halaman Presensi</p>
                <p>• <strong>SK</strong> → Cetak dari halaman Pegawai</p>
                <p>• <strong>Surat Tugas</strong> → Cetak surat penugasan</p>
                <p className="mt-1.5 text-primary/80">Template langsung tersedia untuk cetak setelah dibuat.</p>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-border bg-muted/30">
              <Button type="submit" disabled={creating} className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                {creating ? "Membuat..." : "Buat & Buka Editor"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
