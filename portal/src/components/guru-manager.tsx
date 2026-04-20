"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Upload,
  AlertCircle,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  name: string | null;
  role: string;
  nip: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

const roleBadge: Record<string, { label: string; color: string }> = {
  RADIG: { label: "Admin", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  TU: { label: "TU", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  Guru: { label: "Guru", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
};

export function GuruManager({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"add" | "import">("add");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [formError, setFormError] = useState("");

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    results?: { created: number; skipped: number; errors: string[] };
  } | null>(null);

  // Checkbox selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Form
  const [form, setForm] = useState({
    username: "", name: "", nip: "", role: "Guru", password: "Smpit2026", email: "", phone: "",
  });

  const resetForm = () => {
    setForm({ username: "", name: "", nip: "", role: "Guru", password: "Smpit2026", email: "", phone: "" });
    setEditUser(null);
    setFormError("");
  };

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guru");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // Create / Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setLoading(true);
    try {
      if (editUser) {
        const res = await fetch(`/api/guru/${editUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, nip: form.nip, role: form.role, email: form.email, phone: form.phone }),
        });
        if (!res.ok) { setFormError((await res.json()).error || "Gagal mengupdate"); return; }
      } else {
        const res = await fetch("/api/guru", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) { setFormError((await res.json()).error || "Gagal membuat akun"); return; }
      }
      setSheetOpen(false);
      resetForm();
      await refreshUsers();
    } finally {
      setLoading(false);
    }
  };

  // Import
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setLoading(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await fetch("/api/import-accounts", { method: "POST", body: fd });
      setImportResult(await res.json());
      await refreshUsers();
    } catch {
      setImportResult({ success: false, message: "Gagal menghubungi server" });
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/guru/${deleteConfirm.id}`, { method: "DELETE" });
      if (res.ok) { setDeleteConfirm(null); await refreshUsers(); }
    } finally {
      setLoading(false);
    }
  };

  // Full sync
  const handleFullSync = async () => {
    setSyncing(true);
    try { await fetch("/api/sync/full", { method: "POST" }); await refreshUsers(); } finally { setSyncing(false); }
  };

  // Filter
  const filtered = users.filter((u) => {
    const matchSearch = !search || (u.name || "").toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()) || (u.nip || "").includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Select all
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((u) => u.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-card/30">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 pl-8 text-sm bg-transparent border-border/50"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
            <SelectTrigger className="h-8 w-32 text-sm border-border/50">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="RADIG">Admin</SelectItem>
              <SelectItem value="TU">TU</SelectItem>
              <SelectItem value="Guru">Guru</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleFullSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => { resetForm(); setSheetTab("add"); setImportResult(null); setSheetOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" />
            Insert
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card/80 backdrop-blur-sm z-10">
            <tr className="border-b border-border/40">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="rounded border-border/50 accent-emerald-600"
                />
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                nama <span className="opacity-40">text</span>
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                username <span className="opacity-40">text</span>
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                nip <span className="opacity-40">text</span>
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                role <span className="opacity-40">enum</span>
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                status <span className="opacity-40">bool</span>
              </th>
              <th className="w-20 px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-muted-foreground text-sm">
                  {search ? "Tidak ada hasil" : "Belum ada data"}
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const rb = roleBadge[u.role] || roleBadge.Guru;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border/20 hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        className="rounded border-border/50 accent-emerald-600"
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">{u.name || "\u2014"}</td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">{u.username}</td>
                    <td className="px-4 py-2 font-mono text-muted-foreground hidden sm:table-cell">{u.nip || "\u2014"}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rb.color}`}>
                        {rb.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 hidden sm:table-cell">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="h-3 w-3" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditUser(u);
                            setForm({ username: u.username, name: u.name || "", nip: u.nip || "", role: u.role, password: "", email: u.email || "", phone: u.phone || "" });
                            setSheetTab("add");
                            setSheetOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
                          onClick={() => setDeleteConfirm(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-card/30 text-xs text-muted-foreground">
        <span>{filtered.length} rows</span>
        <span>{users.filter((u) => u.role === "Guru").length} guru · {users.filter((u) => u.role === "TU").length} tu · {users.filter((u) => u.role === "RADIG").length} admin</span>
      </div>

      {/* Add/Import Sheet (slides from right) */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) { resetForm(); setImportFile(null); setImportResult(null); } }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editUser ? "Edit User" : "Tambah User"}</SheetTitle>
          </SheetHeader>

          {/* Tabs — only show when not editing */}
          {!editUser && (
            <div className="flex border-b border-border/40 mx-4">
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  sheetTab === "add"
                    ? "border-emerald-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setSheetTab("add")}
              >
                Tambah Manual
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  sheetTab === "import"
                    ? "border-emerald-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setSheetTab("import")}
              >
                Import dari RADIG
              </button>
            </div>
          )}

          {/* Tab: Manual Add */}
          {sheetTab === "add" && (
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {formError && (
                <div className="text-sm text-red-500 bg-red-500/10 rounded-md p-3">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs">Username *</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    disabled={!!editUser}
                    placeholder="guru-nama"
                    className="h-9"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs">Role *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v ?? "Guru" })}>
                    <SelectTrigger id="role" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Guru">Guru</SelectItem>
                      <SelectItem value="RADIG">Admin</SelectItem>
                      <SelectItem value="TU">TU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Nama Lengkap *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ahmad Zaed S.pd, M.Si" className="h-9" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nip" className="text-xs">NIP</Label>
                  <Input id="nip" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} placeholder="NIP" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">No HP</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxx" className="h-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="h-9" />
              </div>
              {!editUser && (
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <Input id="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Default: Smpit2026" className="h-9" />
                  <p className="text-[10px] text-muted-foreground">Kosongkan untuk password default</p>
                </div>
              )}
              <SheetFooter className="p-0 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSheetOpen(false)}>Batal</Button>
                <Button type="submit" size="sm" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                  {loading ? "Menyimpan..." : editUser ? "Simpan" : "Buat Akun"}
                </Button>
              </SheetFooter>
            </form>
          )}

          {/* Tab: Import */}
          {sheetTab === "import" && (
            <form onSubmit={handleImport} className="p-4 space-y-4">
              <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-emerald-500/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Upload file JSON backup akun RADIG</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
                  className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-emerald-500/10 file:text-emerald-700 hover:file:bg-emerald-500/20 cursor-pointer"
                />
                {importFile && (
                  <p className="text-xs text-emerald-600 mt-2">File terpilih: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>
                )}
              </div>

              {importResult && (
                <div className={`p-3 rounded-lg border text-sm ${importResult.success ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {importResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                    <span className="font-medium text-xs">{importResult.message}</span>
                  </div>
                  {importResult.results && (
                    <p className="text-xs text-muted-foreground">{importResult.results.created} dibuat, {importResult.results.skipped} dilewati</p>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">Cara penggunaan:</p>
                <p>1. Buka <strong>Database Center</strong> di RADIG</p>
                <p>2. Klik <strong>EKSPOR AKUN</strong> untuk download JSON</p>
                <p>3. Upload file tersebut di sini</p>
                <p>4. Password default: <code className="bg-muted px-1 rounded">Smpit2026</code></p>
              </div>

              <SheetFooter className="p-0 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSheetOpen(false)}>Batal</Button>
                <Button type="submit" size="sm" disabled={!importFile || loading} className="bg-emerald-600 hover:bg-emerald-700">
                  {loading ? "Mengimport..." : "Import Akun"}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirm Sheet */}
      <Sheet open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="text-red-600">Hapus Akun</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Akun <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.username}) akan dihapus
              dari Portal, TU, dan RADIG. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Batal</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                {loading ? "Menghapus..." : "Hapus Permanen"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
