import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat akun",
  description: "Buat akun Blush, isi profil sekali, lalu mulai kenalan dengan orang di sekitarmu.",
  alternates: { canonical: "/signup" },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
