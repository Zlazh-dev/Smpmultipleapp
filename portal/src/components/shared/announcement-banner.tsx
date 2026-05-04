import { cn } from "@/lib/utils";
import { Info, CheckCircle2, AlertTriangle } from "lucide-react";

type AnnouncementType = "info" | "success" | "warning";

const typeConfig: Record<AnnouncementType, { icon: typeof Info; iconClass: string; borderClass: string; bgClass: string }> = {
  info: { icon: Info, iconClass: "text-asy-accent", borderClass: "border-l-asy-accent/60", bgClass: "bg-asy-surface" },
  success: { icon: CheckCircle2, iconClass: "text-emerald-500", borderClass: "border-l-emerald-500/60", bgClass: "bg-emerald-500/5 dark:bg-emerald-500/10" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-500", borderClass: "border-l-amber-500/60", bgClass: "bg-amber-500/5 dark:bg-amber-500/10" },
};

interface AnnouncementBannerProps {
  title: string;
  description?: string;
  type?: AnnouncementType;
  className?: string;
}

export function AnnouncementBanner({ title, description, type = "success", className }: AnnouncementBannerProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 py-3.5 px-4 border-l-[3px] rounded-r-lg",
      config.borderClass, config.bgClass, className
    )}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconClass)} />
      <div className="space-y-0 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
