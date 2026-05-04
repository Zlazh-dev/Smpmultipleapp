import { cn } from "@/lib/utils";
import Link from "next/link";

interface TeachQuickActionProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  color?: string;
  className?: string;
}

export function TeachQuickAction({ href, icon, label, description, color = "bg-emerald-500/10", className }: TeachQuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3.5 p-4 rounded-xl border border-border/50 bg-card/50",
        "hover:bg-muted/50 hover:border-border transition-all active:scale-[0.98]",
        className,
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </Link>
  );
}
