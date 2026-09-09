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

export default function SorotanPromo() {
  return (
    /* Geseran mendatar dengan snap, bukan pemutar otomatis. Dua alasan: tidak
       butuh JavaScript sama sekali, dan orang yang sedang membaca satu kartu
       tidak direbut oleh kartu berikutnya. Kartu di sebelahnya sengaja
       mengintip sedikit — itu yang memberi tahu bahwa ia bisa digeser. */
    <div
      className="geser-x -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      aria-label="Kenapa Cari Ruang"
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
  );
}
