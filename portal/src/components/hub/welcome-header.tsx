import { cn } from "@/lib/utils";
import { GraduationCap, Briefcase, ShieldCheck, Users, UserCircle } from "lucide-react";
import type { Role } from "@prisma/client";

const roleIcons: Record<string, typeof GraduationCap> = {
  Guru: GraduationCap,
  TU: Briefcase,
  RADIG: ShieldCheck,
  WaliSantri: Users,
};

interface WelcomeHeaderProps {
  name: string | null;
  role: Role;
  className?: string;
}

export function WelcomeHeader({ name, role, className }: WelcomeHeaderProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Selamat pagi" : hour < 17 ? "Selamat siang" : "Selamat malam";
  const RoleIcon = roleIcons[role] || UserCircle;

  return (
    <div className={cn("relative pb-6 mb-2", className)}>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-asy-accent/40 via-border/40 to-transparent" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5">AsyHub</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Akses aplikasi dan kelola akun Anda dari sini.
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-asy-surface shrink-0">
          <RoleIcon className="h-4.5 w-4.5 text-asy-accent" />
        </div>
      </div>
    </div>
  );
}
