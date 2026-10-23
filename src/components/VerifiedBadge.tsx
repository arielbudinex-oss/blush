import { Icon } from "@/components/Icon";

/**
 * Badge terverifikasi bergaya seal, bukan emoji. Dipakai konsisten di kartu,
 * chat, profil, dan daftar like supaya tanda centang terlihat seperti bagian
 * dari produk, bukan glyph dari keyboard.
 */
export default function VerifiedBadge({
  size = 18,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      title="Terverifikasi"
      aria-label="Terverifikasi"
      role="img"
      className={`inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3da5ff] to-[#0a66d4] text-white shadow-[0_1px_2px_rgba(10,102,212,0.35)] ring-1 ring-white/80 ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon name="check" className="h-[62%] w-[62%]" strokeWidth={3.4} />
    </span>
  );
}
