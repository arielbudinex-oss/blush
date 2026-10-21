import Link from "next/link";

/**
 * Identitas Blush: wordmark lowercase, tracking rapat. Tanpa ikon di header.
 * Ceri hidup di app icon dan favicon, bukan ditempel kecil di samping teks.
 */
export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "lg" ? "text-[1.95rem]" : size === "sm" ? "text-[1.2rem]" : "text-[1.4rem]";
  return (
    <span className={`inline-flex font-display ${scale} font-extrabold leading-none tracking-[-0.055em] text-ink`}>
      blush
    </span>
  );
}

export default function Logo({ size = "md", href = "/" }: { size?: "sm" | "md" | "lg"; href?: string }) {
  return (
    <Link href={href} aria-label="Blush" className="inline-flex shrink-0 items-center">
      <Wordmark size={size} />
    </Link>
  );
}
