import type { Role } from "@prisma/client";
import {
  Building2,
  Radio,
  GraduationCap,
  Users,
} from "lucide-react";

/**
 * Application-wide configuration.
 * Centralized app definitions, role labels, and descriptions.
 */

export const siteConfig = {
  name: "Portal SMPIT Asy-Syadzili",
  shortName: "Portal SMPIT",
  description:
    "Portal terpadu SMPIT Asy-Syadzili — akses ke semua aplikasi sekolah.",
  domain: "sekolahasy.com",
};

/**
 * Available applications that can be accessed via SSO.
 * Every authenticated user can access ALL apps.
 * The target app determines the user's role internally.
 */
export const apps = [
  {
    key: "tu",
    label: "Tata Usaha",
    shortLabel: "TU",
    url: process.env.NEXT_PUBLIC_TU_URL || "http://tu.localhost",
    description: "Presensi geofencing, data pegawai, cetak surat, e-filing, manajemen cuti",
    icon: Building2,
    color: "from-blue-500 to-cyan-500",
    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    key: "radig",
    label: "RADIG",
    shortLabel: "RADIG",
    url: process.env.NEXT_PUBLIC_RADIG_URL || "http://radig.localhost",
    description: "Rapor digital, input nilai, manajemen kelas, cetak rapor",
    icon: Radio,
    color: "from-violet-500 to-purple-500",
    badgeColor: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
] as const;

export type AppKey = (typeof apps)[number]["key"];

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
  RADIG: "RADIG",
  Guru: "Guru",
  WaliSantri: "Wali Santri",
};

export const roleDescriptions: Record<Role, string> = {
  TU: "Presensi geofencing, data pegawai, cetak surat, e-filing, manajemen cuti",
  RADIG: "Pendaftaran santri baru (PSB), manajemen data santri, jadwal & khidmah",
  Guru: "Jadwal mengajar, presensi kelas, input nilai, bimbingan santri",
  WaliSantri: "Pemantauan akademik, kehadiran, dan perkembangan anak",
};
