import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import FormProfil from "./FormProfil";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profil — Ruang" };

export default async function HalamanProfil() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/masuk?lanjut=/profil");

  const db = await klienServer();
  const { data } = await db
    .from("profil")
    .select("id, nama, kota, telepon, terverifikasi, bergabung")
    .eq("id", sesi.profil?.id ?? "")
    .maybeSingle();

  const profil = data as {
    id: string;
    nama: string;
    kota: string;
    telepon: string | null;
    terverifikasi: boolean;
    bergabung: string;
  } | null;

  // Baris profil dibuat trigger saat mendaftar. Kalau tidak ada, triggernya
  // belum terpasang di database yang dipakai — katakan apa adanya alih-alih
  // menampilkan formulir yang setiap simpanannya akan gagal.
  if (!profil) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Profilmu belum terbentuk
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Baris profil dibuat otomatis oleh trigger <code>handle_new_user</code> saat
          mendaftar. Kalau kamu melihat layar ini, migrasi <code>03_auth_rls.sql</code>
          kemungkinan belum dijalankan di database yang sedang dipakai.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
        >
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Profil
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Nama dan kotamu terlihat oleh pihak lain di pemesanan dan ulasan.
      </p>

      <div className="mt-6">
        <FormProfil
          profilId={profil.id}
          email={sesi.email}
          bergabung={profil.bergabung}
          terverifikasi={profil.terverifikasi}
          awal={{
            nama: profil.nama,
            kota: profil.kota,
            telepon: profil.telepon ?? "",
          }}
        />
      </div>
    </div>
  );
}
