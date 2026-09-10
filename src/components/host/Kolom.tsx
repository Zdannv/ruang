"use client";

import React from "react";
import { X } from "lucide-react";

const DASAR =
  "mt-1.5 w-full rounded-xl bg-card px-3.5 py-2.5 text-sm text-ink ring-1 ring-line " +
  "placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function Kolom({
  id,
  label,
  bantuan,
  satuan,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  bantuan?: string;
  satuan?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input id={id} {...props} className={DASAR} />
        {satuan && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">
            {satuan}
          </span>
        )}
      </div>
      {bantuan && <p className="mt-1.5 text-xs leading-relaxed text-muted">{bantuan}</p>}
    </div>
  );
}

/**
 * Teks isian jadi angka, atau null kalau belum jadi apa-apa.
 *
 * Koma diterima sebagai pemisah desimal — itu cara orang Indonesia menulis
 * angka. Dipakai DUA KALI dan wajib sama persis di keduanya: saat mengirim
 * nilai ke atas, dan saat membandingkan nilai yang datang dari atas dengan
 * teks yang sedang diketik. Versi pertama lupa yang kedua, dan akibatnya
 * koma terhapus tepat saat diketik: `Number("2,")` itu NaN, jadi
 * perbandingannya selalu meleset dan teksnya ditimpa "2".
 */
