"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Kolom, Pilihan } from "@/components/host/Kolom";
import { klienBrowser } from "@/lib/supabase/browser";
import {
  buatPermintaan,
  hapusPermintaan,
  type IsiPermintaan,
  type PermintaanRuang,
} from "@/lib/permintaan";
import { LABEL_FREKUENSI, rupiah, tanggalPendek, volume } from "@/lib/label";

function hariIni(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export default function FormPermintaan({
  penyewaId,
  milikSaya,
}: {
  penyewaId: string;
  milikSaya: PermintaanRuang[];
}) {
  const router = useRouter();
  const [isi, setIsi] = useState<IsiPermintaan>({
    kecamatan: "",
    kota: "Malang",
    volume_m3: 10,
    harga_maks: 500000,
    mulai: hariIni(),
    frekuensi_akses: "bulanan",
  });
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setKirim(true);
    setGalat(null);
    try {
      await buatPermintaan(klienBrowser(), penyewaId, isi);
      setIsi((v) => ({ ...v, kecamatan: "" }));
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Gagal menyimpan permintaan.");
    } finally {
      setKirim(false);
    }
  };

  const buang = async (id: string) => {
    setKirim(true);
    try {
      await hapusPermintaan(klienBrowser(), id);
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Gagal menghapus.");
    } finally {
      setKirim(false);
    }
  };

  return (
    <div className="space-y-5">
      {milikSaya.length > 0 && (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Permintaan yang kamu titipkan
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {milikSaya.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {p.kecamatan}, {p.kota}
                  </p>
                  <p className="angka mt-0.5 text-xs text-muted">
                    minimal {volume(p.volume_m3)} · maks {rupiah(p.harga_maks)}/bulan ·
                    mulai {tanggalPendek(p.mulai)} ·{" "}
                    {LABEL_FREKUENSI[p.frekuensi_akses] ?? p.frekuensi_akses}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => buang(p.id)}
                  disabled={kirim}
                  aria-label="Hapus permintaan"
                  className="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-paper hover:text-warn disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={simpan} className="rounded-2xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Titipkan kriteriamu
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Host di kecamatan itu melihat ada berapa orang yang mencari — tanpa nama,
          tanpa kontak. Yang terlihat cuma hitungannya, dan rata-rata anggaran baru
          muncul kalau ada minimal tiga permintaan di kecamatan yang sama.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Kolom
            id="kecamatan"
            label="Kecamatan yang dicari"
            required
            value={isi.kecamatan}
            onChange={(e) => setIsi((v) => ({ ...v, kecamatan: e.target.value }))}
            placeholder="Lowokwaru"
          />
          <Kolom
            id="kota"
            label="Kota"
            required
            value={isi.kota}
            onChange={(e) => setIsi((v) => ({ ...v, kota: e.target.value }))}
          />
          <Kolom
            id="volume"
            label="Ukuran minimum"
            type="number"
            min="1"
            step="1"
            required
            satuan="m³"
            value={isi.volume_m3}
            onChange={(e) => setIsi((v) => ({ ...v, volume_m3: Number(e.target.value) || 0 }))}
            bantuan="Kira-kira saja. 10 m³ kurang lebih isi satu kamar kos."
          />
          <Kolom
            id="harga"
            label="Anggaran maksimum"
            type="number"
            min="0"
            step="50000"
            required
            satuan="Rp"
            value={isi.harga_maks}
            onChange={(e) => setIsi((v) => ({ ...v, harga_maks: Number(e.target.value) || 0 }))}
          />
          <Kolom
            id="mulai"
            label="Mulai dibutuhkan"
            type="date"
            required
            value={isi.mulai}
            onChange={(e) => setIsi((v) => ({ ...v, mulai: e.target.value }))}
          />
          <Pilihan
            id="frekuensi"
            label="Seberapa sering datang"
            value={isi.frekuensi_akses}
            onChange={(e) =>
              setIsi((v) => ({
                ...v,
                frekuensi_akses: e.target.value as IsiPermintaan["frekuensi_akses"],
              }))
            }
            opsi={Object.entries(LABEL_FREKUENSI)}
            bantuan="Menentukan kuota kunjungan yang cocok untukmu."
          />
        </div>

        {galat && (
          <p className="mt-4 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
            {galat}
          </p>
        )}

        <button
          type="submit"
          disabled={kirim}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {kirim && <Loader2 className="h-4 w-4 animate-spin" />}
          Titipkan permintaan
        </button>
      </form>
    </div>
  );
}
