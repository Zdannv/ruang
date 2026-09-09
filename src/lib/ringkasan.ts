/**
 * Angka-angka untuk landing page.
 *
 * Semuanya dari view publik, jadi halaman depan tidak butuh sesi dan bisa
 * dibuka siapa pun. Kalau salah satu kueri gagal, yang dikembalikan nol —
 * beranda tetap tampil, cuma tanpa angkanya. Halaman depan yang kosong karena
 * satu kueri gagal jauh lebih buruk daripada halaman depan tanpa statistik.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { fotoPertama, type RuangDenganFoto } from "@/lib/ruang";

export type RingkasanPasar = {
  jumlahRuang: number;
  jumlahKecamatan: number;
  hargaTermurah: number | null;
  /** Total permintaan ruang yang belum terlayani, dari `permintaan_kecamatan`. */
  jumlahPencari: number;
  kecamatanTeratas: { kecamatan: string; kota: string; jumlah: number }[];
};

export async function getRingkasanPasar(db: SupabaseClient): Promise<RingkasanPasar> {
  const kosong: RingkasanPasar = {
    jumlahRuang: 0,
    jumlahKecamatan: 0,
    hargaTermurah: null,
    jumlahPencari: 0,
    kecamatanTeratas: [],
  };

  try {
    const [ruang, permintaan] = await Promise.all([
      db.from("ruang_publik").select("kecamatan, kota, harga_bulanan"),
      db.from("permintaan_kecamatan").select("kota, kecamatan, jumlah"),
    ]);
    if (ruang.error || permintaan.error) return kosong;

    const baris = (ruang.data ?? []) as { kecamatan: string; harga_bulanan: number }[];
    const minta = (permintaan.data ?? []) as {
      kota: string;
      kecamatan: string;
      jumlah: number;
    }[];

    return {
      jumlahRuang: baris.length,
      jumlahKecamatan: new Set(baris.map((r) => r.kecamatan)).size,
      hargaTermurah:
        baris.length > 0 ? Math.min(...baris.map((r) => r.harga_bulanan)) : null,
      jumlahPencari: minta.reduce((t, m) => t + m.jumlah, 0),
      kecamatanTeratas: [...minta].sort((a, b) => b.jumlah - a.jumlah).slice(0, 4),
    };
  } catch {
    return kosong;
  }
}

/*
  `ruangSorotan()` dan `KolaseSorotan` dibuang 8 September 2026; sorotannya
  sekarang dua ilustrasi (lihat `SorotanPromo`).

  `ruangContoh()` di bawah bukan pengembaliannya. Yang dulu itu menumpuk foto
  jadi hero; yang ini menampilkan KARTU LISTING utuh di tengah halaman depan,
  supaya pengunjung tahu bentuk isinya sebelum menekan apa pun.
*/

/**
 * Beberapa lahan tayang untuk dipamerkan di halaman depan.
 *
 * Diambil acak, dan itu memang keputusan sementara: nanti pilihannya dikelola
 * dari CMS lewat kolom `unggulan`. Sampai itu ada, acak lebih baik daripada
 * "terbaru" — dengan lima belas lahan pertama, "terbaru" berarti halaman
 * depan menampilkan tiga lahan yang sama sepanjang minggu.
 *
 * Diacaknya di sini, bukan di database: PostgREST tidak punya `order by
 * random()`, dan menambah fungsi RPC demi ini berarti satu migrasi untuk
 * sesuatu yang akan diganti CMS.
 *
 * Tanpa `jarak_km`, karena halaman depan tidak tahu di mana pengunjungnya —
 * lihat prop `tanpaJarak` di `KartuRuang`. Menampilkan "0 m" akan jadi angka
 * yang salah, bukan angka yang kosong.
 */
export async function ruangContoh(
  db: SupabaseClient,
  jumlah = 4
): Promise<RuangDenganFoto[]> {
  try {
    const { data, error } = await db
      .from("ruang_publik")
      .select(
        "id, judul, tipe, kecamatan, kota, lat_publik, lng_publik, " +
          "luas_m2, volume_m3, harga_bulanan, akses_masuk, riwayat_banjir, " +
          "penguncian, kategori_diterima"
      )
      .order("dibuat_pada", { ascending: false })
      // Ambil sekumpulan dulu, baru diacak — supaya yang tampil tidak selalu
      // lahan terlama di database.
      .limit(24);
    if (error || !data || data.length === 0) return [];

    const acak = [...(data as unknown as Omit<RuangDenganFoto, "foto" | "jarak_km">[])];
    for (let i = acak.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [acak[i], acak[j]] = [acak[j], acak[i]];
    }
    const dipilih = acak.slice(0, jumlah);

    const foto = await fotoPertama(db, dipilih.map((r) => r.id));
    return dipilih.map((r) => ({
      ...r,
      luas_m2: r.luas_m2 ?? 0,
      kategori_diterima: r.kategori_diterima ?? [],
      jarak_km: 0,
      foto: foto.get(r.id) ?? null,
    })) as RuangDenganFoto[];
  } catch {
    return [];
  }
}
export type UlasanSorotan = {
  id: string;
  skor: number;
  akurasi: number | null;
  komentar: string;
  penulis_nama: string;
  penulis_foto_url: string | null;
};

/**
 * Ulasan penyewa untuk dipamerkan di halaman depan.
 *
 * Hanya yang PUNYA KOMENTAR — bintang tanpa kalimat tidak menambah apa pun di
 * bagian yang gunanya menunjukkan pengalaman orang.
 *
 * Arahnya `untuk_host` saja: yang berguna di halaman depan adalah penilaian
 * penyewa terhadap lahan dan pemiliknya, bukan penilaian pemilik terhadap
 * penyewa.
 *
 * Akan mengembalikan array kosong untuk waktu yang cukup lama, dan itu bukan
 * kegagalan: `boleh_ulas()` mensyaratkan pemesanan yang SUDAH DIBAYAR, dan
 * alur pembayaran belum bisa dilewati. Pemanggilnya wajib menangani keadaan
 * kosong dengan jujur — jangan pernah mengisinya dengan ulasan karangan.
 */
export async function ulasanSorotan(
  db: SupabaseClient,
  jumlah = 6
): Promise<{ daftar: UlasanSorotan[]; rata: number | null; jumlahTotal: number }> {
  try {
    const { data, error, count } = await db
      .from("ulasan_publik")
      .select("id, skor, akurasi, komentar, penulis_nama, penulis_foto_url", {
        count: "exact",
      })
      .eq("arah", "untuk_host")
      .not("komentar", "is", null)
      .order("pada", { ascending: false })
      .limit(jumlah);
    if (error || !data || data.length === 0) {
      return { daftar: [], rata: null, jumlahTotal: 0 };
    }

    const daftar = data as unknown as UlasanSorotan[];
    const rata =
      daftar.reduce((t, u) => t + u.skor, 0) / daftar.length;
    return { daftar, rata, jumlahTotal: count ?? daftar.length };
  } catch {
    return { daftar: [], rata: null, jumlahTotal: 0 };
  }
}
