import { cn } from "@/lib/utils";
import { ShieldX } from "lucide-react";
import Link from "next/link";

interface RestrictedStateProps {
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Restricted access state — shown when user doesn't have permission.
 * Non-alarming, provides a way back to safe ground.
 */
export function RestrictedState({
  title = "Akses Terbatas",
  description = "Anda tidak memiliki izin untuk mengakses halaman ini.",
  className
}: RestrictedStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-16 px-6",
      className
    )}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-4">
        <ShieldX className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      <Link
        href="/hub"
        className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
      >
        ← Kembali ke Home
      </Link>
    </div>
  );
}
