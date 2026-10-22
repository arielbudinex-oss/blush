import Link from "next/link";
import { Wordmark } from "@/components/Logo";

export const metadata = { title: "Syarat pemakaian · Blush" };

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
      <header className="flex items-center justify-between gap-3 border-b border-line pb-4">
        <Link href="/"><Wordmark size="md" /></Link>
        <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">Kembali</Link>
      </header>

      <h1 className="mt-6 text-3xl font-bold tracking-[-0.02em]">Syarat pemakaian</h1>
      <p className="mt-2 text-sm text-ink-soft">Terakhir diperbarui 22 Oktober 2026.</p>

      <div className="mt-6 flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="text-lg font-bold text-ink">Umur minimum 18 tahun</h2>
          <p className="mt-2">Dengan membuat akun, kamu menyatakan berusia 18 tahun atau lebih. Akun yang melanggar akan dinonaktifkan.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Satu akun, satu orang</h2>
          <p className="mt-2">
            Jangan membuat akun untuk orang lain atau memakai foto orang lain tanpa izin. Verifikasi wajah memastikan satu
            wajah hanya terdaftar di satu akun.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Perilaku yang dilarang</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>Melecehkan, mengancam, atau menyebarkan kebencian.</li>
            <li>Mengirim spam, promosi, atau tautan penipuan.</li>
            <li>Meminta uang atau data keuangan ke pengguna lain.</li>
            <li>Menampilkan ketelanjangan atau konten seksual eksplisit.</li>
            <li>Mengambil data pengguna lain secara otomatis.</li>
          </ul>
          <p className="mt-2">Pelanggaran bisa berujung pada penghapusan akun tanpa pemberitahuan sebelumnya.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Pembayaran</h2>
          <p className="mt-2">
            Paket Blush Plus dan Gold dibayar lewat QRIS. Paket aktif setelah pembayaran dikonfirmasi. Harga yang tertera
            dalam rupiah dan berlaku untuk periode yang dipilih. Karena layanan digital langsung aktif, pembayaran yang
            sudah dikonfirmasi tidak dapat dikembalikan, kecuali diwajibkan hukum.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Isi yang kamu unggah</h2>
          <p className="mt-2">
            Kamu tetap pemilik foto dan teks yang kamu unggah. Dengan mengunggah, kamu memberi Blush izin menampilkannya di
            dalam aplikasi untuk keperluan profil dan pencocokan.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Layanan apa adanya</h2>
          <p className="mt-2">
            Kami berusaha menjaga layanan tetap berjalan, tetapi tidak menjamin aplikasi bebas gangguan. Blush tidak
            menjamin kamu akan mendapat match atau hubungan tertentu.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Berhenti memakai</h2>
          <p className="mt-2">
            Kamu bisa keluar kapan saja dari halaman Pengaturan. Untuk menghapus akun beserta datanya, gunakan tombol Hapus
            akun di halaman yang sama.
          </p>
        </section>
      </div>

      <p className="mt-8 border-t border-line pt-4 text-xs text-ink-soft">
        Lihat juga <Link href="/privasi" className="font-semibold text-ink underline underline-offset-2">kebijakan privasi</Link>.
      </p>
    </main>
  );
}
