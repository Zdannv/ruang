import Link from "next/link";
import Lambang from "@/components/Lambang";

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
              <Lambang className="h-8 w-8 text-brand" />
              <span className="font-display text-xl font-bold tracking-tight">Ada Tempat</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              <strong className="text-ink">Sewa tempat usaha jadi gampang.</strong> Punya
              halaman depan yang cuma jadi tempat parkir motor tamu? Sewakan bulanan.
              Butuh tempat jualan di pinggir jalan? Sewa dari tetangga sendiri.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-6 text-sm sm:grid-cols-3 sm:gap-x-12">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Menyewa
              </p>
              <Link href="/" className="block text-ink hover:text-brand">
                Cari lahan
              </Link>
              <Link href="/permintaan" className="block text-ink hover:text-brand">
                Titipkan permintaan
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
                Dasbor pemilik
              </Link>
              <Link href="/host/lahan/baru" className="block text-ink hover:text-brand">
                Sewakan lahan
              </Link>
            </div>
            {/* Ketentuan sengaja di kaki, bukan di navigasi utama: yang
                mencarinya tahu di mana biasanya ia berada, dan yang tidak
                mencarinya tidak perlu dihalangi olehnya. */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Ketentuan
              </p>
              <Link href="/syarat" className="block text-ink hover:text-brand">
                Syarat pemakaian
              </Link>
              <Link href="/privasi" className="block text-ink hover:text-brand">
                Kebijakan privasi
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-8 space-y-1.5 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>
            Alamat dan peta lahan tampil di listing kalau pemiliknya membukanya.
            Yang tidak membukanya cuma menampilkan kelurahan dan titik peta yang
            digeser sekitar 200 m. Nomor pemiliknya bisa dilihat yang punya akun.
          </p>
          <p>
            Ada Tempat mempertemukan pemilik lahan dengan pedagang. Sewanya
            disepakati langsung di antara kalian berdua: aplikasi ini tidak ikut
            memegang uang, tidak menengahi, dan tidak memberi ganti rugi. Lihat
            dulu lahannya sebelum menyerahkan uang apa pun.
          </p>
        </div>
      </div>
    </footer>
  );
}
