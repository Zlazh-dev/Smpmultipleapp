import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";
import { AuthProviders } from "@/components/providers";
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

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AsyHub — SMPIT Asy-Syadzili",
    template: "%s — AsyHub",
  },
  description:
    "AsyHub — Pusat identitas dan akses aplikasi SMPIT Asy-Syadzili. Login, kelola akun, dan akses semua aplikasi sekolah.",
  keywords: [
    "SMPIT",
    "Asy-Syadzili",
    "sekolah",
    "AsyHub",
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
    { media: "(prefers-color-scheme: light)", color: "#71C9CE" },
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
      className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <AuthProviders>
            {children}
            <ServiceWorkerRegistrar />
            <Toaster position="top-right" />
          </AuthProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
