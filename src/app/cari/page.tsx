import { redirect, permanentRedirect } from "next/navigation";

/**
 * `/cari` digabung ke `/` pada 18 September 2026.
 *
 * Rutenya TIDAK dihapus begitu saja, dan itu penting: alamat ini sudah tersebar
 * di luar kendali kita. Ia ada di peta situs yang sudah dikirim ke mesin
 * pencari, di pintasan PWA yang sudah terpasang di layar utama orang, dan di
 * tautan yang sudah pernah dibagikan. Menghapusnya berarti semua itu mendarat
 * di 404.
 *
 * **Parameternya ikut dibawa.** Tautan seperti
 * `/cari?usaha=makanan&radius=5` adalah hasil pencarian yang sudah disaring
 * seseorang, dan mengantarkannya ke halaman depan tanpa penyaringnya sama saja
 * dengan membuangnya. Halaman utama membaca parameter yang sama persis.
 *
 * `permanentRedirect` (308) supaya mesin pencari memindahkan peringkat yang
 * sudah terkumpul ke alamat barunya, bukan menyimpan dua alamat untuk satu
 * halaman. Yang berparameter dibiarkan 307: kombinasinya tak terbatas dan
 * tidak ada gunanya diingat selamanya.
 */
export default async function CariPindah({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kueri = new URLSearchParams();
  for (const [kunci, nilai] of Object.entries(params)) {
    if (typeof nilai === "string") kueri.set(kunci, nilai);
    else if (Array.isArray(nilai) && nilai[0]) kueri.set(kunci, nilai[0]);
  }

  const teks = kueri.toString();
  if (teks) redirect(`/?${teks}`);
  permanentRedirect("/");
}
