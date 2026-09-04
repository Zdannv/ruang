import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarClock,
  CreditCard,
  MapPin,
  Package,
  ShieldAlert,
} from "lucide-react";
import LencanaStatus from "@/components/LencanaStatus";
import AksiPemesanan from "../AksiPemesanan";
import JadwalKunjungan from "./JadwalKunjungan";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { getDetailPemesanan } from "@/lib/pemesanan";
import { daftarKunjungan, sisaKuota, waktuJakarta } from "@/lib/akses";
import {
  LABEL_KATEGORI,
  LABEL_STATUS,
  LABEL_TIPE,
  rupiah,
  tanggal,
  tanggalJam,
} from "@/lib/label";

export const metadata: Metadata = { title: "Detail pemesanan — Ruang" };

/**
 * Satu pemesanan, dilihat dari sisi mana pun.
 *
 * Halaman yang sama dipakai penyewa dan host; yang berbeda cuma tombol
 * keputusannya. Menduplikasi halamannya per peran berarti dua tempat yang
 * harus diubah setiap kali status baru ditambahkan.
 */
export default async function HalamanDetailPemesanan({
  params,
}: PageProps<"/pemesanan/[id]">) {
  const { id } = await params;
  const sesi = await sesiSaya();
  if (!sesi) redirect(`/masuk?lanjut=/pemesanan/${id}`);

  const db = await klienServer();
  const data = await getDetailPemesanan(db, id);
  // `null` di sini berarti pemesanannya tidak ada ATAU bukan milik pemanggil —
  // RLS menyaringnya sebelum sampai ke kode ini. Dua-duanya dijawab 404 yang
  // sama, supaya tidak ada cara mengetes id mana yang benar-benar ada.
  if (!data) notFound();

  const { pemesanan: p, manifes, riwayat, alamatLengkap } = data;
  const sayaId = sesi.profil?.id ?? null;
  const sayaHost = sayaId === p.host_id;
  const sayaPenyewa = sayaId === p.penyewa_id;

  // Kunjungan hanya relevan setelah barang ada di dalam ruangan. Daftar status
  // ini harus sama dengan `status_boleh_akses()` di database — di sana yang
  // ditegakkan, di sini yang menentukan bagiannya muncul atau tidak.
  const bolehAkses = ["aktif", "menunggu_serah_terima_keluar", "tunggakan"].includes(
    p.status
  );
  const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date()
  );
  const [kunjungan, sisa] = bolehAkses
    ? await Promise.all([daftarKunjungan(db, p.id), sisaKuota(db, p.id, hariIni)])
    : [[], 0];

  // Dihitung di server: memanggil jam dari dalam komponen klien melanggar
  // aturan kemurnian React, dan hasilnya juga akan mengikuti zona peramban
  // alih-alih WIB.
  const sekarang = new Date();
  const besok = new Date(sekarang.getTime() + 86_400_000);
  besok.setUTCHours(3, 0, 0, 0); // 10.00 WIB

  const nilaiManifes = manifes.reduce((t, m) => t + m.taksiran_nilai, 0);
  const versiTerbaru = manifes.length > 0 ? Math.max(...manifes.map((m) => m.versi)) : 1;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/pemesanan"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Semua pemesanan
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <LencanaStatus status={p.status} />
          <span className="text-xs text-muted">
            {sayaHost ? "kamu host di pemesanan ini" : "kamu penyewa di pemesanan ini"}
          </span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {p.judul}
        </h1>
        <p className="angka mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <MapPin className="h-4 w-4" />
          {LABEL_TIPE[p.tipe as keyof typeof LABEL_TIPE] ?? p.tipe} · {p.kecamatan}, {p.kota}
          <span aria-hidden>·</span>
          <Link href={`/ruang/${p.ruang_id}`} className="font-semibold text-brand hover:text-brand-dark">
            Lihat ruangnya
          </Link>
        </p>
      </header>

      {p.status === "menunggu_pembayaran" && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-soft p-5">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-brand-dark" />
          <div>
            <p className="text-sm font-semibold text-brand-dark">
              Host sudah menerima. Pembayaran belum bisa dilakukan.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-brand-dark/80">
              Jalur pembayaran menunggu payment gateway berlisensi. Sampai itu ada,
              pemesanan berhenti di tahap ini — tidak ada tombol yang menandainya
              lunas, karena itu berarti mencatat uang yang belum pernah masuk.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <h2 className="font-display text-lg font-bold tracking-tight">Periode sewa</h2>
            <dl className="angka mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Mulai</dt>
                <dd className="font-medium">{tanggal(p.mulai)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Selesai</dt>
                <dd className="font-medium">{tanggal(p.selesai)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Jendela akses</dt>
                <dd className="font-medium">{p.jendela_akses}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Kuota kunjungan</dt>
                <dd className="font-medium">{p.kuota_akses_bulanan}x / bulan</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Manifes barang
              </h2>
              <p className="text-xs text-muted">versi {versiTerbaru}</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Daftar ini jadi acuan saat serah terima. Perubahan manifes membuat versi
              baru, tidak menimpa yang lama.
            </p>

            <ul className="mt-3 divide-y divide-line">
              {manifes
                .filter((m) => m.versi === versiTerbaru)
                .map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{m.nama}</p>
                      <p className="text-xs text-muted">
                        {LABEL_KATEGORI[m.kategori] ?? m.kategori.replace(/_/g, " ")}
                        {" · "}
                        <span className="angka">{m.jumlah} unit</span>
                      </p>
                    </div>
                    <p className="angka shrink-0 text-sm text-muted">
                      {m.taksiran_nilai > 0 ? rupiah(m.taksiran_nilai) : "—"}
                    </p>
                  </li>
                ))}
            </ul>

            {nilaiManifes > 0 && (
              <p className="angka mt-3 border-t border-line pt-3 text-sm">
                <span className="text-muted">Total taksiran nilai </span>
                <span className="font-semibold">{rupiah(nilaiManifes)}</span>
              </p>
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Taksiran nilai dipakai kalau ada sengketa. Platform menengahi, tapi tidak
              memberi ganti rugi — tidak ada asuransi barang.
            </p>
          </section>

          {bolehAkses && (
            <JadwalKunjungan
              pemesananId={p.id}
              jendelaAkses={p.jendela_akses}
              sisaKuotaBulanIni={sisa}
              kuotaBulanan={p.kuota_akses_bulanan}
              kunjungan={kunjungan}
              sayaPenyewa={sayaPenyewa}
              sayaHost={sayaHost}
              waktuAwal={waktuJakarta(besok)}
              waktuMin={waktuJakarta(sekarang)}
            />
          )}

          <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <h2 className="font-display text-lg font-bold tracking-tight">Alamat</h2>
            {alamatLengkap ? (
              <>
                <p className="mt-3 text-sm font-medium">{alamatLengkap.alamat}</p>
                {alamatLengkap.patokan && (
                  <p className="text-sm text-muted">Patokan: {alamatLengkap.patokan}</p>
                )}
              </>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Alamat lengkapnya terbuka setelah pembayaran. Sampai itu terjadi, yang
                terlihat cuma kelurahan dan kecamatannya.
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <h2 className="font-display text-lg font-bold tracking-tight">Jejak</h2>
            <ol className="mt-3 space-y-3">
              {riwayat.map((t) => (
                <li key={t.id} className="flex gap-3">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {LABEL_STATUS[t.ke] ?? t.ke}
                      {t.dari && (
                        <span className="font-normal text-muted">
                          {" "}
                          — dari {(LABEL_STATUS[t.dari] ?? t.dari).toLowerCase()}
                        </span>
                      )}
                    </p>
                    {t.catatan && <p className="text-xs text-muted">{t.catatan}</p>}
                    <p className="angka text-xs text-muted">{tanggalJam(t.pada)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Jejak ini hanya bisa ditambah, tidak bisa diubah atau dihapus dari
              aplikasi.
            </p>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <dl className="angka space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Sewa per bulan</dt>
                <dd className="font-medium">{rupiah(p.harga_bulanan)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-line pt-2">
                <dt className="font-medium">Total sewa</dt>
                <dd className="font-bold">{rupiah(p.total)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Deposit</dt>
                <dd className="font-medium">
                  {p.deposit > 0 ? rupiah(p.deposit) : "Tanpa deposit"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              {sayaHost ? "Penyewa" : "Host"}: {sayaHost ? "—" : p.host_nama}
            </p>
            <p className="angka mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Package className="h-3.5 w-3.5" />
              {manifes.filter((m) => m.versi === versiTerbaru).length} baris manifes
            </p>
          </div>

          <AksiPemesanan
            pemesananId={p.id}
            bolehTerima={sayaHost && p.status === "menunggu_konfirmasi"}
            bolehTolak={sayaHost && p.status === "menunggu_konfirmasi"}
            bolehBatalkan={
              sayaPenyewa &&
              (p.status === "menunggu_konfirmasi" || p.status === "menunggu_pembayaran")
            }
          />
        </aside>
      </div>
    </div>
  );
}
