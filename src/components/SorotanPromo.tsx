"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Sorotan di halaman depan.
 *
 * Menggantikan `KolaseSorotan`, yang menumpuk foto lahan sungguhan dari
 * database — dan setelah data contoh dibuang, menampilkan NOL gambar, karena
 * komponennya memang mengembalikan `null` kalau tidak ada foto. Bagian
 * terbesar halaman depan kosong tanpa ada yang menyadarinya.
 *
 * Isinya dua ilustrasi, menggantikan empat kartu SVG yang dihasilkan skrip
 * (9 September 2026). Kartu SVG itu terlalu datar untuk halaman utama; dua
 * pesan yang hilang bersamanya — rubrik jujur dan alamat bertahap — sudah
 * dinyatakan sebagai teks HTML di bagian "Yang kamu dapat", jadi tidak ada
 * keterangan yang benar-benar lenyap.
 *
 * Berkas sumbernya di `desain/sorotan/`, dan yang disajikan hasil
 * `skrip/pasang-sorotan.mjs`: 1948 KB JPEG → 93 KB WebP, rasio kedua gambar
 * diseragamkan supaya tinggi kartunya tidak berbeda. Jangan menaruh JPEG
 * aslinya langsung ke `public/` — gambar ini diunduh di SETIAP kunjungan
 * halaman depan.
 *
 * Yang PERTAMA memuat slogan utama, dan itu bukan kebetulan urutan berkas:
 * di layar telepon cuma satu kartu yang terlihat sebelum digeser.
 */
const KARTU = [
  {
    berkas: "sorotan-1",
    alt: "Halaman depan nganggur? Jadikan cuan — disewakan bulanan ke pedagang di sekitarmu, Rp 600 ribu per bulan",
  },
  {
    berkas: "sorotan-2",
    alt: "Sewa, bukan beli — punya lahan sendiri ratusan juta, sewa 2 × 3 meter di depan rumah orang ratusan ribu per bulan",
  },
];

/** Jeda geser otomatis, dan jeda yang lebih panjang setelah digeser tangan. */
const JEDA_OTOMATIS = 5_000;
const JEDA_SETELAH_TANGAN = 10_000;

/**
 * Dua isyarat manual berturut-turut dalam rentang ini dihitung satu.
 *
 * Satu geseran jari menghasilkan puluhan event `scroll`. Tanpa peredam ini,
 * tiap satu di antaranya memicu render ulang — dan yang didapat cuma
 * penundaan yang sama, dihitung ulang puluhan kali.
 */
const PEREDAM_MS = 400;

/** Kira-kira selama ini geseran halus berlangsung; sesudahnya dianggap usai. */
const LAMA_GESER_MS = 800;

