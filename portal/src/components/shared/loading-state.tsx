import { cn } from "@/lib/utils";

interface LoadingStateProps {
  lines?: number;
  className?: string;
}

/**
 * Loading skeleton state. Renders shimmer lines of varying widths.
 */
export function LoadingState({ lines = 3, className }: LoadingStateProps) {
  const widths = ["w-3/4", "w-full", "w-1/2", "w-5/6", "w-2/3"];

  return (
    <div className={cn("space-y-4 py-8 px-4", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2 animate-pulse">
          <div className={cn("h-4 rounded-lg bg-muted/60", widths[i % widths.length])} />
          {i === 0 && <div className="h-3 rounded-lg bg-muted/40 w-1/3" />}
        </div>
      ))}
    </div>
  );
}
