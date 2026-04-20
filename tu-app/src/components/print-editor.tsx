"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Type, ImageIcon, Square, Minus, QrCode, Save, Eye,
  ChevronLeft, Trash2, Copy, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, Grid3X3, Magnet,
  ZoomIn, ZoomOut, MousePointer2, Undo2, Redo2,
  Layers, Group, Ungroup, ChevronDown, ChevronRight,
} from "lucide-react";

// ── Types ──
export interface EditorElement {
  id: string;
  type: "text" | "image" | "rect" | "line" | "qrcode" | "group";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  content: string;
  children?: string[]; // IDs of child elements (for groups)
  parentId?: string;   // ID of parent group
  collapsed?: boolean; // Layer panel collapse state
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

interface EditorState {
  title: string;
  width: number;
  height: number;
  elements: EditorElement[];
  selectedIds: string[];
}

const A4_W = 595;
const A4_H = 842;
const MAX_HISTORY = 50;

const TEMPLATE_VARS = [
  // Pegawai
  "namaLengkap", "nip", "jabatan", "username", "noHp", "alamat", "accessLevel",
  // SK
  "noSK", "tanggalSK", "jenisSK", "perihalSK", "berlakuSampai", "keteranganSK",
  // Cuti
  "jenisCuti", "tanggalMulai", "tanggalSelesai", "lamaHari", "alasan",
  // Sekolah & Umum
  "tanggalSekarang", "namaSekolah", "alamatSekolah", "npsn", "tahunAjaran",
  // RADIG
  "namaKepsek", "nipKepsek", "jumlahSiswa", "jumlahGuru", "kelasAjar",
];

function uid() { return Math.random().toString(36).slice(2, 9); }

const defaultStyle: EditorElement["style"] = {
  fontFamily: "Times New Roman", fontSize: 14, fontWeight: "normal",
  textAlign: "left", color: "#000000", bgColor: "transparent",
  borderColor: "#000000", borderWidth: 0, opacity: 1,
};

interface PrintEditorProps {
  templateId?: string;
  initialData?: any;
  templateName?: string;
}

export function PrintEditor({ templateId, initialData, templateName }: PrintEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(80);
  const [snap, setSnap] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [rightTab, setRightTab] = useState<"design" | "vars">("design");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── History (undo/redo) ──
  const historyRef = useRef<EditorState[]>([]);
  const historyIdxRef = useRef(-1);
  const skipHistoryRef = useRef(false);

  const [state, setState] = useState<EditorState>(() => {
    const init: EditorState = initialData?.elements
      ? { title: initialData.title || templateName || "Template Surat", width: initialData.width || A4_W, height: initialData.height || A4_H, elements: initialData.elements || [], selectedIds: [] }
      : { title: templateName || "Template Surat", width: A4_W, height: A4_H, elements: [], selectedIds: [] };
    historyRef.current = [init];
    historyIdxRef.current = 0;
    return init;
  });

  const pushHistory = useCallback((newState: EditorState) => {
    if (skipHistoryRef.current) { skipHistoryRef.current = false; return; }
    const h = historyRef.current;
    const idx = historyIdxRef.current;
    // Trim future states
    historyRef.current = h.slice(0, idx + 1);
    historyRef.current.push(newState);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIdxRef.current = historyRef.current.length - 1;
  }, []);

  const setStateWithHistory = useCallback((updater: EditorState | ((prev: EditorState) => EditorState)) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    const idx = historyIdxRef.current;
    if (idx <= 0) return;
    historyIdxRef.current = idx - 1;
    skipHistoryRef.current = true;
    setState(historyRef.current[idx - 1]);
  }, []);

