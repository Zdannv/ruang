import { ExternalLink, MapPin } from "lucide-react";

/**
 * Peta lokasi lahan, dengan tautan keluar ke Google Maps.
 *
 * **OpenStreetMap, bukan Google Maps, untuk petanya.** Embed Google butuh
 * kunci Maps Embed API beserta akun penagihannya, dan varian tanpa kunci
 * (`output=embed`) di luar ketentuannya. OSM tidak butuh kunci, tidak
 * menagih, dan tidak memasang cookie ke pengunjung kita. Yang dibutuhkan
 * orang dari Google — rute berkendara — tetap didapat lewat tombol di bawah
 * petanya, dan di situ ia memang pergi ke Google atas kemauannya sendiri.
 *
 * `loading="lazy"`: peta ini ada di bawah lipatan, dan iframe yang dimuat
 * duluan menahan render halaman untuk sesuatu yang belum tentu dilihat.
 *
 * Titik yang diplot SELALU `peta_lat`/`peta_lng` dari `ruang_publik`, tidak
 * pernah kolom `lat`/`lng` mentah. Yang menentukan isinya database (lihat
 * migrasi 21): titik asli kalau pemiliknya membuka alamat, pin yang digeser
 * 200 m kalau tidak. Jangan pernah menggantinya dengan koordinat dari sumber
 * lain — seluruh aturan penyamaran alamat bergantung pada satu jalur ini.
 */
export default function PetaLahan({
  lat,
  lng,
  judul,
  persis,
}: {
  lat: number;
  lng: number;
  judul: string;
  /** Titiknya persis, bukan pin yang digeser. Mengubah keterangan di bawah peta. */
  persis: boolean;
}) {
  // Kotak sekitar 400 m; cukup untuk mengenali blok jalannya tanpa membuat
  // pin geseran terlihat seperti alamat persis.
  const d = 0.002;
  const kotak = [lng - d, lat - d, lng + d, lat + d].join("%2C");
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${kotak}&layer=mapnik&marker=${lat}%2C${lng}`;
  const google = `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-line">
      <iframe
        src={osm}
        title={`Peta lokasi ${judul}`}
        loading="lazy"
        className="block h-56 w-full border-0 sm:h-72"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {persis
            ? "Titik persis dari pemiliknya."
            : "Pin digeser sekitar 200 m. Alamat persisnya ditanyakan lewat chat."}
        </p>
        <a
          href={google}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Buka di Google Maps
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
