import { cn } from "@/lib/utils";

interface ContentSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  panel?: boolean;
}

export function ContentSection({
  title, description, children, className, headerAction, panel = false,
}: ContentSectionProps) {
  return (
    <section className={cn("py-6", className)}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {headerAction}
        </div>
      )}
      {panel ? (
        <div className="rounded-xl border border-border/60 bg-asy-surface/40 p-5">
          {children}
        </div>
      ) : children}
    </section>
  );
}
