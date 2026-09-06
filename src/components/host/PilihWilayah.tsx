"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { ambilWilayah, type Tingkat, type Wilayah } from "@/lib/wilayah";

/**
 * Pemilih berjenjang: provinsi → kabupaten/kota → kecamatan → kelurahan.
 *
 * Sebelumnya ketiganya kolom teks bebas, dan itu bukan cuma soal kenyamanan
 * host. `permintaan_kecamatan()` dan facet pencarian mengelompokkan wilayah
 * SEBAGAI TEKS: selama host mengetiknya sendiri, "Lowokwaru", "lowokwaru", dan
 * "Kec. Lowokwaru" adalah tiga wilayah berbeda menurut database — dan tidak
 * ada satu pun layar yang bisa menyadari bahwa hitungannya sudah pecah.
 *
 * TIDAK ADA jalur mengetik sendiri, dan itu keputusan yang diambil sadar.
 * Versi sebelumnya punya tombol "wilayahku tidak ada di daftar — ketik
 * sendiri", dan tombol itu melubangi satu-satunya hal yang komponen ini ada
 * untuk menjaganya: begitu satu orang mengetik "kota malang", hitungan
 * wilayahnya pecah dan tidak ada layar yang bisa menyadarinya.
 *
 * Konsekuensinya ditanggung: kalau daftarnya tidak bisa diambil, formulirnya
 * memang tertahan. Yang meredam itu, provinsi dan kabupaten/kota disalin ke
 * dalam repo dan disajikan `/api/wilayah` saat upstream-nya mati — jadi nama
 * KOTA selalu bisa dipilih dari daftar yang sah. Kecamatan dan kelurahan
 * bergantung pada layanannya, dan di situ yang ditawarkan adalah coba lagi.
 */
