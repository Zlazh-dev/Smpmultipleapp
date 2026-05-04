import { cn } from "@/lib/utils";

interface AppCardGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive grid for app cards.
 * Desktop: 2-col grid with 280px min / 360px preferred width.
 * Mobile: single column full-width.
 * Max 4 cards before needing secondary grouping.
 */
export function AppCardGrid({ children, className }: AppCardGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 gap-4",
      className
    )}>
      {children}
    </div>
  );
}
