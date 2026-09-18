"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronDown,
  Crosshair,
  Droplets,
  Flame,
  Home,
  Inbox,
  MapPin,
  Ruler,
  Search,
  SearchX,
  SlidersHorizontal,
  Store,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import KartuRuang from "@/components/KartuRuang";
import PanelFilter, { type KelompokFilter } from "@/components/PanelFilter";
import { IKON_TIPE } from "@/components/IkonTipe";
import { cariRuang, type RuangDenganFoto, type TipeRuang } from "@/lib/ruang";
import { klienBrowser } from "@/lib/supabase/browser";
import { LABEL_KATEGORI, LABEL_TIPE, LABEL_USAHA, pakaiLuas, rupiah } from "@/lib/label";
import {
  HARGA_PILIHAN,
  MUKA_PILIHAN,
  RADIUS_BAWAAN,
  RADIUS_PILIHAN,
  TITIK_BAWAAN,
  TITIK_PRESET,
  VOLUME_PILIHAN,
  presetDari,
} from "@/lib/titik";
import {
  bacaTitik,
  izinLokasiSudahAda,
  simpanTitik,
  titikProfil,
} from "@/lib/lokasiTersimpan";

/**
 * Radius kueri kedua, yang mengisi bagian "di luar radiusmu".
 *
 * 150 km, bukan tanpa batas: sejauh itu masih terbaca sebagai "agak jauh tapi
 * masih mungkin didatangi", dan lahan di pulau lain bukan jawaban atas
 * pertanyaan siapa pun. Kalau nanti lahannya sudah ribuan, angka ini yang
 * pertama diturunkan.
 */
const RADIUS_LUAS_KM = 150;

/**
 * Pintasan niat di kaki halaman.
 *
 * Tiap parameternya HARUS yang benar-benar ditangani halaman ini — `usaha`,
 * `muka`, `harga`, `tipe`. Pintasan yang menjanjikan penyaring yang belum ada
 * mengantar orang ke hasil kosong yang tidak bisa ia perbaiki, dan itu lebih
 * buruk daripada tidak ada pintasan.
 */
const PINTASAN = [
  { label: "Gerobak makanan", param: "usaha=makanan", ikon: UtensilsCrossed },
  { label: "Boleh menggoreng", param: "usaha=masak_berminyak", ikon: Flame },
  { label: "Cuci motor", param: "usaha=cuci_motor", ikon: Droplets },
  { label: "Di bawah Rp500rb", param: "harga=500000", ikon: Wallet },
  { label: "Muka jalan ≥ 3 m", param: "muka=3", ikon: Ruler },
  { label: "Halaman depan", param: "tipe=halaman_depan", ikon: Home },
];

/**
 * Kategori yang selalu tampil di bilah pintasan.
 *
 * Enam, bukan dua belas: barisnya harus muat tanpa digeser di layar 375px
 * bersama satu pintasan yang terpotong sedikit di kanan — potongan itu yang
 * memberi tahu bahwa barisnya bisa digeser. Sisanya tetap bisa dipilih dari
 * panel Filter.
 */