export default function PilihWilayah({
  nilai,
  onGanti,
  sampai = "kelurahan",
  kolom = 2,
}: {
  nilai: { kelurahan: string; kecamatan: string; kota: string };
  onGanti: (w: { kelurahan: string; kecamatan: string; kota: string }) => void;
  /**
   * Sedalam apa wilayahnya ditanyakan.
   *
   * Ruang butuh sampai kelurahan: itu satuan yang ditampilkan ke publik dan
   * yang dipakai mengelompokkan hasil. Permintaan ruang berhenti di kecamatan,
   * karena itu satuan yang dipakai `permintaan_kecamatan`. Pendaftaran akun
   * cukup sampai kabupaten/kota — di sana wilayahnya hanya jadi titik awal
   * pencarian, dan dua dropdown tambahan di formulir daftar adalah gesekan
   * yang harganya lebih mahal daripada ketelitian yang didapat.
   */
  sampai?: "kabupaten" | "kecamatan" | "kelurahan";
  /** 1 untuk kartu sempit seperti formulir masuk/daftar. */
  kolom?: 1 | 2;
}) {
  const [provinsi, setProvinsi] = useState<Wilayah[]>([]);
  const [kabupaten, setKabupaten] = useState<Wilayah[]>([]);
  const [kecamatan, setKecamatan] = useState<Wilayah[]>([]);
  const [kelurahan, setKelurahan] = useState<Wilayah[]>([]);

  const [kodeProvinsi, setKodeProvinsi] = useState("");
  const [kodeKabupaten, setKodeKabupaten] = useState("");
  const [kodeKecamatan, setKodeKecamatan] = useState("");

  const [memuat, setMemuat] = useState(true);
  const [gagal, setGagal] = useState(false);
  // Dinaikkan tiap kali "coba lagi" ditekan, supaya efek pengambilan
  // provinsinya berjalan ulang.
  const [percobaan, setPercobaan] = useState(0);

  useEffect(() => {
    let hidup = true;
    // Penyetelan ulang `memuat`/`gagal` ada di `cobaLagi()`, bukan di sini:
    // setState sinkron di dalam efek memicu render berantai, dan React
    // Compiler menolaknya.
    ambilWilayah("provinsi")
      .then((d) => {
        if (!hidup) return;
        setProvinsi(d);
        setMemuat(false);
      })
      .catch(() => {
        if (!hidup) return;
        setGagal(true);
        setMemuat(false);
      });
    return () => {
      hidup = false;
    };
  }, [percobaan]);

  const cobaLagi = () => {
    setMemuat(true);
    setGagal(false);
    setPercobaan((n) => n + 1);
  };

  const pilihProvinsi = async (kode: string) => {
    setKodeProvinsi(kode);
    setKodeKabupaten("");
    setKodeKecamatan("");
    setKabupaten([]);
    setKecamatan([]);
    setKelurahan([]);
    onGanti({ kelurahan: "", kecamatan: "", kota: "" });
    if (kode) setKabupaten(await ambilAtauTandai("kabupaten", kode, setGagal));
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
    if (kode) setKecamatan(await ambilAtauTandai("kecamatan", kode, setGagal));
  };

  const pilihKecamatan = async (kode: string) => {
    setKodeKecamatan(kode);
    setKelurahan([]);
    onGanti({
      ...nilai,
      kelurahan: "",
      kecamatan: kecamatan.find((k) => k.kode === kode)?.nama ?? "",
    });
    if (kode) setKelurahan(await ambilAtauTandai("kelurahan", kode, setGagal));
  };

  const kisi = kolom === 1 ? "grid gap-4" : "grid gap-4 sm:grid-cols-2";
  const bungkus = kolom === 1 ? "" : "sm:col-span-2";
  const sampaiKelurahan = sampai === "kelurahan";
  const sampaiKecamatan = sampai !== "kabupaten";

  if (gagal && provinsi.length === 0) {
    return (
      <div className={bungkus}>
        <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-warn">
          Daftar wilayah sedang tidak bisa diambil, jadi pilihannya belum muncul.
          Wilayah hanya boleh dipilih dari daftar resmi — mengetiknya sendiri
          membuat ruangmu terhitung di wilayah yang berbeda dari tetanggamu.
        </p>
        <button
          type="button"
          onClick={cobaLagi}
          className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-card px-4 py-2 text-xs font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Coba lagi
        </button>
      </div>
    );
  }

  const terisi = sampaiKelurahan
    ? Boolean(nilai.kelurahan && nilai.kecamatan && nilai.kota)
    : sampaiKecamatan
      ? Boolean(nilai.kecamatan && nilai.kota)
      : Boolean(nilai.kota);

  return (
    <div className={bungkus}>
      <div className={kisi}>
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
        {sampaiKecamatan && (
          <>
            <Pilih
              id="kecamatan"
              label="Kecamatan"
              nilai={kodeKecamatan}
              daftar={kecamatan}
              nonaktif={!kodeKabupaten}
              onGanti={pilihKecamatan}
            />
            {sampaiKelurahan && (
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
            )}
          </>
        )}
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
              {[nilai.kelurahan, nilai.kecamatan, nilai.kota].filter(Boolean).join(", ")}
            </strong>
            . Memilih ulang di atas akan menggantinya.
          </>
        ) : sampaiKelurahan ? (
          "Pilih sampai kelurahan. Yang terlihat publik cuma kelurahan dan kecamatan — alamat lengkapnya tidak."
        ) : sampaiKecamatan ? (
          "Pilih sampai kecamatan — itu satuan yang dilihat host saat menghitung permintaan."
        ) : (
          "Dipakai sebagai titik awal pencarian, dan bisa diubah kapan pun dari halaman akun."
        )}
      </p>

      {/* Kegagalan di tingkat dalam: daftarnya kosong padahal induknya sudah
          dipilih. Yang ditawarkan coba lagi, bukan kolom teks. */}
      {gagal && provinsi.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="text-xs text-warn">Sebagian daftar gagal diambil.</p>
          <button
            type="button"
            onClick={cobaLagi}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}
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

/**
 * Ambil satu tingkat, dan tandai kegagalannya alih-alih menelannya.
 *
 * Versi sebelumnya menulis `.catch(() => [])`, yang membuat kegagalan jaringan
 * terlihat sama persis dengan "wilayah ini memang tidak punya kecamatan" —
 * dan orangnya menatap dropdown kosong tanpa tahu harus menunggu atau
 * menyerah.
 */
async function ambilAtauTandai(
  tingkat: Tingkat,
  kode: string,
  tandai: (v: boolean) => void
): Promise<Wilayah[]> {
  try {
    const hasil = await ambilWilayah(tingkat, kode);
    return hasil;
  } catch {
    tandai(true);
    return [];
  }
}