function keAngka(teks: string): number | null {
  if (teks.trim() === "") return null;
  const n = Number(teks.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Kotak isian angka yang boleh KOSONG selama diisi.
 *
 * `<input type="number">` yang nilainya angka biasa tidak pernah bisa
 * dikosongkan: begitu karakter terakhir dihapus, induknya menerima "" —
 * diubah jadi 0 — lalu mengirim 0 balik ke layar. Yang terlihat orangnya:
 * angka nol yang muncul sendiri dan tidak bisa dihapus, dan tiap angka baru
 * mendarat di belakangnya jadi "0700000".
 *
 * Jadi teksnya disimpan di sini apa adanya, dan yang dikirim ke atas
 * `number | null`. Kosong berarti null, bukan nol — bedanya nyata: deposit
 * nol adalah pernyataan ("tidak ada deposit"), deposit kosong adalah
 * pertanyaan yang belum dijawab. Induknya yang memutuskan apakah kosong itu
 * boleh, sebelum mengirim.
 *
 * Dipisah dari `KolomAngka` supaya bisa dipakai di baris manifes, yang
 * labelnya `sr-only` dan lebar kotaknya diatur sendiri. Isian di dalam
 * perulangan tidak bisa memakai hook induknya — ia harus jadi komponen.
 */
export function InputAngka({
  nilai,
  onNilai,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  nilai: number | null;
  onNilai: (n: number | null) => void;
}) {
  /*
    `min`, `max`, dan `step` sengaja TIDAK diteruskan ke DOM.

    Kotaknya `type="text"` (alasannya di bawah), dan peramban mengabaikan
    ketiganya di sana. Meneruskannya berarti atribut yang terlihat berlaku
    padahal tidak — dan yang membaca kodenya nanti akan mengira batasnya
    sudah dijaga. Penggantinya pemeriksaan sebelum kirim di formulirnya.
    Ketiganya tetap diterima sebagai prop supaya pemanggilnya tidak perlu
    tahu perbedaan ini.
  */
  const dom = { ...props };
  delete dom.min;
  delete dom.max;
  delete dom.step;
  const [teks, setTeks] = React.useState(() => (nilai == null ? "" : String(nilai)));
  const [nilaiLama, setNilaiLama] = React.useState(nilai);

  /*
    Menyesuaikan state saat prop berubah — pola resmi React, dan sengaja
    BUKAN `useEffect`: efek berjalan setelah render, jadi akan ada satu
    gambar dengan angka basi di layar.

    Perbandingannya lewat `dariTeks`, bukan langsung ke `nilai`. Kalau tidak,
    orang yang mengetik "7," (mau menulis 7,5) akan melihat komanya hilang
    seketika: teks "7," bernilai 7, induknya mengirim 7 kembali, dan teksnya
    ditimpa jadi "7".
  */
  if (nilai !== nilaiLama) {
    setNilaiLama(nilai);
    if (nilai !== keAngka(teks)) setTeks(nilai == null ? "" : String(nilai));
  }

  return (
    <input
      /*
        `text` dengan papan tik angka, BUKAN `type="number"` — dan ini
        keputusan, bukan kelalaian.

        `input[type=number].value` mengembalikan STRING KOSONG untuk isi yang
        belum jadi angka sah. Orang yang mengetik "2," dalam perjalanan menuju
        "2,5" membuat kolomnya melapor kosong, dan teks mentahnya tidak bisa
        dibaca sama sekali dari kode — jadi tidak ada cara menjaganya.

        Sekalian menyelesaikan hal yang lebih sering terjadi di sini: orang
        Indonesia menulis desimal dengan KOMA. Di `type=number` "2,5" ditolak
        peramban tanpa penjelasan apa pun; di sini ia diterima dan
        diterjemahkan.

        Yang hilang: tombol naik-turun dan pemeriksaan `min`/`step` oleh
        peramban. Keduanya sengaja tidak diteruskan ke DOM (lihat `_min`,
        `_step` di atas) supaya tidak ada atribut yang terlihat berlaku
        padahal tidak. Penggantinya pemeriksaan sebelum kirim di formulirnya.
      */
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...dom}
      value={teks}
      onChange={(e) => {
        // Huruf dan spasi dibuang; koma dan titik dibiarkan supaya keduanya
        // bisa dipakai sebagai pemisah desimal.
        const cumaAngka = e.target.value.replace(/[^\d.,]/g, "");
        // Pemisah kedua dan seterusnya dibuang, yang PERTAMA dipertahankan:
        // "2,5,5" → "2,55". Membuang yang pertama akan mengubah 2,5 jadi 25
        // saat orangnya salah pencet sekali.
        const [utuh, ...pecahan] = cumaAngka.split(/[.,]/);
        const pemisah = cumaAngka.match(/[.,]/)?.[0] ?? "";
        const bersih =
          // "07" → "7". Nol di depan itu sisa dari nilai sebelumnya, bukan
          // yang diketik orangnya. "0,5" tidak kena — nolnya diikuti pemisah.
          utuh.replace(/^0+(\d)/, "$1") +
          (pecahan.length > 0 ? pemisah + pecahan.join("") : "");
        setTeks(bersih);
        onNilai(keAngka(bersih));
      }}
      // Merapikan sisa ketikan yang sah tapi belum jadi angka: "7,", ",".
      // Setelah kolomnya ditinggalkan, yang tampil selalu angka yang
      // benar-benar tersimpan.
      onBlur={() => setTeks(nilai == null ? "" : String(nilai))}
    />
  );
}

/** `InputAngka` beserta label, satuan, dan keterangannya. */
export function KolomAngka({
  id,
  label,
  bantuan,
  satuan,
  nilai,
  onNilai,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  id: string;
  label: string;
  bantuan?: string;
  satuan?: string;
  nilai: number | null;
  onNilai: (n: number | null) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <InputAngka id={id} {...props} nilai={nilai} onNilai={onNilai} className={DASAR} />
        {satuan && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">
            {satuan}
          </span>
        )}
      </div>
      {bantuan && <p className="mt-1.5 text-xs leading-relaxed text-muted">{bantuan}</p>}
    </div>
  );
}

export function Pilihan({
  id,
  label,
  bantuan,
  opsi,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  bantuan?: string;
  /** [nilai, label], biasanya `Object.entries(LABEL_*)`. */
  opsi: [string, string][];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select id={id} {...props} className={`${DASAR} cursor-pointer`}>
        {opsi.map(([nilai, teks]) => (
          <option key={nilai} value={nilai}>
            {teks}
          </option>
        ))}
      </select>
      {bantuan && <p className="mt-1.5 text-xs leading-relaxed text-muted">{bantuan}</p>}
    </div>
  );
}

