import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AnalyticsTracker from "@/components/AnalyticsTracker";

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
    default: "Blush · buka webnya, ketemu orangnya",
    template: "%s · Blush",
  },
  description:
    "Dating tanpa download. Buka Blush langsung di browser, lihat foto, bio, dan jawaban asli sebelum memutuskan. Saling suka, chat langsung terbuka.",
  applicationName: "Blush",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Blush",
    title: "Blush · buka webnya, ketemu orangnya",
    description: "Tanpa download, tanpa ribet. Foto, bio, dan jawaban asli sebelum kamu memutuskan.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Blush, aplikasi kencan dengan profil jelas dan badge wajah asli." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blush · buka webnya, ketemu orangnya",
    description: "Tanpa download, tanpa ribet. Foto, bio, dan jawaban asli sebelum kamu memutuskan.",
    images: ["/og.png"],
  },
  alternates: { canonical: "/" },
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
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ojyfxtmjcexngmipgtge.supabase.co"} crossOrigin="" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ojyfxtmjcexngmipgtge.supabase.co"} />
      </head>
      <body>
        <AnalyticsTracker />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Blush",
              url: siteUrl,
              description: "Aplikasi kencan Indonesia dengan profil jelas, badge wajah asli, dan chat setelah saling suka.",
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
