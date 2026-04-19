import { Role } from "@prisma/client";

export type { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  image: string | null;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  icon: string;
  trend?: "up" | "down" | "neutral";
  change?: string;
}
