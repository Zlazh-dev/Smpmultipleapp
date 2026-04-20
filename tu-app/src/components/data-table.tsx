"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ── Types ── */
export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  mono?: boolean;
  render?: (row: T, index: number) => ReactNode;
  mobileHidden?: boolean;
  mobileLabel?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  toolbar?: ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  mobileCardRender?: (row: T, index: number) => ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
}

/* ── Desktop Table ── */
function DesktopTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  emptyMessage,
  onRowClick,
}: Pick<DataTableProps<T>, "columns" | "data" | "keyField" | "emptyMessage" | "onRowClick">) {
  return (
    <div className="overflow-x-auto">
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
                className="!text-center !py-16 !text-muted-foreground !text-sm"
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
}: Pick<DataTableProps<T>, "columns" | "data" | "keyField" | "emptyMessage" | "onRowClick" | "mobileCardRender">) {
  const visibleCols = columns.filter((c) => !c.mobileHidden);

  return (
    <div className="md:hidden space-y-2 p-3">
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
    </div>
  );
}

/* ── Combined DataTable — Supabase unified card ── */
export function DataTable<T extends Record<string, any>>(
  props: DataTableProps<T>
) {
  return (
    <div className="animate-fade-in-up">
      {/* Unified card: toolbar + table + footer */}
      <div className="data-table-wrapper hidden md:block">
        {/* Toolbar */}
        {props.toolbar && (
          <div className="table-toolbar">{props.toolbar}</div>
        )}

        {/* Table */}
        <DesktopTable
          columns={props.columns}
          data={props.data}
          keyField={props.keyField}
          emptyMessage={props.emptyMessage}
          onRowClick={props.onRowClick}
        />

        {/* Footer */}
        {props.data.length > 0 && (
          <div className="data-table-footer">
            <span>{props.footerLeft || `${props.data.length} rows`}</span>
            <span>{props.footerRight || ""}</span>
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="data-table-wrapper">
          {props.toolbar && (
            <div className="table-toolbar">{props.toolbar}</div>
          )}
          <MobileCards
            columns={props.columns}
            data={props.data}
            keyField={props.keyField}
            emptyMessage={props.emptyMessage}
            onRowClick={props.onRowClick}
            mobileCardRender={props.mobileCardRender}
          />
          {props.data.length > 0 && (
            <div className="data-table-footer">
              <span>{props.data.length} data</span>
              <span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
