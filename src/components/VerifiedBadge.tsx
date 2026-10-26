import { useId } from "react";

/**
 * Scalloped verification seal. The silhouette is generated so the badge stays
 * crisp at any size and never depends on platform artwork.
 */
function sealPath(points = 10, inner = 9.6, outer = 11.85, center = 12) {
  const step = (Math.PI * 2) / points;
  const at = (radius: number, angle: number) => {
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  };
  let path = "";
  for (let i = 0; i < points; i += 1) {
    const start = -Math.PI / 2 + i * step;
    const end = start + step;
    const mid = start + step / 2;
    if (i === 0) path += `M${at(inner, start)}`;
    path += `Q${at(outer, mid)} ${at(inner, end)}`;
  }
  return `${path}Z`;
}

const SEAL = sealPath();

export default function VerifiedBadge({
  size = 16,
  className = "",
  label = "Terverifikasi",
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  const gradientId = `blush-seal-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

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
        <linearGradient id={gradientId} x1="5" y1="3.5" x2="19" y2="20.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3BB2FF" />
          <stop offset="0.52" stopColor="#1479EF" />
          <stop offset="1" stopColor="#0A5BD3" />
        </linearGradient>
      </defs>
      <path d={SEAL} fill={`url(#${gradientId})`} />
      <path d={SEAL} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
      <path
        d="m7.9 12.1 2.9 2.9 5.4-5.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
