import Link from "next/link";
import { House } from "lucide-react";

/**
 * Kaki halaman.
 *
 * Dua kalimat di bawah bukan basa-basi hukum: keduanya keputusan produk yang
 * dikunci di CLAUDE.md, dan ditulis di setiap halaman supaya tidak ada yang
 * sampai ke tahap bayar dengan anggapan barangnya diasuransikan.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
                <House className="h-4.5 w-4.5" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight">Ruang</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Marketplace ruang antarwarga. Siapa pun yang punya ruang kosong bisa
              menyewakannya; siapa pun yang butuh tempat bisa menyewanya.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:gap-x-16">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Menyewa
              </p>
              <Link href="/cari" className="block text-ink hover:text-brand">
                Cari ruang
              </Link>
              <Link href="/permintaan" className="block text-ink hover:text-brand">
                Titipkan permintaan
              </Link>
              <Link href="/pemesanan" className="block text-ink hover:text-brand">
                Pemesanan saya
              </Link>
              <Link href="/pesan" className="block text-ink hover:text-brand">
                Pesan
              </Link>
              <Link href="/profil" className="block text-ink hover:text-brand">
                Profil
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Menyewakan
              </p>
              <Link href="/host" className="block text-ink hover:text-brand">
                Dasbor host
              </Link>
              <Link href="/host/ruang/baru" className="block text-ink hover:text-brand">
                Daftarkan ruang
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-8 space-y-1.5 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>
            Alamat lengkap sebuah ruang dibuka bertahap: kelurahan dan jarak persis
            untuk semua orang, alamat setelah pembayaran, nomor kontak setelah itu.
          </p>
          <p>
            Ruang disewakan langsung oleh pemiliknya. Platform menengahi kalau ada
            sengketa, tapi tidak memberi ganti rugi — tidak ada asuransi barang.
          </p>
          <p className="pt-2">Pembayaran belum aktif; menunggu payment gateway berlisensi.</p>
        </div>
      </div>
    </footer>
  );
}
