import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Portal SMPIT Asy-Syadzili",
    template: "%s — Portal SMPIT Asy-Syadzili",
  },
  description:
    "Portal terpadu Sekolah Menengah Pertama Islam Terpadu Asy-Syadzili — Akses cepat ke semua aplikasi sekolah: TU, Waka Kurikulum, Guru, dan Wali Santri.",
  keywords: [
    "SMPIT",
    "Asy-Syadzili",
    "sekolah",
    "portal",
    "pendidikan",
    "Islam",
    "terpadu",
  ],
  authors: [{ name: "SMPIT Asy-Syadzili" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1f1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ServiceWorkerRegistrar />
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
