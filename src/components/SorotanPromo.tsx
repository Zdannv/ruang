import Image from "next/image";

/**
 * Sorotan di halaman depan: kartu yang menjelaskan aplikasinya.
 *
 * Menggantikan `KolaseSorotan`, yang menumpuk foto ruang sungguhan dari
 * database. Aturan tampilan di CLAUDE.md dulu berbunyi "yang berwarna besar
 * hanya foto ruang sungguhan, bukan gambar hiasan" — dan itu benar saat isinya
 * masih 14 ruang berfoto. Setelah seed dibuang, kolasenya menampilkan NOL
 * gambar: komponennya memang mengembalikan `null` kalau tidak ada foto, jadi
 * bagian terbesar halaman depan kosong sama sekali.
 *
 * Kartu ini juga bukan gambar hiasan. Keempatnya menyatakan hal yang
 * benar-benar berlaku di aplikasi — lihat `skrip/buat-promo.py`, dan perhatikan
 * kalimat yang sengaja TIDAK dipakai di sana.
 *
 * SVG, bukan raster: keempatnya cuma bidang warna dan teks, jadi 3 KB
 * masing-masing. Ia muncul di setiap kunjungan halaman depan, jadi ia gambar
 * yang paling sering diunduh di seluruh aplikasi.
 */
const KARTU = [
  { berkas: "01-jadi-cuan", alt: "Lahan nganggur jadi cuan — halaman depan disewakan bulanan" },
  { berkas: "02-tanpa-beli-tanah", alt: "Nggak perlu beli tanah — sewa lahannya saja per bulan" },
  { berkas: "03-apa-adanya", alt: "Kondisi lahan ditulis apa adanya, termasuk yang jelek" },
  { berkas: "04-alamat-bertahap", alt: "Alamat kebuka bertahap: kelurahan, lalu alamat, lalu kontak" },
];

export default function SorotanPromo() {
  return (
    /* Geseran mendatar dengan snap, bukan pemutar otomatis. Dua alasan:
       tidak butuh JavaScript sama sekali, dan orang yang sedang membaca satu
       kartu tidak direbut oleh kartu berikutnya. Kartu di sebelahnya sengaja
       mengintip sedikit — itu yang memberi tahu bahwa ia bisa digeser. */
    <div
      className="geser-x -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      aria-label="Kenapa Ruang"
    >
      {KARTU.map((k) => (
        <div key={k.berkas} className="w-[94%] shrink-0 snap-center sm:w-[96%] lg:w-full">
          <Image
            src={`/promo/${k.berkas}.svg`}
            alt={k.alt}
            width={880}
            height={660}
            /* SVG tidak perlu — dan tidak boleh — lewat pengubah ukuran:
               ia sudah bebas resolusi, dan mengoptimalkannya berarti membayar
               per gambar untuk memperkecil berkas 3 KB. */
            unoptimized
            priority={k.berkas === KARTU[0].berkas}
            className="h-auto w-full rounded-3xl"
          />
        </div>
      ))}
    </div>
  );
}
