"use client";

import { useEffect, useState } from "react";
import { Loader2, PencilLine } from "lucide-react";
import { ambilWilayah, type Wilayah } from "@/lib/wilayah";

/**
 * Pemilih berjenjang: provinsi → kabupaten/kota → kecamatan → kelurahan.
 *
 * Sebelumnya ketiganya kolom teks bebas, dan itu bukan cuma soal kenyamanan
 * host. `permintaan_kecamatan()` dan facet pencarian mengelompokkan wilayah
 * SEBAGAI TEKS: selama host mengetiknya sendiri, "Lowokwaru", "lowokwaru", dan
 * "Kec. Lowokwaru" adalah tiga wilayah berbeda menurut database — dan tidak
 * ada satu pun layar yang bisa menyadari bahwa hitungannya sudah pecah.
 *
 * Daftarnya boleh gagal diambil. Kalau itu terjadi, komponennya berpindah ke
 * pengisian manual alih-alih menyandera formulirnya: host yang sedang
 * mendaftarkan ruang tidak boleh terhenti gara-gara layanan pihak ketiga.
 */
export default function PilihWilayah({
  nilai,
  onGanti,
}: {
  nilai: { kelurahan: string; kecamatan: string; kota: string };
  onGanti: (w: { kelurahan: string; kecamatan: string; kota: string }) => void;
}) {
  const [provinsi, setProvinsi] = useState<Wilayah[]>([]);
  const [kabupaten, setKabupaten] = useState<Wilayah[]>([]);
  const [kecamatan, setKecamatan] = useState<Wilayah[]>([]);
  const [kelurahan, setKelurahan] = useState<Wilayah[]>([]);

  const [kodeProvinsi, setKodeProvinsi] = useState("");
  const [kodeKabupaten, setKodeKabupaten] = useState("");
  const [kodeKecamatan, setKodeKecamatan] = useState("");

  const [memuat, setMemuat] = useState(true);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    let hidup = true;
    ambilWilayah("provinsi")
      .then((d) => {
        if (!hidup) return;
        setProvinsi(d);
        setMemuat(false);
      })
      .catch(() => {
        if (!hidup) return;
        setManual(true);
        setMemuat(false);
      });
    return () => {
      hidup = false;
    };
  }, []);

  const pilihProvinsi = async (kode: string) => {
    setKodeProvinsi(kode);
    setKodeKabupaten("");
    setKodeKecamatan("");
    setKabupaten([]);
    setKecamatan([]);
    setKelurahan([]);
    onGanti({ kelurahan: "", kecamatan: "", kota: "" });
    if (kode) setKabupaten(await ambilWilayah("kabupaten", kode).catch(() => []));
  };

  const pilihKabupaten = async (kode: string) => {
    setKodeKabupaten(kode);
    setKodeKecamatan("");
    setKecamatan([]);
    setKelurahan([]);
    onGanti({
      kelurahan: "",
      kecamatan: "",
      kota: kabupaten.find((k) => k.kode === kode)?.nama ?? "",
    });
    if (kode) setKecamatan(await ambilWilayah("kecamatan", kode).catch(() => []));
  };

  const pilihKecamatan = async (kode: string) => {
    setKodeKecamatan(kode);
    setKelurahan([]);
    onGanti({
      ...nilai,
      kelurahan: "",
      kecamatan: kecamatan.find((k) => k.kode === kode)?.nama ?? "",
    });
    if (kode) setKelurahan(await ambilWilayah("kelurahan", kode).catch(() => []));
  };

  if (manual) {
    return (
      <div className="sm:col-span-2">
        <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-warn">
          Daftar wilayah sedang tidak bisa diambil, jadi ketik sendiri. Tulis apa
          adanya tanpa awalan — <strong>Lowokwaru</strong>, bukan
          &ldquo;Kec. Lowokwaru&rdquo; — supaya ruangmu terhitung di wilayah yang
          sama dengan yang lain.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Teks id="kelurahan" label="Kelurahan" nilai={nilai.kelurahan}
            onGanti={(v) => onGanti({ ...nilai, kelurahan: v })} />
          <Teks id="kecamatan" label="Kecamatan" nilai={nilai.kecamatan}
            onGanti={(v) => onGanti({ ...nilai, kecamatan: v })} />
          <Teks id="kota" label="Kabupaten/Kota" nilai={nilai.kota}
            onGanti={(v) => onGanti({ ...nilai, kota: v })} />
        </div>
      </div>
    );
  }

  const terisi = nilai.kelurahan && nilai.kecamatan && nilai.kota;

  return (
    <div className="sm:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <Pilih
          id="provinsi"
          label="Provinsi"
          nilai={kodeProvinsi}
          daftar={provinsi}
          memuat={memuat}
          onGanti={pilihProvinsi}
        />
        <Pilih
          id="kabupaten"
          label="Kabupaten/Kota"
          nilai={kodeKabupaten}
          daftar={kabupaten}
          nonaktif={!kodeProvinsi}
          onGanti={pilihKabupaten}
        />
        <Pilih
          id="kecamatan"
          label="Kecamatan"
          nilai={kodeKecamatan}
          daftar={kecamatan}
          nonaktif={!kodeKabupaten}
          onGanti={pilihKecamatan}
        />
        <Pilih
          id="kelurahan"
          label="Kelurahan"
          nilai={kelurahan.find((k) => k.nama === nilai.kelurahan)?.kode ?? ""}
          daftar={kelurahan}
          nonaktif={!kodeKecamatan}
          onGanti={(kode) =>
            onGanti({
              ...nilai,
              kelurahan: kelurahan.find((k) => k.kode === kode)?.nama ?? "",
            })
          }
        />
      </div>

      {/* Ringkasan ini penting saat MENGUBAH ruang: yang tersimpan di database
          adalah namanya, bukan kodenya, jadi keempat select di atas mulai
          kosong meski ruangnya sudah punya wilayah. Tanpa baris ini host akan
          menyangka datanya hilang. */}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {terisi ? (
          <>
            Tersimpan:{" "}
            <strong className="text-ink">
              {nilai.kelurahan}, {nilai.kecamatan}, {nilai.kota}
            </strong>
            . Memilih ulang di atas akan menggantinya.
          </>
        ) : (
          "Pilih sampai kelurahan. Yang terlihat publik cuma kelurahan dan kecamatan — alamat lengkapnya tidak."
        )}
      </p>

      <button
        type="button"
        onClick={() => setManual(true)}
        className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
      >
        <PencilLine className="h-3.5 w-3.5" />
        Wilayahku tidak ada di daftar — ketik sendiri
      </button>
    </div>
  );
}

