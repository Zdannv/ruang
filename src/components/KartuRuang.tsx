import Image from "next/image";
import Link from "next/link";
import { MapPin, TriangleAlert } from "lucide-react";
import { IKON_TIPE } from "@/components/IkonTipe";
import { sudahDiperkecil, type RuangDenganFoto } from "@/lib/ruang";
import {
  LABEL_AKSES,
  LABEL_BANJIR,
  LABEL_TIPE,
  banjirPerluPerhatian,
  jarak,
  luas,
  pakaiLuas,
  rupiah,
  volume,
} from "@/lib/label";

/**
 * Satu ruang di daftar hasil.
 *
 * Dirancang untuk layar HP lebih dulu, dan itu keputusan: daftar ini akan
 * dibuka dari jalan, satu tangan, sambil melihat-lihat. Di lebar telepon
 * kartunya tampil DUA KOLOM — versi satu kolom sebelumnya cuma memuat satu
 * setengah ruang per layar, dan menelusuri sepuluh pilihan jadi terasa seperti
 * pekerjaan.
 *
 * Urutan bacanya juga dibalik: harga lebih dulu, judul sesudahnya. Di
 * marketplace, harga yang menentukan apakah sebuah kartu layak dibuka, dan
 * judul cuma menjelaskan yang harganya sudah lolos.
 *
 * Ukuran mengikuti tipenya — luas untuk lahan terbuka, volume untuk ruang
 * tertutup. Lihat `pakaiLuas()`.
 *
 * Yang ditampilkan berhenti di kecamatan; alamat lengkap baru terbuka nanti.
 * Jaraknya tetap persis, karena itu yang paling menentukan saat memilih.
 */
export default function KartuRuang({
  ruang,
  tanpaJarak = false,
}: {
  ruang: RuangDenganFoto;
  /**
   * Sembunyikan jaraknya. Dipakai halaman depan, yang tidak tahu di mana
   * pengunjungnya — dan "0 m" adalah angka yang SALAH, bukan angka yang
   * kosong.
   */
  tanpaJarak?: boolean;
}) {
  const Ikon = IKON_TIPE[ruang.tipe];
  const banjirWaspada = banjirPerluPerhatian(ruang.riwayat_banjir);

  // `luas_m2` nol berarti migrasi 17 belum dijalankan di database ini.
  const ukuran =
    pakaiLuas(ruang.tipe) && ruang.luas_m2 > 0
      ? luas(ruang.luas_m2)
      : volume(ruang.volume_m3);

  return (
    <Link
      href={`/ruang/${ruang.id}`}
      className="naik naik-hover group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
        {ruang.foto ? (
          <Image
            src={ruang.foto}
            alt={`Foto ${ruang.judul}`}
            fill
            /* Dua kolom di HP: kartunya sekitar setengah lebar layar. */
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 50vw"
            unoptimized={sudahDiperkecil(ruang.foto)}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-muted">
            Belum ada foto
          </div>
        )}

        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[11px] font-semibold text-ink shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs">
          <Ikon className="h-3 w-3 text-brand sm:h-3.5 sm:w-3.5" />
          {LABEL_TIPE[ruang.tipe]}
        </span>

        {/* Riwayat banjir naik ke atas foto: di pinggir jalan Sidoarjo ia
            pertanyaan pertama orang, bukan detail teknis, dan di kartu dua
            kolom tidak ada ruang untuk sebaris lencana di bawah.

            Ditaruh di BAWAH, bukan di kanan atas. Versi pertama memakai
            `right-2 top-2` dan di lebar 166px ia menimpa lencana tipe sampai
            "Halaman depan" terbaca "Hala…" — ketahuan saat kartunya dilihat
            di layar 375px, bukan dari membaca kodenya. */}
        {banjirWaspada && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-warn px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm sm:bottom-3 sm:left-3 sm:px-2.5 sm:py-1">
            <TriangleAlert className="h-3 w-3" />
            Pernah banjir
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        {/* Harga lebih dulu — lihat komentar komponen. */}
        <p className="angka text-base font-bold leading-none text-ink sm:text-lg">
          {rupiah(ruang.harga_bulanan)}
          <span className="text-xs font-medium text-muted">/bln</span>
        </p>

        <h3 className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ink sm:text-[15px]">
          {ruang.judul}
        </h3>

        <p className="angka mt-1.5 flex items-center gap-1 text-[11px] text-muted sm:text-xs">
          <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">
            {tanpaJarak
              ? `${ruang.kecamatan}, ${ruang.kota}`
              : `${ruang.kecamatan} · ${jarak(ruang.jarak_km)}`}
          </span>
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5 text-[11px]">
          <span className="angka rounded-full bg-paper px-2 py-0.5 font-semibold text-ink">
            {ukuran}
          </span>
          {/* Akses masuk cuma muat dari sm ke atas, dan di sana ia memang
              lebih berguna: yang memilih dari laptop biasanya sedang
              membandingkan, bukan menelusuri. */}
          <span className="hidden rounded-full bg-brand-soft px-2 py-0.5 font-medium text-brand-dark sm:inline">
            {LABEL_AKSES[ruang.akses_masuk]}
          </span>
          {!banjirWaspada && (
            <span className="hidden rounded-full bg-good-soft px-2 py-0.5 font-medium text-good sm:inline">
              {LABEL_BANJIR[ruang.riwayat_banjir]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
