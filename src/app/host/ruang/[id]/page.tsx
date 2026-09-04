import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import FormRuang from "@/components/host/FormRuang";
import KelolaFoto from "@/components/host/KelolaFoto";
import KelolaJendela from "@/components/host/KelolaJendela";
import LencanaStatus from "@/components/LencanaStatus";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { daftarFoto, getRuangSaya, type IsiRuang } from "@/lib/host";
import { daftarJendela } from "@/lib/jendela";

export const metadata: Metadata = { title: "Kelola ruang — Ruang" };

export default async function KelolaRuang({ params }: PageProps<"/host/ruang/[id]">) {
  const { id } = await params;
  const sesi = await sesiSaya();
  if (!sesi) redirect(`/masuk?lanjut=/host/ruang/${id}`);
  if (!sesi.profil) redirect("/host");

  const db = await klienServer();
  const [ruang, foto, jendela] = await Promise.all([
    getRuangSaya(db, id),
    daftarFoto(db, id),
    daftarJendela(db, id),
  ]);
  // `null` berarti ruangnya tidak ada ATAU bukan milik pemanggil — RLS
  // menyaringnya lebih dulu. Dua-duanya dijawab 404 yang sama.
  if (!ruang) notFound();

  // `RuangSaya` memuat kolom hasil hitungan (luas, volume, jumlah foto) yang
  // tidak boleh ikut dikirim balik saat menyimpan.
  const isi: IsiRuang = {
    judul: ruang.judul,
    tipe: ruang.tipe,
    kepemilikan: ruang.kepemilikan,
    alamat: ruang.alamat,
    patokan: ruang.patokan ?? "",
    kelurahan: ruang.kelurahan,
    kecamatan: ruang.kecamatan,
    kota: ruang.kota,
    lat: ruang.lat,
    lng: ruang.lng,
    terbuka_alamat: ruang.terbuka_alamat,
    panjang_m: ruang.panjang_m,
    lebar_m: ruang.lebar_m,
    tinggi_m: ruang.tinggi_m,
    akses_masuk: ruang.akses_masuk,
    posisi_lantai: ruang.posisi_lantai,
    lebar_pintu_cm: ruang.lebar_pintu_cm,
    jarak_parkir: ruang.jarak_parkir,
    kondisi_bangunan: ruang.kondisi_bangunan,
    kelembapan: ruang.kelembapan,
    riwayat_banjir: ruang.riwayat_banjir,
    tinggi_lantai_cm: ruang.tinggi_lantai_cm,
    penguncian: ruang.penguncian,
    berbagi: ruang.berbagi,
    pengawasan: ruang.pengawasan,
    fasilitas: ruang.fasilitas,
    kategori_diterima: ruang.kategori_diterima,
    kuota_akses_bulanan: ruang.kuota_akses_bulanan,
    durasi_min_hari: ruang.durasi_min_hari,
    harga_bulanan: ruang.harga_bulanan,
    deposit: ruang.deposit,
    status: ruang.status,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/host"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Dasbor host
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <LencanaStatus status={ruang.status} />
            {ruang.sedang_terpakai > 0 && (
              <span className="text-xs text-muted">sedang tersewa</span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {ruang.judul}
          </h1>
        </div>
        {ruang.status === "tayang" && (
          <Link
            href={`/ruang/${ruang.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
          >
            Lihat sebagai penyewa
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="mt-6 space-y-5">
        <KelolaFoto hostId={sesi.profil.id} ruangId={ruang.id} foto={foto} />
        <KelolaJendela ruangId={ruang.id} jendela={jendela} />
        <FormRuang hostId={sesi.profil.id} ruangId={ruang.id} awal={isi} />
      </div>
    </div>
  );
}
