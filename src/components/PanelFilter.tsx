"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

export type OpsiFilter = {
  kunci: string;
  label: string;
  bantuan?: string | null;
  aktif: boolean;
  pilih: () => void;
};

export type KelompokFilter = {
  kunci: string;
  judul: string;
  /** Pilihan yang sedang berlaku, ditulis di bawah judul kelompoknya. */
  ringkas: string | null;
  opsi: OpsiFilter[];
};

/**
 * Panel penyaring `/cari`, berbentuk dialog dua kolom.
 *
 * **Menggantikan bagian yang membuka-tutup di tengah halaman**, 18 September
 * 2026, dengan OLX sebagai rujukan. Yang lama menaruh kelima kelompoknya
 * bertumpuk sebagai baris pil, dan akibatnya dua:
 *
 * 1. Membukanya mendorong hasil pencarian ratusan piksel ke bawah, di halaman
 *    yang satu-satunya alasan dibuka adalah hasil pencarian. Itu persis
 *    pelanggaran yang sudah pernah diukur dan diperbaiki sekali (lihat
 *    CLAUDE.md, "halaman alat kerja tidak punya hero").
 * 2. Kelima kelompok terlihat sekaligus, jadi tidak ada satu pun yang
 *    terbaca sebagai pertanyaan. Yang muncul di layar cuma dinding pil.
 *
 * Dua kolom menjawab keduanya sekaligus: kelompoknya jadi daftar pendek di
 * kiri, dan yang sedang dijawab cuma satu. Halamannya sendiri tidak bergeser
 * sama sekali.
 *
 * **Penyaringnya langsung berlaku saat ditekan, tidak menunggu "Terapkan".**
 * Hasilnya memang di balik panel, tapi hitungannya ada di tombol bawah, dan
 * itu yang benar-benar ingin diketahui orangnya sebelum menutup: "kalau saya
 * pilih ini, sisa berapa". Tombol Terapkan yang menunda perubahan membuat
 * angka itu mustahil ditampilkan.
 */
export default function PanelFilter({
  buka,
  tutup,
  kelompok,
  jumlahFilter,
  bersihkan,
  ringkasanHasil,
}: {
  buka: boolean;
  tutup: () => void;
  kelompok: KelompokFilter[];
  jumlahFilter: number;
  bersihkan: () => void;
  /** Teks tombol tutup, mis. "Lihat 12 lahan". */
  ringkasanHasil: string;
}) {
  const [dipilih, setDipilih] = useState<string | null>(null);

  // Kelompoknya bisa berubah saat hasilnya berubah: "Jenis usaha" hilang
  // kalau tidak ada satu pun lahan terbuka di radius ini. Jadi kelompok aktif
  // diturunkan, bukan disimpan mentah, dan jatuh ke yang pertama kalau yang
  // dipilih sudah tidak ada. Menyimpannya mentah berarti panelnya bisa
  // menampilkan kolom kanan yang kosong tanpa penjelasan apa pun.
  const aktif = kelompok.find((k) => k.kunci === dipilih) ?? kelompok[0];

  useEffect(() => {
    if (!buka) return;
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutup();
    };
    document.addEventListener("keydown", tekan);
    // Halaman di belakangnya tidak boleh ikut tergulir saat panelnya
    // digulir sampai mentok, terutama di telepon.
    const semula = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tekan);
      document.body.style.overflow = semula;
    };
  }, [buka, tutup]);

  if (!buka || !aktif) return null;

  return (
    <div
      /* z-60, di atas navigasi bawah yang z-50. Keduanya sempat sama, dan
         karena navigasinya dirender belakangan di layout akar ia menang:
         tombol "Hapus semua" dan "Lihat N lahan" tertutup rapi di telepon,
         tanpa satu pun galat. Ketahuan dari melihat layarnya. */
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-center sm:p-6"
      onClick={tutup}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter pencarian"
        onClick={(e) => e.stopPropagation()}
        className="naik flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-card sm:max-h-[36rem] sm:max-w-3xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3.5 sm:px-5">
          <h2 className="font-display text-lg font-bold tracking-tight">Filter</h2>
          <button
            type="button"
            onClick={tutup}
            aria-label="Tutup filter"
            className="cursor-pointer rounded-full p-1.5 text-muted transition-colors hover:bg-paper hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Kolom kiri: daftar kelompok. Lebarnya tetap, dan judulnya boleh
              turun ke baris kedua — memangkasnya jadi "Barang yang…" membuat
              orang harus menekan satu per satu untuk tahu isinya apa. */}
          <div className="geser-x w-32 shrink-0 overflow-y-auto border-r border-line bg-paper sm:w-52">
            {kelompok.map((k) => {
              const ini = k.kunci === aktif.kunci;
              return (
                <button
                  key={k.kunci}
                  type="button"
                  onClick={() => setDipilih(k.kunci)}
                  className={`flex w-full cursor-pointer items-center gap-2 border-l-[3px] px-3 py-3 text-left transition-colors sm:px-4 ${
                    ini
                      ? "border-brand bg-card"
                      : "border-transparent text-muted hover:bg-card/60"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-xs font-semibold leading-tight sm:text-sm ${
                        ini ? "text-ink" : ""
                      }`}
                    >
                      {k.judul}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-[11px] leading-tight ${
                        k.ringkas ? "font-medium text-brand" : "text-muted"
                      }`}
                    >
                      {k.ringkas ?? "Semua"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Kolom kanan: pilihan kelompok yang sedang dibuka. Satu kolom di
              telepon karena sisa lebarnya cuma sekitar 240px; dua dari `sm`. */}
          <div className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {aktif.opsi.map((o) => (
                <button
                  key={o.kunci}
                  type="button"
                  aria-pressed={o.aktif}
                  onClick={o.pilih}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-left text-sm transition-colors ${
                    o.aktif
                      ? "bg-brand-soft ring-1 ring-brand/40"
                      : "ring-1 ring-line hover:bg-paper"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-medium ${o.aktif ? "text-brand-dark" : ""}`}
                    >
                      {o.label}
                    </span>
                    {o.bantuan && (
                      <span className="mt-0.5 block text-xs text-muted">{o.bantuan}</span>
                    )}
                  </span>
                  {o.aktif && <Check className="h-4 w-4 shrink-0 text-brand" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-3">
          <button
            type="button"
            onClick={bersihkan}
            disabled={jumlahFilter === 0}
            className="cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Hapus semua
          </button>
          <button
            type="button"
            onClick={tutup}
            className="cursor-pointer rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {ringkasanHasil}
          </button>
        </div>
      </div>
    </div>
  );
}
