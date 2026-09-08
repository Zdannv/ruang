/**
 * Lambang Ruang: kanopi warung di atas garis lahan.
 *
 * Digambar inline, bukan diambil dari `public/ikon.svg`, supaya lambang di
 * header tidak menambah satu permintaan jaringan sendiri — ia muncul di setiap
 * halaman, termasuk yang paling ingin cepat.
 *
 * Geometrinya sama di TIGA tempat: berkas ini, `public/ikon.svg`, dan
 * `skrip/buat-ikon.mjs` yang menghitung ikon PWA per piksel. Kalau salah satu
 * diubah, ubah ketiganya — kalau tidak, lambang di aplikasi dan ikon di layar
 * utama jadi dua bentuk yang berbeda.
 */
export default function Lambang({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <rect width="64" height="64" rx="14.1" fill="currentColor" />
      <path
        fill="#fff"
        d="M19.8 16 H44.2 L51 30.3
           A6.33 4.85 0 0 1 38.33 30.3
           A6.33 4.85 0 0 1 25.67 30.3
           A6.33 4.85 0 0 1 13 30.3 Z"
      />
      <rect x="10.9" y="43" width="42.2" height="3.8" fill="#fff" />
    </svg>
  );
}
