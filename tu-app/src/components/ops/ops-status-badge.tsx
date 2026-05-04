import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  APPROVED: { label: "Disetujui", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  REJECTED: { label: "Ditolak", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" },
  HADIR: { label: "Hadir", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  IZIN: { label: "Izin", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  SAKIT: { label: "Sakit", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  ALFA: { label: "Alfa", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" },
};

interface OpsStatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function OpsStatusBadge({ status, label, className }: OpsStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        config.className,
        className
      )}
    >
      {label || config.label}
    </span>
  );
}
