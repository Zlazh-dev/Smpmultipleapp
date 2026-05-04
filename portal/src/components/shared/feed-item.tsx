import { cn } from "@/lib/utils";

interface FeedItemProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  timestamp: string;
  className?: string;
}

export function FeedItem({ icon, title, description, timestamp, className }: FeedItemProps) {
  return (
    <div className={cn(
      "flex items-start gap-3.5 py-3 px-3 -mx-3 rounded-lg transition-colors hover:bg-asy-surface-alt/40",
      className
    )}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-asy-surface-alt/60 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0 space-y-0">
        <p className="text-sm leading-snug">{title}</p>
        {description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{description}</p>}
      </div>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 pt-1">{timestamp}</span>
    </div>
  );
}
