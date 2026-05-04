import { cn } from "@/lib/utils";

interface AppListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * App list container — spaces app entries evenly.
 * Desktop: vertical stack with spacing (entries have their own panel styling).
 * Mobile: same vertical stack, entries go full-width.
 */
export function AppList({ children, className }: AppListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {children}
    </div>
  );
}
