"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  FolderOpen, FileText, UserCircle,
  Search, Upload, LayoutGrid, List, Trash2, Download,
  X, File, FileSpreadsheet, FileImage,
  Plus, Loader2, ChevronRight, Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";

interface PegawaiSummary {
  id: string;
  namaLengkap: string;
  jabatan: string;
  nip: string;
  _count: { folders: number; dokumen: number };
}

interface EfilingFolder {
  id: string;
  nama: string;
  parentId: string | null;
  pegawaiId: string;
  _count?: { children: number; dokumen: number };
}

interface Dokumen {
  id: string;
  namaAsli: string;
  namaFile: string;
  ukuran: number;
  mimeType: string;
  pathS3: string;
  kategori: string;
  folderId: string | null;
  pegawaiId: string | null;
  uploadedBy: string;
  createdAt: string;
  pegawai: { namaLengkap: string; jabatan: string } | null;
}

const CATEGORIES = [
  { value: "SK", label: "Surat Keputusan" },
  { value: "SERTIFIKAT", label: "Sertifikat" },
  { value: "PRIBADI", label: "Pribadi" },
  { value: "SURAT", label: "Surat" },
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

interface Props {
  userId: string;
  role: string;
  userName: string;
}

export function EFilingManager({ userId, role, userName }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Navigation State
  const [pegawaiList, setPegawaiList] = useState<PegawaiSummary[]>([]);
  const [currentPegawaiId, setCurrentPegawaiId] = useState<string | null>(role === "UMUM" ? userId : null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Data State
  const [folders, setFolders] = useState<EfilingFolder[]>([]);
  const [documents, setDocuments] = useState<Dokumen[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string, nama: string}[]>([]);
  
  // UI State
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Dokumen | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Load Initial Data (Pegawai list for KHUSUS, Root folders for UMUM)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (role === "KHUSUS" && !currentPegawaiId) {
        // Load all Pegawai
        const res = await fetch("/api/efiling-folders");
        if (res.ok) {
          const data = await res.json();
          setPegawaiList(data.pegawaiList || []);
        }
      } else if (currentFolderId) {
        // Load specific folder
        const res = await fetch(`/api/efiling-folders/${currentFolderId}`);
        if (res.ok) {
          const data = await res.json();
          setFolders(data.children || []);
          setDocuments(data.dokumen || []);
          setBreadcrumbs(data.breadcrumbs || []);
        }
      } else if (currentPegawaiId) {
        // Load pegawai root folders
        const res = await fetch(`/api/efiling-folders?pegawaiId=${currentPegawaiId}`);
        if (res.ok) {
          const data = await res.json();
          setFolders(data.folders || []);
          setDocuments(data.documents || []);
          setBreadcrumbs([]);
        }
      }
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [role, currentPegawaiId, currentFolderId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Upload
  const handleUpload = async (files: FileList, kategori: string) => {
    setUploading(true);
    let success = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) { toast.error("Upload gagal"); continue; }
        const uploadData = await uploadRes.json();

        const docRes = await fetch("/api/dokumen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            ...uploadData, 
            kategori,
            folderId: currentFolderId,
            pegawaiId: currentPegawaiId || userId
          }),
        });
        if (!docRes.ok) throw new Error();
        success++;
      } catch {
        toast.error(`Gagal upload: ${file.name}`);
      }
    }
    if (success > 0) {
      toast.success(`${success} file berhasil diupload`);
      loadData();
    }
    setUploading(false);
    setShowUpload(false);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Hapus dokumen ini?")) return;
    try {
      const res = await fetch(`/api/dokumen/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Dokumen dihapus");
      if (preview?.id === id) setPreview(null);
    } catch { toast.error("Gagal menghapus"); }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch("/api/efiling-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: newFolderName,
          parentId: currentFolderId,
          pegawaiId: currentPegawaiId || userId
        })
      });
      if (res.ok) {
        toast.success("Folder dibuat");
        setNewFolderName("");
        setShowNewFolder(false);
        loadData();
      } else {
        toast.error("Gagal membuat folder");
      }
    } catch {
      toast.error("Error jaringan");
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus folder ini beserta seluruh isinya?")) return;
    try {
      const res = await fetch(`/api/efiling-folders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Gagal menghapus folder");
        return;
      }
      toast.success("Folder dihapus");
      setFolders(prev => prev.filter(f => f.id !== id));
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const handleDownload = (doc: Dokumen) => {
    const a = document.createElement("a");
    a.href = `/api/dokumen/file/${doc.pathS3}`;
    a.download = doc.namaAsli;
    a.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      setShowUpload(true);
      (window as any).__pendingFiles = e.dataTransfer.files;
    }
  };

  const filteredFolders = folders.filter(f => f.nama.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDocs = documents.filter(d => d.namaAsli.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPegawai = pegawaiList.filter(p => p.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render Pegawai View (for KHUSUS)
  if (role === "KHUSUS" && !currentPegawaiId) {
    return (
      <div className="flex flex-col h-full overflow-hidden p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">e-Filing Pegawai</h2>
            <p className="text-sm text-muted-foreground">Pilih pegawai untuk melihat folder dokumen</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pegawai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
            {filteredPegawai.map(p => (
              <div 
                key={p.id} 
                onClick={() => setCurrentPegawaiId(p.id)}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer transition-all hover:shadow-sm"
              >
                <div className="bg-primary/10 p-2 rounded-full">
                  <UserCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{p.namaLengkap}</p>
                  <p className="text-xs text-muted-foreground">{p.jabatan}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {p._count.folders} Folder • {p._count.dokumen} Dokumen
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Folder View
  return (
    <div className="flex flex-col h-full overflow-hidden"
         onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
         onDragLeave={() => setDragOver(false)}
         onDrop={handleDrop}>
      
      {/* Breadcrumbs & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-1 text-sm font-medium overflow-x-auto whitespace-nowrap pb-1 sm:pb-0 scrollbar-hide">
          {role === "KHUSUS" && (
            <>
              <button onClick={() => { setCurrentPegawaiId(null); setCurrentFolderId(null); }} className="hover:text-primary transition-colors text-muted-foreground">Pegawai</button>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </>
          )}
          <button onClick={() => setCurrentFolderId(null)} className={cn("hover:text-primary transition-colors", !currentFolderId ? "text-foreground font-bold" : "text-muted-foreground")}>
            Root
          </button>
          {breadcrumbs.map((b) => (
            <div key={b.id} className="flex items-center gap-1 shrink-0">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <button onClick={() => setCurrentFolderId(b.id)} className={cn("hover:text-primary transition-colors", currentFolderId === b.id ? "text-foreground font-bold" : "text-muted-foreground")}>
                {b.nama}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 pl-7 text-xs" />
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setShowNewFolder(true)}>
            <FolderPlusIcon className="h-4 w-4 mr-1" /> Folder
          </Button>
          <Button size="sm" className="h-8" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4 mr-1" /> Upload
          </Button>
        </div>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6" /></div>
        ) : (
          <>
            {/* Folders Section */}
            {filteredFolders.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Folders</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredFolders.map(f => (
                    <div key={f.id} onClick={() => setCurrentFolderId(f.id)} 
                         className="group flex items-center p-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-muted/50 cursor-pointer transition-all">
                      <Folder className="h-8 w-8 text-amber-400 mr-3 shrink-0 fill-amber-400/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.nama}</p>
                        <p className="text-[10px] text-muted-foreground">{f._count?.dokumen || 0} file</p>
                      </div>
                      <button onClick={(e) => handleDeleteFolder(f.id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Section */}
            {filteredDocs.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-2">Files</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredDocs.map((doc) => (
                    <div key={doc.id} className="group cursor-pointer" onClick={() => setPreview(doc)}>
                      <div className="aspect-[4/3] rounded-lg border border-border overflow-hidden bg-muted/30 flex justify-center items-center group-hover:border-primary/50 transition-colors">
                        {getFileIcon(doc.mimeType)}
                      </div>
                      <div className="mt-2 px-1">
                        <p className="text-xs font-semibold truncate">{doc.namaAsli}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[10px] text-muted-foreground">{formatSize(doc.ukuran)}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} className="text-primary hover:bg-primary/10 p-0.5 rounded"><Download className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }} className="text-red-500 hover:bg-red-500/10 p-0.5 rounded"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredFolders.length === 0 && filteredDocs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderOpen className="h-14 w-14 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">Folder kosong</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Sheet */}
      <Sheet open={showUpload} onOpenChange={setShowUpload}>
        <SheetContent 
          side={isDesktop ? "right" : "bottom"} 
          className={cn(
            "p-0 flex flex-col border-l border-border/50 shadow-2xl",
            isDesktop ? "sm:max-w-md w-full" : "h-[85vh]",
            "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          )}
        >
          <UploadForm onUpload={handleUpload} uploading={uploading} onClose={() => setShowUpload(false)} pendingFiles={(typeof window !== "undefined" && (window as any).__pendingFiles) || null} />
        </SheetContent>
      </Sheet>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-lg p-5">
            <h3 className="text-lg font-semibold mb-4">Folder Baru</h3>
            <Input placeholder="Nama folder..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} autoFocus />
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setShowNewFolder(false)}>Batal</Button>
              <Button onClick={handleCreateFolder}>Buat</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Document Preview omitted for brevity, uses handleDownload */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-card p-5 rounded-xl text-center max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">{getFileIcon(preview.mimeType)}</div>
            <h3 className="font-semibold text-sm truncate">{preview.namaAsli}</h3>
            <p className="text-xs text-muted-foreground mt-1">{formatSize(preview.ukuran)}</p>
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPreview(null)}>Tutup</Button>
              <Button size="sm" onClick={() => handleDownload(preview)}><Download className="h-4 w-4 mr-2" /> Download</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderPlusIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="9" y1="13" x2="15" y2="13"/>
    </svg>
  );
}

function UploadForm({ onUpload, uploading, onClose, pendingFiles }: any) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(pendingFiles);
  const [kategori, setKategori] = useState("SURAT");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col justify-center px-6 py-5 border-b border-border/40 bg-muted/10">
        <h2 className="text-base font-semibold text-foreground">Upload File</h2>
        <p className="text-xs text-muted-foreground mt-1">Unggah dokumen baru ke direktori ini</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="border-2 border-dashed border-border/60 bg-muted/5 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <div className="bg-background rounded-full p-3 w-12 h-12 mx-auto flex items-center justify-center mb-3 shadow-sm border border-border/50 group-hover:scale-105 transition-transform">
            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {selectedFiles ? `${selectedFiles.length} file dipilih` : "Klik atau Drop file di sini"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Hanya file berukuran kurang dari 10MB</p>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => setSelectedFiles(e.target.files)} />
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kategori Dokumen</Label>
          <select 
            value={kategori} 
            onChange={(e) => setKategori(e.target.value)} 
            className="w-full h-10 rounded-lg border border-border/60 bg-background/50 px-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-shadow"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex justify-end gap-3 mt-auto shrink-0">
        <Button variant="outline" onClick={onClose} type="button" disabled={uploading}>
          Batal
        </Button>
        <Button 
          disabled={!selectedFiles || uploading} 
          onClick={() => selectedFiles && onUpload(selectedFiles, kategori)}
        >
          {uploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload {selectedFiles ? `(${selectedFiles.length})` : ""}
        </Button>
      </div>
    </>
  );
}
