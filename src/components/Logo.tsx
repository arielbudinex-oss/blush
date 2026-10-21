import Link from "next/link";

/**
 * Identitas Blush: wordmark lowercase, tracking rapat, titik cherry.
 * Tidak ada ikon hati. Ikon app memakai huruf "b" yang sama.
 */
export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "lg" ? "text-[1.95rem]" : size === "sm" ? "text-[1.2rem]" : "text-[1.4rem]";
  const dot = size === "lg" ? "h-[0.5em] w-[0.5em]" : "h-[0.48em] w-[0.48em]";
  return (
    <span className={`inline-flex items-baseline font-display ${scale} font-extrabold leading-none tracking-[-0.055em] text-ink`}>
      blush
      <svg
        viewBox="0 0 18 18"
        aria-hidden="true"
        className={`${dot} ml-[0.045em] shrink-0 text-blush-deep`}
      >
        <path d="M9.2 6.3C10.2 3.4 12.1 1.4 15 1" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="7.4" cy="12.2" r="5.8" fill="currentColor" />
      </svg>
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
