import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

/**
 * Reusable section card — groups related content with optional title and action.
 * Used for account details, announcements, activity sections, etc.
 */
export function SectionCard({ title, description, children, className, headerAction }: SectionCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden",
      className
    )}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {headerAction}
        </div>
      )}
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}
