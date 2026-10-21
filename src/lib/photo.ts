const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** URL publik foto profil (bucket "photos" publik). */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${base}/storage/v1/object/public/photos/${path}`;
}

export function firstPhoto(paths: string[] | null | undefined): string | null {
  if (!paths || paths.length === 0) return null;
  return photoUrl(paths[0]);
}

export function distanceLabel(meters: number | null | undefined): string {
  if (meters === null || meters === undefined) return "jarak belum diketahui";
  if (meters < 1000) return "di kotamu";
  return `${Math.round(meters / 1000)} km dari kamu`;
}
