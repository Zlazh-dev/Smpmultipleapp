import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type AttendanceState = "checked_in" | "not_checked" | "on_leave";

interface TeachStatusBlockProps {
  state: AttendanceState;
  time?: string | null;
  className?: string;
}

const stateConfig: Record<AttendanceState, { label: string; sub: string; icon: any; color: string; bg: string; border: string }> = {
  checked_in: {
    label: "Sudah Presensi",
    sub: "Anda sudah check-in hari ini",
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/20",
  },
  not_checked: {
    label: "Belum Presensi",
    sub: "Anda belum melakukan presensi hari ini",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
  },
  on_leave: {
    label: "Sedang Cuti",
    sub: "Anda sedang dalam masa cuti",
    icon: XCircle,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
  },
};

export function TeachStatusBlock({ state, time, className }: TeachStatusBlockProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl border",
      config.bg, config.border,
      className,
    )}>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", config.bg)}>
        <Icon className={cn("h-6 w-6", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", config.color)}>{config.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{config.sub}</p>
      </div>
      {time && (
        <span className="text-xs text-muted-foreground font-mono shrink-0">{time}</span>
      )}
    </div>
  );
}
