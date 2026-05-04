import { cn } from "@/lib/utils";

interface TeachStatRowProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export function TeachStatRow({ label, value, icon, className }: TeachStatRowProps) {
  return (
    <div className={cn("flex items-center justify-between py-2.5 px-4 border-b border-border/20 last:border-0", className)}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
