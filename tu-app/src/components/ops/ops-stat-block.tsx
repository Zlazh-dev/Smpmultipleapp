import { cn } from "@/lib/utils";

interface OpsStatBlockProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "attention" | "neutral";
  sub?: string;
  className?: string;
}

export function OpsStatBlock({ label, value, icon, trend, sub, className }: OpsStatBlockProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-4", className)}>
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold tracking-tight mt-0.5">{value}</p>
        {sub && (
          <p className={cn(
            "text-[10px] mt-0.5",
            trend === "attention" ? "text-amber-500" :
            trend === "up" ? "text-emerald-500" :
            trend === "down" ? "text-red-500" :
            "text-muted-foreground"
          )}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
