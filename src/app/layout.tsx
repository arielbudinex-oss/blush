import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-bricolage",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jakarta",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blush — kenalan yang nggak bikin capek",
    template: "%s · Blush",
  },
  description:
    "Blush adalah aplikasi kencan web: swipe yang jujur, match dari minat yang sama, chat realtime, dan verifikasi foto. Tanpa metrik palsu, tanpa bot.",
  applicationName: "Blush",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Blush",
    title: "Blush — kenalan yang nggak bikin capek",
    description:
      "Swipe yang jujur, match dari minat yang sama, chat realtime, verifikasi foto. Coba Blush gratis.",
  },
  twitter: { card: "summary_large_image", title: "Blush", description: "Kenalan yang nggak bikin capek." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f7f2ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${bricolage.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
