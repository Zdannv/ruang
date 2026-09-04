import { cache } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Blocks,
  CalendarClock,
  CircleParking,
  DoorOpen,
  Droplets,
  Eye,
  Home,
  KeyRound,
  Layers,
  MapPin,
  Package,
  Ruler,
  ShieldAlert,
  Star,
  Truck,
  Users,
  Waves,
} from "lucide-react";
import GaleriFoto from "@/components/GaleriFoto";
import BarisRubrik from "@/components/BarisRubrik";
import { IKON_TIPE } from "@/components/IkonTipe";
import { getDetailRuang } from "@/lib/ruang";
import { klienServer } from "@/lib/supabase/server";
import { supabaseSiap } from "@/lib/supabase/env";
import {
  LABEL_AKSES,
  LABEL_BANGUNAN,
  LABEL_BANJIR,
  LABEL_BERBAGI,
  LABEL_FASILITAS,
  LABEL_KATEGORI,
  LABEL_KELEMBAPAN,
  LABEL_KEPEMILIKAN,
  LABEL_PARKIR,
  LABEL_PENGAWASAN,
  LABEL_PENGUNCIAN,
  LABEL_POSISI,
  LABEL_TIPE,
  bulanTahun,
  dimensi,
  labelDaftar,
  luas,
  rupiah,
  tanggal,
  volume,
} from "@/lib/label";

/**
 * `generateMetadata` dan komponen halaman butuh data yang sama persis, dan
 * keduanya dijalankan untuk satu request. `cache` membuat pemanggilan kedua
 * memakai hasil yang pertama, jadi tidak ada empat kueri yang berjalan dua kali.
 */
const ambilDetail = cache(async (id: string) => getDetailRuang(await klienServer(), id));

export async function generateMetadata({ params }: PageProps<"/ruang/[id]">) {
  if (!supabaseSiap) return { title: "Ruang" };
  const { id } = await params;
  const data = await ambilDetail(id).catch(() => null);
  if (!data) return { title: "Ruang tidak ditemukan — Ruang" };

  const { ruang } = data;
  return {
    title: `${ruang.judul} — ${ruang.kecamatan}, ${ruang.kota} · Ruang`,
    description: `${LABEL_TIPE[ruang.tipe]} ${volume(ruang.volume_m3)} di ${ruang.kelurahan}, ${ruang.kecamatan}. ${rupiah(ruang.harga_bulanan)} per bulan.`,
  };
}

/**
 * Detail satu ruang.
 *
 * Dirender di server: isinya publik, tidak bergantung sesi, dan lebih cepat
 * sampai ke layar tanpa perjalanan bolak-balik ke browser dulu.
 *
 * Rubrik kondisi ditampilkan **utuh** — 16 field, tidak ada yang diringkas atau
 * disembunyikan di balik "lihat selengkapnya". Itu keputusan yang dikunci di
 * CLAUDE.md: kelengkapan rubrik inilah yang membedakan halaman ini dari iklan
 * OLX, jadi meringkasnya berarti membuang satu-satunya keunggulannya.
 */
