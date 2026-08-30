"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ChevronDown, Crosshair, MapPin, Search, SearchX } from "lucide-react";
import KartuRuang from "@/components/KartuRuang";
import { IKON_TIPE } from "@/components/IkonTipe";
import { cariRuang, type RuangDenganFoto, type TipeRuang } from "@/lib/ruang";
import { LABEL_TIPE } from "@/lib/label";
import {
  HARGA_PILIHAN,
  RADIUS_BAWAAN,
  RADIUS_PILIHAN,
  TITIK_BAWAAN,
  TITIK_PRESET,
  VOLUME_PILIHAN,
  presetDari,
} from "@/lib/titik";

const PIL =
  "cursor-pointer rounded-full px-3.5 py-2 text-sm font-medium transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const PIL_AKTIF = "bg-brand text-white";
const PIL_MATI = "bg-card text-ink ring-1 ring-line hover:bg-brand-soft";

const TIPE_URUT: TipeRuang[] = [
  "kamar",
  "garasi",
  "gudang",
  "lantai_ruko",
  "mezanin",
  "bawah_tangga",
  "loteng",
  "kontainer",
];

function angkaDari(nilai: string | null, bawaan: number): number {
  const n = Number(nilai);
  return Number.isFinite(n) && nilai !== null && nilai !== "" ? n : bawaan;
}

/**
 * Halaman pencarian: titik + radius di bilah utama, tipe dan filter lain di
 * bawahnya, lalu kartu hasil.
 *
 * Seluruh keadaan layar ada di URL. Saat presentasi itu berarti satu tautan
 * bisa membuka persis kombinasi filter yang mau ditunjukkan, tanpa mengklik
 * ulang di depan orang — dan tombol back berperilaku seperti yang diharapkan.
 */
