import { cn } from "@/lib/utils";
import type { AppStatus } from "@/lib/config";

const statusConfig: Record<AppStatus, { label: string; dot: string; text: string; bg: string }> = {
  available: {
    label: "Tersedia",
    dot: "bg-emerald-500 animate-pulse",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  restricted: {
    label: "Terbatas",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  coming_soon: {
    label: "Segera Hadir",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/10",
  },
};

interface AppBadgeProps {
  status: AppStatus;
  className?: string;
}

/**
 * Status badge for app cards showing availability state.
 */
export function AppBadge({ status, className }: AppBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
      config.bg,
      config.text,
      className
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
