import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";

/**
 * Nomor pemilik lahan di halaman detail.
 *
 * **Hanya untuk yang sudah masuk**, dan gerbangnya ada di database:
 * `kontak_lahan()` menolak pemanggil tanpa `auth.uid()`. Komponen ini cuma
 * memilih apa yang ditampilkan — kalau nomornya null, yang tampil ajakan
 * masuk, bukan kotak kosong.
 *
 * Alasannya bukan basa-basi privasi. Nomor di view publik berarti seluruh
 * nomor pemilik lahan bisa dipanen satu permintaan tanpa akun, dan nomor yang
 * dipanen begitu berakhir di daftar telemarketing. Menuntut akun tidak
 * menghentikan yang benar-benar niat, tapi ia mengubah "satu permintaan" jadi
 * "buat akun dulu".
 *
 * Nomornya TIDAK disamarkan jadi "0812****". Di papan iklan, nomor itu justru
 * alasan orang membuka halamannya.
 */
export default function KontakPemilik({
  ruangId,
  nama,
  telepon,
}: {
  ruangId: string;
  nama: string;
  /** Null berarti pemanggilnya belum masuk. */
  telepon: string | null;
}) {
  if (!telepon) {
    return (
      <div className="mt-4 border-t border-line pt-4">
        <p className="text-xs leading-relaxed text-muted">
          Nomor {nama} cuma bisa dilihat yang sudah punya akun. Gratis, dan
          sekalian dipakai buat chat.
        </p>
        <Link
          href={`/masuk?lanjut=/ruang/${ruangId}`}
          className="mt-3 block w-full rounded-full bg-card px-5 py-2.5 text-center text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
        >
          Masuk untuk lihat nomornya
        </Link>
      </div>
    );
  }

  /*
    `wa.me` menuntut format internasional tanpa tanda baca. Nomor di profil
    diketik orangnya sendiri, jadi ia bisa datang sebagai "0812-3456-7890",
    "+62 812...", atau "62812...". Ketiganya dinormalkan di sini; kalau
    hasilnya tidak masuk akal, tombol WhatsApp-nya tidak dipasang sama sekali
    daripada mengantar orang ke percakapan kosong dengan nomor salah.
  */
  const angka = telepon.replace(/[^\d]/g, "");
  const wa = angka.startsWith("0")
    ? `62${angka.slice(1)}`
    : angka.startsWith("62")
      ? angka
      : null;

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-xs text-muted">Hubungi langsung</p>
      <a
        href={`tel:${telepon}`}
        className="angka mt-1 flex items-center gap-2 text-lg font-bold text-ink hover:text-brand"
      >
        <Phone className="h-4 w-4 shrink-0 text-brand" />
        {telepon}
      </a>
      {wa && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-good px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      )}
    </div>
  );
}
