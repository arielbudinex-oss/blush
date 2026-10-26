import { useId } from "react";

/**
 * Verification seal: solid blue disc with a soft gradient, a hairline rim and a
 * crisp white check. A circle reads cleanly at 12-16 px, where scalloped edges
 * turn into visual noise. Drawn as SVG so it stays sharp at any density.
 */

export default function VerifiedBadge({
  size = 16,
  className = "",
  label = "Terverifikasi",
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const fill = `blush-seal-fill-${id}`;
  const gloss = `blush-seal-gloss-${id}`;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`inline-block shrink-0 align-[-0.18em] ${className}`}
      role="img"
      aria-label={label}
      focusable="false"
    >
      <defs>
        <linearGradient id={fill} x1="12" y1="1.6" x2="12" y2="22.4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#59B6FF" />
          <stop offset="0.55" stopColor="#1B84F5" />
          <stop offset="1" stopColor="#0B57CE" />
        </linearGradient>
        <linearGradient id={gloss} x1="12" y1="2.4" x2="12" y2="11.6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10.6" fill={`url(#${fill})`} />
      <circle cx="12" cy="12" r="10.6" fill={`url(#${gloss})`} />
      <circle cx="12" cy="12" r="9.55" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" />
      <path
        d="m7.35 12.2 3.2 3.2 6.15-6.4"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
