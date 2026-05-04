import { cn } from "@/lib/utils";

interface TeachActivityItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  time?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function TeachActivityItem({ icon, title, subtitle, time, badge, className }: TeachActivityItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 py-3 px-4 border-b border-border/20 last:border-0",
      className,
    )}>
      {icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge}
        {time && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{time}</span>}
      </div>
    </div>
  );
}
