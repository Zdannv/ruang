/**
 * Daftar wilayah administratif, diambil lewat `/api/wilayah`.
 *
 * Nama wilayah tidak cuma tampilan: ia disimpan ke `ruang.kelurahan`,
 * `ruang.kecamatan`, dan `ruang.kota`, lalu dikelompokkan sebagai teks oleh
 * `permintaan_kecamatan()` dan facet pencarian. Selama host mengetiknya
 * sendiri, "Lowokwaru", "lowokwaru", dan "Kec. Lowokwaru" adalah tiga wilayah
 * berbeda menurut database — dan tidak ada satu pun layar yang bisa
 * menyadarinya.
 */

export type Wilayah = { kode: string; nama: string };

export type Tingkat = "provinsi" | "kabupaten" | "kecamatan" | "kelurahan";

/** Melempar kalau daftarnya tidak bisa diambil; pemanggilnya harus menangani. */
export async function ambilWilayah(
  tingkat: Tingkat,
  kode?: string
): Promise<Wilayah[]> {
  const q = new URLSearchParams({ tingkat });
  if (kode) q.set("kode", kode);

  const jawab = await fetch(`/api/wilayah?${q}`);
  if (!jawab.ok) throw new Error("Daftar wilayah tidak bisa diambil.");

  const isi = (await jawab.json()) as { daftar?: Wilayah[] };
  return isi.daftar ?? [];
}
