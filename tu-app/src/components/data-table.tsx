"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ── Types ── */
export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  mono?: boolean;
  render?: (row: T, index: number) => ReactNode;
  mobileHidden?: boolean; // hide in mobile card
  mobileLabel?: string;   // override label in mobile card
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  title?: string;
  subtitle?: string;
  toolbar?: ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  mobileCardRender?: (row: T, index: number) => ReactNode;
}

/* ── Desktop Table ── */
function DesktopTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  emptyMessage,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="data-table-wrapper hidden md:block overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="row-num">#</th>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="!text-center !py-12 !text-muted-foreground"
              >
                {emptyMessage || "Tidak ada data"}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row[keyField]}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(row)}
              >
                <td className="row-num">{i + 1}</td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(col.mono && "col-mono", col.className)}
                  >
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Footer */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 border-t text-[11px] text-muted-foreground bg-[var(--table-header-bg)]">
          <span>{data.length} rows</span>
          <span className="text-[10px]">Supabase-style table</span>
        </div>
      )}
    </div>
  );
}

/* ── Mobile Cards ── */
function MobileCards<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  emptyMessage,
  onRowClick,
  mobileCardRender,
}: DataTableProps<T>) {
  const visibleCols = columns.filter((c) => !c.mobileHidden);

  return (
    <div className="md:hidden space-y-2">
      {data.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          {emptyMessage || "Tidak ada data"}
        </div>
      ) : (
        data.map((row, i) =>
          mobileCardRender ? (
            <div key={row[keyField]}>{mobileCardRender(row, i)}</div>
          ) : (
            <div
              key={row[keyField]}
              className={cn("mobile-card space-y-2", onRowClick && "cursor-pointer")}
              onClick={() => onRowClick?.(row)}
            >
              {visibleCols.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {col.mobileLabel || col.label}
                  </span>
                  <span
                    className={cn(
                      "text-sm text-right truncate",
                      col.mono && "font-mono text-xs"
                    )}
                  >
                    {col.render ? col.render(row, i) : row[col.key]}
                  </span>
                </div>
              ))}
            </div>
          )
        )
      )}
      {data.length > 0 && (
        <p className="text-center text-[10px] text-muted-foreground pt-2">
          {data.length} data
        </p>
      )}
    </div>
  );
}

/* ── Combined DataTable ── */
export function DataTable<T extends Record<string, any>>(
  props: DataTableProps<T>
) {
  return (
    <div className="animate-fade-in-up">
      {/* Toolbar */}
      {(props.title || props.toolbar) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {props.title && (
            <div>
              <h2 className="text-base font-semibold">{props.title}</h2>
              {props.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {props.subtitle}
                </p>
              )}
            </div>
          )}
          {props.toolbar && <div className="flex items-center gap-2">{props.toolbar}</div>}
        </div>
      )}

      {/* Desktop */}
      <DesktopTable {...props} />

      {/* Mobile */}
      <MobileCards {...props} />
    </div>
  );
}
