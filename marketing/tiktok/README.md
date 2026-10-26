# Blush TikTok Account Kit

Semua aset di folder ini siap dipakai. Video utama 9:16, 1080x1920, 30 fps, 34,0 detik, audio -14 LUFS, H.264 + AAC, faststart.

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

- `blush-iklan-9x16.mp4` — iklan utama 34,0 detik: hook, masalah, solusi web tanpa download, bukti profil, penawaran, CTA.
- `cover-9x16.jpg` — cover unggahan, hook `Buka webnya, ketemu orangnya.`
- `voiceover-raw.wav` — voice over final tanpa musik (34,0 detik), sudah di-loudnorm.
- `vo_v11_preview.mp3` — preview voice over untuk cek cepat di HP.

Naskah voice over (7 segmen, tiap kalimat dikunci ke scene-nya):

1. `Cari pasangan mulai terasa melelahkan? Mungkin bukan kamu yang salah.` (0,0–5,5)
2. `Geser ratusan foto, tapi obrolan tak pernah jalan.` (5,5–9,9)
3. `Blush beda. Langsung dari browser, tanpa download.` (9,9–14,4)
4. `Foto asli, bio jelas, jawaban jujur. Saling suka, langsung ngobrol.` (14,4–21,2)
5. `Profil yang sudah dicek, dapat centang biru.` (21,2–24,7)
6. `Mulai gratis. Fitur lengkap kapan pun kamu siap.` (24,7–28,9)
7. `Buka Blush sekarang. Bisa jadi, orangnya sedang menunggu.` (28,9–33,9)

Harga tidak diucapkan di voice over karena sudah tertera di kartu scene 6. Voice over hanya menjual manfaat.

Voice: edge-tts (lisensi MIT, gratis) voice `id-ID-GadisNeural`, rate dan pitch dibedakan per kalimat supaya prosodi tidak datar. Hasil TTS dipangkas heningnya, difade 12–20 ms di tiap ujung, lalu diolah high-pass 95 Hz, potong mud 300 Hz, presence 3,2 kHz, de-ess 7,2 kHz, kompresor 2,5:1. Musik dibuat khusus dengan Python, bebas royalti, di-ducking 6:1 di bawah voice over.

## 3. Caption unggahan utama

```
Masalahnya bukan kamu. Aplikasinya yang bikin capek.

Blush bisa dibuka langsung dari browser. Tanpa download, tanpa ribet.
Foto asli, bio jelas, jawaban jujur. Saling suka, obrolan langsung jalan.

Mulai gratis. Link di bio.

#datingapp #datingindonesia #kenalan #blush #genzindonesia
```

## 4. Rencana 6 konten pertama

| # | Format | Hook | Tujuan |
|---|---|---|---|
| 1 | Iklan 35 detik | `Masalahnya bukan kamu.` | Perkenalan brand |
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
