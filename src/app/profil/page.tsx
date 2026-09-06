import Link from "next/link";
import { Bell, ChevronRight, LogOut, MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import FormProfil from "./FormProfil";
import PasangAplikasi from "@/components/PasangAplikasi";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { jumlahBelumDibaca } from "@/lib/notifikasi";
import { pesanBelumDibaca } from "@/lib/percakapan";

export const metadata: Metadata = { title: "Profil — Ruang" };

type UsahaProfil = { nama_usaha: string | null; npwp: string | null };
type WilayahProfil = { kelurahan: string | null; kecamatan: string | null };

export default async function HalamanProfil() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/masuk?lanjut=/profil");

  const db = await klienServer();
  const [belumDibaca, pesanBaru] = await Promise.all([
    jumlahBelumDibaca(db),
    pesanBelumDibaca(db),
  ]);
  const { data } = await db
    .from("profil")
    .select("id, nama, kota, telepon, terverifikasi, bergabung")
    .eq("id", sesi.profil?.id ?? "")
    .maybeSingle();

  // Diambil terpisah dari select di atas, dan galatnya ditelan: kedua kolom ini
  // baru ada sejak 13_umkm.sql. Kalau digabung, database yang belum dijalankan
  // migrasinya membuat SELURUH halaman akun gagal — termasuk tombol keluar,
  // yang di HP cuma ada di sini.
  const { data: usaha } = await db
    .from("profil")
    .select("nama_usaha, npwp")
    .eq("id", sesi.profil?.id ?? "")
    .maybeSingle();

  // Select ketiga, dengan alasan yang sama seperti kolom usaha di atas:
  // `kelurahan` dan `kecamatan` baru ada sejak 16_wilayah_profil.sql, dan
  // menggabungkannya membuat database yang belum dijalankan migrasinya
  // menjatuhkan seluruh halaman akun. Dipisah dari kueri usaha karena
  // migrasinya berbeda — yang satu belum ada tidak berarti yang lain juga.
  const { data: wilayah } = await db
    .from("profil")
    .select("kelurahan, kecamatan")
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
        Akun
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Nama dan kotamu terlihat oleh pihak lain di pemesanan dan ulasan.
      </p>

      {/* Notifikasi dijangkau dari sini juga, bukan cuma dari lonceng di
          header — lonceng itu disembunyikan di layar kecil. */}
      <Link
        href="/notifikasi"
        className="naik naik-hover mt-6 flex items-center gap-3 rounded-2xl border border-line bg-card p-4"
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
          <Bell className="h-5 w-5" />
          {belumDibaca > 0 && (
            <span className="angka absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
              {belumDibaca > 9 ? "9+" : belumDibaca}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Notifikasi</span>
          <span className="block text-xs text-muted">
            {belumDibaca > 0
              ? `${belumDibaca} belum dibaca`
              : "Permintaan sewa, jawaban host, jadwal kunjungan"}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </Link>

      <Link
        href="/pesan"
        className="naik naik-hover mt-2 flex items-center gap-3 rounded-2xl border border-line bg-card p-4"
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
          <MessageCircle className="h-5 w-5" />
          {pesanBaru > 0 && (
            <span className="angka absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
              {pesanBaru > 9 ? "9+" : pesanBaru}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Pesan</span>
          <span className="block text-xs text-muted">
            {pesanBaru > 0
              ? `${pesanBaru} pesan belum dibaca`
              : "Tanya-jawab dengan host atau penyewa"}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </Link>

      <div className="mt-5">
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
          wilayah={
            wilayah
              ? {
                  kelurahan: (wilayah as WilayahProfil).kelurahan ?? "",
                  kecamatan: (wilayah as WilayahProfil).kecamatan ?? "",
                  kota: profil.kota,
                }
              : null
          }
          usaha={
            usaha
              ? {
                  namaUsaha: (usaha as UsahaProfil).nama_usaha ?? "",
                  npwp: (usaha as UsahaProfil).npwp ?? "",
                }
              : null
          }
        />
      </div>

      <div className="mt-5 space-y-5">
        <PasangAplikasi />

        {/* Satu-satunya tombol keluar yang terjangkau dari HP: yang di header
            ikut tersembunyi bersama nama pengguna di layar kecil. */}
        <form action="/keluar" method="post">
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-paper hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            Keluar akun
          </button>
        </form>
      </div>
    </div>
  );
}