export default function PencarianRuang() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const lat = angkaDari(searchParams.get("lat"), TITIK_BAWAAN.lat);
  const lng = angkaDari(searchParams.get("lng"), TITIK_BAWAAN.lng);
  const radiusKm = angkaDari(searchParams.get("radius"), RADIUS_BAWAAN);
  const volumeMin = angkaDari(searchParams.get("volume"), 0);
  const hargaMaks = angkaDari(searchParams.get("harga"), 0);
  const tipe = (searchParams.get("tipe") ?? "") as TipeRuang | "";

  const preset = presetDari(lat, lng);
  const namaTitik = preset?.nama ?? "lokasimu";
  const kunci = `${lat}|${lng}|${radiusKm}|${volumeMin}|${hargaMaks}`;

  const ubah = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      // `replace`, bukan `push`: mengubah radius empat kali tidak boleh berarti
      // empat kali tekan back untuk keluar dari halaman.
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const [galatLokasi, setGalatLokasi] = useState<string | null>(null);
  const pakaiLokasiSaya = () => {
    if (!("geolocation" in navigator)) {
      setGalatLokasi("Peramban ini tidak mendukung deteksi lokasi.");
      return;
    }
    setGalatLokasi(null);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        ubah({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }),
      () => setGalatLokasi("Lokasi tidak bisa dibaca. Pilih titik dari daftar saja."),
      { timeout: 8000 }
    );
  };

  // Hasil disimpan bersama kombinasi filter yang menghasilkannya, jadi keadaan
  // "sedang memuat" bisa diturunkan dari perbandingan kunci — tanpa memanggil
  // setState langsung di dalam efek.
  const [hasil, setHasil] = useState<{
    kunci: string;
    daftar: RuangDenganFoto[];
    galat: string | null;
  } | null>(null);
  const permintaan = useRef(0);

  const filter = useMemo(
    () => ({ lat, lng, radiusKm, volumeMin, hargaMaks }),
    [lat, lng, radiusKm, volumeMin, hargaMaks]
  );

  useEffect(() => {
    const id = ++permintaan.current;
    cariRuang(filter)
      .then((daftar) => {
        if (id === permintaan.current) setHasil({ kunci, daftar, galat: null });
      })
      .catch((e: unknown) => {
        if (id !== permintaan.current) return;
        setHasil({
          kunci,
          daftar: [],
          galat: e instanceof Error ? e.message : "Gagal memuat hasil.",
        });
      });
  }, [filter, kunci]);

  const memuat = hasil?.kunci !== kunci;
  const galat = memuat ? null : hasil?.galat;
  // Dibungkus useMemo supaya rujukan arraynya stabil; `tipeTersedia` di bawah
  // bergantung padanya, dan array baru tiap render membuat memo itu tidak ada
  // gunanya.
  const semua = useMemo(
    () => (memuat ? [] : (hasil?.daftar ?? [])),
    [memuat, hasil]
  );

  // Tipe disaring di sisi klien, bukan lewat parameter fungsi database.
  // `ruang_terdekat()` sudah mengembalikan kolom `tipe`, dan menambah parameter
  // baru berarti mengubah 01_schema.sql yang sudah diuji dan dijalankan.
  const daftar = tipe ? semua.filter((r) => r.tipe === tipe) : semua;

  // Tipe yang memang ada isinya dalam radius sekarang. Menawarkan "Kontainer"
  // padahal tidak ada satu pun di sekitar situ cuma memancing hasil kosong.
  const tipeTersedia = useMemo(() => {
    const ada = new Set(semua.map((r) => r.tipe));
    return TIPE_URUT.filter((t) => ada.has(t));
  }, [semua]);

  const bersihkan = () => router.replace(pathname, { scroll: false });

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────
          Latar dibuat gradien, bukan foto: belum ada aset foto sendiri, dan
          foto acak dari picsum tidak bisa diandalkan untuk layar pertama yang
          dilihat calon partner. Ganti `bg-*` di bawah dengan <Image> begitu
          ada satu foto ruang sungguhan yang layak dipajang. */}
      <section className="relative -mt-[68px] overflow-hidden bg-gradient-to-br from-[#0d2a6b] via-brand to-[#3f7bff] pb-10 pt-[104px] sm:pb-14 sm:pt-[132px]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Ruang kosong di dekatmu, disewakan tetangga sendiri
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            Pilih titikmu, atur radius, lalu bandingkan ruangnya. Jarak dihitung dari
            lokasi asli ruangnya, jadi angkanya persis.
          </p>

          {/* Bilah pencarian: menumpuk di layar kecil, jadi satu pil panjang
              dari sm ke atas. */}
          <div className="mt-7 flex flex-col gap-2 rounded-3xl bg-card p-2 shadow-xl shadow-ink/10 sm:flex-row sm:items-center sm:rounded-full sm:gap-0 sm:p-1.5">
            <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 hover:bg-paper sm:rounded-full">
              <MapPin className="h-4.5 w-4.5 shrink-0 text-brand" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Cari dari
                </span>
                <span className="relative flex items-center">
                  <select
                    value={preset?.id ?? "custom"}
                    onChange={(e) => {
                      const t = TITIK_PRESET.find((x) => x.id === e.target.value);
                      if (t) ubah({ lat: String(t.lat), lng: String(t.lng) });
                    }}
                    className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-semibold text-ink focus:outline-none"
                  >
                    {!preset && <option value="custom">Lokasi saya</option>}
                    {TITIK_PRESET.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-muted" />
                </span>
              </span>
            </label>

            <span className="hidden h-9 w-px bg-line sm:block" />

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 hover:bg-paper sm:rounded-full">
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Radius
                </span>
                <span className="relative flex items-center">
                  <select
                    value={radiusKm}
                    onChange={(e) => ubah({ radius: e.target.value })}
                    className="angka w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-semibold text-ink focus:outline-none"
                  >
                    {RADIUS_PILIHAN.map((km) => (
                      <option key={km} value={km}>
                        {km} km
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-muted" />
                </span>
              </span>
            </label>

            <a
              href="#hasil"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:ml-2"
            >
              <Search className="h-4 w-4" />
              Lihat hasil
            </a>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={pakaiLokasiSaya}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white"
            >
              <Crosshair className="h-4 w-4" />
              Gunakan lokasi saya
            </button>
            {!preset && (
              <span className="angka text-xs text-white/70">
                Titikmu: {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            )}
            {galatLokasi && <span className="text-xs text-white/90">{galatLokasi}</span>}
          </div>
        </div>
      </section>

      <div id="hasil" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6 lg:px-8">
        {/* ── Tipe ruang ─────────────────────────────────────────────────── */}
        {tipeTersedia.length > 0 && (
          <section aria-label="Tipe ruang" className="pt-8 sm:pt-10">
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              Mau menyimpan apa?
            </h2>

            <div className="geser-x -mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex w-max gap-3 pb-1">
                <button
                  type="button"
                  aria-pressed={!tipe}
                  onClick={() => ubah({ tipe: null })}
                  className={`flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl text-xs font-semibold transition-colors ${
                    tipe
                      ? "bg-card text-ink ring-1 ring-line hover:bg-brand-soft"
                      : "bg-brand text-white"
                  }`}
                >
                  <Search className="h-6 w-6" />
                  Semua
                </button>

                {tipeTersedia.map((t) => {
                  const Ikon = IKON_TIPE[t];
                  const aktif = tipe === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={aktif}
                      onClick={() => ubah({ tipe: aktif ? null : t })}
                      className={`flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl px-2 text-center text-xs font-semibold leading-tight transition-colors ${
                        aktif
                          ? "bg-brand text-white"
                          : "bg-card text-ink ring-1 ring-line hover:bg-brand-soft"
                      }`}
                    >
                      <Ikon className="h-6 w-6" />
                      {LABEL_TIPE[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Filter lain ────────────────────────────────────────────────── */}
        <section aria-label="Filter ukuran dan harga" className="mt-8 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Ukuran minimum
            </h3>
            <div className="geser-x -mx-4 mt-2.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
                {VOLUME_PILIHAN.map((v) => {
                  const aktif = volumeMin === v.nilai;
                  return (
                    <button
                      key={v.nilai}
                      type="button"
                      aria-pressed={aktif}
                      onClick={() => ubah({ volume: v.nilai ? String(v.nilai) : null })}
                      className={`${PIL} ${aktif ? PIL_AKTIF : PIL_MATI} whitespace-nowrap`}
                    >
                      {v.label}
                      {v.bantuan && (
                        <span className={aktif ? "ml-1.5 text-white/75" : "ml-1.5 text-muted"}>
                          {v.bantuan}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Harga maksimum
            </h3>
            <div className="geser-x -mx-4 mt-2.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
                {HARGA_PILIHAN.map((h) => {
                  const aktif = hargaMaks === h.nilai;
                  return (
                    <button
                      key={h.nilai}
                      type="button"
                      aria-pressed={aktif}
                      onClick={() => ubah({ harga: h.nilai ? String(h.nilai) : null })}
                      className={`angka ${PIL} ${aktif ? PIL_AKTIF : PIL_MATI} whitespace-nowrap`}
                    >
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Hasil ──────────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 aria-live="polite" className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            {memuat
              ? "Mencari ruang terdekat…"
              : galat
                ? "Hasil tidak bisa dimuat"
                : daftar.length === 0
                  ? `Belum ada ruang dalam ${radiusKm} km`
                  : `${daftar.length} ruang dalam ${radiusKm} km`}
          </h2>
          <p className="text-sm text-muted">
            dari {namaTitik}
            {tipe ? ` · ${LABEL_TIPE[tipe].toLowerCase()} saja` : ""} · terdekat lebih dulu
          </p>
        </div>

        {memuat && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-card ring-1 ring-line" />
            ))}
          </div>
        )}

        {galat && (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center ring-1 ring-line">
            <AlertCircle className="h-8 w-8 text-warn" />
            <p className="text-sm font-semibold">Ada yang tidak beres saat mengambil data</p>
            <p className="max-w-md text-xs leading-relaxed text-muted">{galat}</p>
          </div>
        )}

        {!memuat && !galat && daftar.length === 0 && (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center ring-1 ring-line">
            <SearchX className="h-8 w-8 text-muted" />
            <p className="text-sm font-semibold">Belum ada yang cocok di sini</p>
            <p className="max-w-md text-xs leading-relaxed text-muted">
              Coba perlebar radiusnya, atau longgarkan tipe, ukuran, dan harganya.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {radiusKm < 15 && (
                <button
                  type="button"
                  onClick={() => ubah({ radius: "15" })}
                  className="cursor-pointer rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                  Perlebar ke 15 km
                </button>
              )}
              <button
                type="button"
                onClick={bersihkan}
                className="cursor-pointer rounded-full bg-card px-5 py-2.5 text-xs font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
              >
                Hapus semua filter
              </button>
            </div>
          </div>
        )}

        {!memuat && daftar.length > 0 && (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {daftar.map((ruang) => (
              <li key={ruang.id}>
                <KartuRuang ruang={ruang} />
              </li>
            ))}
          </ul>
        )}

        {/* Keputusan produk yang dikunci: platform menengahi sengketa, tapi tidak
            membayar ganti rugi. Kalimatnya ditulis apa adanya di layar pencarian
            supaya tidak ada yang datang ke sini mengira barangnya diasuransikan. */}
        <p className="mt-12 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          Alamat lengkap dibuka setelah jadwal survei disetujui host. Ruang di sini
          disewakan langsung oleh pemiliknya — platform menengahi kalau ada sengketa,
          tapi tidak memberi ganti rugi.
        </p>
      </div>
    </>
  );
}
