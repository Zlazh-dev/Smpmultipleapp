"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, AlertCircle, Users } from "lucide-react";

export default function ImportAccountsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    results?: { created: number; skipped: number; errors: string[] };
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import-accounts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "Gagal menghubungi server" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Users className="h-7 w-7 text-emerald-500" />
          Import Akun dari RADIG
        </h1>
        <p className="text-muted-foreground">
          Upload file JSON backup akun dari RADIG untuk membuat akun di Portal secara otomatis.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Upload File Backup Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-emerald-500/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <input
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-700 hover:file:bg-emerald-500/20 cursor-pointer"
              />
              {file && (
                <p className="text-sm text-emerald-600 mt-2 font-medium">
                  ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Mengimport..." : "Import Akun ke Portal"}
            </button>
          </form>

          {result && (
            <div className={`mt-6 p-4 rounded-xl border ${result.success ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <p className="font-semibold text-sm">{result.message}</p>
              </div>
              {result.results && (
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <p>✓ Diproses: {result.results.created} akun</p>
                  {result.results.skipped > 0 && (
                    <p>✗ Dilewati: {result.results.skipped} akun</p>
                  )}
                  <p className="text-xs mt-2 opacity-75">Password default: Smpit2026</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground">Cara Penggunaan:</h3>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Buka halaman <strong>Database Center</strong> di RADIG</li>
            <li>Klik tombol <strong>EKSPOR AKUN</strong> untuk download file JSON</li>
            <li>Upload file JSON tersebut di halaman ini</li>
            <li>Akun guru akan otomatis dibuat dengan password default <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Smpit2026</code></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
