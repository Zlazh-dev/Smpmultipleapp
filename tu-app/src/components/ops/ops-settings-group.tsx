import { cn } from "@/lib/utils";

interface OpsSettingsGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function OpsSettingsGroup({ title, description, children, className }: OpsSettingsGroupProps) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/50", className)}>
      <div className="px-5 py-4 border-b border-border/30">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

interface OpsSettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function OpsSettingsRow({ label, description, children, className }: OpsSettingsRowProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border/20 last:border-0", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
