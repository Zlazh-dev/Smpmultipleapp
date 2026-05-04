import { cn } from "@/lib/utils";
import { Info, CheckCircle2, AlertTriangle } from "lucide-react";

type AnnouncementType = "info" | "success" | "warning";

const typeConfig: Record<AnnouncementType, { icon: typeof Info; iconClass: string; borderClass: string }> = {
  info: { icon: Info, iconClass: "text-blue-500", borderClass: "border-blue-500/20" },
  success: { icon: CheckCircle2, iconClass: "text-emerald-500", borderClass: "border-emerald-500/20" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-500", borderClass: "border-amber-500/20" },
};

interface AnnouncementCardProps {
  title: string;
  description?: string;
  type?: AnnouncementType;
  className?: string;
}

/**
 * System announcement or status card.
 * Used on Home page and Activity page for system-wide notices.
 */
export function AnnouncementCard({ title, description, type = "success", className }: AnnouncementCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-xl border bg-card/50 backdrop-blur-sm p-4",
      config.borderClass,
      className
    )}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconClass)} />
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
