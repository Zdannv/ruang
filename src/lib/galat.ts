/**
 * Mengenali galat yang punya penjelasan berguna untuk ditampilkan.
 *
 * Migrasi database di proyek ini dijalankan tangan lewat SQL editor Supabase,
 * terpisah dari deploy aplikasinya. Artinya keadaan "kode sudah tayang, tabelnya
 * belum ada" bukan kasus tepi — ia pasti terjadi lagi. Yang tidak boleh terjadi
 * adalah layar 500 kosong yang tidak memberi tahu apa pun, karena dari situ
 * tidak ada yang bisa ditindaklanjuti siapa pun.
 */

/**
 * Benar kalau galatnya berarti tabel atau view-nya belum ada.
 *
 * PostgREST menjawab `PGRST205` dengan pesan "Could not find the table ... in
 * the schema cache"; Postgres sendiri memakai `42P01` "relation does not
 * exist". Dua-duanya diperiksa karena keduanya bisa muncul tergantung apakah
 * yang gagal kuerinya atau pemanggilan fungsinya.
 */
export function tabelBelumAda(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const g = e as { code?: string; message?: string };
  if (g.code === "PGRST205" || g.code === "PGRST202" || g.code === "42P01") return true;
  const pesan = (g.message ?? "").toLowerCase();
  return (
    pesan.includes("could not find the table") ||
    pesan.includes("could not find the function") ||
    pesan.includes("does not exist")
  );
}
