import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Blush untuk lanjut ke profil, chat, dan match kamu.",
  alternates: { canonical: "/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
