"use client";

interface CanvasElement {
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

interface CanvasData {
  title: string;
  width: number;
  height: number;
  elements: CanvasElement[];
}

interface TemplatePrintProps {
  canvasData: CanvasData;
  variables: Record<string, string>;
  title: string;
}

function substituteVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\[(\w+)\]/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

// Editor canvas → A4 mm conversion
// Editor uses 595×842 px. A4 = 210×297 mm.
const EDITOR_W = 595;
const EDITOR_H = 842;
const A4_W_MM = 210;
const A4_H_MM = 297;

function pxToMmX(px: number, canvasW: number): number {
  return (px / canvasW) * A4_W_MM;
}
function pxToMmY(py: number, canvasH: number): number {
  return (py / canvasH) * A4_H_MM;
}
function pxToMmFont(fontSize: number, canvasW: number): number {
  // Scale font proportionally — use mm units
  return (fontSize / canvasW) * A4_W_MM;
}

export function TemplatePrint({ canvasData, variables, title }: TemplatePrintProps) {
  const W = canvasData.width || EDITOR_W;
  const H = canvasData.height || EDITOR_H;

  // Filter out group elements (invisible containers)
  const visibleElements = canvasData.elements.filter((el) => el.type !== "group");

  return (
    <div className="print-page-wrapper">
      {/* Toolbar — hidden in print */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "12px 16px", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 12,
      }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: "8px 24px", background: "#10b981", color: "#fff",
            borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none",
            cursor: "pointer",
          }}
        >
          🖨 Cetak
        </button>
        <button
          onClick={() => window.close()}
          style={{
            padding: "8px 24px", background: "#f3f4f6", color: "#374151",
            borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none",
            cursor: "pointer",
          }}
        >
          ✕ Tutup
        </button>
      </div>

      {/* Screen preview — uses px (same as editor) */}
      <div className="no-print" style={{
        display: "flex", justifyContent: "center", padding: 32,
        background: "#f3f4f6", minHeight: "100vh",
      }}>
        <div style={{
          width: W, height: H, background: "#fff",
          position: "relative", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}>
          {visibleElements.map((el) => renderElement(el, variables, false, W, H))}
        </div>
      </div>

      {/* Print-only page — uses mm units for exact A4 positioning */}
      <div className="print-only" style={{ display: "none" }}>
        <div
          className="a4-page"
          style={{
            width: `${A4_W_MM}mm`,
            height: `${A4_H_MM}mm`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {visibleElements.map((el) => renderElement(el, variables, true, W, H))}
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function renderElement(
  el: CanvasElement,
  variables: Record<string, string>,
  useMm: boolean,
  canvasW: number,
  canvasH: number,
) {
  const resolved = (el.type === "text" || el.type === "qrcode")
    ? substituteVars(el.content, variables)
    : el.content;

  // Position & size
  const left = useMm ? `${pxToMmX(el.x, canvasW)}mm` : el.x;
  const top = useMm ? `${pxToMmY(el.y, canvasH)}mm` : el.y;
  const width = useMm ? `${pxToMmX(el.w, canvasW)}mm` : el.w;
  const height = useMm ? `${pxToMmY(el.h, canvasH)}mm` : el.h;
  const fontSize = useMm
    ? `${pxToMmFont(el.style.fontSize, canvasW)}mm`
    : el.style.fontSize;
  const borderW = useMm
    ? `${pxToMmX(el.style.borderWidth || 1, canvasW)}mm`
    : `${el.style.borderWidth || 1}px`;
  const padding = useMm ? `${pxToMmX(2, canvasW)}mm` : 2;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left, top, width, height,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.style.opacity,
  };

  if (el.type === "text") {
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          fontFamily: el.style.fontFamily,
          fontSize,
          fontWeight: el.style.fontWeight,
          textAlign: el.style.textAlign as any,
          color: el.style.color,
          background: el.style.bgColor === "transparent" ? undefined : el.style.bgColor,
          lineHeight: 1.4,
          padding,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflow: "hidden",
        }}
      >
        {resolved}
      </div>
    );
  }

  if (el.type === "rect") {
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          background: el.style.bgColor === "transparent" ? "transparent" : el.style.bgColor,
          border: `${borderW} solid ${el.style.borderColor}`,
        }}
      />
    );
  }

  if (el.type === "line") {
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          height: 0,
          borderTop: `${borderW} solid ${el.style.borderColor}`,
        }}
      />
    );
  }

  if (el.type === "image") {
    return (
      <img
        key={el.id}
        src={resolved}
        alt=""
        style={{ ...baseStyle, objectFit: "contain" }}
      />
    );
  }

  if (el.type === "qrcode") {
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid #ccc`,
          fontSize: useMm ? "2.5mm" : 10,
          color: "#666",
        }}
      >
        QR: {resolved}
      </div>
    );
  }

  return null;
}
