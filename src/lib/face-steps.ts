export type Challenge = "kiri" | "kanan" | "dekat";

/**
 * Ambang dibuat longgar supaya kamera laptop/HP murah tetap bisa lolos.
 * offset = posisi hidung relatif ke tengah kotak wajah (indikator menoleh),
 * ratio = lebar wajah dibanding lebar frame (indikator mendekat).
 */
export function stepSatisfied(
  step: Challenge,
  box: { x: number; width: number },
  nose: { x: number },
  videoWidth: number,
): boolean {
  if (!videoWidth || !box.width) return false;
  const offset = (nose.x - (box.x + box.width / 2)) / box.width;
  const ratio = box.width / videoWidth;
  if (step === "kiri") return offset > 0.04;
  if (step === "kanan") return offset < -0.04;
  return ratio > 0.2;
}
