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
  Route,
  Ruler,
  ShieldAlert,
  Star,
  Store,
  Truck,
  Umbrella,
  Users,
  Waves,
  Zap,
} from "lucide-react";
import GaleriFoto from "@/components/GaleriFoto";
import PemutarVideo from "@/components/PemutarVideo";
import TanyaHost from "@/components/TanyaHost";
import PetaLahan from "@/components/PetaLahan";
import KontakPemilik from "@/components/KontakPemilik";
import BarisRubrik from "@/components/BarisRubrik";
import { IKON_TIPE } from "@/components/IkonTipe";
import { getDetailRuang } from "@/lib/ruang";
import { catatStatistik, kontakLahan } from "@/lib/kontak";
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
  LABEL_AIR,
  LABEL_ATAP,
  LABEL_KELAS_JALAN,
  LABEL_LISTRIK,
  LABEL_TIPE,
  LABEL_USAHA,
  bulanTahun,
  dimensi,
  labelDaftar,
  lebarMuka,
  luas,
  pakaiLuas,
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
  if (!supabaseSiap) return { title: "Cari Ruang" };
  const { id } = await params;
  const data = await ambilDetail(id).catch(() => null);
  if (!data) return { title: "Lahan tidak ditemukan · Cari Ruang" };

  const { ruang } = data;
  return {
    title: `${ruang.judul}, ${ruang.kecamatan}, ${ruang.kota} · Cari Ruang`,
    // Satuannya ikut tipenya, sama seperti di layar: "18 m³" untuk halaman
    // depan rumah adalah angka yang benar dan tidak berarti apa-apa — dan di
    // sini ia masuk ke cuplikan hasil pencarian Google.
    description: `${LABEL_TIPE[ruang.tipe]} ${
      pakaiLuas(ruang.tipe) ? luas(ruang.luas_m2) : volume(ruang.volume_m3)
    } di ${ruang.kelurahan}, ${ruang.kecamatan}. ${rupiah(ruang.harga_bulanan)} per bulan.`,
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

  const { ruang, host, foto, video, ulasan, tersewaSampai, alamatLengkap } = data;
  /*
    Nomor pemiliknya, dan `null` kalau pengunjungnya belum masuk — gerbangnya
    di `kontak_lahan()`, bukan di sini. Di luar `Promise.all` halaman ini
    supaya database yang belum menjalankan migrasi 21 menjawab null alih-alih
    mematikan halamannya.
  */
  const kontak = await kontakLahan(await klienServer(), id);
  // Satu peristiwa "dibuka" per render halaman. Kunjungan pemiliknya sendiri
  // disaring di database, bukan di sini.
  await catatStatistik(await klienServer(), id, "dibuka");
  const IkonTipe = IKON_TIPE[ruang.tipe];

  /*
    Lahan terbuka dan ruang tertutup dibaca dengan pertanyaan yang berbeda, dan
    halaman ini mengikuti pertanyaannya — bukan menampilkan semua kolom yang
    ada. "Kelembapan: kering & berventilasi" pada halaman depan rumah bukan
    keterangan yang kurang berguna, ia keterangan yang MENYESATKAN: ia membaca
    seolah lahannya berdinding.
  */
  const terbuka = pakaiLuas(ruang.tipe);
  const muka = lebarMuka(ruang.lebar_muka_m ?? ruang.lebar_m);

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
        href="/cari"
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
              {terbuka ? luas(ruang.luas_m2) : dimensi(ruang.panjang_m, ruang.lebar_m, ruang.tinggi_m)}
              <span aria-hidden>·</span>
              {terbuka ? (muka ?? `${ruang.lebar_m} m lebar`) : luas(ruang.luas_m2)}
              {!terbuka && (
                <>
                  <span aria-hidden>·</span>
                  {volume(ruang.volume_m3)}
                </>
              )}
            </p>
          </header>

          {/* ── Buat jualan ────────────────────────────────────────────────── */}
          {terbuka && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-bold tracking-tight">
                Buat jualan
              </h2>
              <p className="mt-1 text-sm text-muted">
                Lima hal yang menentukan lahannya cocok atau tidak buat daganganmu.
                Yang belum diisi pemilik ditandai, tanya lewat chat sebelum memesan.
              </p>

              <div className="mt-4 grid gap-x-8 rounded-2xl bg-card p-5 ring-1 ring-line sm:grid-cols-2">
                <dl className="divide-y divide-line">
                  <BarisRubrik
                    ikon={Ruler}
                    label="Lebar muka jalan"
                    nilai={muka ?? "Belum diisi pemilik"}
                    nada={muka ? "netral" : "waspada"}
                  />
                  <BarisRubrik
                    ikon={Route}
                    label="Kelas jalan"
                    nilai={
                      ruang.kelas_jalan
                        ? (LABEL_KELAS_JALAN[ruang.kelas_jalan] ?? ruang.kelas_jalan)
                        : "Belum diisi pemilik"
                    }
                    nada={
                      ruang.kelas_jalan === "jalan_raya"
                        ? "baik"
                        : ruang.kelas_jalan === "dalam_gang"
                          ? "waspada"
                          : "netral"
                    }
                  />
                  <BarisRubrik
                    ikon={Umbrella}
                    label="Atap"
                    nilai={
                      ruang.atap
                        ? (LABEL_ATAP[ruang.atap] ?? ruang.atap)
                        : "Belum diisi pemilik"
                    }
                    nada={ruang.atap === "tidak_ada" ? "waspada" : "netral"}
                  />
                </dl>

                <dl className="divide-y divide-line">
                  <BarisRubrik
                    ikon={Zap}
                    label="Listrik"
                    nilai={
                      ruang.listrik
                        ? (LABEL_LISTRIK[ruang.listrik] ?? ruang.listrik)
                        : "Belum diisi pemilik"
                    }
                    nada={
                      ruang.listrik === "tidak_ada"
                        ? "waspada"
                        : ruang.listrik
                          ? "baik"
                          : "waspada"
                    }
                  />
                  <BarisRubrik
                    ikon={Droplets}
                    label="Air"
                    nilai={
                      ruang.air
                        ? (LABEL_AIR[ruang.air] ?? ruang.air)
                        : "Belum diisi pemilik"
                    }
                    nada={ruang.air === "tidak_ada" ? "waspada" : "netral"}
                  />
                  <BarisRubrik
                    ikon={Users}
                    label="Pemakaian lahan"
                    nilai={LABEL_BERBAGI[ruang.berbagi]}
                  />
                </dl>
              </div>

              <div className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-line">
                <DaftarChip
                  ikon={Store}
                  judul="Usaha yang diizinkan pemilik"
                  isi={labelDaftar(ruang.usaha_diizinkan, LABEL_USAHA)}
                  kosong="Pemilik belum menuliskannya, tanya dulu lewat chat"
                  rapat
                />
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Jenis usaha yang tidak ada di daftar itu ditolak sistem sebelum
                  permintaanmu sampai ke pemilik. Menggoreng dipisah dari makanan
                  biasa, karena asap dan minyak yang menempel di rumah orang adalah
                  alasan penolakan paling sering.
                </p>
              </div>
            </section>
          )}

          {/* ── Rubrik kondisi ─────────────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold tracking-tight">
              {terbuka ? "Kondisi lahan" : "Kondisi ruang"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {terbuka
                ? "Semua diisi pemilik saat mendaftarkan lahannya. Penyewa menilai ketepatannya setelah sewa berakhir."
                : "Semua diisi host saat mendaftarkan ruangnya. Penyewa menilai ketepatannya setelah sewa berakhir."}
            </p>

            <div className="mt-4 grid gap-x-8 rounded-2xl bg-card p-5 ring-1 ring-line sm:grid-cols-2">
              <dl className="divide-y divide-line">
                <BarisRubrik
                  ikon={Truck}
                  label="Kendaraan terbesar yang bisa masuk"
                  nilai={LABEL_AKSES[ruang.akses_masuk]}
                />
                {!terbuka && (
                  <>
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
                  </>
                )}
                <BarisRubrik
                  ikon={CircleParking}
                  label="Jarak dari parkir"
                  nilai={LABEL_PARKIR[ruang.jarak_parkir]}
                />
                {!terbuka && (
                  <BarisRubrik
                    ikon={Home}
                    label="Kondisi bangunan"
                    nilai={LABEL_BANGUNAN[ruang.kondisi_bangunan]}
                  />
                )}
              </dl>

              <dl className="divide-y divide-line">
                {!terbuka && (
                  <BarisRubrik
                    ikon={Droplets}
                    label="Kelembapan"
                    nilai={LABEL_KELEMBAPAN[ruang.kelembapan]}
                    nada={ruang.kelembapan === "cenderung_lembap" ? "waspada" : "baik"}
                  />
                )}
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
                {!terbuka && (
                  <>
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
                  </>
                )}
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
              Aturan dari pemilik
            </h2>

            <div className="mt-4 space-y-4 rounded-2xl bg-card p-5 ring-1 ring-line">
              {!terbuka && (
                <DaftarChip
                  ikon={Package}
                  judul="Barang yang diterima"
                  isi={labelDaftar(ruang.kategori_diterima, LABEL_KATEGORI)}
                  kosong="Pemilik belum menentukan kategori"
                  rapat
                />
              )}

              <dl className="grid divide-y divide-line border-t border-line pt-1 sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
                <BarisRubrik
                  ikon={CalendarClock}
                  label={terbuka ? "Jam boleh jualan" : "Jendela akses"}
                  nilai={ruang.jendela_akses}
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
                Semua ini ditulis pemiliknya sendiri. Cocokkan lagi waktu kamu
                chat dan waktu datang ke lokasinya.
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

              {/*
                Tiga keadaan, dan urutannya menentukan mana yang menang.
                `alamatLengkap` datang dari alamat yang dibuka pemilik khusus
                untuk orang ini lewat chat; ia lebih spesifik daripada alamat
                yang memang publik, jadi ia didahulukan.
              */}
              {alamatLengkap ? (
                <>
                  <p className="mt-2 text-sm font-medium">{alamatLengkap.alamat}</p>
                  {alamatLengkap.patokan && (
                    <p className="text-sm text-muted">Patokan: {alamatLengkap.patokan}</p>
                  )}
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Alamat ini dibuka khusus untukmu. Jangan dibagikan ke orang lain.
                  </p>
                </>
              ) : ruang.alamat_terbuka && ruang.alamat_publik ? (
                <>
                  <p className="mt-2 text-sm font-medium">{ruang.alamat_publik}</p>
                  {ruang.patokan_publik && (
                    <p className="text-sm text-muted">Patokan: {ruang.patokan_publik}</p>
                  )}
                </>
              ) : (
                <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  Pemiliknya belum membuka alamat lengkapnya. Titik di peta digeser
                  sekitar 200 m; tanyakan alamat persisnya lewat chat.
                </p>
              )}

              <PetaLahan
                lat={ruang.peta_lat}
                lng={ruang.peta_lng}
                judul={ruang.judul}
                persis={ruang.alamat_terbuka || alamatLengkap != null}
              />
            </div>
          </section>

          <PemutarVideo video={video} />

          {/* ── Ulasan ───────────────────────────────────────────────────────
              Disembunyikan seluruhnya kalau kosong, dan sejak alur pemesanan
              dibuang (18 Sep 2026) ia praktis selalu kosong: `boleh_ulas()`
              mensyaratkan pemesanan lewat aplikasi. Judul "Ulasan penyewa"
              dengan keterangan "hanya bisa ditulis penyewa yang sewanya sudah
              selesai" menjanjikan sesuatu yang tidak akan pernah datang. */}
          {ulasan.length > 0 && (
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
          </section>
          )}
        </div>

        {/* ── Panel harga ──────────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-[calc(var(--tinggi-header)+1rem)] lg:self-start">
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

            {/* Chat adalah satu-satunya tombol utama sekarang. Sewanya
                disepakati langsung antara pedagang dan pemiliknya, di luar
                aplikasi, jadi tidak ada tahap "ajukan" yang bisa ditekan di
                sini. Lihat nomor 43 di CLAUDE.md. */}
            <TanyaHost ruangId={ruang.id} utama />

            <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              Harga dan cara bayarnya kamu bicarakan langsung dengan pemiliknya.
              Aplikasi ini cuma mempertemukan, tidak ikut memegang uang dan tidak
              memberi ganti rugi.
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
              <KontakPemilik
                ruangId={ruang.id}
                nama={host.nama}
                telepon={kontak?.telepon ?? null}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Kelompok chip untuk kolom `text[]`, pengawasan, fasilitas, kategori. */
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
