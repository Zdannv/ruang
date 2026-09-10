import { cache } from "react";
import { klienServer } from "@/lib/supabase/server";
import { supabaseSiap } from "@/lib/supabase/env";

export type ProfilSaya = {
  id: string;
  nama: string;
  telepon: string | null;
  kota: string;
  foto_url: string | null;
  terverifikasi: boolean;
  /** Petugas aplikasi. Migrasi 20; false di database yang belum menjalankannya. */
  admin: boolean;
};

export type Sesi = {
  userId: string;
  email: string | null;
  profil: ProfilSaya | null;
};

/**
 * Siapa yang sedang masuk, dilihat dari server.
 *
 * Dibungkus `cache` karena satu request memanggilnya beberapa kali — layout
 * untuk bilah navigasi, header untuk nama, dan halamannya sendiri untuk
 * penjagaan. Tanpa itu, satu pemuatan halaman berarti tiga verifikasi token dan
 * tiga kueri profil. Cakupannya per request, jadi sesi orang tidak pernah
 * terbawa ke request berikutnya.
 *
 * Memakai `getUser()`, bukan `getSession()`. `getSession()` membaca cookie apa
 * adanya tanpa memverifikasi tanda tangannya — cukup untuk menghias tampilan,
 * tapi tidak boleh dipakai memutuskan siapa yang berhak melihat apa.
 *
 * `profil` bisa `null` sesaat setelah pendaftaran: barisnya dibuat oleh
 * trigger `handle_new_user`, dan kalau trigger itu belum terpasang di database
 * yang dipakai, layar harus tetap jalan alih-alih rusak.
 */
export const sesiSaya = cache(async (): Promise<Sesi | null> => {
  if (!supabaseSiap) return null;

  const db = await klienServer();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return null;

  const ambil = (kolom: string) =>
    db.from("profil").select(kolom).eq("user_id", data.user.id).maybeSingle();

  let { data: profil, error: galatProfil } = await ambil(
    "id, nama, telepon, kota, foto_url, terverifikasi, admin"
  );

  /*
    `admin` baru ada sejak 20_verifikasi.sql, dan database yang belum
    menjalankannya menjawab 42703. Mundurnya WAJIB: tanpa ini profilnya
    terbaca null, dan semua orang yang sudah masuk melihat header "Masuk /
    Daftar" — seluruh aplikasi tampak keluar sendiri. Migrasi di proyek ini
    dijalankan tangan, terpisah dari deploy, jadi keadaan "kode sudah tayang,
    kolomnya belum ada" pasti terjadi.
  */
  if (galatProfil?.code === "42703") {
    ({ data: profil, error: galatProfil } = await ambil(
      "id, nama, telepon, kota, foto_url, terverifikasi"
    ));
  }

  const baris = (profil as unknown as ProfilSaya | null) ?? null;
  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    profil: baris && { ...baris, admin: baris.admin ?? false },
  };
});
