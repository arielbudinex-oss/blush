import type { SVGProps } from "react";

export type IconName =
  | "deck"
  | "heart"
  | "chat"
  | "user"
  | "back"
  | "send"
  | "check"
  | "checks"
  | "shield"
  | "x"
  | "star"
  | "undo"
  | "clock"
  | "chevron"
  | "camera"
  | "lock"
  | "more"
  | "filter"
  | "info"
  | "location"
  | "sparkles"
  | "flag"
  | "ban"
  | "plus";

/**
 * Satu set ikon 24px dengan grid, ketebalan, dan ujung garis yang sama.
 * Semua memakai currentColor supaya warna ikut teks.
 */
export function Icon({
  name,
  className = "h-5 w-5",
  filled = false,
  ...rest
}: { name: IconName; className?: string; filled?: boolean } & SVGProps<SVGSVGElement>) {
  const common = {
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
    focusable: false,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };

  switch (name) {
    case "deck":
      return (
        <svg {...common}>
          <rect x="8.2" y="3.6" width="12.2" height="15.4" rx="2.4" />
          <path d="M5.1 7.2A2.2 2.2 0 0 0 3.6 9.3v8.3a2.2 2.2 0 0 0 2.2 2.2h7.8" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common} fill={filled ? "currentColor" : "none"}>
          <path d="M12 20.2c-.6-.4-7.4-4.6-7.4-9.8A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.4 3.1c0 5.2-6.8 9.4-7.4 9.8Z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M12 4.2c-4.5 0-8.1 3-8.1 6.8 0 2.2 1.2 4.1 3.1 5.4v3.4l3.2-1.8c.6.1 1.2.2 1.8.2 4.5 0 8.1-3 8.1-6.8S16.5 4.2 12 4.2Z" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.3" r="3.5" />
          <path d="M5.1 19.8c.7-3.3 3.4-5.1 6.9-5.1s6.2 1.8 6.9 5.1" />
        </svg>
      );
    case "back":
      return (
        <svg {...common}>
          <path d="M14.6 5.4 8 12l6.6 6.6" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path d="M4.6 11.6 20 5.2l-5.7 14-3.1-5.3-6.6-2.3Z" />
          <path d="m11.2 13.9 3.4-3.5" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} strokeWidth={2.6}>
          <path d="m5 12.6 4.4 4.3L19 6.8" />
        </svg>
      );
    case "checks":
      return (
        <svg {...common}>
          <path d="M2.6 12.6l4 4L14.8 7" />
          <path d="M9.4 15.2l1.6 1.5L22 6.6" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3.2 18.9 6v5.4c0 4.1-2.8 7.5-6.9 9.4-4.1-1.9-6.9-5.3-6.9-9.4V6L12 3.2Z" />
          <path d="m8.9 12 2.2 2.2 4.1-4.5" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} fill={filled ? "currentColor" : "none"}>
          <path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.8-5.1 2.8 1-5.7-4.1-4 5.7-.8L12 3.6Z" />
        </svg>
      );
    case "undo":
      return (
        <svg {...common}>
          <path d="M4.6 9.2h8.6a5.2 5.2 0 1 1 0 10.4H8.6" />
          <path d="M8.2 5.2 4.2 9.2l4 4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M12 7.6V12l3 1.8" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="m9.2 5.4 6.6 6.6-6.6 6.6" />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <path d="M4.2 8.6h3l1.4-2h6.8l1.4 2h3v10H4.2v-10Z" />
          <circle cx="12" cy="13.2" r="3.1" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.4" />
          <path d="M8.2 10.4V7.9a3.8 3.8 0 0 1 7.6 0v2.5" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <path d="M4.4 7h4.2M12.2 7h7.4M4.4 12h8.2M16.2 12h3.4M4.4 17h2.4M10.4 17h9.2" />
          <circle cx="10.4" cy="7" r="1.7" />
          <circle cx="14.2" cy="12" r="1.7" />
          <circle cx="8.2" cy="17" r="1.7" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.3" />
          <path d="M12 11v5.2" />
          <circle cx="12" cy="7.9" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "location":
      return (
        <svg {...common}>
          <path d="M12 21c4-4.2 6-7.4 6-10a6 6 0 1 0-12 0c0 2.6 2 5.8 6 10Z" />
          <circle cx="12" cy="10.7" r="2.2" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="M12 3.4l1.5 4.1 4.1 1.5-4.1 1.5L12 14.6l-1.5-4.1L6.4 9l4.1-1.5L12 3.4Z" />
          <path d="M18.6 14.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
        </svg>
      );
    case "flag":
      return (
        <svg {...common}>
          <path d="M6 21V4.2" />
          <path d="M6 4.8c3.2-1.8 6.2 1.8 9.4 0v7.4c-3.2 1.8-6.2-1.8-9.4 0" />
        </svg>
      );
    case "ban":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" />
          <path d="m6.4 17.6 11.2-11.2" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5.6v12.8M5.6 12h12.8" />
        </svg>
      );
    case "more":
      return (
        <svg {...common}>
          <circle cx="5.6" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="18.4" cy="12" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}
