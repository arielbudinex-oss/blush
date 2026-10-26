import { useId } from "react";

/**
 * Scalloped verification seal. The silhouette is generated so the badge stays
 * crisp at any size and never depends on platform artwork.
 */
function sealPath(points = 12, inner = 9.35, outer = 11.7, center = 12) {
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
const SEAL_INNER = sealPath(12, 8.55, 9.58, 12);

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
        <linearGradient id={fill} x1="6" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5CC6FF" />
          <stop offset="0.45" stopColor="#1B84F5" />
          <stop offset="1" stopColor="#0A51C4" />
        </linearGradient>
        <linearGradient id={gloss} x1="12" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.42" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={SEAL} fill={`url(#${fill})`} />
      <path d={SEAL} fill={`url(#${gloss})`} />
      <path d={SEAL} fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
      <path d={SEAL_INNER} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.5" />
      <path
        d="m7.75 12.15 2.95 2.95 5.6-5.95"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
