import { NextResponse } from "next/server";
import { klienServer } from "@/lib/supabase/server";
import { kolomBelumAda } from "@/lib/galat";
import { siteUrl } from "@/lib/supabase/env";

/**
 * Titik awal pencarian dari wilayah yang orangnya sebut saat mendaftar.
 *
 * `profil.kota` adalah nama, sedangkan `ruang_terdekat()` butuh lintang dan
 * bujur. Jembatannya di sini: nama wilayahnya digeokode SEKALI, hasilnya
 * disimpan ke `profil.lat`/`lng`, dan panggilan berikutnya menjawab dari
 * database tanpa menyentuh jaringan luar sama sekali.
 *
 * Kenapa rute ini tidak menerima parameter apa pun: wilayah yang digeokode
 * selalu diambil dari profil pemanggilnya sendiri. Kalau ia menerima
 * `?q=`, ia jadi geocoder terbuka atas nama server kita — dan Nominatim
 * membatasi pemakaian per IP, jadi penyalahgunaannya akan memblokir seluruh
 * pengguna aplikasi ini, bukan penyalahgunanya.
 *
 * Yang dikirim ke Nominatim adalah nama wilayah administratif — "Ketawanggede,
 * Lowokwaru, Kota Malang" — bukan alamat rumah siapa pun. Alamat asli ruang
 * TIDAK BOLEH pernah dikirim ke geocoder mana pun; seluruh aturan penyamaran
 * alamat di CLAUDE.md akan sia-sia kalau koordinat aslinya bocor lewat
 * permintaan pihak ketiga.
 */

const SEBULAN = 60 * 60 * 24 * 30;

type Profil = {
  id: string;
  kota: string | null;
  kecamatan: string | null;
  kelurahan: string | null;
  lat: number | null;
  lng: number | null;
};

/** Jawaban "tidak tahu". Klien menjatuhkan diri ke titik bawaan. */
const tidakTahu = () => NextResponse.json({ titik: null });

export async function GET() {
  const db = await klienServer();

  const { data: sesi } = await db.auth.getUser();
  if (!sesi.user) return NextResponse.json({ titik: null }, { status: 401 });

  const { data, error } = await db
    .from("profil")
    .select("id, kota, kecamatan, kelurahan, lat, lng")
    .eq("user_id", sesi.user.id)
    .maybeSingle();

  // Setiap kegagalan di sini berakhir sama: "tidak tahu", dan pencarian
  // memakai titik bawaan. Kolomnya sendiri baru ada sejak
  // 16_wilayah_profil.sql, jadi jawaban 42703 memang wajar sampai migrasinya
  // dijalankan — dan mematikan pencarian karena penyempurnaan yang belum siap
  // adalah pertukaran yang salah arah.
  if (error) {
    if (!kolomBelumAda(error)) console.error("titik-saya:", error.message);
    return tidakTahu();
  }

  const profil = data as Profil | null;
  if (!profil) return tidakTahu();

  if (profil.lat != null && profil.lng != null) {
    return NextResponse.json({
      titik: { lat: profil.lat, lng: profil.lng, nama: namaWilayah(profil) },
    });
  }

  const titik = await geokode(profil);
  if (!titik) return tidakTahu();

  // Disimpan supaya tidak pernah dihitung dua kali. Kegagalan menyimpan tidak
  // menggagalkan jawabannya — yang hilang cuma penghematan lain kali.
  await db.from("profil").update({ lat: titik.lat, lng: titik.lng }).eq("id", profil.id);

  return NextResponse.json({ titik: { ...titik, nama: namaWilayah(profil) } });
}

function namaWilayah(p: Profil): string {
  return p.kelurahan ?? p.kecamatan ?? p.kota ?? "wilayahmu";
}

async function geokode(p: Profil): Promise<{ lat: number; lng: number } | null> {
  // Dari yang paling sempit ke yang paling luas. Kelurahan memberi titik yang
  // benar-benar berguna; kota saja masih jauh lebih baik daripada titik
  // bawaan yang menganggap semua orang ada di Malang.
  const bagian = [p.kelurahan, p.kecamatan, p.kota].filter(Boolean) as string[];
  if (bagian.length === 0) return null;

  for (let i = 0; i < bagian.length; i += 1) {
    const q = bagian.slice(i).join(", ");
    const titik = await cariSatu(q);
    if (titik) return titik;
  }
  return null;
}

async function cariSatu(q: string): Promise<{ lat: number; lng: number } | null> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=id&q=" +
    encodeURIComponent(q);
  try {
    const jawab = await fetch(url, {
      headers: {
        // Nominatim mewajibkan pemakainya bisa dikenali, dan memblokir yang
        // tidak. Alamat aplikasinya dipakai sebagai kontak.
        "user-agent": `Ruang/1.0 (+${siteUrl("/")})`,
        accept: "application/json",
      },
      // Jawabannya untuk satu wilayah administratif tidak berubah; disimpan
      // sebulan supaya Nominatim praktis cuma dipanggil sekali per wilayah.
      next: { revalidate: SEBULAN },
    });
    if (!jawab.ok) return null;

    const isi = (await jawab.json()) as { lat?: string; lon?: string }[];
    const pertama = isi[0];
    if (!pertama?.lat || !pertama?.lon) return null;

    const lat = Number(pertama.lat);
    const lng = Number(pertama.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
