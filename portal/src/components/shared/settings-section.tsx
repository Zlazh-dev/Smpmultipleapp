import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SettingsItem {
  label: string;
  value: React.ReactNode;
}

interface SettingsSectionProps {
  title: string;
  items: SettingsItem[];
  className?: string;
  headerAction?: React.ReactNode;
}

/**
 * Reusable settings section — displays label-value pairs in a card.
 * Used for account details, profile info, security settings, etc.
 */
export function SettingsSection({ title, items, className, headerAction }: SettingsSectionProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden",
      className
    )}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {headerAction}
      </div>
      <div className="px-5 pb-5 space-y-0">
        {items.map((item, i) => (
          <div key={item.label}>
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium truncate ml-4 text-right max-w-[60%]">{item.value}</span>
            </div>
            {i < items.length - 1 && <Separator className="opacity-50" />}
          </div>
        ))}
      </div>
    </div>
  );
}
