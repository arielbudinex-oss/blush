/** Definisi paket + batasannya. Angka di sini adalah satu-satunya sumber kebenaran;
 *  dipakai oleh UI dan oleh route server saat mengaktifkan premium. */

export type Plan = "free" | "plus" | "gold";

export type PlanConfig = {
  id: Plan;
  name: string;
  priceIdr: number;
  period: string;
  tagline: string;
  features: string[];
  dailyLikes: number;
  dailySuperlikes: number;
  unlimitedSwipes: boolean;
  seeWhoLiked: boolean;
  passport: boolean;
  boostsPerMonth: number;
};

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: "free",
    name: "Gratis",
    priceIdr: 0,
    period: "selamanya",
    tagline: "Cukup buat cari serius tanpa bayar apa pun.",
    features: [
      "20 like per hari",
      "1 superlike per hari",
      "Chat realtime tanpa batas setelah match",
      "Filter umur, jarak, dan gender",
      "Report & block kapan saja",
    ],
    dailyLikes: 20,
    dailySuperlikes: 1,
    unlimitedSwipes: false,
    seeWhoLiked: false,
    passport: false,
    boostsPerMonth: 0,
  },
  plus: {
    id: "plus",
    name: "Blush Plus",
    priceIdr: 49000,
    period: "per bulan",
    tagline: "Buat yang serius tapi nggak mau nunggu kuota.",
    features: [
      "Swipe tanpa batas",
      "Lihat siapa yang sudah nge-like kamu",
      "5 superlike per hari",
      "Undo swipe terakhir kapan pun",
      "Tanpa iklan",
    ],
    dailyLikes: 100000,
    dailySuperlikes: 5,
    unlimitedSwipes: true,
    seeWhoLiked: true,
    passport: false,
    boostsPerMonth: 0,
  },
  gold: {
    id: "gold",
    name: "Blush Gold",
    priceIdr: 129000,
    period: "per bulan",
    tagline: "Semua kekuatan Blush, plus jangkauan yang lebih luas.",
    features: [
      "Semua fitur Blush Plus",
      "1 Boost per minggu (30 menit di urutan teratas)",
      "Passport: atur lokasi jelajah sendiri",
      "Prioritas di urutan discovery",
      "Filter lanjutan: hanya profil terverifikasi",
    ],
    dailyLikes: 100000,
    dailySuperlikes: 10,
    unlimitedSwipes: true,
    seeWhoLiked: true,
    passport: true,
    boostsPerMonth: 4,
  },
};

export const PLAN_ORDER: Plan[] = ["free", "plus", "gold"];

export function isPremium(plan: Plan | null | undefined): boolean {
  return plan === "plus" || plan === "gold";
}

export function formatIdr(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}
