import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface FeedListProps {
  children: React.ReactNode;
  className?: string;
  maxItems?: number;
}

/**
 * Scrollable feed container with dividers between items.
 */
export function FeedList({ children, className, maxItems }: FeedListProps) {
  const items = Array.isArray(children) ? children : [children];
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className={cn("divide-y divide-border/30", className)}>
      {displayItems}
    </div>
  );
}
