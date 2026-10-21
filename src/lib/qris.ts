/**
 * QRIS (EMVCo merchant-presented QR) helpers.
 *
 * QRIS statis yang dimiliki merchant = payload TLV. Payload "dinamis" hanya beda di:
 *   - tag 01 (point of initiation) diset "12" = dynamic
 *   - tag 54 (transaction amount) diisi nominal
 *   - tag 63 (CRC) dihitung ulang
 *
 * Tidak ada kripto/rahasia di sini: nominal ditulis apa adanya di payload, dan
 * pembaca QR (aplikasi bank/e-wallet) yang menagih nominal itu ke rekening merchant.
 */

export type Tlv = { tag: string; value: string };

/** Baca isi payload TLV satu level (sesuai spesifikasi EMVCo). */
export function parseTlv(payload: string): Tlv[] {
  const out: Tlv[] = [];
  let i = 0;
  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const lenRaw = payload.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(lenRaw)) throw new Error(`TLV rusak di offset ${i}: panjang "${lenRaw}"`);
    const len = Number(lenRaw);
    const value = payload.slice(i + 4, i + 4 + len);
    if (value.length !== len) throw new Error(`TLV rusak di tag ${tag}: butuh ${len} char`);
    out.push({ tag, value });
    i += 4 + len;
  }
  if (i !== payload.length) throw new Error("TLV tidak habis terbaca (sisa byte)");
  return out;
}

function serializeTag(tag: string, value: string): string {
  const len = value.length;
  if (len > 99) throw new Error(`nilai tag ${tag} terlalu panjang`);
  return `${tag}${String(len).padStart(2, "0")}${value}`;
}

/** CRC16-CCITT (poly 0x1021, init 0xFFFF) — algoritma yang dipakai EMVCo tag 63. */
export function crc16ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function isQrisPayload(payload: string): boolean {
  const trimmed = payload.trim();
  if (trimmed.length < 12 || !trimmed.startsWith("000201")) return false;
  try {
    return parseTlv(trimmed).some((t) => t.tag === "63");
  } catch {
    return false;
  }
}

/**
 * Ubah QRIS statis milik merchant jadi payload dinamis bernominal `amountIdr`.
 * Melempar error kalau payload statis tidak valid — jangan pernah menampilkan
 * QR yang nominalnya tidak bisa dipastikan.
 */
export function toDynamicQris(staticPayload: string, amountIdr: number): string {
  if (!Number.isInteger(amountIdr) || amountIdr < 1) throw new Error("nominal harus bilangan bulat rupiah > 0");
  const payload = staticPayload.trim();
  if (!isQrisPayload(payload)) throw new Error("payload QRIS statis tidak valid");

  const tags = parseTlv(payload).filter((t) => t.tag !== "63");
  const result: Tlv[] = [];
  let amountInserted = false;

  for (const t of tags) {
    if (t.tag === "01") {
      result.push({ tag: "01", value: "12" }); // 12 = dynamic
      continue;
    }
    if (t.tag === "54") continue; // nominal lama dibuang
    // sisipkan nominal tepat sebelum tag 53 (currency) / 58 (country) / 59 (merchant name)
    if (!amountInserted && ["53", "58", "59", "60"].includes(t.tag)) {
      result.push({ tag: "54", value: String(amountIdr) });
      amountInserted = true;
    }
    result.push(t);
  }
  if (!amountInserted) result.push({ tag: "54", value: String(amountIdr) });

  const body = result.map((t) => serializeTag(t.tag, t.value)).join("") + "6304";
  return body + crc16ccitt(body);
}

/** Cek ulang payload yang kita hasilkan sendiri (dipakai di test + route checkout). */
export function verifyQris(payload: string): { ok: boolean; reason?: string; amountIdr?: number } {
  const trimmed = payload.trim();
  if (trimmed.length < 8) return { ok: false, reason: "terlalu pendek" };
  const body = trimmed.slice(0, -4);
  const crc = trimmed.slice(-4);
  if (crc16ccitt(body) !== crc.toUpperCase()) return { ok: false, reason: "CRC tidak cocok" };
  let tags: Tlv[];
  try {
    tags = parseTlv(trimmed);
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
  const amount = tags.find((t) => t.tag === "54");
  return { ok: true, amountIdr: amount ? Number(amount.value) : undefined };
}