function Pilih({
  id,
  label,
  nilai,
  daftar,
  onGanti,
  nonaktif = false,
  memuat = false,
}: {
  id: string;
  label: string;
  nilai: string;
  daftar: Wilayah[];
  onGanti: (kode: string) => void;
  nonaktif?: boolean;
  memuat?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1.5">
        <select
          id={id}
          value={nilai}
          disabled={nonaktif || memuat}
          onChange={(e) => onGanti(e.target.value)}
          className="w-full cursor-pointer rounded-xl bg-card px-3.5 py-2.5 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">{memuat ? "Memuat…" : `Pilih ${label.toLowerCase()}`}</option>
          {daftar.map((w) => (
            <option key={w.kode} value={w.kode}>
              {w.nama}
            </option>
          ))}
        </select>
        {memuat && (
          <Loader2 className="pointer-events-none absolute right-9 top-3 h-4 w-4 animate-spin text-muted" />
        )}
      </div>
    </div>
  );
}

function Teks({
  id,
  label,
  nilai,
  onGanti,
}: {
  id: string;
  label: string;
  nilai: string;
  onGanti: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        required
        value={nilai}
        onChange={(e) => onGanti(e.target.value)}
        className="mt-1.5 w-full rounded-xl bg-card px-3.5 py-2.5 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
    </div>
  );
}
