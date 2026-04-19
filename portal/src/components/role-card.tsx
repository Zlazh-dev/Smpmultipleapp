"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { roleLabels, roleDescriptions, subdomainMap } from "@/lib/config";
import {
  Building2,
  Radio,
  GraduationCap,
  Users,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import type { Role } from "@prisma/client";

const roleConfig = {
  TU: {
    icon: Building2,
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/25",
    accent: "text-blue-500",
    bgAccent: "bg-blue-500/10",
    borderAccent: "border-blue-500/20 hover:border-blue-500/40",
    active: true,
  },
  RADIG: {
    icon: Radio,
    gradient: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/25",
    accent: "text-violet-500",
    bgAccent: "bg-violet-500/10",
    borderAccent: "border-violet-500/20 hover:border-violet-500/40",
    active: true,
  },
  Guru: {
    icon: GraduationCap,
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/25",
    accent: "text-emerald-500",
    bgAccent: "bg-emerald-500/10",
    borderAccent: "border-emerald-500/20 hover:border-emerald-500/40",
    active: false,
  },
  WaliSantri: {
    icon: Users,
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/25",
    accent: "text-amber-500",
    bgAccent: "bg-amber-500/10",
    borderAccent: "border-amber-500/20 hover:border-amber-500/40",
    active: false,
  },
} as const;

interface RoleCardProps {
  role: Role;
  index: number;
}

export function RoleCard({ role, index }: RoleCardProps) {
  const config = roleConfig[role];
  const Icon = config.icon;
  const delay = index * 150;

  return (
    <Card
      className={cn(
        "group relative border transition-all duration-300 bg-card/50 backdrop-blur-sm",
        config.active
          ? "cursor-pointer hover:scale-[1.02] hover:shadow-xl"
          : "opacity-60 cursor-default",
        config.borderAccent
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => {
        if (config.active) {
          window.location.href = subdomainMap[role];
        }
      }}
    >
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
        {/* Icon */}
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br transition-shadow duration-300",
            config.gradient,
            config.shadow,
            config.active && "group-hover:shadow-lg"
          )}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold tracking-tight">
            {roleLabels[role]}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {roleDescriptions[role]}
          </p>
        </div>

        {/* Badge */}
        {config.active ? (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] gap-1 transition-colors",
              config.bgAccent,
              config.accent,
              "border-transparent"
            )}
          >
            Masuk
            <ArrowUpRight className="h-3 w-3" />
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 bg-muted/50 text-muted-foreground border-transparent"
          >
            <Clock className="h-3 w-3" />
            Segera Hadir
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
