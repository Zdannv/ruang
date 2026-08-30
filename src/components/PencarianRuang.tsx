"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Crosshair, MapPin, SearchX } from "lucide-react";
import KartuRuang from "@/components/KartuRuang";
import { cariRuang, type RuangDenganFoto } from "@/lib/ruang";
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
const PIL_MATI = "border border-line bg-card text-ink hover:bg-paper";

function angkaDari(nilai: string | null, bawaan: number): number {
  const n = Number(nilai);
  return Number.isFinite(n) && nilai !== null && nilai !== "" ? n : bawaan;
}

/**
 * Halaman pencarian: titik + radius + filter, lalu kartu hasil.
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

  const preset = presetDari(lat, lng);
  const namaTitik = preset?.nama ?? "Lokasi saya";
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
      (pos) => {
        ubah({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        });
      },
      () => {
        setGalatLokasi(
          "Lokasi tidak bisa dibaca. Pilih salah satu titik di atas dulu."
        );
      },
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
  const daftar = memuat ? [] : (hasil?.daftar ?? []);
  const galat = memuat ? null : hasil?.galat;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <header className="pt-8 sm:pt-12">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ruang kosong di dekatmu
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Pilih titikmu, atur radius, lalu saring seukuran barang dan anggaranmu.
          Jarak dihitung dari lokasi asli ruangnya, jadi angkanya persis.
        </p>
      </header>

      <section
        aria-label="Filter pencarian"
        className="mt-6 space-y-5 rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5"
      >
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Cari dari
            </h2>
            <button
              type="button"
              onClick={pakaiLokasiSaya}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              <Crosshair className="h-4 w-4" />
              Gunakan lokasi saya
            </button>
          </div>

          <div className="-mx-4 mt-2.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
              {TITIK_PRESET.map((t) => {
                const aktif = preset?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => ubah({ lat: String(t.lat), lng: String(t.lng) })}
                    className={`${PIL} ${aktif ? PIL_AKTIF : PIL_MATI}`}
                  >
                    {t.nama}
                  </button>
                );
              })}
            </div>
          </div>

          {!preset && (
            <p className="angka mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5" />
              Memakai lokasimu: {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          )}
          {galatLokasi && <p className="mt-2 text-xs text-warn">{galatLokasi}</p>}
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Radius
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {RADIUS_PILIHAN.map((km) => (
              <button
                key={km}
                type="button"
                aria-pressed={radiusKm === km}
                onClick={() => ubah({ radius: String(km) })}
                className={`angka ${PIL} ${radiusKm === km ? PIL_AKTIF : PIL_MATI}`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Ukuran minimum
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {VOLUME_PILIHAN.map((v) => {
              const aktif = volumeMin === v.nilai;
              return (
                <button
                  key={v.nilai}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => ubah({ volume: v.nilai ? String(v.nilai) : null })}
                  className={`${PIL} ${aktif ? PIL_AKTIF : PIL_MATI}`}
                >
                  {v.label}
                  {v.bantuan && (
                    <span
                      className={
                        aktif ? "ml-1.5 text-white/75" : "ml-1.5 text-muted"
                      }
                    >
                      {v.bantuan}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Harga maksimum
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {HARGA_PILIHAN.map((h) => {
              const aktif = hargaMaks === h.nilai;
              return (
                <button
                  key={h.nilai}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => ubah({ harga: h.nilai ? String(h.nilai) : null })}
                  className={`angka ${PIL} ${aktif ? PIL_AKTIF : PIL_MATI}`}
                >
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <p aria-live="polite" className="mt-6 text-sm text-muted">
        {memuat
          ? "Mencari ruang terdekat…"
          : galat
            ? "Gagal memuat hasil."
            : daftar.length === 0
              ? `Belum ada ruang dalam ${radiusKm} km dari ${namaTitik}.`
              : `${daftar.length} ruang dalam ${radiusKm} km dari ${namaTitik}, terdekat lebih dulu.`}
      </p>

      {memuat && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-line bg-card"
            />
          ))}
        </div>
      )}

      {galat && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-line bg-card p-10 text-center">
          <AlertCircle className="h-8 w-8 text-warn" />
          <p className="text-sm font-semibold">Hasil tidak bisa dimuat</p>
          <p className="max-w-md text-xs leading-relaxed text-muted">{galat}</p>
        </div>
      )}

      {!memuat && !galat && daftar.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-line bg-card p-10 text-center">
          <SearchX className="h-8 w-8 text-muted" />
          <p className="text-sm font-semibold">Belum ada yang cocok di sini</p>
          <p className="max-w-md text-xs leading-relaxed text-muted">
            Coba perlebar radiusnya, atau longgarkan batas ukuran dan harganya.
          </p>
          {radiusKm < 15 && (
            <button
              type="button"
              onClick={() => ubah({ radius: "15" })}
              className="mt-1 cursor-pointer rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Perlebar ke 15 km
            </button>
          )}
        </div>
      )}

      {!memuat && daftar.length > 0 && (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      <p className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
        Alamat lengkap dibuka setelah jadwal survei disetujui host. Ruang di sini
        disewakan langsung oleh pemiliknya — platform menengahi kalau ada sengketa,
        tapi tidak memberi ganti rugi.
      </p>
    </div>
  );
}
