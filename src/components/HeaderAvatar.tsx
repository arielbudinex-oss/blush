"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Avatar header global; disembunyikan di halaman profil supaya tidak dobel. */
export default function HeaderAvatar({ cover, initial }: { cover: string | null; initial: string }) {
  const pathname = usePathname();
  if (pathname === "/app/profile") return null;

  return (
    <Link
      href="/app/profile"
      aria-label="Profil kamu"
      className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-line-strong bg-paper-2 text-sm font-bold text-ink-soft"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </Link>
  );
}
