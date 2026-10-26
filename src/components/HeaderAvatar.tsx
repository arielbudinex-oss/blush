"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

/** Avatar header global; disembunyikan di halaman profil supaya tidak dobel. */
export default function HeaderAvatar({ cover, initial }: { cover: string | null; initial: string }) {
  const pathname = usePathname();
  if (pathname === "/app/profile") return null;

  return (
    <Link
      href="/app/profile"
      aria-label="Profil kamu"
      className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-line-strong bg-paper-2 text-sm font-bold text-ink-soft"
    >
      {cover ? (
        <Image src={cover} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        initial
      )}
    </Link>
  );
}
