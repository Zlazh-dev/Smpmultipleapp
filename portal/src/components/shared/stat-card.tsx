import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  description?: string;
  className?: string;
}

/**
 * Metric display card for admin console overview.
 */
export function StatCard({ label, value, icon, trend, description, className }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
