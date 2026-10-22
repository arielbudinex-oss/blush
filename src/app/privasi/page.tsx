import Link from "next/link";
import { Wordmark } from "@/components/Logo";

export const metadata = {
  title: "Kebijakan privasi",
  description: "Cara Blush menyimpan dan memakai data akun, profil, lokasi, verifikasi wajah, dan analitik kunjungan.",
  alternates: { canonical: "/privasi" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
      <header className="flex items-center justify-between gap-3 border-b border-line pb-4">
        <Link href="/"><Wordmark size="md" /></Link>
        <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">Kembali</Link>
      </header>

      <h1 className="mt-6 text-3xl font-bold tracking-[-0.02em]">Kebijakan privasi</h1>
      <p className="mt-2 text-sm text-ink-soft">Terakhir diperbarui 22 Oktober 2026. Berlaku untuk aplikasi Blush di blush.xinet.id.</p>

      <div className="mt-6 flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="text-lg font-bold text-ink">Data yang kami simpan</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>Akun: alamat email, dan nama serta foto profil kalau kamu masuk lewat Google.</li>
            <li>Profil: nama panggilan, tanggal lahir, gender, kota, bio, pekerjaan, minat, dan jawaban prompt.</li>
            <li>Foto profil yang kamu unggah, maksimal enam foto.</li>
            <li>Lokasi perkiraan dari izin browser, dipakai untuk menghitung jarak.</li>
            <li>Data verifikasi wajah berupa angka ciri wajah, bukan foto atau video.</li>
            <li>Pesan chat, like, match, blokir, dan laporan yang kamu kirim.</li>
            <li>Riwayat pembayaran paket: nominal, status, dan tanggal. Data kartu tidak pernah masuk ke server kami.</li>
            <li>Analitik kunjungan: halaman yang dibuka, tautan yang diklik, jenis perangkat dan browser, serta IP yang disamarkan dan di-hash untuk menghitung pengunjung.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Kenapa data itu dipakai</h2>
          <p className="mt-2">
            Untuk menampilkan kandidat yang sesuai preferensi, menghitung jarak, membuka chat setelah saling suka,
            menjalankan verifikasi wajah, memproses pembayaran, dan menangani laporan penyalahgunaan.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Yang tidak kami lakukan</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>Tidak menjual data pribadi ke pihak ketiga.</li>
            <li>Tidak menampilkan koordinat lokasi ke pengguna lain. Yang terlihat hanya perkiraan jarak.</li>
            <li>Tidak menampilkan foto verifikasi wajah di profil, deck, maupun ke pengguna lain.</li>
            <li>Tidak mengirim pesan promosi di luar pemberitahuan produk yang kamu pakai.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Siapa yang bisa melihat</h2>
          <p className="mt-2">
            Profil dan foto yang kamu isi bisa dilihat pengguna lain yang memenuhi preferensimu. Email, lokasi presisi,
            dan data verifikasi tidak pernah ikut ditampilkan. Akses database dibatasi aturan per baris sehingga satu akun
            hanya bisa membaca data miliknya sendiri, kecuali data publik profil.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Penyimpanan dan penghapusan</h2>
          <p className="mt-2">
            Data disimpan selama akun aktif. Kamu bisa mengubah profil kapan saja di halaman Profil. Untuk menghapus akun
            beserta foto dan pesan, gunakan tombol Hapus akun di halaman Pengaturan. Penghapusan berjalan langsung dan
            tidak bisa dibatalkan.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Keamanan</h2>
          <p className="mt-2">
            Koneksi memakai HTTPS. Kunci layanan yang sensitif hanya ada di server. Verifikasi wajah dijalankan di browser;
            yang dikirim ke server hanya angka ciri wajah untuk mencegah satu wajah dipakai di banyak akun.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Anak di bawah umur</h2>
          <p className="mt-2">
            Blush hanya untuk pengguna berusia 18 tahun ke atas. Tanggal lahir dipakai untuk menyaring kandidat. Akun yang
            terbukti di bawah umur akan dinonaktifkan.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Hubungi kami</h2>
          <p className="mt-2">
            Pertanyaan soal data bisa dikirim lewat menu Pengaturan setelah masuk, atau ke alamat email yang terdaftar di
            akunmu. Kami menjawab paling lambat tujuh hari kerja.
          </p>
        </section>
      </div>

      <p className="mt-8 border-t border-line pt-4 text-xs text-ink-soft">
        Lihat juga <Link href="/syarat" className="font-semibold text-ink underline underline-offset-2">syarat pemakaian</Link>.
      </p>
    </main>
  );
}
