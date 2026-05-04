import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import type { AppStatus } from "@/lib/config";
import { AppBadge } from "./app-badge";

interface AppCardProps {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // gradient classes e.g. "from-blue-500 to-cyan-500"
  status: AppStatus;
  ssoUrl: string;
  className?: string;
}

/**
 * Reusable app launcher card — used on Home and Apps pages.
 * Large, scannable, tappable. Full-card click target when available.
 * 
 * Desktop: min-w 280px, preferred 320-360px, min-h 160px
 * Mobile: full-width, min-h 140px
 */
export function AppCard({ name, description, icon: Icon, color, status, ssoUrl, className }: AppCardProps) {
  const isAccessible = status === "available";

  const content = (
    <div className={cn(
      "group relative flex flex-col justify-between rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6",
      "min-h-[160px] sm:min-h-[160px]",
      "transition-all duration-300",
      isAccessible && "hover:bg-card/80 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-border/80 hover:scale-[1.01] cursor-pointer",
      !isAccessible && "opacity-60 cursor-default",
      className
    )}>
      {/* Top section: icon + badge */}
      <div className="flex items-start justify-between">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
          color
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <AppBadge status={status} />
      </div>

      {/* Bottom section: name + description + action */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight">{name}</h3>
          {isAccessible && (
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        {isAccessible && (
          <span className="inline-flex items-center gap-1.5 mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors">
            Buka {name}
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (isAccessible) {
    return (
      <a href={ssoUrl} className="block">
        {content}
      </a>
    );
  }

  return content;
}
