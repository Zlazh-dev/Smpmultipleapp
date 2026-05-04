import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import type { AppStatus } from "@/lib/config";
import { AppBadge } from "./app-badge";

interface AppEntryProps {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  status: AppStatus;
  ssoUrl: string;
  className?: string;
}

export function AppEntry({ name, description, icon: Icon, color, status, ssoUrl, className }: AppEntryProps) {
  const isAccessible = status === "available";

  const content = (
    <div className={cn(
      "group relative flex items-center gap-5 p-5 rounded-xl transition-all duration-200",
      "border border-border/60",
      "bg-asy-surface/50",
      isAccessible && [
        "hover:bg-asy-surface-alt/60 hover:border-asy-accent/40",
        "hover:shadow-md hover:shadow-asy-accent/8",
        "cursor-pointer",
      ],
      !isAccessible && "opacity-50 cursor-default",
      className
    )}>
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
        color,
      )}>
        <Icon className="h-6 w-6 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <p className="text-sm font-semibold">{name}</p>
          <AppBadge status={status} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">{description}</p>
      </div>

      {isAccessible && (
        <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-asy-accent group-hover:text-asy-accent-hover transition-colors">
          <span className="hidden sm:inline">Buka</span>
          <ArrowUpRight className="h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
      )}
    </div>
  );

  if (isAccessible) {
    return <a href={ssoUrl} className="block">{content}</a>;
  }
  return content;
}