/**
 * Pilihan ganda untuk kolom `text[]`.
 *
 * Dibangun dari checkbox sungguhan, bukan tombol: pembaca layar mengumumkan
 * keadaan tercentangnya, dan keyboard bisa menyalakannya dengan spasi tanpa
 * perlu ditulis manual.
 */
export function KotakCentangGanda({
  label,
  bantuan,
  opsi,
  nilai,
  onChange,
  bolehLain = false,
  contohLain,
}: {
  label: string;
  bantuan?: string;
  opsi: [string, string][];
  nilai: string[];
  onChange: (nilai: string[]) => void;
  /**
   * Izinkan isian di luar daftar.
   *
   * Daftar tertutup selalu salah untuk sebagian orang, dan yang tidak
   * menemukan pilihannya akan mencentang yang paling mendekati — yang
   * artinya keterangannya jadi salah, bukan kosong. Isian bebas di sini
   * tidak merusak apa pun: kolomnya `text[]`, dan pencocokan jenis usaha di
   * database membandingkan teksnya apa adanya.
   */
  bolehLain?: boolean;
  contohLain?: string;
}) {
  const [lain, setLain] = React.useState("");
  const [bukaLain, setBukaLain] = React.useState(false);
  const dikenal = new Set(opsi.map(([kode]) => kode));
  const tambahan = nilai.filter((v) => !dikenal.has(v));

  const tambah = () => {
    const v = lain.trim().slice(0, 40);
    if (v === "" || nilai.includes(v)) {
      setLain("");
      return;
    }
    onChange([...nilai, v]);
    setLain("");
  };

  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      {bantuan && <p className="mt-1 text-xs leading-relaxed text-muted">{bantuan}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {opsi.map(([kode, teks]) => {
          const aktif = nilai.includes(kode);
          return (
            <label
              key={kode}
              className={`cursor-pointer select-none rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${
                aktif
                  ? "bg-brand-soft text-brand-dark ring-brand/30"
                  : "bg-card text-ink ring-line hover:bg-paper"
              }`}
            >
              <input
                type="checkbox"
                checked={aktif}
                onChange={() =>
                  onChange(aktif ? nilai.filter((v) => v !== kode) : [...nilai, kode])
                }
                className="sr-only"
              />
              {teks}
            </label>
          );
        })}

        {/* Isian sendiri tampil sebagai chip yang bisa dibuang, bukan sebagai
            teks di kolom terpisah, supaya ia terbaca setara dengan pilihan
            yang lain, dan supaya jelas ia sudah tersimpan. */}
        {tambahan.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-2 pl-3.5 pr-2 text-sm font-medium text-brand-dark ring-1 ring-brand/30"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(nilai.filter((x) => x !== v))}
              aria-label={`Hapus ${v}`}
              className="cursor-pointer rounded-full p-0.5 text-brand-dark/70 hover:text-warn"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        {bolehLain && !bukaLain && (
          <button
            type="button"
            onClick={() => setBukaLain(true)}
            className="cursor-pointer select-none rounded-full px-3.5 py-2 text-sm font-medium text-brand ring-1 ring-dashed ring-brand/40 transition-colors hover:bg-brand-soft"
          >
            + Lainnya
          </button>
        )}
      </div>

      {bolehLain && bukaLain && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={lain}
            maxLength={40}
            placeholder={contohLain ?? "Tulis sendiri"}
            onChange={(e) => setLain(e.target.value)}
            /* Enter menambahkan isiannya, TIDAK mengirim formulir. Formulir
               ini panjang, dan terkirim setengah jadi karena satu Enter di
               kolom kecil adalah kehilangan yang tidak perlu. */
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                tambah();
              }
            }}
            className="min-w-0 flex-1 rounded-xl bg-card px-3.5 py-2 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          <button
            type="button"
            onClick={tambah}
            className="cursor-pointer rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Tambah
          </button>
        </div>
      )}
    </fieldset>
  );
}

export function Bagian({
  judul,
  keterangan,
  children,
}: {
  judul: string;
  keterangan?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
      <h2 className="font-display text-lg font-bold tracking-tight">{judul}</h2>
      {keterangan && (
        <p className="mt-1 text-xs leading-relaxed text-muted">{keterangan}</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