  const redo = useCallback(() => {
    const idx = historyIdxRef.current;
    if (idx >= historyRef.current.length - 1) return;
    historyIdxRef.current = idx + 1;
    skipHistoryRef.current = true;
    setState(historyRef.current[idx + 1]);
  }, []);

  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; elW: number; elH: number } | null>(null);

  const selected = state.selectedIds.length === 1 ? state.elements.find((e) => e.id === state.selectedIds[0]) || null : null;
  const scale = zoom / 100;

  // ── Helpers ──
  const getGroupChildren = (groupId: string): string[] => {
    return state.elements.filter((e) => e.parentId === groupId).map((e) => e.id);
  };

  const getSelectedAndChildren = (): string[] => {
    const ids = new Set<string>(state.selectedIds);
    state.selectedIds.forEach((id) => {
      const el = state.elements.find((e) => e.id === id);
      if (el?.type === "group" && el.children) {
        el.children.forEach((cid) => ids.add(cid));
      }
    });
    return Array.from(ids);
  };

  // ── CRUD ──
  const addElement = (type: EditorElement["type"]) => {
    const el: EditorElement = {
      id: uid(), type, x: 50, y: 50,
      w: type === "line" ? 200 : type === "text" ? 200 : 120,
      h: type === "line" ? 2 : type === "text" ? 30 : 120,
      rotation: 0,
      content: type === "text" ? "Teks baru" : type === "qrcode" ? "[nip]" : "",
      style: { ...defaultStyle },
    };
    setStateWithHistory((s) => ({ ...s, elements: [...s.elements, el], selectedIds: [el.id] }));
  };

  const updateElement = (id: string, patch: Partial<EditorElement>) => {
    setState((s) => ({ ...s, elements: s.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  };

  const updateElementWithHistory = (id: string, patch: Partial<EditorElement>) => {
    setStateWithHistory((s) => ({ ...s, elements: s.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  };

  const updateStyle = (id: string, patch: Partial<EditorElement["style"]>) => {
    setStateWithHistory((s) => ({ ...s, elements: s.elements.map((e) => e.id === id ? { ...e, style: { ...e.style, ...patch } } : e) }));
  };

  const deleteSelected = useCallback(() => {
    if (state.selectedIds.length === 0) return;
    const toDelete = new Set(getSelectedAndChildren());
    setStateWithHistory((s) => ({
      ...s,
      elements: s.elements.filter((e) => !toDelete.has(e.id)),
      selectedIds: [],
    }));
  }, [state.selectedIds]);

  const duplicateSelected = useCallback(() => {
    if (state.selectedIds.length === 0) return;
    setStateWithHistory((s) => {
      const newEls: EditorElement[] = [];
      const idMap = new Map<string, string>();

      s.selectedIds.forEach((id) => {
        const el = s.elements.find((e) => e.id === id);
        if (!el) return;
        const newId = uid();
        idMap.set(id, newId);
        newEls.push({ ...el, id: newId, x: el.x + 15, y: el.y + 15, children: el.children ? [...el.children] : undefined });
      });

      // Re-map children IDs for duplicated groups
      newEls.forEach((el) => {
        if (el.children) {
          el.children = el.children.map((cid) => idMap.get(cid) || cid);
        }
        if (el.parentId && idMap.has(el.parentId)) {
          el.parentId = idMap.get(el.parentId);
        }
      });

      return { ...s, elements: [...s.elements, ...newEls], selectedIds: newEls.map((e) => e.id) };
    });
  }, [state.selectedIds]);

  // ── Group / Ungroup ──
  const groupSelected = useCallback(() => {
    if (state.selectedIds.length < 2) { toast.error("Pilih minimal 2 elemen"); return; }
    // Only group top-level (non-children) elements
    const topLevel = state.selectedIds.filter((id) => {
      const el = state.elements.find((e) => e.id === id);
      return el && !el.parentId;
    });
    if (topLevel.length < 2) return;

    const selectedEls = state.elements.filter((e) => topLevel.includes(e.id));
    const minX = Math.min(...selectedEls.map((e) => e.x));
    const minY = Math.min(...selectedEls.map((e) => e.y));
    const maxX = Math.max(...selectedEls.map((e) => e.x + e.w));
    const maxY = Math.max(...selectedEls.map((e) => e.y + e.h));

    const groupId = uid();
    const groupEl: EditorElement = {
      id: groupId, type: "group",
      x: minX, y: minY, w: maxX - minX, h: maxY - minY,
      rotation: 0, content: "Group",
      children: topLevel,
      style: { ...defaultStyle, opacity: 1 },
    };

    setStateWithHistory((s) => ({
      ...s,
      elements: [
        ...s.elements.map((e) => topLevel.includes(e.id) ? { ...e, parentId: groupId } : e),
        groupEl,
      ],
      selectedIds: [groupId],
    }));
    toast.success(`${topLevel.length} elemen digabung`);
  }, [state.selectedIds, state.elements]);

  const ungroupSelected = useCallback(() => {
    const groupEl = state.selectedIds.length === 1
      ? state.elements.find((e) => e.id === state.selectedIds[0] && e.type === "group")
      : null;
    if (!groupEl) { toast.error("Pilih sebuah group"); return; }

    const childIds = groupEl.children || [];
    setStateWithHistory((s) => ({
      ...s,
      elements: s.elements
        .filter((e) => e.id !== groupEl.id) // Remove group
        .map((e) => childIds.includes(e.id) ? { ...e, parentId: undefined } : e), // Free children
      selectedIds: childIds,
    }));
    toast.success("Group dilepas");
  }, [state.selectedIds, state.elements]);

  const moveLayer = (id: string, dir: "up" | "down") => {
    setStateWithHistory((s) => {
      const idx = s.elements.findIndex((e) => e.id === id);
      if (idx < 0) return s;
      const newEls = [...s.elements];
      const target = dir === "up" ? idx + 1 : idx - 1;
      if (target < 0 || target >= newEls.length) return s;
      [newEls[idx], newEls[target]] = [newEls[target], newEls[idx]];
      return { ...s, elements: newEls };
    });
  };

  // ── Mouse ──
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = state.elements.find((el) => el.id === id);
    if (!el) return;

    // If element is in a group, select the group instead (unless already selected inside)
    const targetId = el.parentId && !state.selectedIds.includes(el.parentId) ? el.parentId : id;

    if (e.shiftKey) {
      // Multi-select
      setState((s) => ({
        ...s,
        selectedIds: s.selectedIds.includes(targetId)
          ? s.selectedIds.filter((i) => i !== targetId)
          : [...s.selectedIds, targetId],
      }));
    } else {
      setState((s) => ({ ...s, selectedIds: [targetId] }));
    }

    const target = state.elements.find((el) => el.id === targetId) || el;
    setDragging({ id: targetId, startX: e.clientX, startY: e.clientY, elX: target.x, elY: target.y });
  };

  const handleResizeDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = state.elements.find((el) => el.id === id);
    if (!el) return;
    setResizing({ id, startX: e.clientX, startY: e.clientY, elW: el.w, elH: el.h });
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / scale;
        const dy = (e.clientY - dragging.startY) / scale;
        let nx = dragging.elX + dx, ny = dragging.elY + dy;
        if (snap) { nx = Math.round(nx / 5) * 5; ny = Math.round(ny / 5) * 5; }
        updateElement(dragging.id, { x: nx, y: ny });

        // Move children if group
        const el = state.elements.find((e) => e.id === dragging.id);
        if (el?.type === "group" && el.children) {
          const origGroup = historyRef.current[historyIdxRef.current]?.elements.find((e) => e.id === dragging.id);
          if (origGroup) {
            const gdx = nx - origGroup.x, gdy = ny - origGroup.y;
            el.children.forEach((cid) => {
              const origChild = historyRef.current[historyIdxRef.current]?.elements.find((e) => e.id === cid);
              if (origChild) {
                updateElement(cid, { x: origChild.x + gdx, y: origChild.y + gdy });
              }
            });
          }
        }
      }
      if (resizing) {
        const dx = (e.clientX - resizing.startX) / scale;
        const dy = (e.clientY - resizing.startY) / scale;
        let nw = Math.max(20, resizing.elW + dx), nh = Math.max(5, resizing.elH + dy);
        if (snap) { nw = Math.round(nw / 5) * 5; nh = Math.round(nh / 5) * 5; }
        updateElement(resizing.id, { w: nw, h: nh });
      }
    };
    const up = () => {
      if (dragging || resizing) {
        // Commit to history after drag/resize
        pushHistory(state);
      }
      setDragging(null);
      setResizing(null);
    };
    if (dragging || resizing) {
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    }
  }, [dragging, resizing, scale, snap, state]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire if editing text or typing in input
      if (editingId) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
      }
      // Ctrl+D — Duplicate
      if (ctrl && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      // Ctrl+Z — Undo
      if (ctrl && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      // Ctrl+Shift+Z or Ctrl+Y — Redo
      if ((ctrl && e.shiftKey && e.key === "z") || (ctrl && e.key === "y")) {
        e.preventDefault();
        redo();
        return;
      }
      // Ctrl+G — Group
      if (ctrl && !e.shiftKey && e.key === "g") {
        e.preventDefault();
        groupSelected();
        return;
      }
      // Ctrl+Shift+G — Ungroup
      if (ctrl && e.shiftKey && e.key === "g") {
        e.preventDefault();
        ungroupSelected();
        return;
      }
      // Ctrl+A — Select all
      if (ctrl && e.key === "a") {
        e.preventDefault();
        setState((s) => ({ ...s, selectedIds: s.elements.filter((e) => !e.parentId).map((e) => e.id) }));
        return;
      }
      // Escape — Deselect
      if (e.key === "Escape") {
        setState((s) => ({ ...s, selectedIds: [] }));
        setEditingId(null);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, deleteSelected, duplicateSelected, undo, redo, groupSelected, ungroupSelected]);

  // ── Preview ──
  const handlePreview = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    const visibleEls = state.elements.filter((e) => e.type !== "group");
    
    // Screen preview HTML (px-based, same as editor)
    const screenHtml = visibleEls.map((el) => {
      const s = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;opacity:${el.style.opacity};`;
      if (el.type === "text") return `<div style="${s}font-family:${el.style.fontFamily};font-size:${el.style.fontSize}px;font-weight:${el.style.fontWeight};text-align:${el.style.textAlign};color:${el.style.color};line-height:1.4;white-space:pre-wrap;padding:2px;word-break:break-word;overflow:hidden;">${el.content}</div>`;
      if (el.type === "rect") return `<div style="${s}background:${el.style.bgColor};border:${el.style.borderWidth}px solid ${el.style.borderColor};"></div>`;
      if (el.type === "line") return `<div style="${s}border-top:${el.style.borderWidth || 1}px solid ${el.style.borderColor};height:0;"></div>`;
      if (el.type === "image") return `<img src="${el.content}" style="${s}object-fit:contain;" />`;
      return "";
    }).join("");
    
    // Print HTML (mm-based for exact A4 positioning)
    const toMmX = (px: number) => (px / A4_W) * 210;
    const toMmY = (py: number) => (py / A4_H) * 297;
    const toMmFont = (fs: number) => (fs / A4_W) * 210;
    
    const printHtml = visibleEls.map((el) => {
      const s = `position:absolute;left:${toMmX(el.x)}mm;top:${toMmY(el.y)}mm;width:${toMmX(el.w)}mm;height:${toMmY(el.h)}mm;opacity:${el.style.opacity};`;
      if (el.type === "text") return `<div style="${s}font-family:${el.style.fontFamily};font-size:${toMmFont(el.style.fontSize)}mm;font-weight:${el.style.fontWeight};text-align:${el.style.textAlign};color:${el.style.color};line-height:1.4;white-space:pre-wrap;padding:${toMmX(2)}mm;word-break:break-word;overflow:hidden;">${el.content}</div>`;
      if (el.type === "rect") return `<div style="${s}background:${el.style.bgColor};border:${toMmX(el.style.borderWidth)}mm solid ${el.style.borderColor};"></div>`;
      if (el.type === "line") return `<div style="${s}border-top:${toMmX(el.style.borderWidth || 1)}mm solid ${el.style.borderColor};height:0;"></div>`;
      if (el.type === "image") return `<img src="${el.content}" style="${s}object-fit:contain;" />`;
      return "";
    }).join("");
    
    pw.document.write(`<!DOCTYPE html><html><head><title>${state.title}</title><style>
      @page{size:A4;margin:0}
      body{margin:0}
      .screen-preview{width:${A4_W}px;height:${A4_H}px;position:relative;margin:0 auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.15)}
      .print-page{width:210mm;height:297mm;position:relative;overflow:hidden;display:none}
      @media print{.np{display:none!important}.screen-preview{display:none!important}.print-page{display:block!important}}
      @media screen{.print-page{display:none!important}}
    </style></head><body>
      <div class="np" style="text-align:center;padding:12px;background:#1e1e1e;">
        <button onclick="window.print()" style="padding:8px 24px;background:#0d99ff;color:white;border:none;border-radius:8px;cursor:pointer;">🖨 Print</button>
      </div>
      <div style="display:flex;justify-content:center;padding:32px;background:#f3f4f6;min-height:calc(100vh - 48px)" class="np">
        <div class="screen-preview">${screenHtml}</div>
      </div>
      <div class="print-page">${printHtml}</div>
    </body></html>`);
    pw.document.close();
  };

  // ── Save ──
  const handleSave = async () => {
    if (!templateId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasData: { title: state.title, width: state.width, height: state.height, elements: state.elements } }),
      });
      if (!res.ok) throw new Error();
      toast.success("Tersimpan");
    } catch { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  // ── Render Element ──
  const renderElement = (el: EditorElement) => {
    if (el.type === "group") return null; // Groups are invisible containers
    const isSel = state.selectedIds.includes(el.id) || (el.parentId && state.selectedIds.includes(el.parentId));
    const isEdit = editingId === el.id;
    const base: React.CSSProperties = {
      position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      opacity: el.style.opacity, userSelect: "none",
    };

    let content: React.ReactNode = null;

    if (el.type === "text") {
      content = (
        <div
          style={{
            ...base, fontFamily: el.style.fontFamily, fontSize: el.style.fontSize,
            fontWeight: el.style.fontWeight as any, textAlign: el.style.textAlign as any,
            color: el.style.color, background: el.style.bgColor === "transparent" ? undefined : el.style.bgColor,
            lineHeight: 1.4, padding: 2, overflow: isEdit ? "auto" : "hidden",
            whiteSpace: "pre-wrap", wordBreak: "break-word", cursor: isEdit ? "text" : "move",
          }}
          contentEditable={isEdit} suppressContentEditableWarning
          onMouseDown={(e) => { if (isEdit) { e.stopPropagation(); return; } handleMouseDown(e, el.id); }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditingId(el.id); setState((s) => ({ ...s, selectedIds: [el.id] })); }}
          onBlur={(e) => { if (isEdit) { updateElementWithHistory(el.id, { content: e.currentTarget.innerText }); setEditingId(null); } }}
          onKeyDown={(e) => { if (e.key === "Escape" && isEdit) { updateElementWithHistory(el.id, { content: e.currentTarget.innerText }); setEditingId(null); e.currentTarget.blur(); } }}
        >{el.content}</div>
      );
    } else if (el.type === "rect") {
      content = <div style={{ ...base, background: el.style.bgColor === "transparent" ? "transparent" : el.style.bgColor, border: `${el.style.borderWidth || 1}px solid ${el.style.borderColor}`, cursor: "move" }} onMouseDown={(e) => handleMouseDown(e, el.id)} />;
    } else if (el.type === "line") {
      content = <div style={{ ...base, borderTop: `${el.style.borderWidth || 1}px solid ${el.style.borderColor}`, height: 0, cursor: "move" }} onMouseDown={(e) => handleMouseDown(e, el.id)} />;
    } else if (el.type === "image") {
      content = (
        <div style={{ ...base, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #555", cursor: "move" }} onMouseDown={(e) => handleMouseDown(e, el.id)}>
          {el.content ? <img src={el.content} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="" /> : <ImageIcon className="h-8 w-8 text-gray-400" />}
        </div>
      );
    } else if (el.type === "qrcode") {
      content = (
        <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #555", background: "#fafafa", cursor: "move" }} onMouseDown={(e) => handleMouseDown(e, el.id)}>
          <QrCode className="h-10 w-10 text-gray-500" />
        </div>
      );
    }

    return (
      <div key={el.id}>
        {content}
        {isSel && !isEdit && (
          <>
            <div style={{ position: "absolute", left: el.x - 1, top: el.y - 1, width: el.w + 2, height: el.h + 2, border: "1.5px solid #0d99ff", pointerEvents: "none", zIndex: 90 }} />
            <div style={{ position: "absolute", left: el.x + el.w - 4, top: el.y + el.h - 4, width: 8, height: 8, background: "white", border: "1.5px solid #0d99ff", borderRadius: 1, cursor: "se-resize", zIndex: 100 }} onMouseDown={(e) => handleResizeDown(e, el.id)} />
            <div style={{ position: "absolute", left: el.x - 4, top: el.y - 4, width: 8, height: 8, background: "white", border: "1.5px solid #0d99ff", borderRadius: 1, cursor: "nw-resize", zIndex: 100 }} onMouseDown={(e) => e.stopPropagation()} />
          </>
        )}
        {isEdit && <div style={{ position: "absolute", left: el.x - 1, top: el.y - 1, width: el.w + 2, height: el.h + 2, border: "1.5px solid #0d99ff", pointerEvents: "none", zIndex: 90 }} />}
      </div>
    );
  };

  // Group bounding box
  const renderGroupBox = (groupEl: EditorElement) => {
    if (!state.selectedIds.includes(groupEl.id)) return null;
    return (
      <div key={`gb-${groupEl.id}`} style={{
        position: "absolute", left: groupEl.x - 2, top: groupEl.y - 2,
        width: groupEl.w + 4, height: groupEl.h + 4,
        border: "1.5px dashed #0d99ff", pointerEvents: "none", zIndex: 85,
        borderRadius: 2,
      }} />
    );
  };

  // ── UI Helpers ──
  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="border-b border-[#3a3a3a]">
      <div className="px-3 py-2 text-[10px] font-semibold text-[#999] uppercase tracking-wider">{label}</div>
      <div className="px-3 pb-3">{children}</div>
    </div>
  );

  const NumInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-[#888] w-3">{label}</span>
      <input type="number" value={Math.round(value)} onChange={(e) => onChange(+e.target.value)}
        className="w-full h-6 bg-[#2c2c2c] border border-[#3a3a3a] rounded text-[11px] text-[#ddd] px-1.5 focus:outline-none focus:border-[#0d99ff] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
    </div>
  );

  // Layer item for tree rendering
  const renderLayerItem = (el: EditorElement, depth: number = 0) => {
    const TypeIcon = el.type === "text" ? Type : el.type === "image" ? ImageIcon : el.type === "rect" ? Square : el.type === "line" ? Minus : el.type === "group" ? Group : QrCode;
    const isSel = state.selectedIds.includes(el.id);
    const hasChildren = el.type === "group" && el.children && el.children.length > 0;

    return (
      <div key={el.id}>
        <div
          onClick={(e) => {
            if (e.shiftKey) {
              setState((s) => ({
                ...s,
                selectedIds: s.selectedIds.includes(el.id) ? s.selectedIds.filter((i) => i !== el.id) : [...s.selectedIds, el.id],
              }));
            } else {
              setState((s) => ({ ...s, selectedIds: [el.id] }));
            }
          }}
          className={cn(
            "flex items-center gap-1.5 py-1.5 mx-1 rounded text-[11px] cursor-pointer transition-colors",
            isSel ? "bg-[#0d99ff]/20 text-[#0d99ff]" : "text-[#aaa] hover:bg-[#2a2a2a]"
          )}
          style={{ paddingLeft: 8 + depth * 16, paddingRight: 8 }}
        >
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); updateElement(el.id, { collapsed: !el.collapsed }); }}
              className="text-[#666] hover:text-[#aaa] cursor-pointer shrink-0"
            >
              {el.collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          {!hasChildren && <span className="w-3 shrink-0" />}
          <TypeIcon className="h-3 w-3 shrink-0" />
          <span className="truncate flex-1">
            {el.type === "text" ? el.content.slice(0, 16) : el.type === "group" ? `Group (${el.children?.length || 0})` : el.type}
          </span>
        </div>
        {hasChildren && !el.collapsed && el.children!.map((cid) => {
          const child = state.elements.find((e) => e.id === cid);
          return child ? renderLayerItem(child, depth + 1) : null;
        })}
      </div>
    );
  };

  // Top-level elements (not inside any group)
  const topLevelElements = state.elements.filter((e) => !e.parentId);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1e1e1e] text-[#ccc]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* ── TOP BAR ── */}
      <div className="flex items-center h-10 px-3 border-b border-[#2c2c2c] bg-[#2c2c2c] shrink-0">
        <button onClick={() => window.history.back()} className="text-[#999] hover:text-white transition-colors cursor-pointer mr-3"><ChevronLeft className="h-4 w-4" /></button>
        <input value={state.title} onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
          className="h-6 text-[12px] font-medium bg-transparent border-0 text-[#ddd] focus:outline-none focus:bg-[#3a3a3a] rounded px-1.5 w-48" />

        <div className="flex-1" />

        {/* Undo / Redo */}
        <button onClick={undo} className="p-1.5 text-[#888] hover:text-white cursor-pointer" title="Undo (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></button>
        <button onClick={redo} className="p-1.5 text-[#888] hover:text-white cursor-pointer" title="Redo (Ctrl+Shift+Z)"><Redo2 className="h-3.5 w-3.5" /></button>
        <div className="w-px h-4 bg-[#3a3a3a] mx-1" />

        <button className={cn("p-1.5 rounded transition-colors cursor-pointer", snap ? "bg-[#0d99ff]/20 text-[#0d99ff]" : "text-[#888] hover:text-white")} onClick={() => setSnap(!snap)} title="Snap"><Magnet className="h-3.5 w-3.5" /></button>
        <button className={cn("p-1.5 rounded transition-colors cursor-pointer", showGrid ? "bg-[#0d99ff]/20 text-[#0d99ff]" : "text-[#888] hover:text-white")} onClick={() => setShowGrid(!showGrid)} title="Grid"><Grid3X3 className="h-3.5 w-3.5" /></button>
        <div className="w-px h-4 bg-[#3a3a3a] mx-1" />
        <button className="p-1.5 text-[#888] hover:text-white cursor-pointer" onClick={() => setZoom((z) => Math.max(30, z - 10))}><ZoomOut className="h-3.5 w-3.5" /></button>
        <span className="text-[10px] text-[#888] w-8 text-center select-none">{zoom}%</span>
        <button className="p-1.5 text-[#888] hover:text-white cursor-pointer" onClick={() => setZoom((z) => Math.min(200, z + 10))}><ZoomIn className="h-3.5 w-3.5" /></button>
        <div className="w-px h-4 bg-[#3a3a3a] mx-1" />
        <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#888] hover:text-white rounded hover:bg-[#3a3a3a] cursor-pointer" onClick={handlePreview}><Eye className="h-3.5 w-3.5" /> Preview</button>
        <button className="flex items-center gap-1 px-3 py-1 text-[11px] bg-[#0d99ff] text-white rounded hover:bg-[#0b87e0] cursor-pointer font-medium ml-1" onClick={handleSave} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "..." : "Simpan"}</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Layers ── */}
        <div className="w-56 border-r border-[#2c2c2c] bg-[#252526] flex flex-col shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#2c2c2c]">
            <Layers className="h-3.5 w-3.5 text-[#888]" />
            <span className="text-[11px] font-semibold text-[#ddd]">Layers</span>
            <span className="ml-auto text-[9px] text-[#666] bg-[#333] px-1.5 py-0.5 rounded">{state.elements.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {[...topLevelElements].reverse().map((el) => renderLayerItem(el))}
            {state.elements.length === 0 && <p className="text-[10px] text-[#555] text-center py-8">Tambah elemen dari toolbar</p>}
          </div>

          {/* Shortcuts hint */}
          <div className="border-t border-[#2c2c2c] p-2 text-[9px] text-[#555] space-y-0.5">
            <p><kbd className="text-[#777]">Del</kbd> Hapus · <kbd className="text-[#777]">Ctrl+D</kbd> Duplikat</p>
            <p><kbd className="text-[#777]">Ctrl+Z</kbd> Undo · <kbd className="text-[#777]">Ctrl+Shift+Z</kbd> Redo</p>
            <p><kbd className="text-[#777]">Ctrl+G</kbd> Group · <kbd className="text-[#777]">Ctrl+Shift+G</kbd> Ungroup</p>
            <p><kbd className="text-[#777]">Shift+Click</kbd> Multi-select</p>
          </div>
        </div>

        {/* ── CENTER: Canvas ── */}
        <div
          className="flex-1 overflow-auto flex items-start justify-center"
          style={{ background: "#1a1a1a" }}
          onClick={() => { setState((s) => ({ ...s, selectedIds: [] })); setEditingId(null); }}
        >
          <div className="p-12">
            <div ref={canvasRef} className="relative shadow-2xl"
              style={{ width: A4_W, height: A4_H, background: "#fff", transform: `scale(${scale})`, transformOrigin: "top center", backgroundImage: showGrid ? "radial-gradient(circle, #ddd 1px, transparent 1px)" : "none", backgroundSize: "20px 20px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {state.elements.map(renderElement)}
              {state.elements.filter((e) => e.type === "group").map(renderGroupBox)}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Design / Variables ── */}
        <div className="w-60 border-l border-[#2c2c2c] bg-[#252526] flex flex-col shrink-0">
          <div className="flex border-b border-[#2c2c2c]">
            <button onClick={() => setRightTab("design")} className={cn("flex-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer", rightTab === "design" ? "text-[#0d99ff] border-b-2 border-[#0d99ff]" : "text-[#888] hover:text-white")}>Design</button>
            <button onClick={() => setRightTab("vars")} className={cn("flex-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer", rightTab === "vars" ? "text-[#0d99ff] border-b-2 border-[#0d99ff]" : "text-[#888] hover:text-white")}>Variables</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {rightTab === "design" && selected ? (
              <>
                <Section label="Position">
                  <div className="grid grid-cols-2 gap-1.5">
                    <NumInput label="X" value={selected.x} onChange={(v) => updateElementWithHistory(selected.id, { x: v })} />
                    <NumInput label="Y" value={selected.y} onChange={(v) => updateElementWithHistory(selected.id, { y: v })} />
                  </div>
                </Section>
                <Section label="Dimensions">
                  <div className="grid grid-cols-2 gap-1.5">
                    <NumInput label="W" value={selected.w} onChange={(v) => updateElementWithHistory(selected.id, { w: v })} />
                    <NumInput label="H" value={selected.h} onChange={(v) => updateElementWithHistory(selected.id, { h: v })} />
                  </div>
                  <div className="mt-1.5"><NumInput label="R" value={selected.rotation} onChange={(v) => updateElementWithHistory(selected.id, { rotation: v })} /></div>
                </Section>
                {(selected.type === "text" || selected.type === "image" || selected.type === "qrcode") && (
                  <Section label="Content">
                    {selected.type === "text" ? (
                      <textarea value={selected.content} onChange={(e) => updateElementWithHistory(selected.id, { content: e.target.value })} rows={3}
                        className="w-full bg-[#2c2c2c] border border-[#3a3a3a] rounded text-[11px] text-[#ddd] px-2 py-1.5 resize-none focus:outline-none focus:border-[#0d99ff]" />
                    ) : selected.type === "image" ? (
                      <div className="space-y-2">
                        <input value={selected.content} onChange={(e) => updateElementWithHistory(selected.id, { content: e.target.value })}
                          placeholder="Image URL..."
                          className="w-full h-6 bg-[#2c2c2c] border border-[#3a3a3a] rounded text-[11px] text-[#ddd] px-2 focus:outline-none focus:border-[#0d99ff]" />
                        <label className="flex items-center justify-center gap-1.5 h-7 w-full rounded bg-[#0d99ff]/15 text-[#0d99ff] text-[10px] cursor-pointer hover:bg-[#0d99ff]/25 transition-colors">
                          <ImageIcon className="h-3 w-3" /> Upload dari komputer
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) { toast.error("Maks 2MB"); return; }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const dataUrl = ev.target?.result as string;
                              updateElementWithHistory(selected.id, { content: dataUrl });
                            };
                            reader.readAsDataURL(file);
                          }} />
                        </label>
                        {selected.content && selected.content.startsWith("data:") && (
                          <p className="text-[9px] text-[#666]">✓ Gambar lokal (base64)</p>
                        )}
                      </div>
                    ) : (
                      <input value={selected.content} onChange={(e) => updateElementWithHistory(selected.id, { content: e.target.value })}
                        placeholder="QR / [var]"
                        className="w-full h-6 bg-[#2c2c2c] border border-[#3a3a3a] rounded text-[11px] text-[#ddd] px-2 focus:outline-none focus:border-[#0d99ff]" />
                    )}
                  </Section>
                )}
                {selected.type === "text" && (
                  <Section label="Typography">
                    <select value={selected.style.fontFamily} onChange={(e) => updateStyle(selected.id, { fontFamily: e.target.value })}
                      className="w-full h-6 bg-[#2c2c2c] border border-[#3a3a3a] rounded text-[11px] text-[#ddd] px-1.5 mb-1.5">
                      {["Times New Roman","Arial","Inter","Courier New","Georgia"].map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div className="flex gap-1 mb-1.5">
                      <select value={selected.style.fontWeight} onChange={(e) => updateStyle(selected.id, { fontWeight: e.target.value })}
                        className="flex-1 h-6 bg-[#2c2c2c] border border-[#3a3a3a] rounded text-[11px] text-[#ddd] px-1.5">
                        <option value="normal">Regular</option><option value="bold">Bold</option>
                      </select>
                      <input type="number" value={selected.style.fontSize} onChange={(e) => updateStyle(selected.id, { fontSize: +e.target.value })}
                        className="w-14 h-6 bg-[#2c2c2c] border border-[#3a3a3a] rounded text-[11px] text-[#ddd] px-1.5 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <div className="flex gap-0.5">
                      {(["left","center","right"] as const).map((a) => (
                        <button key={a} onClick={() => updateStyle(selected.id, { textAlign: a })}
                          className={cn("flex-1 h-6 rounded flex items-center justify-center cursor-pointer", selected.style.textAlign === a ? "bg-[#0d99ff]/20 text-[#0d99ff]" : "text-[#888] hover:bg-[#333]")}>
                          {a === "left" ? <AlignLeft className="h-3 w-3" /> : a === "center" ? <AlignCenter className="h-3 w-3" /> : <AlignRight className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  </Section>
                )}
                <Section label="Appearance">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#888] w-12">Opacity</span>
                    <input type="number" value={selected.style.opacity} step={0.1} min={0} max={1} onChange={(e) => updateStyle(selected.id, { opacity: +e.target.value })}
                      className="w-16 h-6 bg-[#2c2c2c] border border-[#3a3a3a] rounded text-[11px] text-[#ddd] px-1.5 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                </Section>
                <Section label="Fill">
                  <div className="flex items-center gap-2">
                    <input type="color" value={selected.style.color === "transparent" ? "#000000" : selected.style.color} onChange={(e) => updateStyle(selected.id, { color: e.target.value })}
                      className="h-6 w-6 rounded cursor-pointer border border-[#3a3a3a] bg-transparent" />
                    <span className="text-[10px] text-[#888] font-mono flex-1">{selected.style.color}</span>
                  </div>
                </Section>
                {(selected.type === "rect" || selected.type === "line") && (
                  <Section label="Stroke">
                    <div className="flex items-center gap-2">
                      <input type="color" value={selected.style.borderColor} onChange={(e) => updateStyle(selected.id, { borderColor: e.target.value })}
                        className="h-6 w-6 rounded cursor-pointer border border-[#3a3a3a] bg-transparent" />
                      <input type="number" value={selected.style.borderWidth} onChange={(e) => updateStyle(selected.id, { borderWidth: +e.target.value })}
                        className="w-12 h-6 bg-[#2c2c2c] border border-[#3a3a3a] rounded text-[11px] text-[#ddd] px-1.5 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                      <span className="text-[10px] text-[#888]">px</span>
                    </div>
                  </Section>
                )}
                <Section label="Actions">
                  <div className="flex gap-1">
                    <button onClick={() => moveLayer(selected.id, "up")} className="flex-1 h-6 rounded bg-[#2c2c2c] text-[#888] hover:text-white flex items-center justify-center cursor-pointer"><ArrowUp className="h-3 w-3" /></button>
                    <button onClick={() => moveLayer(selected.id, "down")} className="flex-1 h-6 rounded bg-[#2c2c2c] text-[#888] hover:text-white flex items-center justify-center cursor-pointer"><ArrowDown className="h-3 w-3" /></button>
                    <button onClick={() => duplicateSelected()} className="flex-1 h-6 rounded bg-[#2c2c2c] text-[#888] hover:text-white flex items-center justify-center cursor-pointer"><Copy className="h-3 w-3" /></button>
                    <button onClick={() => deleteSelected()} className="flex-1 h-6 rounded bg-[#2c2c2c] text-red-400 hover:bg-red-500/20 flex items-center justify-center cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </Section>
              </>
            ) : rightTab === "design" && state.selectedIds.length > 1 ? (
              <div className="p-3 space-y-3">
                <p className="text-[11px] text-[#ddd]">{state.selectedIds.length} elemen dipilih</p>
                <div className="flex gap-1">
                  <button onClick={groupSelected} className="flex-1 h-7 rounded bg-[#0d99ff]/20 text-[#0d99ff] flex items-center justify-center gap-1 text-[10px] cursor-pointer hover:bg-[#0d99ff]/30"><Group className="h-3 w-3" /> Group</button>
                  <button onClick={() => duplicateSelected()} className="flex-1 h-7 rounded bg-[#2c2c2c] text-[#888] hover:text-white flex items-center justify-center gap-1 text-[10px] cursor-pointer"><Copy className="h-3 w-3" /> Copy</button>
                  <button onClick={() => deleteSelected()} className="flex-1 h-7 rounded bg-[#2c2c2c] text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-1 text-[10px] cursor-pointer"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              </div>
            ) : rightTab === "design" ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <MousePointer2 className="h-8 w-8 text-[#444] mb-3" />
                <p className="text-[11px] text-[#666]">Pilih elemen di canvas</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <p className="text-[10px] text-[#888]">Pilih elemen teks, lalu klik variabel:</p>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_VARS.map((v) => (
                    <button key={v} onClick={() => {
                      if (selected?.type === "text") { updateElementWithHistory(selected.id, { content: selected.content + ` [${v}]` }); }
                      else { toast.error("Pilih elemen teks dulu"); }
                    }} className="text-[9px] px-2 py-1 rounded bg-[#0d99ff]/10 text-[#0d99ff] hover:bg-[#0d99ff]/20 cursor-pointer font-mono">[{v}]</button>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded bg-[#2a2a2a] text-[9px] text-[#777] space-y-1">
                  <p className="text-[#999] font-semibold">Contoh:</p>
                  <p>[namaLengkap] → Siti Nurhaliza</p>
                  <p>[noSK] → 001/KS/2026</p>
                  <p>[tanggalSekarang] → 10 April 2026</p>
                  <p>[namaSekolah] → SMPIT Asy-Syadzili</p>
                  <p>[namaKepsek] → Dr. Ahmad Fauzi</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM TOOLBAR ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[#2c2c2c] rounded-xl shadow-2xl border border-[#3a3a3a]">
          {[
            { type: "text" as const, icon: Type, label: "Teks" },
            { type: "image" as const, icon: ImageIcon, label: "Gambar" },
            { type: "rect" as const, icon: Square, label: "Kotak" },
            { type: "line" as const, icon: Minus, label: "Garis" },
            { type: "qrcode" as const, icon: QrCode, label: "QR" },
          ].map((tool) => (
            <button key={tool.type} onClick={() => addElement(tool.type)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[#888] hover:text-white hover:bg-[#3a3a3a] transition-colors cursor-pointer" title={tool.label}>
              <tool.icon className="h-4 w-4" />
              <span className="text-[11px] hidden sm:inline">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
