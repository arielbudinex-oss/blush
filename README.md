# Blush

Dating app web (PWA). Next.js 16 + Supabase (Postgres 17 + PostGIS, Auth, Realtime, Storage) + QRIS.

Fitur: onboarding, discovery berbasis jarak (PostGIS), swipe (drag/pointer + tombol), match otomatis
saat like timbal balik (trigger DB), chat realtime, kuota like harian, superlike, undo, lihat yang
sudah nge-like (premium), boost + passport (gold), verifikasi foto, report/block, dan aktivasi premium
lewat pembayaran QRIS.

## Menjalankan

```bash
pnpm install
cp .env.example .env.local   # lalu isi nilainya
pnpm dev                     # http://localhost:3000
```

Variabel `.env.local`:

| Nama | Isi |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key (aman di klien) |
| `SUPABASE_SERVICE_ROLE_KEY` | **rahasia** — hanya dipakai route server |
| `NEXT_PUBLIC_SITE_URL` | URL situs (dipakai metadata + redirect auth) |
| `QRIS_STATIC_PAYLOAD` | payload QRIS statis milik merchant (lihat bawah) |
| `ADMIN_CONFIRM_SECRET` | secret untuk memanggil webhook pembayaran |

## Skema & migrasi

SQL ada di `supabase/migrations/0001_core_schema.sql` (idempoten untuk tabel/fungsi; jalankan sekali).
Isinya: 12 tabel, RLS di semua tabel, RPC `discover_candidates`, `likes_received`, `my_matches`,
`likes_used_today`, trigger `handle_new_user` dan `handle_swipe`, bucket storage `photos` (publik) dan
`verifications` (privat).

Yang penting soal keamanan:

- Klien tidak bisa menulis `profiles.plan`, `plan_expires_at`, `role`, `is_verified` — kolom itu tidak
  di-`grant` ke role `authenticated`, dan premium hanya diaktifkan `src/lib/activate.ts` dari route server.
- Discovery lewat fungsi `security definer`, jadi koordinat presisi tidak pernah terekspos; yang dibaca
  klien hanya jarak (meter) hasil hitungan server.
- Semua tabel ber-RLS: pesan hanya bisa dibaca peserta match, foto hanya milik sendiri atau match,
  pembayaran hanya milik sendiri atau admin.

## QRIS

`src/lib/qris.ts` mengubah payload QRIS **statis** milikmu jadi **dinamis**: tag `01` diset `12`,
tag `54` diisi nominal, lalu CRC16-CCITT dihitung ulang di tag `63`.

Isi `QRIS_STATIC_PAYLOAD` dengan string payload QRIS statis (bukan gambar): dari aplikasi bank/e-wallet
merchant, ekspor/lihat payload-nya, atau scan QR-mu dan baca string-nya. Kalau kosong, checkout menolak
dengan pesan jelas — tidak akan pernah menampilkan QR bernominal salah.

Verifikasi pembayaran punya dua jalur:

1. `POST /api/payments/webhook` dengan header `x-blush-secret: $ADMIN_CONFIRM_SECRET` — untuk gateway
   atau notifikasi otomatis. Kalau nanti pakai Midtrans/Xendit, ganti pemeriksaan secret itu dengan
   verifikasi signature gateway, lalu panggil `activatePayment()` yang sama.
2. `/admin` → tombol **Tandai lunas** (hanya akun `role = admin`) setelah cek mutasi QRIS.

## Menjadikan akun admin

```sql
update public.profiles set role = 'admin' where id = '<user-uuid>';
```

## Verifikasi

```bash
pnpm build                          # build produksi + typecheck
pnpm exec next start -p 3100        # server produksi
BLUSH_BASE=http://localhost:3100 node scripts/verify-flows.mjs
```

`scripts/verify-flows.mjs` menjalankan alur nyata lewat Chrome (GPU): dua akun, onboarding lewat UI,
swipe → match → chat realtime, checkout QRIS, aktivasi premium dari halaman admin. Log terakhir:
`docs/verify/run.log` (14/14 PASS), tangkapan layar di `docs/verify/*.png`.

Verifikasi wajah (opsional, on-device, kamera palsu dari file Y4M):

```bash
BLUSH_BASE=http://localhost:3100 node scripts/verify-face.mjs
```

Badge centang biru hanya muncul kalau verifikasi disetujui. Kelengkapan profil dihitung dari
`src/lib/completeness.ts`: verifikasi berbobot 20 dari 100, jadi tanpa verifikasi profil mentok 80%.

## Status

Sudah terverifikasi end-to-end di lokal (lihat `docs/verify/run.log`).

- `QRIS_STATIC_PAYLOAD` sudah berisi QRIS merchant asli (Xinet, Sukoharjo). Bukti bahwa QR yang
  ditampilkan benar-benar tertagih: PNG dari data URL dan tangkapan layar QR di-decode ulang dengan
  `zxing-cpp` → payload identik dengan yang tampil di halaman (tag `01`=12, tag `54`=49000, CRC valid).
  Catatan alat: `cv2.QRCodeDetector` gagal membaca QR padat ini; pakai `zxing-cpp` untuk verifikasi.
- Confirm-email di Supabase masih aktif (PATCH konfigurasi auth butuh scope token yang lebih luas).
  Matikan manual di Dashboard → Authentication → Providers → Email → Confirm email, supaya signup
  langsung masuk tanpa menunggu email.
- Belum dideploy (target Vercel belum ditentukan).
