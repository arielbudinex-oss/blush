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
    tagline: "Semua yang kamu butuh buat mulai. Tanpa bayar.",
    features: [
      "20 like per hari",
      "1 superlike per hari",
      "Chat tanpa batas setelah match",
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
    tagline: "Geser sepuasnya, tanpa menunggu kuota.",
    features: [
      "Swipe tanpa batas",
      "Lihat siapa yang suka kamu duluan",
      "5 superlike per hari",
      "Batalkan swipe terakhir",
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
    tagline: "Buat yang mau dilihat lebih banyak orang.",
    features: [
      "Semua fitur Blush Plus",
      "Naik ke urutan atas 30 menit, 1 kali per minggu",
      "Ganti kota: jelajah orang di kota lain",
      "Profil lebih sering muncul duluan",
      "Saring hanya profil terverifikasi",
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

/** Paket superlike sekali beli. Harga terpisah dari langganan bulanan. */
export const SUPERLIKE_PACKS = [
  { id: "superlike-5", count: 5, priceIdr: 15000 },
  { id: "superlike-15", count: 15, priceIdr: 39000 },
  { id: "superlike-40", count: 40, priceIdr: 89000 },
] as const;

export function isPremium(plan: Plan | null | undefined): boolean {
  return plan === "plus" || plan === "gold";
}

export function formatIdr(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}
