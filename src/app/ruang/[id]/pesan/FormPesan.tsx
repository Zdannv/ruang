"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import { InputAngka } from "@/components/host/Kolom";
import {
  buatPemesanan,
  bulanSewa,
  type BarisManifesBaru,
  type RuangUntukPesan,
} from "@/lib/pemesanan";
import { LABEL_KATEGORI, LABEL_USAHA, pakaiLuas, rupiah, tanggalPendek } from "@/lib/label";
import type { TipeRuang } from "@/lib/ruang";

/** Tanggal hari ini di zona Jakarta, dalam bentuk yyyy-mm-dd untuk <input date>. */
function hariIni(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function tambahHari(iso: string, hari: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + hari);
  return d.toISOString().slice(0, 10);
}

/*
  Jumlah dan taksiran nilainya boleh KOSONG selama diketik — lihat
  `InputAngka`. Yang dikirim ke database tetap angka; penerjemahannya di
  `kirimkan()`, bukan di tiap ketikan.
*/
type Baris = Omit<BarisManifesBaru, "jumlah" | "taksiran_nilai"> & {
  kunci: number;
  jumlah: number | null;
  taksiran_nilai: number | null;
};

export default function FormPesan({ ruang }: { ruang: RuangUntukPesan }) {
  const router = useRouter();

  /*
    Dua isi kesepakatan yang berbeda, bukan satu formulir dengan bagian
    tambahan. Pedagang yang menyewa halaman depan tidak menitipkan apa pun —
    gerobaknya dibawa pulang setiap hari — jadi manifes barang di sana bukan
    beban tambahan, ia pertanyaan yang tidak punya jawaban. Yang menggantikannya
    JENIS USAHA, dan itu yang dicocokkan dengan kebijakan pemilik.
  */
  const terbuka = pakaiLuas(ruang.tipe as TipeRuang);
  const usahaBelumDiisi = terbuka && ruang.usaha_diizinkan.length === 0;

  const awal = tambahHari(hariIni(), 1);
  const [mulai, setMulai] = useState(awal);
  const [selesai, setSelesai] = useState(tambahHari(awal, ruang.durasi_min_hari));
  const [usaha, setUsaha] = useState(ruang.usaha_diizinkan[0] ?? "");
  const [baris, setBaris] = useState<Baris[]>([
    { kunci: 1, nama: "", kategori: ruang.kategori_diterima[0] ?? "", jumlah: 1, taksiran_nilai: 0 },
  ]);
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const bulan = useMemo(() => bulanSewa(mulai, selesai), [mulai, selesai]);
  const hari = useMemo(() => {
    const d = Math.round(
      (new Date(selesai).getTime() - new Date(mulai).getTime()) / 86_400_000
    );
    return Number.isFinite(d) ? d : 0;
  }, [mulai, selesai]);
  const total = bulan * ruang.harga_bulanan;
  const kurangDariMinimum = hari > 0 && hari < ruang.durasi_min_hari;

  const ubahBaris = (kunci: number, patch: Partial<Baris>) =>
    setBaris((b) => b.map((x) => (x.kunci === kunci ? { ...x, ...patch } : x)));

  const kirimkan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(null);

    // `kunci` cuma penanda baris untuk React; yang dikirim ke database hanya
    // isi manifesnya.
    const manifes: BarisManifesBaru[] = terbuka
      ? []
      : baris
          .filter((x) => x.nama.trim() !== "")
          .map((x) => ({
            nama: x.nama.trim(),
            kategori: x.kategori,
            // Kosong dibaca satu, bukan nol: baris manifes yang jumlahnya nol
            // adalah baris yang tidak berarti apa-apa.
            jumlah: x.jumlah ?? 1,
            taksiran_nilai: x.taksiran_nilai ?? 0,
          }));
    if (terbuka && usaha === "") {
      setGalat("Pilih dulu jenis usaha yang mau kamu jalankan di lahan ini.");
      return;
    }
    if (!terbuka && manifes.length === 0) {
      setGalat("Isi minimal satu baris manifes barang.");
      return;
    }

    setKirim(true);
    try {
      const id = await buatPemesanan(klienBrowser(), {
        ruangId: ruang.id,
        mulai,
        selesai,
        manifes,
        usaha: terbuka ? usaha : null,
      });
      router.replace(`/pemesanan/${id}`);
      router.refresh();
    } catch (e: unknown) {
      // Pesan galat dari RPC memang sudah ditulis untuk dibaca orang
      // ("Host tidak menerima kategori ... di ruang ini"), jadi diteruskan
      // apa adanya alih-alih diganti kalimat umum.
      setKirim(false);
      setGalat(e instanceof Error ? e.message : "Pemesanan gagal dibuat.");
    }
  };

  return (
    <form onSubmit={kirimkan} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-display text-lg font-bold tracking-tight">Tanggal sewa</h2>
          <p className="mt-1 text-xs text-muted">
            Sewa minimum {ruang.durasi_min_hari} hari.
            {ruang.tersewa_sampai &&
              ` Ruang ini terisi sampai ${tanggalPendek(ruang.tersewa_sampai)}.`}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mulai" className="block text-sm font-medium">
                Mulai
              </label>
              <input
                id="mulai"
                type="date"
                required
                min={hariIni()}
                value={mulai}
                onChange={(e) => {
                  setMulai(e.target.value);
                  // Menggeser tanggal mulai tanpa ikut menggeser selesai akan
                  // sering membuat rentangnya jadi lebih pendek dari minimum,
                  // dan orang harus memperbaikinya dua kali.
                  if (new Date(e.target.value) >= new Date(selesai)) {
                    setSelesai(tambahHari(e.target.value, ruang.durasi_min_hari));
                  }
                }}
                className="mt-1.5 w-full rounded-xl bg-card px-3.5 py-2.5 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            </div>
            <div>
              <label htmlFor="selesai" className="block text-sm font-medium">
                Selesai
              </label>
              <input
                id="selesai"
                type="date"
                required
                min={tambahHari(mulai, ruang.durasi_min_hari)}
                value={selesai}
                onChange={(e) => setSelesai(e.target.value)}
                className="mt-1.5 w-full rounded-xl bg-card px-3.5 py-2.5 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            </div>
          </div>

          {kurangDariMinimum && (
            <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
              Rentangnya {hari} hari, minimum di ruang ini {ruang.durasi_min_hari} hari.
            </p>
          )}
        </section>

        {terbuka ? (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <h2 className="font-display text-lg font-bold tracking-tight">Jenis usaha</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Pilih yang paling mendekati daganganmu. Yang tampil di bawah cuma yang
              memang diizinkan pemilik lahan, jadi kamu tidak perlu menunggu jawaban
              untuk sesuatu yang sudah pasti ditolak.
            </p>

            {usahaBelumDiisi ? (
              <p className="mt-4 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm leading-relaxed text-warn">
                Pemilik lahan ini belum menuliskan jenis usaha yang boleh jalan di
                sini, jadi permintaannya belum bisa dikirim. Tanya dulu lewat chat di
                halaman lahannya.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {ruang.usaha_diizinkan.map((u) => (
                  <label
                    key={u}
                    className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors ${
                      usaha === u
                        ? "bg-brand text-white ring-brand"
                        : "bg-paper text-ink ring-line hover:ring-brand"
                    }`}
                  >
                    <input
                      type="radio"
                      name="usaha"
                      value={u}
                      checked={usaha === u}
                      onChange={() => setUsaha(u)}
                      className="sr-only"
                    />
                    {LABEL_USAHA[u] ?? u.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs leading-relaxed text-muted">
              Gerobak, meja, dan alat daganganmu tetap milikmu dan dibawa pulang
              sendiri, tidak ada manifes barang untuk lahan usaha. Kalau ada
              sengketa, platform menengahi tapi tidak memberi ganti rugi.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <h2 className="font-display text-lg font-bold tracking-tight">Manifes barang</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Wajib diisi. Kategorinya dicocokkan dengan kebijakan host sebelum
              permintaanmu diteruskan, host berhak menolak barang yang tidak sesuai.
              Daftar ini juga jadi acuan saat serah terima.
            </p>

            <div className="mt-4 space-y-3">
              {baris.map((b, i) => (
                <div key={b.kunci} className="rounded-xl bg-paper p-3">
                  <div className="flex items-start gap-2">
                    <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_auto]">
                      <div>
                        <label htmlFor={`nama-${b.kunci}`} className="sr-only">
                          Nama barang {i + 1}
                        </label>
                        <input
                          id={`nama-${b.kunci}`}
                          value={b.nama}
                          onChange={(e) => ubahBaris(b.kunci, { nama: e.target.value })}
                          placeholder="Nama barang, mis. stok baju lebaran"
                          className="w-full rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div>
                          <label htmlFor={`kategori-${b.kunci}`} className="sr-only">
                            Kategori barang {i + 1}
                          </label>
                          <select
                            id={`kategori-${b.kunci}`}
                            value={b.kategori}
                            onChange={(e) => ubahBaris(b.kunci, { kategori: e.target.value })}
                            className="cursor-pointer rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          >
                            {/* Hanya kategori yang diterima host yang bisa dipilih.
                                Validasi sungguhannya tetap di database. */}
                            {ruang.kategori_diterima.map((k) => (
                              <option key={k} value={k}>
                                {LABEL_KATEGORI[k] ?? k.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`jumlah-${b.kunci}`} className="sr-only">
                            Jumlah barang {i + 1}
                          </label>
                          <InputAngka
                            id={`jumlah-${b.kunci}`}
                            min={1}
                            nilai={b.jumlah}
                            onNilai={(n) => ubahBaris(b.kunci, { jumlah: n })}
                            className="angka w-20 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          />
                        </div>
                      </div>
                    </div>

                    {baris.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setBaris((v) => v.filter((x) => x.kunci !== b.kunci))}
                        aria-label={`Hapus baris ${i + 1}`}
                        className="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-card hover:text-warn"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2">
                    <label htmlFor={`nilai-${b.kunci}`} className="text-xs text-muted">
                      Taksiran nilai (opsional)
                    </label>
                    <InputAngka
                      id={`nilai-${b.kunci}`}
                      min={0}
                      step={50000}
                      nilai={b.taksiran_nilai}
                      onNilai={(n) => ubahBaris(b.kunci, { taksiran_nilai: n })}
                      className="angka mt-1 w-40 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setBaris((v) => [
                  ...v,
                  {
                    kunci: Math.max(0, ...v.map((x) => x.kunci)) + 1,
                    nama: "",
                    kategori: ruang.kategori_diterima[0] ?? "",
                    jumlah: 1,
                    taksiran_nilai: 0,
                  },
                ])
              }
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              <Plus className="h-4 w-4" />
              Tambah barang
            </button>

            <p className="mt-4 text-xs leading-relaxed text-muted">
              Taksiran nilai dipakai kalau ada sengketa. Platform menengahi, tapi tidak
              memberi ganti rugi, tidak ada asuransi barang.
            </p>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-[calc(var(--tinggi-header)+1rem)] lg:self-start">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-line">
          <p className="text-sm font-semibold">{ruang.judul}</p>
          <p className="text-xs text-muted">
            {ruang.kecamatan}, {ruang.kota} · {ruang.host_nama}
          </p>

          <dl className="angka mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Sewa per bulan</dt>
              <dd className="font-medium">{rupiah(ruang.harga_bulanan)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Lama sewa</dt>
              <dd className="font-medium">
                {hari > 0 ? `${hari} hari · ${bulan} bulan` : "-"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-2">
              <dt className="font-medium">Total sewa</dt>
              <dd className="font-bold">{total > 0 ? rupiah(total) : "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Deposit</dt>
              <dd className="font-medium">
                {ruang.deposit > 0 ? rupiah(ruang.deposit) : "Tanpa deposit"}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            Bulan dibulatkan ke atas: 45 hari dihitung dua bulan. Deposit ditagih
            terpisah dan dikembalikan di akhir sewa, jadi tidak ikut di total.
          </p>

          {galat && (
            <p className="mt-4 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
              {galat}
            </p>
          )}

          <button
            type="submit"
            disabled={kirim || kurangDariMinimum || hari <= 0 || usahaBelumDiisi}
            className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {kirim && <Loader2 className="h-4 w-4 animate-spin" />}
            {kirim ? "Mengirim…" : "Kirim permintaan"}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            Belum ada pembayaran di langkah ini. Host akan menerima atau menolak dulu.
          </p>
        </div>
      </aside>
    </form>
  );
}
