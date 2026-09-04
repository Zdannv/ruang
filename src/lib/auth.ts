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

  const { data: profil } = await db
    .from("profil")
    .select("id, nama, telepon, kota, foto_url, terverifikasi")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    profil: (profil as ProfilSaya | null) ?? null,
  };
});
