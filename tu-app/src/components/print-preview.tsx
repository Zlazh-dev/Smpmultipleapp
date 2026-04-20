"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Printer, Save, Download, X, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const A4_W = 595;
const A4_H = 842;

interface EditorElement {
  id: string;
  type: "text" | "image" | "rect" | "line" | "qrcode" | "group";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  content: string;
  children?: string[];
  parentId?: string;
  style: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    textAlign: string;
    color: string;
    bgColor: string;
    borderColor: string;
    borderWidth: number;
    opacity: number;
  };
}

interface TemplateData {
  title: string;
  width: number;
  height: number;
  elements: EditorElement[];
}

interface PrintPreviewProps {
  template: TemplateData;
  variables: Record<string, string>;
  pegawaiId: string;
  kategori: string; // SK, SURAT_TUGAS, etc.
  onClose: () => void;
}

function replaceVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\[(\w+)\]/g, (match, key) => vars[key] || match);
}

function buildHtml(elements: EditorElement[], vars: Record<string, string>, useMm: boolean): string {
  const visibleEls = elements.filter((e) => e.type !== "group");

  const toMmX = (px: number) => (px / A4_W) * 210;
  const toMmY = (py: number) => (py / A4_H) * 297;
  const toMmFont = (fs: number) => (fs / A4_W) * 210;

  return visibleEls.map((el) => {
    const content = replaceVars(el.content, vars);
    const s = useMm
      ? `position:absolute;left:${toMmX(el.x)}mm;top:${toMmY(el.y)}mm;width:${toMmX(el.w)}mm;height:${toMmY(el.h)}mm;opacity:${el.style.opacity};`
      : `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;opacity:${el.style.opacity};`;

    if (el.type === "text") {
      const fs = useMm ? `${toMmFont(el.style.fontSize)}mm` : `${el.style.fontSize}px`;
      const pd = useMm ? `${toMmX(2)}mm` : "2px";
      return `<div style="${s}font-family:${el.style.fontFamily};font-size:${fs};font-weight:${el.style.fontWeight};text-align:${el.style.textAlign};color:${el.style.color};line-height:1.4;white-space:pre-wrap;padding:${pd};word-break:break-word;overflow:hidden;">${content}</div>`;
    }
    if (el.type === "rect") {
      const bw = useMm ? `${toMmX(el.style.borderWidth)}mm` : `${el.style.borderWidth}px`;
      return `<div style="${s}background:${el.style.bgColor};border:${bw} solid ${el.style.borderColor};"></div>`;
    }
    if (el.type === "line") {
      const bw = useMm ? `${toMmX(el.style.borderWidth || 1)}mm` : `${el.style.borderWidth || 1}px`;
      return `<div style="${s}border-top:${bw} solid ${el.style.borderColor};height:0;"></div>`;
    }
    if (el.type === "image") return `<img src="${content}" style="${s}object-fit:contain;" />`;
    return "";
  }).join("");
}

export function PrintPreview({ template, variables, pegawaiId, kategori, onClose }: PrintPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const screenHtml = buildHtml(template.elements, variables, false);
  const printHtml = buildHtml(template.elements, variables, true);

  const handlePrint = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;

    pw.document.write(`<!DOCTYPE html><html><head><title>${replaceVars(template.title, variables)}</title><style>
      @page{size:A4;margin:0}
      body{margin:0}
      .print-page{width:210mm;height:297mm;position:relative;overflow:hidden}
    </style></head><body>
      <div class="print-page">${printHtml}</div>
      <script>window.onload=function(){window.print()}<\/script>
    </body></html>`);
    pw.document.close();
  };

  const handleSaveAndPrint = async () => {
    setSaving(true);
    try {
      // Dynamically import to reduce bundle size
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      if (!previewRef.current) throw new Error("Preview not ready");

      // Render to canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: A4_W,
        height: A4_H,
      });

      // Convert to PDF
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);

      // Convert PDF to blob
      const pdfBlob = pdf.output("blob");
      const title = replaceVars(template.title, variables);
      const fileName = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;

      // Upload to dokumen API
      const formData = new FormData();
      formData.append("file", new File([pdfBlob], fileName, { type: "application/pdf" }));
      formData.append("kategori", kategori);

      const res = await fetch(`/api/pegawai/${pegawaiId}/dokumen`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload gagal");

      toast.success("Dokumen berhasil disimpan & siap cetak");

      // Also trigger print
      handlePrint();
    } catch (err) {
      console.error("Save & print error:", err);
      toast.error("Gagal menyimpan dokumen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-3xl my-6 mx-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 bg-card/95 backdrop-blur-xl rounded-xl border border-border/50 p-3 shadow-2xl sticky top-6 z-10">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold flex-1 truncate">
            {replaceVars(template.title, variables)}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="cursor-pointer"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Cetak
          </Button>

          <Button
            size="sm"
            onClick={handleSaveAndPrint}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Menyimpan..." : "Cetak & Simpan"}
          </Button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center">
          <div
            ref={previewRef}
            className="relative bg-white shadow-2xl"
            style={{ width: A4_W, height: A4_H }}
            dangerouslySetInnerHTML={{ __html: screenHtml }}
          />
        </div>
      </div>
    </div>
  );
}
