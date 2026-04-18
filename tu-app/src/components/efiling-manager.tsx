"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  FolderOpen, FileText, Award, UserCircle, Mail,
  Search, Upload, LayoutGrid, List, Trash2, Download,
  Eye, X, ChevronDown, File, FileSpreadsheet, FileImage,
  Plus, Loader2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Dokumen {
  id: string;
  namaAsli: string;
  namaFile: string;
  ukuran: number;
  mimeType: string;
  pathS3: string;
  kategori: string;
  pegawaiId: string | null;
  uploadedBy: string;
  createdAt: string;
  pegawai: { namaLengkap: string; jabatan: string } | null;
}

const CATEGORIES = [
  { value: "ALL", label: "Semua Dokumen", icon: FolderOpen, color: "text-foreground" },
  { value: "SK", label: "Surat Keputusan", icon: Award, color: "text-amber-500" },
  { value: "SERTIFIKAT", label: "Sertifikat", icon: FileText, color: "text-blue-500" },
  { value: "PRIBADI", label: "Pribadi", icon: UserCircle, color: "text-emerald-500" },
  { value: "SURAT", label: "Surat", icon: Mail, color: "text-purple-500" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  const days = Math.floor(hrs / 24);
  return `${days}h lalu`;
}

function getFileIcon(mime: string) {
  if (mime === "application/pdf") return <File className="h-5 w-5 text-red-500" />;
  if (mime.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
  if (mime.includes("spreadsheet") || mime.includes("excel")) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
  if (mime.includes("word")) return <FileText className="h-5 w-5 text-blue-600" />;
  return <File className="h-5 w-5 text-gray-500" />;
}

function getFileThumbnail(doc: Dokumen) {
  if (doc.mimeType.startsWith("image/")) {
    return (
      <img src={`/api/dokumen/file/${doc.pathS3}`} alt={doc.namaAsli}
        className="w-full h-full object-cover" loading="lazy" />
    );
  }
  if (doc.mimeType === "application/pdf") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-red-500/5">
        <File className="h-8 w-8 text-red-500/60" />
        <span className="text-[9px] mt-1 text-red-500/60 font-semibold">PDF</span>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/30">
      {getFileIcon(doc.mimeType)}
    </div>
  );
}

interface Props {
  userId: string;
  role: string;
  userName: string;
}

export function EFilingManager({ userId, role, userName }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [docs, setDocs] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Dokumen | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "ALL") params.set("kategori", activeCategory);
      if (searchQuery) params.set("q", searchQuery);
      const res = await fetch(`/api/dokumen?${params}`);
      if (res.ok) setDocs(await res.json());
    } catch { toast.error("Gagal memuat dokumen"); }
    finally { setLoading(false); }
  }, [activeCategory, searchQuery]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Upload
  const handleUpload = async (files: FileList, kategori: string) => {
    setUploading(true);
    let success = 0;
    for (const file of Array.from(files)) {
      try {
        // Step 1: Upload file
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) { const err = await uploadRes.json(); toast.error(err.error || "Upload gagal"); continue; }
        const uploadData = await uploadRes.json();

        // Step 2: Create document record
        const docRes = await fetch("/api/dokumen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...uploadData, kategori }),
        });
        if (!docRes.ok) throw new Error();
        success++;
      } catch {
        toast.error(`Gagal upload: ${file.name}`);
      }
    }
    if (success > 0) {
      toast.success(`${success} file berhasil diupload`);
      fetchDocs();
    }
    setUploading(false);
    setShowUpload(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus dokumen ini?")) return;
    try {
      const res = await fetch(`/api/dokumen/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Dokumen dihapus");
      if (preview?.id === id) setPreview(null);
    } catch { toast.error("Gagal menghapus"); }
  };

  const handleDownload = (doc: Dokumen) => {
    const a = document.createElement("a");
    a.href = `/api/dokumen/file/${doc.pathS3}`;
    a.download = doc.namaAsli;
    a.click();
  };

  // Drag & drop on main area
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      setShowUpload(true);
      // Store files temporarily
      (window as any).__pendingFiles = e.dataTransfer.files;
    }
  };

  const catCounts = CATEGORIES.map((c) => ({
    ...c,
    count: c.value === "ALL" ? docs.length : docs.filter((d) => d.kategori === c.value).length,
  }));

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar: Categories ── */}
        <div className="w-56 border-r border-border bg-muted/30 p-3 space-y-1 hidden md:block shrink-0">
          <div className="px-2 mb-3">
            <h2 className="text-sm font-bold">e-Filing</h2>
            <p className="text-[10px] text-muted-foreground">Arsip digital dokumen</p>
          </div>
          {catCounts.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                activeCategory === cat.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <cat.icon className={cn("h-4 w-4 shrink-0", activeCategory === cat.value ? "text-primary" : cat.color)} />
              <span className="flex-1 text-left">{cat.label}</span>
              <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* ── Main Content ── */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
            {/* Mobile category dropdown */}
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="md:hidden h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari dokumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={cn("p-1.5 transition-colors cursor-pointer", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><LayoutGrid className="h-3.5 w-3.5" /></button>
              <button onClick={() => setViewMode("list")} className={cn("p-1.5 transition-colors cursor-pointer", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><List className="h-3.5 w-3.5" /></button>
            </div>

            <Button size="sm" className="h-8 cursor-pointer" onClick={() => setShowUpload(true)}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
            </Button>
          </div>

          {/* Drag overlay */}
          {dragOver && (
            <div className="absolute inset-0 z-50 bg-primary/5 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-10 w-10 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-primary">Drop file di sini</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderOpen className="h-14 w-14 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Tidak ada dokumen yang cocok" : "Belum ada dokumen"}
                </p>
                <Button size="sm" variant="outline" className="mt-4 cursor-pointer" onClick={() => setShowUpload(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Upload Dokumen
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {docs.map((doc) => (
                  <div key={doc.id} className="group cursor-pointer" onClick={() => setPreview(doc)}>
                    <div className="aspect-[4/3] rounded-lg border border-border overflow-hidden bg-muted/30 transition-all group-hover:shadow-lg group-hover:border-primary/30 group-hover:scale-[1.02]">
                      {getFileThumbnail(doc)}
                    </div>
                    <div className="mt-2 px-0.5">
                      <p className="text-xs font-semibold truncate">{doc.namaAsli}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-muted-foreground">{formatSize(doc.ukuran)}</span>
                        <span className="text-[9px] text-muted-foreground">•</span>
                        <span className="text-[9px] text-muted-foreground">{timeAgo(doc.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} className="p-1 rounded hover:bg-primary/10 text-primary cursor-pointer"><Download className="h-3 w-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }} className="p-1 rounded hover:bg-red-500/10 text-red-500 cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                {docs.map((doc, i) => (
                  <div
                    key={doc.id}
                    onClick={() => setPreview(doc)}
                    className={cn("flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/50 cursor-pointer transition-colors group", i > 0 && "border-t border-border")}
                  >
                    <div className="shrink-0">{getFileIcon(doc.mimeType)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{doc.namaAsli}</p>
                      <p className="text-[10px] text-muted-foreground sm:hidden">
                        {formatSize(doc.ukuran)} • {timeAgo(doc.createdAt)}
                      </p>
                      {doc.pegawai && <p className="text-[10px] text-muted-foreground hidden sm:block">{doc.pegawai.namaLengkap}</p>}
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0 hidden sm:inline-flex">
                      {CATEGORIES.find((c) => c.value === doc.kategori)?.label || doc.kategori}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0 hidden md:block">{formatSize(doc.ukuran)}</span>
                    <span className="text-[10px] text-muted-foreground w-14 text-right shrink-0 hidden md:block">{timeAgo(doc.createdAt)}</span>
                    <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} className="p-1.5 rounded hover:bg-primary/10 text-primary cursor-pointer"><Download className="h-3.5 w-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }} className="p-1.5 rounded hover:bg-red-500/10 text-red-500 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Upload Sheet ── */}
      <Sheet open={showUpload} onOpenChange={setShowUpload}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={isDesktop ? "w-[400px] sm:max-w-[400px] p-0 [&>button]:hidden" : "h-[75vh] rounded-t-2xl p-0 [&>button]:hidden"}
        >
          <UploadForm
            onUpload={handleUpload}
            uploading={uploading}
            onClose={() => setShowUpload(false)}
            pendingFiles={(typeof window !== "undefined" && (window as any).__pendingFiles) || null}
          />
        </SheetContent>
      </Sheet>

      {/* ── Preview Modal ── */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(preview.mimeType)}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{preview.namaAsli}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(preview.ukuran)} • {new Date(preview.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-7 text-xs cursor-pointer" onClick={() => handleDownload(preview)}>
                  <Download className="h-3 w-3 mr-1" /> Download
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setPreview(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center min-h-[300px]">
              {preview.mimeType === "application/pdf" ? (
                <iframe src={`/api/dokumen/file/${preview.pathS3}`} className="w-full h-[70vh]" title={preview.namaAsli} />
              ) : preview.mimeType.startsWith("image/") ? (
                <img src={`/api/dokumen/file/${preview.pathS3}`} alt={preview.namaAsli} className="max-w-full max-h-[70vh] object-contain" />
              ) : (
                <div className="text-center py-12">
                  {getFileIcon(preview.mimeType)}
                  <p className="text-sm text-muted-foreground mt-3">Preview tidak tersedia untuk tipe file ini</p>
                  <Button size="sm" className="mt-4 cursor-pointer" onClick={() => handleDownload(preview)}>
                    <Download className="h-3 w-3 mr-1" /> Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Upload Form Component ──
function UploadForm({
  onUpload,
  uploading,
  onClose,
  pendingFiles,
}: {
  onUpload: (files: FileList, kategori: string) => void;
  uploading: boolean;
  onClose: () => void;
  pendingFiles: FileList | null;
}) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(pendingFiles);
  const [kategori, setKategori] = useState("SURAT");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (pendingFiles) setSelectedFiles(pendingFiles);
    // Cleanup
    return () => { if (typeof window !== "undefined") delete (window as any).__pendingFiles; };
  }, [pendingFiles]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Upload Dokumen</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); setSelectedFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <Upload className={cn("h-8 w-8 mx-auto mb-2", dragOver ? "text-primary" : "text-muted-foreground/50")} />
          <p className="text-xs font-medium">
            {selectedFiles ? `${selectedFiles.length} file dipilih` : "Klik atau drop file di sini"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">PDF, Word, Excel, Gambar (maks 10MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => setSelectedFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {selectedFiles && selectedFiles.length > 0 && (
          <div className="space-y-1.5">
            {Array.from(selectedFiles).map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{f.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatSize(f.size)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-xs">Kategori *</Label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {CATEGORIES.filter((c) => c.value !== "ALL").map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <Button
          disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
          onClick={() => selectedFiles && onUpload(selectedFiles, kategori)}
          className="w-full h-9 cursor-pointer"
        >
          {uploading ? (
            <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Mengupload...</>
          ) : (
            <><Upload className="h-3.5 w-3.5 mr-1.5" /> Upload {selectedFiles?.length || 0} File</>
          )}
        </Button>
      </div>
    </div>
  );
}
