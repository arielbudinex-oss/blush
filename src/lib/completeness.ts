type ProfileLike = Record<string, unknown>;

/**
 * Kelengkapan profil dalam persen.
 * Verifikasi wajah opsional, tapi bobotnya 20% — tanpa centang biru profil mentok di 80%.
 */
export function profileCompletion(
  profile: ProfileLike,
  photoCount: number,
  interestCount: number,
  promptCount: number,
): number {
  let total = 0;
  if (photoCount >= 1) total += 10;
  if (photoCount >= 3) total += 10;
  if (profile.bio) total += 10;
  if (profile.job) total += 5;
  if (profile.city) total += 5;
  if (profile.birthdate && profile.gender) total += 5;
  if (interestCount >= 3) total += 10;
  if (promptCount >= 1) total += 10;
  if (promptCount >= 3) total += 5;

  const vitals = [
    "height_cm",
    "exercise",
    "drinking",
    "smoking",
    "pets",
    "zodiac",
    "education",
    "languages",
    "hometown",
  ].filter((key) => Boolean(profile[key])).length;
  if (vitals >= 3) total += 10;

  if (profile.is_verified === "approved") total += 20;

  return Math.min(100, total);
}

/** Sisa langkah yang paling berpengaruh buat naikin persentase. */
export function profileGaps(
  profile: ProfileLike,
  photoCount: number,
  interestCount: number,
  promptCount: number,
): string[] {
  const gaps: string[] = [];
  if (!profile.bio) gaps.push("Tulis bio");
  if (photoCount < 3) gaps.push(`Tambah ${3 - photoCount} foto`);
  if (promptCount < 1) gaps.push("Jawab 1 prompt");
  else if (promptCount < 3) gaps.push(`${promptCount}/3 prompt`);
  if (interestCount < 3) gaps.push(`${interestCount}/3 minat`);
  const vitals = [
    "height_cm",
    "exercise",
    "drinking",
    "smoking",
    "pets",
    "zodiac",
    "education",
    "languages",
    "hometown",
  ].filter((key) => Boolean(profile[key])).length;
  if (vitals < 3) gaps.push("Isi detail diri");
  return gaps;
}