export default async function HalamanRuang({ params }: PageProps<"/ruang/[id]">) {
  const { id } = await params;
  const data = await ambilDetail(id);
  if (!data) notFound();

  const { ruang, host, foto, ulasan, tersewaSampai } = data;
  const IkonTipe = IKON_TIPE[ruang.tipe];

  const skorRata =
    ulasan.length > 0
      ? ulasan.reduce((t, u) => t + u.skor, 0) / ulasan.length
      : null;
  const akurasiTerisi = ulasan.filter((u) => u.akurasi != null);
  const akurasiRata =
    akurasiTerisi.length > 0
      ? akurasiTerisi.reduce((t, u) => t + (u.akurasi ?? 0), 0) / akurasiTerisi.length
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke pencarian
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <GaleriFoto foto={foto} judul={ruang.judul} />

          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
                <IkonTipe className="h-3.5 w-3.5" />
                {LABEL_TIPE[ruang.tipe]}
              </span>
              {ruang.berbagi === "eksklusif" && (
                <span className="rounded-full bg-good-soft px-3 py-1 text-xs font-semibold text-good">
                  Dipakai sendiri
                </span>
              )}
              {skorRata != null && (
                <span className="angka inline-flex items-center gap-1 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                  {skorRata.toFixed(1).replace(".", ",")} · {ulasan.length} ulasan
                </span>
              )}
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
              {ruang.judul}
            </h1>

            <p className="angka mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <MapPin className="h-4 w-4" />
              {ruang.kelurahan}, {ruang.kecamatan}, {ruang.kota}
              <span aria-hidden>·</span>
              {dimensi(ruang.panjang_m, ruang.lebar_m, ruang.tinggi_m)}
              <span aria-hidden>·</span>
              {luas(ruang.luas_m2)}
              <span aria-hidden>·</span>
              {volume(ruang.volume_m3)}
            </p>
          </header>

          {/* ── Rubrik kondisi ─────────────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold tracking-tight">Kondisi ruang</h2>
            <p className="mt-1 text-sm text-muted">
              Semua diisi host saat mendaftarkan ruangnya. Penyewa menilai
              ketepatannya setelah sewa berakhir.
            </p>

            <div className="mt-4 grid gap-x-8 rounded-2xl bg-card p-5 ring-1 ring-line sm:grid-cols-2">
              <dl className="divide-y divide-line">
                <BarisRubrik
                  ikon={Truck}
                  label="Kendaraan terbesar yang bisa masuk"
                  nilai={LABEL_AKSES[ruang.akses_masuk]}
                />
                <BarisRubrik
                  ikon={Layers}
                  label="Posisi lantai"
                  nilai={LABEL_POSISI[ruang.posisi_lantai]}
                />
                <BarisRubrik
                  ikon={DoorOpen}
                  label="Lebar pintu"
                  nilai={`${ruang.lebar_pintu_cm} cm`}
                />
                <BarisRubrik
                  ikon={CircleParking}
                  label="Jarak dari parkir"
                  nilai={LABEL_PARKIR[ruang.jarak_parkir]}
                />
                <BarisRubrik
                  ikon={Home}
                  label="Kondisi bangunan"
                  nilai={LABEL_BANGUNAN[ruang.kondisi_bangunan]}
                />
              </dl>

              <dl className="divide-y divide-line">
                <BarisRubrik
                  ikon={Droplets}
                  label="Kelembapan"
                  nilai={LABEL_KELEMBAPAN[ruang.kelembapan]}
                  nada={ruang.kelembapan === "cenderung_lembap" ? "waspada" : "baik"}
                />
                <BarisRubrik
                  ikon={Waves}
                  label="Riwayat banjir"
                  nilai={LABEL_BANJIR[ruang.riwayat_banjir]}
                  nada={
                    ruang.riwayat_banjir === "dalam_5_tahun"
                      ? "waspada"
                      : ruang.riwayat_banjir === "tidak_pernah"
                        ? "baik"
                        : "netral"
                  }
                />
                <BarisRubrik
                  ikon={Ruler}
                  label="Tinggi lantai dari tanah"
                  nilai={`${ruang.tinggi_lantai_cm} cm`}
                />
                <BarisRubrik
                  ikon={KeyRound}
                  label="Penguncian"
                  nilai={LABEL_PENGUNCIAN[ruang.penguncian]}
                  nada={ruang.penguncian === "kunci_penyewa" ? "baik" : "waspada"}
                />
                <BarisRubrik
                  ikon={Users}
                  label="Pemakaian ruang"
                  nilai={LABEL_BERBAGI[ruang.berbagi]}
                />
              </dl>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DaftarChip
                ikon={Eye}
                judul="Pengawasan"
                isi={labelDaftar(ruang.pengawasan, LABEL_PENGAWASAN)}
                kosong="Host tidak mencantumkan pengawasan apa pun"
              />
              <DaftarChip
                ikon={Blocks}
                judul="Fasilitas"
                isi={labelDaftar(ruang.fasilitas, LABEL_FASILITAS)}
                kosong="Tidak ada fasilitas tambahan"
              />
            </div>
          </section>

          {/* ── Kebijakan ──────────────────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold tracking-tight">
              Aturan dari host
            </h2>

            <div className="mt-4 space-y-4 rounded-2xl bg-card p-5 ring-1 ring-line">
              <DaftarChip
                ikon={Package}
                judul="Barang yang diterima"
                isi={labelDaftar(ruang.kategori_diterima, LABEL_KATEGORI)}
                kosong="Host belum menentukan kategori"
                rapat
              />
              <p className="text-xs leading-relaxed text-muted">
                Manifes barang wajib diisi saat memesan, dan dicocokkan dengan daftar
                ini sebelum permintaanmu diteruskan ke host. Host berhak menolak barang
                yang tidak sesuai.
              </p>

              <dl className="grid divide-y divide-line border-t border-line pt-1 sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
                <BarisRubrik
                  ikon={CalendarClock}
                  label="Jendela akses"
                  nilai={ruang.jendela_akses}
                />
                <BarisRubrik
                  ikon={DoorOpen}
                  label="Kuota kunjungan"
                  nilai={`${ruang.kuota_akses_bulanan}x per bulan`}
                />
                <BarisRubrik
                  ikon={CalendarClock}
                  label="Sewa minimum"
                  nilai={`${ruang.durasi_min_hari} hari`}
                />
                <BarisRubrik
                  ikon={Home}
                  label="Status kepemilikan"
                  nilai={LABEL_KEPEMILIKAN[ruang.kepemilikan]}
                />
              </dl>

              <p className="text-xs leading-relaxed text-muted">
                Kunjungan dijanjikan lewat aplikasi, di dalam jendela akses di atas.
                Setiap kunjungan tercatat di log akses — itu yang menggantikan segel
                pada penitipan biasa.
              </p>
            </div>
          </section>

          {/* ── Lokasi ─────────────────────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold tracking-tight">Lokasi</h2>
            <div className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-line">
              <p className="text-sm font-medium">
                {ruang.kelurahan}, {ruang.kecamatan}, {ruang.kota}
              </p>
              <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {ruang.terbuka_alamat
                  ? "Ruang komersial — alamat lengkap dan patokannya dibuka begitu kamu mengajukan sewa."
                  : "Ruang di rumah tinggal. Titik di peta digeser sekitar 200 m dan alamat lengkapnya baru dibuka setelah host menyetujui jadwal surveimu."}
              </p>
              {/* TODO: peta. Butuh penyedia tile; yang diplot nanti
                  lat_publik/lng_publik, jangan pernah koordinat aslinya. */}
            </div>
          </section>

          {/* ── Ulasan ─────────────────────────────────────────────────────── */}
          <section className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h2 className="font-display text-xl font-bold tracking-tight">
                Ulasan penyewa
              </h2>
              {akurasiRata != null && (
                <p className="angka text-sm text-muted">
                  Ketepatan rubrik {akurasiRata.toFixed(1).replace(".", ",")}/5
                </p>
              )}
            </div>

            {ulasan.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-card p-5 text-sm text-muted ring-1 ring-line">
                Belum ada ulasan. Ulasan hanya bisa ditulis penyewa yang sewanya sudah
                selesai, jadi jumlahnya memang bertambah lambat.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {ulasan.map((u) => (
                  <li key={u.id} className="rounded-2xl bg-card p-5 ring-1 ring-line">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{u.penulis_nama}</p>
                      <p className="angka flex items-center gap-1 text-sm font-semibold">
                        <Star className="h-4 w-4 fill-current text-amber-500" />
                        {u.skor}
                      </p>
                    </div>
                    {u.komentar && (
                      <p className="mt-2 text-sm leading-relaxed text-ink">{u.komentar}</p>
                    )}
                    <p className="angka mt-2 text-xs text-muted">
                      {tanggal(u.pada)}
                      {u.akurasi != null && ` · ketepatan rubrik ${u.akurasi}/5`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Panel harga ──────────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <p className="angka text-2xl font-bold">
              {rupiah(ruang.harga_bulanan)}
              <span className="text-sm font-medium text-muted"> / bulan</span>
            </p>

            <dl className="angka mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Deposit</dt>
                <dd className="font-medium">
                  {ruang.deposit > 0 ? rupiah(ruang.deposit) : "Tanpa deposit"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Sewa minimum</dt>
                <dd className="font-medium">{ruang.durasi_min_hari} hari</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Kuota kunjungan</dt>
                <dd className="font-medium">{ruang.kuota_akses_bulanan}x / bulan</dd>
              </div>
            </dl>

            {tersewaSampai ? (
              <p className="angka mt-4 rounded-xl bg-warn-soft px-3 py-2.5 text-xs font-medium text-warn">
                Sedang tersewa sampai {tanggal(tersewaSampai)}
              </p>
            ) : (
              <p className="mt-4 rounded-xl bg-good-soft px-3 py-2.5 text-xs font-medium text-good">
                Tersedia sekarang
              </p>
            )}

            {/* Halaman /pesan yang mengurus "belum masuk": ia mengalihkan ke
                /masuk dengan `lanjut`, jadi orang kembali ke formulir ini setelah
                login. Tombolnya tidak perlu tahu keadaan sesi, dan halaman ini
                tetap bisa dirender tanpa membaca cookie. */}
            <Link
              href={`/ruang/${ruang.id}/pesan`}
              className="mt-4 block w-full rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Ajukan sewa
            </Link>
            <p className="mt-2 text-center text-xs text-muted">
              Belum ada pembayaran di langkah ini. Host menerima atau menolak dulu.
            </p>

            <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              Platform menengahi kalau ada sengketa, tapi tidak memberi ganti rugi.
              Tidak ada asuransi barang.
            </p>
          </div>

          {host && (
            <div className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-line">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-paper">
                  {host.foto_url && (
                    <Image src={host.foto_url} alt="" fill sizes="44px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    {host.nama}
                    {host.terverifikasi && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-brand" />
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {host.kota} · sejak {bulanTahun(host.bergabung)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Nomor kontak host baru terbuka setelah pembayaran. Sebelum itu, semua
                komunikasi lewat aplikasi.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Kelompok chip untuk kolom `text[]` — pengawasan, fasilitas, kategori. */
function DaftarChip({
  ikon: Ikon,
  judul,
  isi,
  kosong,
  rapat = false,
}: {
  ikon: typeof Eye;
  judul: string;
  isi: string[];
  kosong: string;
  rapat?: boolean;
}) {
  return (
    <div className={rapat ? "" : "rounded-2xl bg-card p-5 ring-1 ring-line"}>
      <p className="flex items-center gap-2 text-xs text-muted">
        <Ikon className="h-4 w-4" />
        {judul}
      </p>
      {isi.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{kosong}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {isi.map((v) => (
            <li
              key={v}
              className="rounded-full bg-paper px-2.5 py-1 text-xs font-medium capitalize text-ink"
            >
              {v}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