const KATEGORI: TipeRuang[] = [
  "halaman_depan",
  "teras",
  "lahan_kosong",
  "kios",
  "lantai_ruko",
  "garasi",
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
  const kategori = searchParams.get("kategori") ?? "";
  const usaha = searchParams.get("usaha") ?? "";
  const mukaMin = angkaDari(searchParams.get("muka"), 0);

  // Dipakai label titik supaya tertulis "Ketawanggede", bukan "lokasimu",
  // untuk titik yang datang dari wilayah pendaftaran.
  const [namaWilayahProfil, setNamaWilayahProfil] = useState<string | null>(null);

  const preset = presetDari(lat, lng);
  const namaTitik = preset?.nama ?? namaWilayahProfil ?? "lokasimu";
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

  /*
    Titik awal ditentukan sekali, sebelum kueri pertama jalan.

    Sebelum ini halaman selalu mulai dari Kampus UB dan lokasi asli baru
    dipakai kalau tombolnya ditekan — termasuk untuk orang yang sudah pernah
    memberi izin lokasi, dan termasuk saat ia baru saja mencari dari titik
    lain semenit sebelumnya.

    Urutannya:
      1. Parameter URL — menang mutlak, karena itu tautan yang orangnya
         sengaja buka atau bagikan.
      2. Lokasi sungguhan, TAPI hanya kalau izinnya sudah pernah diberikan.
         Lihat `izinLokasiSudahAda()` untuk alasan kenapa tidak boleh
         bertanya sendiri di sini.
      3. Titik terakhir yang ia pakai di perangkat ini.
      4. Wilayah yang ia sebut saat mendaftar — lihat `/api/titik-saya`.
      5. Titik bawaan.

    `siapCari` menahan kueri pertama sampai keputusannya jatuh. Tanpa itu,
    halaman menjalankan satu pencarian dari Kampus UB, menampilkan hasilnya,
    lalu menggantinya begitu lokasi aslinya masuk — satu kueri terbuang dan
    satu lompatan yang terlihat.
  */
  const [siapCari, setSiapCari] = useState(
    () => searchParams.has("lat") || searchParams.has("lng")
  );
  /*
    Panel filter TERTUTUP secara bawaan, dan itu bukan selera.

    Diukur di layar 375×812: dengan keempat bagian filter terbentang, kartu
    hasil pertama mulai di y=809 — tiga piksel di bawah lipatan. Artinya di
    HP, halaman yang satu-satunya alasan dibuka adalah hasil pencarian
    menampilkan NOL hasil sebelum orang menggulir.

    Aturan di CLAUDE.md sudah menyebutnya sejak awal ("halaman alat kerja
    tidak punya hero; kendalinya muat dalam satu bilah") — pelaksanaannya yang
    menyimpang, satu bagian filter setiap kali fitur baru ditambah.
  */
  const [bukaFilter, setBukaFilter] = useState(false);

  useEffect(() => {
    /*
      Tidak ada penjaga `useRef` di sini, dan itu bukan kelalaian. Versi
      pertama memakainya sebagai kunci sekali-jalan — dan ref BERTAHAN
      melewati pelepasan komponen. React memasang lalu melepas lalu memasang
      ulang setiap efek di mode ketat: jalur pertama dibatalkan cleanup-nya,
      jalur kedua menemukan kuncinya sudah terpakai dan langsung keluar. Yang
      tersisa adalah `siapCari` yang selamanya false, jadi pencarian tidak
      pernah dijalankan sama sekali. Ketahuan saat halamannya benar-benar
      dibuka, bukan dari membaca kodenya.

      Yang menahan pengulangan cukup `siapCari` sendiri: sekali ia true,
      efek ini keluar di baris pertama.
    */
    if (siapCari) return;

    let hidup = true;
    const pakai = (t: { lat: number; lng: number; radiusKm?: number }) => {
      if (!hidup) return;
      ubah({
        lat: t.lat.toFixed(6),
        lng: t.lng.toFixed(6),
        ...(t.radiusKm && t.radiusKm !== RADIUS_BAWAAN
          ? { radius: String(t.radiusKm) }
          : {}),
      });
      setSiapCari(true);
    };

    izinLokasiSudahAda().then((ada) => {
      if (!hidup) return;
      const tanpaLokasi = async () => {
        const ingat = bacaTitik();
        if (ingat) {
          pakai(ingat);
          return;
        }
        const profil = await titikProfil();
        if (!hidup) return;
        if (profil) {
          setNamaWilayahProfil(profil.nama);
          pakai(profil);
          return;
        }
        setSiapCari(true);
      };

      if (!ada) {
        void tanpaLokasi();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => pakai({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          // Izinnya ada tapi perangkatnya gagal membaca posisi — GPS mati,
          // atau di dalam gedung. Turun ke cadangan, bukan ke layar kosong.
          if (!hidup) return;
          void tanpaLokasi();
        },
        { timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    });

    return () => {
      hidup = false;
    };
  }, [siapCari, ubah]);

  // Titik yang dipakai diingat untuk kunjungan berikutnya — hanya kalau ia
  // memang pilihan eksplisit (ada di URL), bukan titik bawaan.
  useEffect(() => {
    if (searchParams.has("lat") && searchParams.has("lng")) {
      simpanTitik({ lat, lng, radiusKm });
    }
  }, [searchParams, lat, lng, radiusKm]);

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
    if (!siapCari) return;
    const id = ++permintaan.current;
    cariRuang(klienBrowser(), filter)
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
  }, [filter, kunci, siapCari]);

  /*
    Kueri kedua, dan ia TIDAK ikut radius yang dipilih orangnya.

    Gunanya satu: halaman ini tidak boleh berhenti di "belum ada lahan dalam
    5 km". Dengan lima belas lahan pertama yang tersebar di beberapa
    kecamatan, radius yang wajar hampir selalu kosong, dan layar kosong
    membuat orang menutup aplikasinya alih-alih memperlebar radiusnya sendiri.
    Jadi yang di luar radius tetap diambil, ditandai jaraknya apa adanya, dan
    ditawarkan di bawah hasil utama.

    Kuncinya cuma titik, bukan seluruh filter: mengubah radius, harga, atau
    ukuran tidak perlu memanggilnya lagi. Penyaringnya dikerjakan di layar,
    di `diLuar` bawah.
  */
  const kunciLuas = `${lat}|${lng}`;
  const [luas, setLuas] = useState<{ kunci: string; daftar: RuangDenganFoto[] } | null>(
    null
  );
  const permintaanLuas = useRef(0);

  const filterLuas = useMemo(
    () => ({ lat, lng, radiusKm: RADIUS_LUAS_KM, volumeMin: 0, hargaMaks: 0 }),
    [lat, lng]
  );

  useEffect(() => {
    if (!siapCari) return;
    const id = ++permintaanLuas.current;
    cariRuang(klienBrowser(), filterLuas)
      .then((daftar) => {
        if (id === permintaanLuas.current) setLuas({ kunci: kunciLuas, daftar });
      })
      .catch(() => {
        // Galatnya sengaja tidak ditampilkan. Ini bagian pelengkap; yang
        // ditanyakan orangnya sudah dijawab hasil utama di atas, dan dua
        // kotak galat untuk satu halaman terbaca seperti aplikasi yang rusak.
        if (id === permintaanLuas.current) setLuas({ kunci: kunciLuas, daftar: [] });
      });
  }, [filterLuas, kunciLuas, siapCari]);

  const memuat = !siapCari || hasil?.kunci !== kunci;
  const galat = memuat ? null : hasil?.galat;
  // Dibungkus useMemo supaya rujukan arraynya stabil; `tipeTersedia` di bawah
  // bergantung padanya, dan array baru tiap render membuat memo itu tidak ada
  // gunanya.
  const semua = useMemo(
    () => (memuat ? [] : (hasil?.daftar ?? [])),
    [memuat, hasil]
  );

  // Tipe dan kategori disaring di sisi klien, bukan lewat parameter fungsi
  // database. `ruang_terdekat()` sudah mengembalikan kedua kolomnya dan
  // mengembalikan seluruh hasil dalam radius tanpa halaman, jadi hitungannya
  // tetap benar. Dibungkus useMemo dengan alasan yang sama seperti `semua` —
  // dan tanpanya React Compiler menolak mengoptimalkan seluruh komponen.
  const daftar = useMemo(
    () =>
      semua.filter(
        (r) =>
          (!tipe || r.tipe === tipe) &&
          (!kategori || r.kategori_diterima.includes(kategori)) &&
          (!usaha || r.usaha_diizinkan.includes(usaha)) &&
          // Lahan yang lebar mukanya belum diisi pemilik ikut tersaring keluar
          // saat penyaring ini menyala. Menampilkannya berarti pedagang membuka
          // lahan yang belum tentu selebar yang ia minta — dan yang ia minta
          // adalah satu-satunya alasan ia menyalakan penyaringnya.
          (mukaMin === 0 || Number(r.lebar_muka_m ?? r.lebar_m ?? 0) >= mukaMin)
      ),
    [semua, tipe, kategori, usaha, mukaMin]
  );

  // Kategori yang benar-benar diterima seseorang dalam radius sekarang, dengan
  // alasan yang sama seperti `tipeTersedia`. Ia sekaligus menahan keadaan
  // "13_umkm.sql belum dijalankan": di database itu `kategori_diterima`
  // kosong untuk semua baris, jadi barisan pilihannya tidak muncul sama sekali
  // alih-alih memberi filter yang selalu menghasilkan nol.
  const kategoriTersedia = useMemo(() => {
    const ada = new Set(semua.flatMap((r) => r.kategori_diterima));
    if (kategori) ada.add(kategori);
    return Object.keys(LABEL_KATEGORI).filter((k) => ada.has(k));
  }, [semua, kategori]);

  // Jenis usaha yang benar-benar diizinkan seseorang dalam radius sekarang.
  // Sama seperti `kategoriTersedia`, ia sekaligus menahan keadaan "migrasi 19
  // belum dijalankan": di sana kolomnya tidak terkirim, jadi barisan
  // pilihannya tidak muncul alih-alih memberi penyaring yang selalu nol.
  const usahaTersedia = useMemo(() => {
    const ada = new Set(semua.flatMap((r) => r.usaha_diizinkan));
    if (usaha) ada.add(usaha);
    const dikenal = Object.keys(LABEL_USAHA).filter((u) => ada.has(u));
    // Pemilik boleh menulis jenis usahanya sendiri, dan yang ditulis itu ikut
    // jadi penyaring — kalau tidak, satu-satunya lahan yang mengizinkan
    // "warung kopi" tidak bisa ditemukan lewat penyaring apa pun.
    const sendiri = [...ada].filter((u) => !(u in LABEL_USAHA)).sort();
    return [...dikenal, ...sendiri];
  }, [semua, usaha]);

  // Penyaring lebar muka hanya berguna kalau memang ada lahan terbuka di
  // radius ini — di daftar yang isinya gudang semua ia cuma satu baris kendali
  // yang tidak pernah dipakai.
  const adaLahanTerbuka = useMemo(
    () => semua.some((r) => pakaiLuas(r.tipe)) || mukaMin > 0,
    [semua, mukaMin]
  );

  // Dipakai bilah ringkas: apa saja yang sedang menyaring, dalam kata yang
  // bisa dibaca. Radius dan titik TIDAK ikut — keduanya selalu ada nilainya,
  // jadi menghitungnya sebagai "filter" membuat angkanya tidak pernah nol.
  const ringkasanFilter = [
    tipe ? LABEL_TIPE[tipe] : null,
    usaha ? (LABEL_USAHA[usaha] ?? usaha) : null,
    mukaMin > 0 ? `muka ≥ ${mukaMin} m` : null,
    kategori ? LABEL_KATEGORI[kategori] : null,
    volumeMin > 0 ? `≥ ${volumeMin} m³` : null,
    hargaMaks > 0 ? `≤ ${rupiah(hargaMaks)}` : null,
  ].filter((v): v is string => Boolean(v));
  const jumlahFilter = ringkasanFilter.length;

  /*
    Hasilnya dipecah jadi beberapa bagian bertema, pola yang diminta dengan
    OLX dan Travelio sebagai rujukan.

    Dipartisi, BUKAN diulang: tiap lahan muncul di tepat satu bagian. Dengan
    lima belas lahan pertama, bagian bertema yang saling meminjam isi akan
    menampilkan lahan yang sama dua-tiga kali dalam satu layar, dan itu
    terbaca sebagai aplikasi yang isinya sedikit dan sedang ditutup-tutupi.

    Cuma menyala kalau hasilnya cukup banyak (>= 8) dan tidak ada penyaring
    yang aktif. Orang yang sudah memilih "kios di bawah Rp500rb" sedang
    mencari, bukan melihat-lihat, dan memecah hasilnya jadi tiga bagian
    justru menyembunyikan yang ia minta.
  */
  const bagian = useMemo(() => {
    if (jumlahFilter > 0 || daftar.length < 4) return null;
    const ambil = (dari: RuangDenganFoto[], n: number) => dari.slice(0, n);
    const dekat = ambil(daftar, 4);
    const dipakai = new Set(dekat.map((r) => r.id));

    const sisa1 = daftar.filter((r) => !dipakai.has(r.id));
    const murah = ambil([...sisa1].sort((a, b) => a.harga_bulanan - b.harga_bulanan), 4);
    murah.forEach((r) => dipakai.add(r.id));

    const sisa2 = daftar.filter((r) => !dipakai.has(r.id));
    const lebar = ambil(
      [...sisa2].sort(
        (a, b) => Number(b.lebar_muka_m ?? b.lebar_m ?? 0) - Number(a.lebar_muka_m ?? a.lebar_m ?? 0)
      ),
      4
    );
    lebar.forEach((r) => dipakai.add(r.id));

    return { dekat, murah, lebar, lainnya: daftar.filter((r) => !dipakai.has(r.id)) };
  }, [daftar, jumlahFilter]);

  /*
    Lahan di luar radius yang sedang dipilih, terdekat lebih dulu.

    Penyaringnya diulang di sini, dan itu tidak bisa dihindari: kueri keduanya
    sengaja dipanggil tanpa harga dan ukuran supaya tidak perlu diulang tiap
    kali salah satunya digeser. Yang dijaga cuma satu hal — apa yang tampil di
    bagian ini HARUS lolos penyaring yang sama dengan hasil utama, kalau tidak
    orang akan menemukan lahan di bawah Rp500rb di bawah judul yang bilang
    tidak ada satu pun.

    `jarak_km > radiusKm` bukan sekadar pembeda dari hasil utama; ia yang
    membuat judulnya jujur. Tanpa itu, lahan yang sudah tampil di atas muncul
    lagi di bawah judul "di luar radiusmu".
  */
  const diLuar = useMemo(() => {
    if (luas?.kunci !== kunciLuas) return [];
    return luas.daftar
      .filter(
        (r) =>
          Number(r.jarak_km) > radiusKm &&
          (!tipe || r.tipe === tipe) &&
          (!kategori || r.kategori_diterima.includes(kategori)) &&
          (!usaha || r.usaha_diizinkan.includes(usaha)) &&
          (mukaMin === 0 || Number(r.lebar_muka_m ?? r.lebar_m ?? 0) >= mukaMin) &&
          (hargaMaks === 0 || r.harga_bulanan <= hargaMaks) &&
          (volumeMin === 0 || Number(r.volume_m3) >= volumeMin)
      )
      .slice(0, 8);
  }, [
    luas,
    kunciLuas,
    radiusKm,
    tipe,
    kategori,
    usaha,
    mukaMin,
    hargaMaks,
    volumeMin,
  ]);

  /*
    Radius terkecil yang cukup untuk menjangkau lahan terdekat di luar radius
    sekarang, dibulatkan ke atas ke satuan utuh.

    Null kalau lahan itu lebih jauh dari pilihan radius terbesar: tombol
    "perlebar jadi 83 km" akan mengantar orang ke keadaan yang tidak bisa ia
    kembalikan lewat daftar radius biasa, dan angka sebesar itu bukan lagi
    "sekitar sini".
  */
  const radiusMenjangkau = useMemo(() => {
    const terdekat = diLuar[0];
    if (!terdekat) return null;
    const perlu = Math.ceil(Number(terdekat.jarak_km));
    const cocok = RADIUS_PILIHAN.find((km) => km >= perlu);
    return cocok ?? null;
  }, [diLuar]);

  /*
    Isi panel filter, disusun sebagai data.

    Bentuk ini yang membuat panel dua kolomnya mungkin: kolom kirinya butuh
    tahu judul dan pilihan yang sedang berlaku SEBELUM kelompoknya dibuka,
    dan itu tidak bisa dibaca dari JSX yang bersarang.

    Dua kelompok bisa tidak ada sama sekali. "Jenis usaha" dan "Barang yang
    disimpan" cuma muncul kalau memang ada lahan yang menyebutkannya di
    radius ini — penyaring yang setiap pilihannya menghasilkan nol lebih
    buruk daripada penyaring yang tidak ada.
  */
  const kelompokFilter = useMemo<KelompokFilter[]>(() => {
    const daftarKelompok: KelompokFilter[] = [];

    if (usahaTersedia.length > 0) {
      daftarKelompok.push({
        kunci: "usaha",
        judul: "Jenis usaha",
        ringkas: usaha ? (LABEL_USAHA[usaha] ?? usaha) : null,
        opsi: [
          {
            kunci: "semua",
            label: "Semua usaha",
            aktif: !usaha,
            pilih: () => ubah({ usaha: null }),
          },
          ...usahaTersedia.map((kode) => ({
            kunci: kode,
            label: LABEL_USAHA[kode] ?? kode,
            aktif: usaha === kode,
            pilih: () => ubah({ usaha: usaha === kode ? null : kode }),
          })),
        ],
      });
    }

    if (adaLahanTerbuka) {
      daftarKelompok.push({
        kunci: "muka",
        judul: "Lebar muka jalan",
        ringkas: mukaMin > 0 ? `≥ ${mukaMin} m` : null,
        opsi: MUKA_PILIHAN.map((m) => ({
          kunci: String(m.nilai),
          label: m.label,
          bantuan: m.bantuan,
          aktif: mukaMin === m.nilai,
          pilih: () => ubah({ muka: m.nilai ? String(m.nilai) : null }),
        })),
      });
    }

    daftarKelompok.push({
      kunci: "harga",
      judul: "Harga maksimum",
      ringkas: hargaMaks > 0 ? `≤ ${rupiah(hargaMaks)}` : null,
      opsi: HARGA_PILIHAN.map((h) => ({
        kunci: String(h.nilai),
        label: h.label,
        aktif: hargaMaks === h.nilai,
        pilih: () => ubah({ harga: h.nilai ? String(h.nilai) : null }),
      })),
    });

    daftarKelompok.push({
      kunci: "volume",
      judul: "Ukuran ruang",
      ringkas: volumeMin > 0 ? `≥ ${volumeMin} m³` : null,
      opsi: VOLUME_PILIHAN.map((v) => ({
        kunci: String(v.nilai),
        label: v.label,
        // Cuma berarti untuk ruang tertutup, dan itu ditulis di keterangan
        // pilihan pertamanya saja. Mengulangnya di tiap pilihan membuat
        // kolomnya penuh kalimat yang sama.
        bantuan: v.bantuan ?? (v.nilai === 0 ? "Volume, untuk ruang tertutup" : null),
        aktif: volumeMin === v.nilai,
        pilih: () => ubah({ volume: v.nilai ? String(v.nilai) : null }),
      })),
    });

    if (kategoriTersedia.length > 0) {
      daftarKelompok.push({
        kunci: "kategori",
        judul: "Barang yang disimpan",
        ringkas: kategori ? LABEL_KATEGORI[kategori] : null,
        opsi: [
          {
            kunci: "semua",
            label: "Semua barang",
            aktif: !kategori,
            pilih: () => ubah({ kategori: null }),
          },
          ...kategoriTersedia.map((kode) => ({
            kunci: kode,
            label: LABEL_KATEGORI[kode],
            aktif: kategori === kode,
            pilih: () => ubah({ kategori: kategori === kode ? null : kode }),
          })),
        ],
      });
    }

    return daftarKelompok;
  }, [
    ubah,
    usaha,
    usahaTersedia,
    adaLahanTerbuka,
    mukaMin,
    hargaMaks,
    volumeMin,
    kategori,
    kategoriTersedia,
  ]);

  const bersihkan = () => router.replace(pathname, { scroll: false });

  /*
    Kata bendanya ikut tipe yang sedang dipilih.

    Bawaannya "lahan", bukan "ruang", karena itu fokus aplikasinya sekarang —
    dan "3 ruang" untuk tiga halaman depan rumah salah menggambarkan apa yang
    ditemukan orangnya. Kalau ia justru sedang menyaring tipe tertutup,
    katanya kembali jadi "ruang".
  */
  const kataTempat = tipe && !pakaiLuas(tipe) ? "ruang" : "lahan";

  /*
    `adaFilter` dibuang bersama tombol "Hapus filter" yang kedua.

    Perhatikan bedanya dari `jumlahFilter` di atas, karena keduanya mudah
    tertukar: yang lama ikut menghitung titik dan radius, jadi ia menyala
    untuk pencarian yang sama sekali belum disaring — cukup titik yang bukan
    bawaan. Yang sekarang cuma menghitung penyaring sungguhan, dan itulah yang
    benar untuk angka di sebelah tombol Filter.
  */

  return (
    <>
      {/* ── Bilah pencarian ────────────────────────────────────────────────
          Ringkas, bukan hero.

          Versi sebelumnya memakai bidang gradien biru setinggi hampir separuh
          layar di sini, sama seperti halaman depan. Setelah dilihat di layar
          sungguhan, akibatnya jelas: hasil pencarian, satu-satunya alasan orang
          membuka halaman ini, terdorong ke bawah lipatan oleh bidang yang tidak
          membawa informasi apa pun. Sekarang kendalinya muat dalam satu baris
          dan kartu pertama sudah terlihat tanpa menggulir. */}
      <section className="sticky top-[var(--tinggi-header)] z-40 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="sr-only">Cari lahan usaha</h1>

          {/* Titik mengambil satu baris penuh di layar telepon. Bertiga dalam
              satu baris di lebar 375px membuat namanya terpangkas jadi satu
              huruf, "Waru / Aloha" terbaca "W…". */}
          <label className="flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2 sm:w-auto sm:min-w-56 sm:flex-none">
            <MapPin className="h-4 w-4 shrink-0 text-brand" />
            <span className="sr-only">Titik pencarian</span>
            <span className="relative flex min-w-0 flex-1 items-center">
              <select
                value={preset?.id ?? "custom"}
                onChange={(e) => {
                  const t = TITIK_PRESET.find((x) => x.id === e.target.value);
                  if (t) ubah({ lat: String(t.lat), lng: String(t.lng) });
                }}
                className="w-full cursor-pointer appearance-none truncate bg-transparent pr-5 text-sm font-medium text-ink focus:outline-none"
              >
                {/* `namaTitik`, bukan selalu "Lokasi saya": titik bisa datang
                    dari wilayah pendaftaran atau dari tautan yang dibagikan,
                    dan keduanya bukan "lokasi saya". */}
                {!preset && <option value="custom">{namaTitik}</option>}
                {TITIK_PRESET.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-muted" />
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2">
            <span className="text-xs text-muted">Radius</span>
            <span className="relative flex items-center">
              <select
                value={radiusKm}
                onChange={(e) => ubah({ radius: e.target.value })}
                className="angka cursor-pointer appearance-none bg-transparent pr-5 text-sm font-medium text-ink focus:outline-none"
              >
                {/* Radius dari tautan bisa di luar daftar — `?radius=20`
                    misalnya. Tanpa opsi ini, `<select>` jatuh ke pilihan
                    pertama dan menampilkan "1 km" sementara hasilnya dihitung
                    20 km, lengkap dengan judul "1 ruang dalam 20 km" di
                    bawahnya. Kendali yang berbohong tentang keadaannya sendiri
                    lebih buruk daripada kendali yang tidak ada. */}
                {!RADIUS_PILIHAN.includes(radiusKm) && (
                  <option value={radiusKm}>{radiusKm} km</option>
                )}
                {RADIUS_PILIHAN.map((km) => (
                  <option key={km} value={km}>
                    {km} km
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-muted" />
            </span>
          </label>

          <button
            type="button"
            onClick={pakaiLokasiSaya}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
          >
            <Crosshair className="h-4 w-4" />
            <span className="hidden sm:inline">Gunakan lokasi saya</span>
            <span className="sm:hidden">Lokasiku</span>
          </button>

          {/* "Hapus filter" dulu di sini juga. Dibuang: bilah ringkas di bawah
              sudah punya tombol yang memanggil `bersihkan()` yang sama, dan
              sejak titik mengambil baris penuh di HP, yang di sini terlempar
              ke barisnya sendiri, satu baris terbuang untuk tombol kembar. */}
        </div>

        {/* Tawaran "Pakai lokasiku" yang berupa pita penuh DIBUANG
            18 September 2026, atas permintaan pemiliknya: titik yang sedang
            dipakai sudah tertulis di kendali tepat di atasnya, jadi pita itu
            mengulanginya dengan kalimat panjang. Di layar 375px ia memakan
            sekitar 120px, dan yang terdorong ke bawahnya persis barisan
            kategori dan hasil pencarian.

            Tombol "Lokasiku" tetap ada di baris kendali, jadi tidak ada jalan
            yang hilang. Yang hilang cuma pengulangannya. */}

        {/* Koordinat mentah dulu dicetak di sini ("Memakai lokasimu: -7.3013,
            112.7834"). Itu isi kepala pengembang, bukan keterangan untuk
            orang: tidak ada satu pun keputusan yang bisa diambil pedagang dari
            empat angka di belakang koma. Nama titiknya sudah tertulis di
            kendali di atas, jadi barisnya dibuang; yang tersisa cuma galat
            lokasi, yang memang perlu dibaca. */}
        {galatLokasi && (
          <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6 lg:px-8">
            <p className="text-xs text-warn">{galatLokasi}</p>
          </div>
        )}
      </section>

      <div id="hasil" className="mx-auto w-full max-w-6xl scroll-mt-[calc(var(--tinggi-header)*2)] px-4 pb-16 sm:px-6 lg:px-8">
        {/* ── Tipe ruang ───────────────────────────────────────────────────
            Bagiannya dirender bahkan saat hasilnya belum datang, dengan kartu
            kosong sebagai penahan tempat.

            Sebelumnya ia disembunyikan selama memuat, lalu muncul dan mendorong
            seluruh hasil ke bawah tepat saat orang mulai membacanya. Pergeseran
            seperti itu paling terasa justru di koneksi lambat, persis keadaan
            saat orang paling tidak sabar. */}
        {/* Bilah ringkas. Marketplace besar menaruh penyaring rinci di balik
            satu tombol dan menyisakan barisan pilihan yang sedang aktif 
            karena yang dibutuhkan orang di layar hasil adalah HASILNYA, dan
            penyaring cuma sesekali. */}
        <div className="geser-x -mx-4 flex items-center gap-2 overflow-x-auto px-4 pt-5 pb-1 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setBukaFilter(true)}
            aria-haspopup="dialog"
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              jumlahFilter > 0
                ? "bg-brand text-white hover:bg-brand-dark"
                : "bg-card text-ink ring-1 ring-line hover:bg-paper"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {jumlahFilter > 0 && (
              <span className="angka flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs">
                {jumlahFilter}
              </span>
            )}
          </button>

          {ringkasanFilter.map((r) => (
            <span
              key={r}
              className="inline-flex shrink-0 items-center rounded-full bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-dark"
            >
              {r}
            </span>
          ))}

          {jumlahFilter > 0 && (
            <button
              type="button"
              onClick={bersihkan}
              className="shrink-0 cursor-pointer rounded-full px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-paper hover:text-ink"
            >
              Hapus
            </button>
          )}
        </div>

        {/* ── Kategori ────────────────────────────────────────────────────────
            Pintu masuk cepat per tipe, pola yang dipakai hampir semua
            marketplace dan diminta 18 September 2026 dengan OLX sebagai
            rujukan.

            Daftarnya TETAP, bukan hanya tipe yang kebetulan ada isinya di
            radius sekarang. Kategori yang muncul dan hilang mengikuti hasil
            membuat orang mengira aplikasinya rusak, dan tidak ada cara
            menemukan tipe yang sedang kosong untuk memperlebar radiusnya.

            Ia di LUAR panel filter dan selalu terlihat: penyaring rinci
            sesekali dipakai, tapi "saya cuma mau lihat kios" adalah niat yang
            dibawa orang sejak sebelum halaman ini terbuka. */}
        <div className="geser-x -mx-4 flex gap-2 overflow-x-auto px-4 pt-3 pb-1 sm:mx-0 sm:px-0">
          {/* "Semua" cuma muncul saat ada tipe yang sedang dipilih. Petak
              reset yang selalu ada memakan satu slot di baris yang muat enam,
              dan saat tidak ada yang dipilih ia tidak mereset apa pun. */}
          {tipe && (
            <button
              type="button"
              onClick={() => ubah({ tipe: null })}
              className="flex w-[4.6rem] shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl px-1.5 py-2.5 text-center text-[11px] font-semibold leading-tight text-muted transition-colors hover:bg-card sm:w-20 sm:text-xs"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-card ring-1 ring-line sm:h-11 sm:w-11">
                <Search className="h-5 w-5" />
              </span>
              Semua
            </button>
          )}
          {KATEGORI.map((t) => {
            const Ikon = IKON_TIPE[t];
            const aktif = tipe === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={aktif}
                onClick={() => ubah({ tipe: aktif ? null : t })}
                className={`flex w-[4.6rem] shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl px-1.5 py-2.5 text-center text-[11px] font-semibold leading-tight transition-colors sm:w-20 sm:text-xs ${
                  aktif ? "bg-brand text-white" : "text-ink hover:bg-card"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
                    aktif ? "bg-white/20" : "bg-brand-soft"
                  }`}
                >
                  <Ikon className={`h-5 w-5 ${aktif ? "text-white" : "text-brand"}`} />
                </span>
                {LABEL_TIPE[t]}
              </button>
            );
          })}
        </div>

        <PanelFilter
          buka={bukaFilter}
          tutup={() => setBukaFilter(false)}
          kelompok={kelompokFilter}
          jumlahFilter={jumlahFilter}
          bersihkan={bersihkan}
          ringkasanHasil={
            memuat
              ? "Lihat hasil"
              : `Lihat ${daftar.length} ${kataTempat}`
          }
        />

        {/* ── Hasil ──────────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 aria-live="polite" className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            {memuat
              ? "Mencari yang terdekat…"
              : galat
                ? "Hasil tidak bisa dimuat"
                : daftar.length === 0
                  ? `Belum ada ${kataTempat} dalam ${radiusKm} km`
                  : `${daftar.length} ${kataTempat} dalam ${radiusKm} km`}
          </h2>
          <p className="text-sm text-muted">
            dari {namaTitik}
            {tipe ? ` · ${LABEL_TIPE[tipe].toLowerCase()} saja` : ""}
            {usaha ? ` · buat ${(LABEL_USAHA[usaha] ?? usaha).toLowerCase()}` : ""} ·
            terdekat lebih dulu
          </p>
        </div>

        {memuat && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
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
              Coba perlebar radiusnya, atau longgarkan jenis usaha, lebar muka, dan
              harganya. Bisa juga menitipkan kriteriamu di halaman permintaan, pemilik
              lahan di kecamatanmu bisa melihat hitungannya.
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

        {!memuat && daftar.length > 0 && bagian && (
          <>
            <Deret judul={`Paling dekat dari ${namaTitik}`} isi={bagian.dekat} />
            <Deret judul="Paling murah di sekitarmu" isi={bagian.murah} />
            <Deret judul="Muka jalannya paling lebar" isi={bagian.lebar} />
            {bagian.lainnya.length > 0 && (
              <>
                <h3 className="mt-8 font-display text-lg font-bold tracking-tight">
                  Lahan lainnya
                </h3>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                  {bagian.lainnya.map((ruang) => (
                    <li key={ruang.id}>
                      <KartuRuang ruang={ruang} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        {!memuat && daftar.length > 0 && !bagian && (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {daftar.map((ruang) => (
              <li key={ruang.id}>
                <KartuRuang ruang={ruang} />
              </li>
            ))}
          </ul>
        )}

        {/* ── Di luar radius ─────────────────────────────────────────────────
            Bagian yang paling menentukan saat lahannya masih sedikit.

            Tanpa ini, orang yang radiusnya kosong melihat satu kotak "belum
            ada yang cocok" dan tidak punya alasan menggulir lebih jauh —
            padahal sering kali ADA lahan, cuma di kecamatan sebelah. Jaraknya
            ditulis apa adanya di kartunya, jadi tidak ada yang disamarkan:
            yang jauh terlihat jauh, dan orangnya sendiri yang memutuskan.

            Cuma muncul kalau hasil utamanya belum cukup untuk mengisi layar.
            Di radius yang sudah ramai ia jadi gangguan. */}
        {!memuat && !galat && diLuar.length > 0 && daftar.length < 6 && (
          <section className="mt-10 border-t border-line pt-8">
            <h3 className="font-display text-lg font-bold tracking-tight">
              {daftar.length === 0
                ? `Yang terdekat di luar ${radiusKm} km`
                : `Agak jauh, tapi mungkin cocok`}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Masih di luar radius yang kamu pilih. Jaraknya ada di tiap kartu.
            </p>
            <div className="geser-x -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {diLuar.map((ruang) => (
                <div key={ruang.id} className="w-[10.5rem] shrink-0 snap-start sm:w-auto">
                  <KartuRuang ruang={ruang} />
                </div>
              ))}
            </div>
            {radiusMenjangkau !== null && (
              <button
                type="button"
                onClick={() => ubah({ radius: String(radiusMenjangkau) })}
                className="mt-4 cursor-pointer rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-brand-soft"
              >
                Perlebar radius jadi {radiusMenjangkau} km
              </button>
            )}
          </section>
        )}

        {/* ── Cari cepat ─────────────────────────────────────────────────────
            Pintasan niat, bukan daftar lahan — dan itu sebabnya ia berguna
            justru saat isinya masih sedikit. Bagian bertema di atas butuh
            lahan untuk ditampilkan; yang ini tidak, ia menawarkan JALAN
            mencari, dan tetap menjawab "terus saya ngapain sekarang" waktu
            radiusnya kosong.

            Semuanya tautan ke halaman ini sendiri dengan parameter yang memang sudah
            ditangani halaman ini. Tidak ada satu pun yang menjanjikan
            penyaring yang belum ada. */}
        <section className="mt-12 border-t border-line pt-8">
          <h3 className="font-display text-lg font-bold tracking-tight">Cari cepat</h3>
          <p className="mt-1 text-sm text-muted">
            Pintasan yang paling sering dipakai pedagang.
          </p>
          {/* Dua kolom di telepon, bukan satu pintasan per baris: enam baris
              penuh membuat bagian ini lebih tinggi daripada hasil yang ada di
              atasnya. Dari `sm` ia kembali jadi barisan yang membungkus, karena
              di sana enam pintasan muat dalam dua baris. */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {PINTASAN.map((p) => (
              <Link
                key={p.label}
                href={`/?lat=${lat}&lng=${lng}&radius=${radiusKm}&${p.param}`}
                className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2.5 text-xs font-medium text-ink ring-1 ring-line transition-colors hover:bg-brand-soft hover:ring-brand/30 sm:inline-flex sm:px-4 sm:text-sm"
              >
                <p.ikon className="h-4 w-4 shrink-0 text-brand" />
                <span className="min-w-0 truncate">{p.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Belum nemu ─────────────────────────────────────────────────────
            Dua jalan keluar, dan keduanya menguntungkan aplikasinya: yang
            tidak menemukan lahan menitipkan kriterianya (itu yang menarik
            pemilik lahan ke kecamatan itu), dan yang kebetulan PUNYA lahan
            nganggur diingatkan bahwa ia bisa memasangnya. */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/permintaan"
            className="naik naik-hover flex items-start gap-3 rounded-2xl bg-card p-5 ring-1 ring-line"
          >
            <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span>
              <span className="block text-sm font-bold">Belum ada yang cocok?</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                Titipkan kriterianya. Pemilik lahan di kecamatanmu bisa melihat ada
                berapa orang yang sedang mencari.
              </span>
            </span>
          </Link>
          <Link
            href="/host/lahan/baru"
            className="naik naik-hover flex items-start gap-3 rounded-2xl bg-card p-5 ring-1 ring-line"
          >
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span>
              <span className="block text-sm font-bold">Punya lahan nganggur?</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                Halaman depan rumah yang cuma jadi tempat parkir sepeda sudah cukup.
                Gratis, dan kamu yang menentukan harganya.
              </span>
            </span>
          </Link>
        </section>

        {/* Kalimatnya ditulis apa adanya di layar pencarian supaya tidak ada yang
            sampai ke sini mengira uangnya lewat aplikasi. Sejak papan iklan
            (nomor 43) ia lebih keras: kami bahkan tidak menengahi. */}
        <p className="mt-12 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          Lahan di sini dipasang langsung oleh pemiliknya, dan sewanya kalian
          sepakati berdua. Ada Tempat tidak ikut memegang uang dan tidak memberi
          ganti rugi. Datangi dulu lahannya sebelum menyerahkan uang apa pun.
        </p>
      </div>
    </>
  );
}

/**
 * Satu deret lahan bertema.
 *
 * **Digeser mendatar di telepon, kisi di laptop.** Di layar 375px, empat
 * kartu dalam kisi dua kolom memakan dua baris penuh dan mendorong bagian
 * berikutnya jauh ke bawah; digeser, satu bagian cuma setinggi satu kartu dan
 * orang tetap tahu ada lebih banyak karena kartu berikutnya mengintip.
 *
 * Pakai snap, bukan tombol panah: tidak butuh JavaScript sama sekali, dan di
 * telepon jari memang alat yang benar.
 */
function Deret({ judul, isi }: { judul: string; isi: RuangDenganFoto[] }) {
  if (isi.length === 0) return null;
  return (
    <section className="mt-8">
      <h3 className="font-display text-lg font-bold tracking-tight">{judul}</h3>
      <div className="geser-x -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {isi.map((ruang) => (
          <div key={ruang.id} className="w-[10.5rem] shrink-0 snap-start sm:w-auto">
            <KartuRuang ruang={ruang} />
          </div>
        ))}
      </div>
    </section>
  );
}
