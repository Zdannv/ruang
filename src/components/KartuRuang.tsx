import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, TriangleAlert } from "lucide-react";
import { IKON_TIPE } from "@/components/IkonTipe";
import { sudahDiperkecil, type RuangDenganFoto } from "@/lib/ruang";
import {
  LABEL_AKSES,
  LABEL_BANJIR,
  LABEL_LISTRIK_PENDEK,
  LABEL_TIPE,
  banjirPerluPerhatian,
  jarak,
  lebarMuka,
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
  const terbuka = pakaiLuas(ruang.tipe);

  // `luas_m2` nol berarti migrasi 17 belum dijalankan di database ini.
  const ukuran =
    terbuka && ruang.luas_m2 > 0 ? luas(ruang.luas_m2) : volume(ruang.volume_m3);

  /*
    Lencana kedua mengikuti tipenya.

    Untuk lahan terbuka, "Muat mobil pikap" bukan yang sedang dicari orangnya —
    ia mencari berapa meter yang menghadap jalan dan ada colokan atau tidak.
    Keduanya baru ada sejak migrasi 19, jadi lencananya hilang sendiri di
    database yang belum menjalankannya, bukan menampilkan "muka null m".
  */
  // `?? lebar_m`: sejak 10 Sep 2026 lebar muka jalan tidak ditanyakan
  // terpisah — untuk lahan terbuka ia SISI YANG MENGHADAP JALAN, yaitu
  // `lebar_m`. Kolom lamanya tetap dibaca lebih dulu untuk lahan yang
  // sempat mengisinya sendiri.
  const muka = terbuka ? lebarMuka(ruang.lebar_muka_m ?? ruang.lebar_m, true) : null;
  const listrik =
    terbuka && ruang.listrik ? (LABEL_LISTRIK_PENDEK[ruang.listrik] ?? null) : null;

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

        {/* Lencana verifikasi di kanan atas — sisi berlawanan dari lencana
            tipe, karena keduanya bisa muncul bersamaan dan di kartu selebar
            166px tidak ada ruang untuk berdampingan. Ikon saja tanpa teks di
            layar telepon, dengan alasan yang sama. */}
        {ruang.tempat_terverifikasi && (
          <span
            title="Petugas sudah datang dan mencocokkan keterangannya"
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-good px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm sm:right-3 sm:top-3 sm:px-2.5 sm:py-1"
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Terverifikasi</span>
          </span>
        )}

        {/* Riwayat banjir naik ke atas foto: di pinggir jalan Sidoarjo ia
            pertanyaan pertama orang, bukan detail teknis, dan di kartu dua
            kolom tidak ada ruang untuk sebaris lencana di bawah.

            Ditaruh di BAWAH, bukan di kanan atas. Versi pertama memakai
            `right-2 top-2` dan di lebar 166px ia menimpa lencana tipe sampai
            "Halaman depan" terbaca "Hala…", ketahuan saat kartunya dilihat
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
          {/* Lebar muka jalan ikut tampil di HP — untuk pedagang ia sama
              menentukannya dengan harga, jadi ia tidak boleh cuma muncul di
              laptop seperti lencana-lencana di bawahnya. */}
          {muka && (
            <span className="angka rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand-dark">
              {muka}
            </span>
          )}
          {/* Sisanya cuma muat dari sm ke atas, dan di sana ia memang lebih
              berguna: yang memilih dari laptop biasanya sedang membandingkan,
              bukan menelusuri. */}
          {terbuka ? (
            listrik && (
              <span className="hidden rounded-full bg-paper px-2 py-0.5 font-medium text-ink sm:inline">
                {listrik}
              </span>
            )
          ) : (
            <span className="hidden rounded-full bg-brand-soft px-2 py-0.5 font-medium text-brand-dark sm:inline">
              {LABEL_AKSES[ruang.akses_masuk]}
            </span>
          )}
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
