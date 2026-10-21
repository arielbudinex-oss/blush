import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakarta = localFont({
  src: [
    { path: "../../public/fonts/plus-jakarta-sans-latin.woff2", weight: "400 800", style: "normal" },
    { path: "../../public/fonts/plus-jakarta-sans-latin-ext.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blush · kenalan dulu, urusan belakangan",
    template: "%s · Blush",
  },
  description:
    "Aplikasi kencan buat kenalan dulu. Isi profil sekali, geser kalau ada yang menarik, chat kebuka kalau kalian saling suka.",
  applicationName: "Blush",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Blush",
    title: "Blush · kenalan dulu, urusan belakangan",
    description: "Profil yang jelas, badge wajah asli, chat yang kebuka setelah saling suka.",
  },
  twitter: { card: "summary_large_image", title: "Blush", description: "Kenalan dulu, urusan belakangan." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f9f6f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