export default function SorotanPromo() {
  const wadah = useRef<HTMLDivElement>(null);
  /** Menandai geseran yang KITA jalankan, supaya tidak terbaca sebagai manual. */
  const otomatis = useRef(false);
  const manualTerakhir = useRef(0);

  const [aktif, setAktif] = useState(0);
  const [jeda, setJeda] = useState(JEDA_OTOMATIS);
  /**
   * Dinaikkan tiap isyarat manual, semata untuk memaksa penghitung waktunya
   * mulai lagi dari nol.
   *
   * `aktif` dan `jeda` saja tidak cukup: orang yang menggeser sedikit lalu
   * melepasnya kembali ke kartu yang sama tidak mengubah keduanya, jadi
   * efeknya tidak berjalan ulang dan kartunya tetap berpindah beberapa ratus
   * milidetik kemudian — persis di tangan orang yang baru saja menyentuhnya.
   */
  const [tik, setTik] = useState(0);

  const geserKe = useCallback((i: number) => {
    const el = wadah.current;
    const anak = el?.children[i] as HTMLElement | undefined;
    if (!el || !anak) return;

    /*
      Menggeser WADAHNYA, bukan `scrollIntoView`. Yang terakhir boleh ikut
      menggeser halamannya kalau sorotannya sedang di luar layar — dan
      pemutar otomatis berjalan terus, jadi akibatnya halaman melompat
      sendiri saat orangnya sedang membaca bagian lain.
    */
    const kiri =
      el.scrollLeft +
      anak.getBoundingClientRect().left -
      el.getBoundingClientRect().left;

    otomatis.current = true;
    el.scrollTo({
      left: kiri - (el.clientWidth - anak.clientWidth) / 2,
      behavior: "smooth",
    });
    window.setTimeout(() => {
      otomatis.current = false;
    }, LAMA_GESER_MS);
  }, []);

  const tunda = useCallback(() => {
    const sekarang = Date.now();
    if (sekarang - manualTerakhir.current < PEREDAM_MS) return;
    manualTerakhir.current = sekarang;
    setJeda(JEDA_SETELAH_TANGAN);
    setTik((t) => t + 1);
  }, []);

  // Kartu mana yang sedang di tengah, dan apakah yang menggesernya orang.
  useEffect(() => {
    const el = wadah.current;
    if (!el) return;

    /*
      Dihitung langsung di penanganan event, TANPA diredam
      `requestAnimationFrame`.

      Versi pertama memakai rAF dengan penanda "sudah dijadwalkan", dan itu
      jebakan yang sama bentuknya dengan `useRef` sekali-jalan di
      `PencarianRuang`: **rAF tidak pernah berjalan di tab yang tersembunyi**.
      Kalau orangnya berpindah tab tepat saat kartunya sedang bergeser,
      penandanya tertinggal menyala selamanya — dan sekembalinya ia, titik
      penunjuknya berhenti mengikuti kartu, tanpa galat apa pun. Ketahuan saat
      pemutarnya diuji di tab yang memang tersembunyi.

      Yang dihemat rAF di sini juga hampir nol: kartunya dua, dan peramban
      sudah menggabungkan event scroll per frame sendiri.
    */
    const dengar = () => {
      if (!otomatis.current) tunda();
      const kotak = el.getBoundingClientRect();
      const pusat = kotak.left + kotak.width / 2;
      let dekat = 0;
      let jarak = Infinity;
      Array.from(el.children).forEach((c, i) => {
        const k = c.getBoundingClientRect();
        const d = Math.abs(k.left + k.width / 2 - pusat);
        if (d < jarak) {
          jarak = d;
          dekat = i;
        }
      });
      setAktif(dekat);
    };

    el.addEventListener("scroll", dengar, { passive: true });
    return () => el.removeEventListener("scroll", dengar);
  }, [tunda]);

  // Berhenti selama tabnya tidak dilihat, lalu mulai lagi dari nol.
  useEffect(() => {
    const bangun = () => {
      if (!document.hidden) setTik((t) => t + 1);
    };
    document.addEventListener("visibilitychange", bangun);
    return () => document.removeEventListener("visibilitychange", bangun);
  }, []);

  // Geser otomatis.
  useEffect(() => {
    if (KARTU.length < 2) return;
    /*
      Dibaca di sini, bukan disimpan di state: menyimpannya berarti satu
      `setState` di dalam efek, dan yang didapat cuma tanggapan terhadap orang
      yang mengubah setelan sistemnya di tengah kunjungan.

      Kalau ia minta gerak dikurangi, pemutar otomatisnya MATI sepenuhnya —
      bukan diperlambat. Titik-titik penunjuknya tetap ada, jadi kartunya
      tetap bisa dipindah sendiri.
    */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /*
      Tab yang tidak dilihat tidak digeser. Bukan penghematan: geseran halus
      TIDAK beranimasi di tab tersembunyi, jadi kartunya melompat — dan orang
      yang kembali setelah sepuluh menit mendarat di kartu acak, bukan di
      kartu yang ia tinggalkan. Efek ini berjalan lagi lewat `visibilitychange`
      di atas.
    */
    if (document.hidden) return;

    const id = window.setTimeout(
      () => geserKe((aktif + 1) % KARTU.length),
      jeda
    );
    return () => window.clearTimeout(id);
  }, [aktif, jeda, tik, geserKe]);

  return (
    <div>
      {/* Geseran mendatar dengan snap. Kartu di sebelahnya sengaja mengintip
          sedikit di layar telepon — itu isyarat pertama bahwa ia bisa
          digeser. Di laptop kartunya selebar penuh dan tidak ada yang
          mengintip, dan di sanalah titik penunjuk di bawah menjadi
          satu-satunya yang memberi tahu bahwa masih ada kartu berikutnya. */}
      <div
        ref={wadah}
        className="geser-x -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        aria-label="Kenapa Cari Ruang"
        onPointerDown={tunda}
        onKeyDown={tunda}
      >
        {KARTU.map((k, i) => (
          <div key={k.berkas} className="w-[94%] shrink-0 snap-center sm:w-[96%] lg:w-full">
            <Image
              src={`/promo/${k.berkas}.webp`}
              alt={k.alt}
              width={1400}
              height={915}
              /* Sengaja TIDAK `unoptimized`, berbeda dari kartu SVG sebelumnya
                 dan dari foto kartu hasil pencarian. Berkasnya 1400px sementara
                 slot terlebarnya sekitar 700px di laptop dan 352px di telepon —
                 menyerahkannya ke pengubah ukuran menghemat sekitar dua pertiga
                 di HP, dan HP-lah sasaran utamanya. Untuk SVG penghematannya nol
                 (ia bebas resolusi); untuk yang ini nyata. */
              sizes="(min-width: 1024px) 700px, 94vw"
              priority={i === 0}
              className="h-auto w-full rounded-3xl"
            />
          </div>
        ))}
      </div>

      {/* Tombolnya jauh lebih besar daripada titiknya: sasaran sentuh 8px
          hampir tidak bisa dikenai jempol, dan titik yang lebih tebal dari
          ini terbaca sebagai kendali yang berat untuk dua kartu. */}
      <div className="mt-3 flex items-center justify-center gap-1">
        {KARTU.map((k, i) => (
          <button
            key={k.berkas}
            type="button"
            onClick={() => {
              tunda();
              geserKe(i);
            }}
            aria-label={`Lihat sorotan ${i + 1} dari ${KARTU.length}`}
            aria-current={i === aktif}
            className="cursor-pointer p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span
              className={`block h-2 rounded-full transition-all duration-300 ${
                i === aktif ? "w-7 bg-brand" : "w-2 bg-line"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
