# Blush — rencana produk

Dating app web (PWA), original. Bukan fork/kopi kode pihak lain: fitur standar industri
(swipe, match, chat) diimplementasikan sendiri, UI/UX dan brand sendiri.

## Keputusan yang sudah dikunci

| Item | Nilai |
| --- | --- |
| Nama | Blush |
| Repo | `F:\blush` |
| Stack | Next.js 16 (App Router, TS, Tailwind 4) + Supabase (Postgres 17 + PostGIS, Auth, Realtime, Storage) |
| Deploy | Vercel (akun Ariel — belum diputuskan akun mana) |
| Pembayaran | QRIS dinamis, digenerate dari QRIS statis merchant milik Ariel (EMVCo TLV + CRC16) |
| Supabase project | `ojyfxtmjcexngmipgtge` (ap-southeast-1, $0/bulan) |

## Fitur

**Inti (gratis)**

- Auth email + Google, onboarding (nama, tanggal lahir, gender, minat, foto, lokasi).
- Discovery berbasis jarak (PostGIS), filter umur/jarak/gender/intent.
- Swipe like/pass, superlike terbatas, undo swipe terakhir.
- Kuota like harian (gratis 20/hari) dihitung dari tabel `swipes` — bukan metrik dummy.
- Match otomatis saat like timbal balik (trigger DB), halaman matches.
- Chat realtime (Supabase Realtime) + indikator belum dibaca.
- Safety: report, block, verifikasi foto (selfie masuk review).

**Premium `plus` / `gold`**

- `plus`: seperti siapa yang nge-like, unlimited swipe, lihat pembaca pesan, undo tak terbatas.
- `gold`: semua di atas + 1 boost/minggu, passport (ubah lokasi), 5 superlike/hari,
  filter lanjutan (intent, verified only).
- Aktivasi premium hanya setelah pembayaran berstatus `paid` — tidak ada premium yang
  bisa dinyalakan dari klien.

## Skema DB (ringkas)

`profiles`, `preferences`, `interests`, `profile_interests`, `photos`, `swipes`, `matches`,
`messages`, `reports`, `blocks`, `payments`, `boosts`.
RLS aktif di semua tabel; discovery lewat RPC `security definer` supaya kolom sensitif
(lokasi presisi) tidak pernah terekspos langsung.

## QRIS dinamis

QRIS statis = payload EMVCo TLV. Payload dinamis = tambah tag `54` (nominal) + set tag `01`
ke `12` (dynamic) lalu hitung ulang CRC16-CCITT di tag `63`. Semua dihitung server-side
(`src/lib/qris.ts`), dan payload yang ditampilkan ke pembeli ikut disimpan di baris
`payments` supaya bisa diaudit.

Verifikasi pembayaran:

1. Gateway (Midtrans/Xendit) → webhook `POST /api/payments/webhook`.
2. Tanpa gateway → semua transaksi `pending`, admin menandai `paid` dari halaman admin
   setelah cek mutasi QRIS. Satu-satunya jalur aktivasi di mode ini.

## Urutan kerja

1. Skema + RLS + RPC discovery + seed interests. → verify: `list_tables` + query `discover_candidates` mengembalikan kandidat nyata.
2. Auth + onboarding + upload foto. → verify: signup nyata bikin baris `profiles`.
3. Swipe + match + kuota. → verify: dua akun saling like → baris `matches` muncul dari trigger.
4. Chat realtime. → verify: pesan terkirim muncul di klien kedua tanpa refresh.
5. Premium + QRIS + halaman admin. → verify: payload QRIS valid (CRC benar) + `payments` pending→paid mengubah `profiles.plan`.
6. Desain anti-slop (Hallmark, genre playful) + PWA + SEO. → verify: skor slop-probe bersih, render 320/375/414/768.
7. Deploy Vercel + verifikasi live (baca balik halaman yang tersaji).
