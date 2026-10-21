import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const cabinet = localFont({
  src: [
    { path: "../../public/fonts/cabinet-grotesk-700.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/cabinet-grotesk-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-cabinet",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const author = localFont({
  src: [
    { path: "../../public/fonts/author-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/author-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/author-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-author",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const gambetta = localFont({
  src: [{ path: "../../public/fonts/gambetta-500i.woff2", weight: "500", style: "italic" }],
  variable: "--font-gambetta",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blush — kenalan dulu, urusan belakangan",
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
    title: "Blush — kenalan dulu, urusan belakangan",
    description: "Profil yang jelas, badge wajah asli, chat yang kebuka setelah saling suka.",
  },
  twitter: { card: "summary_large_image", title: "Blush", description: "Kenalan dulu, urusan belakangan." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f7f2ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${cabinet.variable} ${author.variable} ${gambetta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
