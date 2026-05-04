import type { Role } from "@prisma/client";
import {
  Briefcase,
  Radio,
  GraduationCap,
  Users,
} from "lucide-react";

/**
 * Application-wide configuration for AsyHub.
 * Centralized app definitions, role labels, descriptions, and access rules.
 */

export const siteConfig = {
  name: "AsyHub",
  shortName: "AsyHub",
  description:
    "Pusat identitas dan akses aplikasi SMPIT Asy-Syadzili — login, kelola akun, dan akses semua aplikasi sekolah.",
  domain: "sekolahasy.com",
};

/**
 * App availability states shown in the launcher.
 */
export type AppStatus = "available" | "restricted" | "coming_soon" | "maintenance";

/**
 * Available applications that can be accessed via SSO.
 *
 * AsyOps  = Backoffice administration (was TU App)
 * AsyTeach = Teacher workspace (coming soon)
 * RADIG   = Rapor Digital / academic system (external, standalone)
 */
export const apps = [
  {
    key: "asyops",
    label: "AsyOps",
    shortLabel: "AsyOps",
    url: process.env.NEXT_PUBLIC_TU_URL || "http://tu.localhost",
    ssoKey: "tu", // maps to existing SSO redirect ?app=tu
    description: "Administrasi backoffice, presensi, kepegawaian, dan dokumen",
    icon: Briefcase,
    color: "from-indigo-500 to-blue-600",
    badgeColor: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    status: "available" as AppStatus,
    allowedRoles: ["TU", "RADIG"] as Role[], // Teachers do NOT see AsyOps by default
  },
  {
    key: "asyteach",
    label: "AsyTeach",
    shortLabel: "AsyTeach",
    url: (process.env.NEXT_PUBLIC_TU_URL || "http://tu.localhost") + "/teach/home",
    ssoKey: "tu", // Same SSO target as AsyOps, redirect handles routing
    description: "Ruang kerja guru — presensi, cuti, dan dokumen pribadi",
    icon: GraduationCap,
    color: "from-emerald-500 to-teal-500",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    status: "available" as AppStatus,
    allowedRoles: ["TU", "RADIG", "Guru"] as Role[],
  },
  {
    key: "radig",
    label: "RADIG",
    shortLabel: "RADIG",
    url: process.env.NEXT_PUBLIC_RADIG_URL || "http://radig.localhost",
    ssoKey: "radig",
    description: "Rapor digital, manajemen akademik, dan data siswa",
    icon: Radio,
    color: "from-violet-500 to-purple-500",
    badgeColor: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    status: "available" as AppStatus,
    allowedRoles: ["TU", "RADIG", "Guru"] as Role[],
  },
] as const;

export type AppKey = (typeof apps)[number]["key"];

/**
 * Get apps accessible by a specific role.
 */
export function getAppsForRole(role: Role) {
  return apps.filter((app) => app.allowedRoles.includes(role));
}

/**
 * Get apps that a role cannot access (for "Other Apps" section).
 */
export function getRestrictedAppsForRole(role: Role) {
  return apps.filter((app) => !app.allowedRoles.includes(role));
}

/**
 * Check if a role has admin privileges.
 */
export function isAdminRole(role: Role): boolean {
  return role === "RADIG";
}

/**
 * Subdomain URLs mapped by role (legacy compat).
 */
export const subdomainMap: Record<Role, string> = {
  TU: process.env.NEXT_PUBLIC_TU_URL || "http://tu.localhost",
  RADIG: process.env.NEXT_PUBLIC_RADIG_URL || "http://radig.localhost",
  Guru: process.env.NEXT_PUBLIC_GURU_URL || "http://guru.localhost",
  WaliSantri: process.env.NEXT_PUBLIC_WALI_URL || "http://wali.localhost",
};

export const roleLabels: Record<Role, string> = {
  TU: "Tata Usaha",
  RADIG: "Administrator",
  Guru: "Guru",
  WaliSantri: "Wali Santri",
};

export const roleDescriptions: Record<Role, string> = {
  TU: "Administrasi backoffice, presensi, kepegawaian, dan dokumen operasional",
  RADIG: "Administrasi sistem, manajemen pengguna, dan konfigurasi aplikasi",
  Guru: "Jadwal mengajar, presensi kelas, input nilai, bimbingan santri",
  WaliSantri: "Pemantauan akademik, kehadiran, dan perkembangan anak",
};
