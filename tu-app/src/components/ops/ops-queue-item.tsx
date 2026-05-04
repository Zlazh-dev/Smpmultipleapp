import { cn } from "@/lib/utils";

interface OpsQueueItemProps {
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function OpsQueueItem({
  avatar,
  title,
  subtitle,
  meta,
  status,
  actions,
  className,
}: OpsQueueItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 py-3 px-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors",
      className
    )}>
      {avatar && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {meta && <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:block">{meta}</span>}
      {status && <div className="shrink-0">{status}</div>}
      {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
    </div>
  );
}
