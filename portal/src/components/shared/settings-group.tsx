import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SettingsItem { label: string; value: React.ReactNode; }

interface SettingsGroupProps {
  title: string;
  items: SettingsItem[];
  className?: string;
  headerAction?: React.ReactNode;
}

export function SettingsGroup({ title, items, className, headerAction }: SettingsGroupProps) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-asy-surface/40 overflow-hidden", className)}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
        {headerAction}
      </div>
      <div className="px-5 pb-4">
        {items.map((item, i) => (
          <div key={item.label}>
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium truncate ml-4 text-right max-w-[60%]">{item.value}</span>
            </div>
            {i < items.length - 1 && <Separator className="opacity-20" />}
          </div>
        ))}
      </div>
    </div>
  );
}
