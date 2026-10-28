# Blush TikTok Account Kit

Semua aset di folder ini siap dipakai. Video utama 9:16, 1080x1920, 30 fps, 37,0 detik, audio -13,8 LUFS, H.264 + AAC, faststart.

## 1. Profil

| Field | Isi |
|---|---|
| Nama tampilan | `Blush Indonesia` |
| Username pilihan | `@blush.id` (cek ketersediaan), `@blushapp.id`, `@blushindonesia`, `@bukablush` |
| Bio (78 karakter) | `Buka webnya, ketemu orangnya. Dating app orang Indonesia. Mulai gratis.` |
| Link | `https://blush.xinet.id` |
| Foto profil | `avatar-1080.png` |
| Kategori akun | Aplikasi / Teknologi |

Foto profil: latar merah cherry, tanda `b` krem, tanpa teks kecil. Tetap terbaca setelah TikTok mengecilkannya ke lingkaran 100 px. Jangan tambah tulisan atau badge di foto profil.

Username dicek langsung di aplikasi TikTok saat mendaftar. Nama tampilan bisa diganti kapan saja, username hanya sekali.

## 2. Video yang sudah jadi

- `blush-iklan-9x16.mp4` — iklan utama 37,0 detik dengan motion graphics: hook ribet, tiga masalah, STOP, brand, browser, nol download, akun satu menit, foto/bio, BOOM match, chat, gratis, tagline, URL, end card.
- `cover-9x16.jpg` — cover unggahan, hook `Buka webnya, ketemu orangnya.`
- `voiceover-raw.wav` — voice over final tanpa musik (37,0 detik), dari `iklan blush 1.3.mp3` milik user, tidak diubah nadanya.
- `vo_v14_preview.mp3` — preview voice over terbaru untuk cek cepat di HP.

Naskah voice over (mengikuti audio user, 13 kalimat):

1. `Cari gebetan kok ribet banget?` (0,0–1,9)
2. `Harus download aplikasi, daftar panjang, belum tentu cocok lagi.` (2,3–6,2)
3. `Stop! Kenalan sama Blush.` (7,4–9,7)
4. `Dating platform buat kamu yang mau cari koneksi baru, langsung dari browser.` (10,2–14,5)
5. `Tanpa download aplikasi.` (14,9–16,1)
6. `Bikin akun? Cukup isi yang penting dalam satu menit.` (16,4–19,3)
7. `Lihat foto, baca bio, temukan yang menarik.` (19,5–22,4)
8. `Kalau sama-sama suka? BOOM! Langsung bisa chat.` (22,6–25,9)
9. `Mulai gratis, cari koneksi yang cocok buat kamu.` (26,2–28,9)
10. `Blush! Buka webnya, ketemu orangnya.` (28,9–31,8)
11. `Langsung kunjungi blush.xinet.id.` (32,0–34,5)
12. `Your next connection starts here.` (34,8–36,6)

Visual: 14 scene mengikuti kalimat di atas (`scratch/ad/ad.html`, `CFG.scenes` = 0 / 2,05 / 6,55 / 8,35 / 10,10 / 14,70 / 16,25 / 19,20 / 22,40 / 24,70 / 25,95 / 28,90 / 31,95 / 34,80, `end` 36,99). Semua gerak dihitung dari `seek(t)` supaya frame dan suara tidak meleset.

Tidak ada angka harga di video. Voice over hanya menjual manfaat: cepat, tanpa download, gratis untuk mulai.

Audio: VO user dipakai apa adanya (tidak ada TTS baru, tidak ada tempo-stretch). Olahan akhir high-pass 95 Hz, potong mud 300 Hz, presence 3,2 kHz, de-ess 7,2 kHz, kompresor 2,5:1, lalu loudnorm -14 LUFS. Musik `music.wav` (dibuat dengan Python, bebas royalti) di-loop ke 37 detik dan di-ducking 6:1 di bawah VO.

## 3. Caption unggahan utama

```
Masalahnya bukan kamu. Aplikasinya yang bikin capek.

Blush bisa dibuka langsung dari browser. Tanpa download, tanpa ribet.
Foto asli, bio jelas, jawaban jujur. Saling suka, obrolan langsung jalan.

Mulai gratis, langsung dari browser. Link di bio.

#datingapp #datingindonesia #kenalan #blush #genzindonesia
```

## 4. Rencana 6 konten pertama

| # | Format | Hook | Tujuan |
|---|---|---|---|
| 1 | Iklan 30 detik | `Masalahnya bukan kamu.` | Perkenalan brand |
| 2 | Skit POV | `POV: chat 24 jam kamu tinggal 10 menit.` | Jelaskan aturan chat |
| 3 | Screen record | `Cara dapat centang biru di Blush.` | Edukasi verifikasi |
| 4 | Perbandingan harga | `Aplikasi luar Rp129 ribu. Blush Rp29 ribu.` | Nilai paket |
| 5 | Tips profil | `3 kalimat bio yang bikin orang balas.` | Engagement |
| 6 | UGC / tangkapan layar | `Chat pertama yang bikin aku buka Blush tiap hari.` | Social proof |

Posting 3–4 kali seminggu, jam 19.00–22.00 WIB. Semua video vertikal, teks aman di 320 px bawah dan 250 px atas. Jangan taruh teks penting di rail kanan karena tombol TikTok menutupinya.

## 5. Catatan produksi

- Foto profil di video: Pexels, atribusi di `docs/photo-credits.md`.
- Profil di video adalah profil demo, bukan pengguna nyata.
- Verifikasi ditampilkan sebagai penanda profil yang sudah dicek, tanpa menyebut opsional dan tanpa klaim semua pengguna sudah diverifikasi.
- Tidak memakai aset, logo, atau trade dress Bumble.
- Semua harga di layar diambil dari `src/lib/plans.ts`: Plus Rp29.000, Gold Rp59.000 per bulan. Voice over tidak menyebut angka apa pun.
