# Audit keamanan Blush

Tanggal: 22 Oktober 2026

## Yang diperbaiki

1. **Escalation role lewat profil sendiri**
   - Sebelumnya policy `profiles_update` mengizinkan user mengubah semua kolom miliknya, termasuk `role`, `plan`, `plan_expires_at`, dan `is_verified`.
   - Sekarang `authenticated` hanya mendapat izin UPDATE pada kolom profil yang aman. `role`, `plan`, `plan_expires_at`, dan `is_verified` hanya bisa ditulis server dengan service role.
   - Uji: `update profiles set role='admin'` dari sesi user biasa ditolak `42501 permission denied`.

2. **Status verifikasi bisa ditulis langsung**
   - INSERT/UPDATE/DELETE pada `verifications` dicabut dari `authenticated` dan `anon`. Hanya route server yang menulis.
   - Policy storage `verif_own` dihapus; selfie verifikasi hanya diakses server/admin.
   - Uji: insert `status='approved'` dari sesi user ditolak `42501 permission denied`.

3. **Match bisa dialihkan ke orang lain**
   - UPDATE pada `matches` dibatasi ke kolom `unmatched_by`.
   - Uji: mengganti `user_b` dari sesi user ditolak `42501 permission denied`.

4. **Pesan setelah match ditutup/kedaluwarsa**
   - `can_access_match` sekarang mensyaratkan `unmatched_by is null` dan `expires_at` belum lewat.
   - Artinya histori chat tidak bisa dibaca atau dikirimi pesan setelah match berakhir.

5. **Open redirect**
   - `next` pada login Google dan halaman login hanya menerima path satu slash; `//domain-lain` ditolak.
   - URL notifikasi admin juga menolak `//domain-lain`.

6. **Verifikasi wajah**
   - Route sekarang mewajibkan selfie gambar, bukan hanya deskriptor angka.
   - Uji end-to-end kamera: badge `approved` tersimpan.
   - Uji wajah duplikat: akun kedua ditolak.

## Hasil uji

| Uji | Hasil |
| --- | --- |
| User biasa akses `/admin` | Halaman menolak, bukan data admin |
| User biasa akses API analytics | `403` |
| User biasa akses broadcast push | `403` |
| Tanpa sesi akses `/admin` | `307` ke `/admin/login` |
| Logout admin | Mendarat di `/admin/login?bye=1` |
| Escalation role | Ditolak |
| Insert verifikasi approved | Ditolak |
| Reassign match | Ditolak |
| Verifikasi wajah end-to-end | Lulus |
| Wajah duplikat | Ditolak |

## Risiko yang masih ada

- **Liveness verifikasi wajah berjalan di browser.** Server memeriksa deskriptor, selfie, dan duplikat, tetapi tidak bisa membuktikan tantangan gerak benar-benar dilakukan. Untuk keamanan tingkat tinggi, verifikasi sebaiknya masuk review admin.
- **Foto profil ada di bucket publik.** Siapa pun yang tahu URL bisa membuka foto. Kalau privasi foto ingin lebih ketat, bucket harus privat dan URL harus ditandatangani.
- **IP analitik bergantung pada header proxy.** Di Vercel header diisi platform; kalau pindah hosting, pastikan hanya proxy tepercaya yang boleh mengisi `x-forwarded-for`.
- **Rate limit berbasis memori tidak dipakai.** Endpoint push mengandalkan pengecekan data swipe; spam klik berulang masih mungkin. Tambahkan rate limit berbasis database/edge kalau trafik naik.
