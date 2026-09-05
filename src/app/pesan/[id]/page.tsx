import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPinned } from "lucide-react";
import Utas from "./Utas";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { getPercakapan, tandaiUtasDibaca } from "@/lib/percakapan";
import { tabelBelumAda } from "@/lib/galat";
import MigrasiKurang from "@/components/MigrasiKurang";
import {
  balasanDariRuang,
  daftarBalasan,
  type BalasanSiap,
  type RuangUntukBalasan,
} from "@/lib/balasan";

export const metadata: Metadata = { title: "Percakapan — Ruang" };

export default async function HalamanUtas({ params }: PageProps<"/pesan/[id]">) {
  const { id } = await params;
  const sesi = await sesiSaya();
  if (!sesi) redirect(`/masuk?lanjut=/pesan/${id}`);

  const db = await klienServer();

  let data: Awaited<ReturnType<typeof getPercakapan>>;
  try {
    data = await getPercakapan(db, id);
  } catch (e: unknown) {
    if (tabelBelumAda(e)) {
      return (
        <MigrasiKurang
          fitur="Pesan"
          berkas={["11_pesan_chat.sql", "12_balasan_cepat.sql"]}
        />
      );
    }
    throw e;
  }
  // `null` berarti utasnya tidak ada ATAU bukan milik pemanggil — RLS
  // menyaringnya lebih dulu, dan dua-duanya dijawab 404 yang sama.
  if (!data) notFound();

  const { utas, pesan } = data;
  const sayaId = sesi.profil?.id ?? "";
  const sayaHost = sayaId === utas.host_id;

  // Ditandai dibaca saat halamannya dibuka. Menandainya dari klien setelah
  // render akan membuat lencana berkedip sekali sebelum hilang.
  await tandaiUtasDibaca(db, id, sayaHost ? "host" : "penyewa");

  // Balasan cepat hanya berguna untuk host, jadi datanya cuma diambil untuk
  // host — penyewa tidak perlu membayar dua kueri untuk sesuatu yang tidak
  // akan ditampilkan.
  let balasanRuang: BalasanSiap[] = [];
  let balasanTersimpan: { id: string; isi: string }[] = [];
  if (sayaHost) {
    const [r, tersimpan] = await Promise.all([
      db
        .from("ruang_publik")
        .select(
          "akses_masuk, lebar_pintu_cm, jarak_parkir, posisi_lantai, jendela_akses, " +
            "kuota_akses_bulanan, durasi_min_hari, harga_bulanan, deposit, " +
            "kategori_diterima, penguncian, berbagi, kelembapan, riwayat_banjir"
        )
        .eq("id", utas.ruang_id)
        .maybeSingle(),
      daftarBalasan(db),
    ]);
    if (r.data) balasanRuang = balasanDariRuang(r.data as unknown as RuangUntukBalasan);
    balasanTersimpan = tersimpan;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/pesan"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Semua pesan
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          {utas.judul}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {utas.kecamatan}, {utas.kota} ·{" "}
          {sayaHost ? "kamu host di sini" : `Host: ${utas.host_nama}`} ·{" "}
          <Link
            href={`/ruang/${utas.ruang_id}`}
            className="font-semibold text-brand hover:text-brand-dark"
          >
            Lihat ruangnya
          </Link>
        </p>
      </header>

      {utas.alamat_dibuka_pada && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-good-soft px-4 py-3 text-sm leading-relaxed text-good">
          <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
          {sayaHost
            ? "Kamu sudah membuka alamat untuk penyewa ini."
            : "Host sudah membuka alamatnya. Alamat lengkap dan patokan terlihat di halaman ruang."}
        </p>
      )}

      <Utas
        percakapanId={utas.id}
        profilId={sayaId}
        pesanAwal={pesan}
        sayaId={sayaId}
        sayaHost={sayaHost}
        alamatSudahDibuka={utas.alamat_dibuka_pada !== null}
        balasanRuang={balasanRuang}
        balasanTersimpan={balasanTersimpan}
      />
    </div>
  );
}
