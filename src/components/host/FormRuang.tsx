"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Loader2, Trash2 } from "lucide-react";
import {
  Bagian,
  Kolom,
  KolomAngka,
  KotakCentangGanda,
  Pilihan,
} from "@/components/host/Kolom";
import PilihWilayah from "@/components/host/PilihWilayah";
import { klienBrowser } from "@/lib/supabase/browser";
import { bulanDari } from "@/lib/pemesanan";
import { buatRuang, hapusRuang, ubahRuang, type IsiRuang } from "@/lib/host";
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
  LABEL_TIPE,
  luas,
  rupiah,
  volume,
  LABEL_AIR,
  LABEL_ATAP,
  LABEL_KELAS_JALAN,
  LABEL_LISTRIK,
  LABEL_USAHA,
  pakaiLuas,
} from "@/lib/label";

const opsi = (peta: Record<string, string>): [string, string][] => Object.entries(peta);

/**
 * Titik awal peta ruang baru, dipakai sampai host menempelkan lokasinya —
 * Waru, gerbang antara Surabaya dan Sidoarjo. Sengaja bukan 0,0: koordinat nol
 * mendarat di Samudra Atlantik, dan jarak yang dihitung dari sana menghasilkan
 * angka yang salah tanpa terlihat seperti galat.
 */
const AWAL: IsiRuang = {
  judul: "",
  tipe: "halaman_depan",
  kepemilikan: "milik_sendiri",
  alamat: "",
  patokan: "",
  kelurahan: "",
  kecamatan: "",
  kota: "",
  lat: -7.3527,
  lng: 112.7294,
  terbuka_alamat: false,
  panjang_m: 3,
  lebar_m: 3,
  tinggi_m: 2.5,
  akses_masuk: "mobil_pikap",
  posisi_lantai: "dasar_rata",
  lebar_pintu_cm: 90,
  jarak_parkir: "lt10m",
  // Bawaannya lahan terbuka, jadi ketiga jawaban ini yang benar untuk halaman
  // depan rumah — bukan warisan dari masa ruang tertutup. `gantiTipe()` di
  // bawah menukarnya begitu host memilih tipe dari kelompok yang lain.
  kondisi_bangunan: "terbuka",
  kelembapan: "kering_ventilasi",
  riwayat_banjir: "tidak_pernah",
  tinggi_lantai_cm: 0,
  penguncian: "tanpa_kunci",
  berbagi: "eksklusif",
  pengawasan: [],
  fasilitas: [],
  kategori_diterima: ["kardus"],
  usaha_diizinkan: [],
  lebar_muka_m: null,
  listrik: null,
  air: null,
  atap: null,
  kelas_jalan: null,
  // Lahan usaha hampir selalu tanpa batas kunjungan — pedagang ada di sana
  // setiap hari. Host ruang tertutup mengisinya sendiri.
  kuota_akses_bulanan: null,
  durasi_min_hari: 30,
  harga_bulanan: 300000,
  deposit: 0,
  status: "draf",
};

/**
 * Formulir ruang, dipakai untuk membuat maupun mengubah.
 *
 * Rubrik kondisinya diminta lengkap — 16 hal — dan itu memang beban bagi host.
 * Tapi kelengkapan rubrik inilah satu-satunya hal yang membedakan halaman
 * detail dari iklan OLX, dan sewa yang batal karena penyewa datang lalu
 * menemukan ruangnya lembap jauh lebih mahal bagi kedua pihak daripada
 * beberapa menit tambahan mengisi formulir.
 */
export default function FormRuang({
  hostId,
  awal,
  ruangId,
  onDibuat,
}: {
  hostId: string;
  awal?: IsiRuang;
  ruangId?: string;
  /**
   * Dipanggil dengan id ruang yang baru dibuat, alih-alih berpindah halaman.
   *
   * Dipakai alur daftar ruang, yang setelah ini menampilkan langkah foto di
   * halaman yang sama. Foto butuh id ruangnya — itu sebabnya urutannya tidak
   * bisa dibalik — tapi itu alasan teknis dan tidak ada gunanya diketahui
   * host, jadi ia tidak perlu ikut berpindah halaman untuk melewatinya.
   */
  onDibuat?: (id: string, tipe: IsiRuang["tipe"]) => void;
}) {
  const router = useRouter();
  const [isi, setIsi] = useState<IsiRuang>(awal ?? AWAL);
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);

  /*
    Dua kelompok tipe punya pertanyaan yang berbeda, dan menanyakan semuanya ke
    semua orang adalah cara tercepat membuat host berhenti mengisi.

    Lahan terbuka: jenis usaha yang diizinkan, lebar muka jalan, listrik, air,
    atap, kelas jalan. Ruang tertutup: kategori barang dan kuota kunjungan.

    "Kelas jalan" untuk sebuah loteng tidak ada artinya, dan "kategori barang"
    untuk halaman depan yang disewa pedagang juga tidak.
  */
  const terbuka = pakaiLuas(isi.tipe);

  const ubah = <K extends keyof IsiRuang>(kunci: K, nilai: IsiRuang[K]) =>
    setIsi((v) => ({ ...v, [kunci]: nilai }));

  /*
    Berpindah kelompok tipe ikut menukar jawaban yang tidak berlaku lagi.

    Kolomnya NOT NULL dan tetap tersimpan meski isiannya disembunyikan, jadi
    tanpa ini sebuah halaman depan rumah menyimpan "berdinding dan beratap"
    dan "kunci dipegang penyewa" — dua keterangan yang tidak pernah tampil di
    layar untuk tipe itu, tapi tetap ada di database dan tetap salah. Arah
    sebaliknya juga: rubrik lahan usaha dikosongkan supaya sebuah gudang tidak
    membawa "boleh menggoreng" yang tidak pernah dijawab pemiliknya.
  */
  const gantiTipe = (tipe: IsiRuang["tipe"]) =>
    setIsi((v) =>
      pakaiLuas(tipe)
        ? {
            ...v,
            tipe,
            kondisi_bangunan: "terbuka",
            penguncian: "tanpa_kunci",
            kuota_akses_bulanan: null,
          }
        : {
            ...v,
            tipe,
            kondisi_bangunan:
              v.kondisi_bangunan === "terbuka" ? "dinding_atap" : v.kondisi_bangunan,
            penguncian: v.penguncian === "tanpa_kunci" ? "kunci_penyewa" : v.penguncian,
            usaha_diizinkan: [],
            lebar_muka_m: null,
            listrik: null,
            air: null,
            atap: null,
            kelas_jalan: null,
          }
    );

  const angka = (v: string) => (v === "" ? 0 : Number(v));

  const pakaiLokasiSaya = () => {
    if (!("geolocation" in navigator)) {
      setPesanLokasi("Peramban ini tidak mendukung deteksi lokasi.");
      return;
    }
    setPesanLokasi("Mengambil lokasi…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsi((v) => ({
          ...v,
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        }));
        setPesanLokasi("Lokasi terpasang. Pastikan kamu sedang berada di ruangnya.");
      },
      () => setPesanLokasi("Lokasi tidak bisa dibaca. Isi koordinatnya manual.")
    );
  };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    // Syaratnya berbeda per kelompok tipe. Lahan terbuka dengan
    // `usaha_diizinkan` kosong akan menolak SETIAP pemesanan di database
    // (lihat migrasi 19), jadi menyimpannya begitu berarti memasang lahan yang
    // tidak mungkin disewa — dan pemiliknya tidak akan pernah tahu kenapa.
    if (terbuka && isi.usaha_diizinkan.length === 0) {
      setGalat("Pilih minimal satu jenis usaha yang boleh jalan di lahan ini.");
      return;
    }
    if (!terbuka && isi.kategori_diterima.length === 0) {
      setGalat("Pilih minimal satu kategori barang yang kamu terima.");
      return;
    }
    // Wilayah dipilih lewat select berjenjang, dan `required` pada select tidak
    // menahan apa pun kalau nilainya string kosong dari <option> pertama.
    if (!isi.kelurahan || !isi.kecamatan || !isi.kota) {
      setGalat("Lengkapi wilayahnya sampai kelurahan.");
      return;
    }
    /*
      Kolom angka boleh KOSONG di layar (lihat `KolomAngka`), padahal
      kolomnya NOT NULL di database. Yang menahannya di sini, bukan tipe
      datanya — dan yang kosong dijawab dengan nama kolomnya, bukan dengan
      "ada isian yang belum lengkap" yang membuat orang menyisir formulir
      sepanjang ini satu per satu.
    */
    const wajib: [string, number | null][] = [
      ["Lebar", isi.lebar_m],
      ["Panjang", isi.panjang_m],
      ...(terbuka
        ? []
        : ([
            ["Tinggi", isi.tinggi_m],
            ["Lebar pintu", isi.lebar_pintu_cm],
            ["Tinggi lantai dari tanah", isi.tinggi_lantai_cm],
          ] as [string, number | null][])),
      ["Sewa minimum", isi.durasi_min_hari],
      ["Sewa per bulan", isi.harga_bulanan],
    ];
    const kosong = wajib.find(([, v]) => v == null);
    if (kosong) {
      setGalat(`"${kosong[0]}" belum diisi.`);
      return;
    }
    /*
      Batas bawahnya diperiksa di sini, bukan lewat atribut `min`.
      `KolomAngka` merender kotak teks — supaya "2," bisa diketik dan koma
      bisa dipakai sebagai pemisah desimal — dan peramban tidak memeriksa
      `min` pada kotak teks. Database menolaknya juga lewat check constraint,
      tapi galat dari sana sampai ke layar sebagai pesan Postgres.
    */
    const nol = ([
      ["Lebar", isi.lebar_m],
      ["Panjang", isi.panjang_m],
      ["Sewa minimum", isi.durasi_min_hari],
      ...(terbuka ? [] : [["Tinggi", isi.tinggi_m] as [string, number | null]]),
    ] as [string, number | null][]).find(([, v]) => (v ?? 0) <= 0);
    if (nol) {
      setGalat(`"${nol[0]}" harus lebih dari nol.`);
      return;
    }

    /*
      Yang dikirim ke database, dengan yang boleh kosong diterjemahkan ke
      nilai yang benar — bukan dibiarkan null menabrak NOT NULL.

      `tinggi_m` dan `tinggi_lantai_cm` untuk lahan terbuka tidak pernah
      ditanyakan: yang pertama karena lahan diukur luas bukan volume, yang
      kedua karena riwayat banjir sudah menjawab hal yang sama tanpa alat
      ukur. Keduanya dikirim sebagai angka yang tidak menyesatkan, dan
      layar detail memang tidak menampilkan keduanya untuk tipe ini.
    */
    const payload: IsiRuang = {
      ...isi,
      tinggi_m: terbuka ? 2.5 : isi.tinggi_m,
      lebar_pintu_cm: terbuka ? 0 : isi.lebar_pintu_cm,
      tinggi_lantai_cm: terbuka ? 0 : isi.tinggi_lantai_cm,
      deposit: isi.deposit ?? 0,
      // Lebar muka jalan tidak ditanyakan lagi; untuk lahan terbuka ia sama
      // dengan sisi yang menghadap jalan, yaitu `lebar_m`.
      lebar_muka_m: terbuka ? isi.lebar_m : null,
    };

    setKirim(true);
    setGalat(null);
    setTersimpan(false);
    try {
      const db = klienBrowser();
      if (ruangId) {
        await ubahRuang(db, ruangId, payload);
        // Versi sebelumnya memanggil `router.replace` ke alamat yang SEDANG
        // dibuka. Itu bukan perpindahan halaman, jadi komponennya tidak pernah
        // dilepas — dan karena `setKirim(false)` cuma ada di cabang galat,
        // tombolnya berputar selamanya setiap kali penyimpanannya berhasil.
        // Yang dibutuhkan halaman ini cuma memuat ulang datanya.
        setKirim(false);
        setTersimpan(true);
        router.refresh();
      } else {
        const id = await buatRuang(db, hostId, payload);
        if (onDibuat) {
          // Tidak ada perpindahan halaman di jalur ini, jadi pemintalnya harus
          // dimatikan sendiri — persis jenis kelalaian yang dulu membuat
          // tombol simpan berputar selamanya.
          setKirim(false);
          onDibuat(id, isi.tipe);
        } else {
          // Di sini `kirim` sengaja dibiarkan menyala: halamannya benar-benar
          // berpindah, dan pemintalnya adalah satu-satunya tanda bahwa
          // perpindahan itu sedang berjalan.
          router.replace(`/host/ruang/${id}`);
          router.refresh();
        }
      }
    } catch (e: unknown) {
      setKirim(false);
      setGalat(e instanceof Error ? e.message : "Gagal menyimpan.");
    }
  };

  const hapus = async () => {
    if (!ruangId) return;
    setKirim(true);
    try {
      await hapusRuang(klienBrowser(), ruangId);
      router.replace("/host");
      router.refresh();
    } catch (e: unknown) {
      setKirim(false);
      setGalat(e instanceof Error ? e.message : "Gagal menghapus.");
    }
  };

  return (
    <form onSubmit={simpan} className="space-y-5">
      <Bagian judul="Dasar">
        <div className="sm:col-span-2">
          <Kolom
            id="judul"
            label="Judul"
            required
            maxLength={120}
            value={isi.judul}
            onChange={(e) => ubah("judul", e.target.value)}
            placeholder={
              terbuka
                ? "mis. Halaman depan pinggir jalan raya, muka 4 m"
                : "mis. Garasi kering, mobil sudah dijual"
            }
          />
        </div>
        <Pilihan
          id="tipe"
          label="Tipe tempat"
          value={isi.tipe}
          onChange={(e) => gantiTipe(e.target.value as IsiRuang["tipe"])}
          opsi={opsi(LABEL_TIPE)}
        />
        <Pilihan
          id="kepemilikan"
          label="Status kepemilikan"
          value={isi.kepemilikan}
          onChange={(e) => ubah("kepemilikan", e.target.value as IsiRuang["kepemilikan"])}
          opsi={opsi(LABEL_KEPEMILIKAN)}
          bantuan="Kalau kamu menyewa, pastikan pemiliknya mengizinkan disewakan lagi."
        />
      </Bagian>

      <Bagian
        judul="Lokasi"
        keterangan="Alamat lengkap tidak pernah tampil ke publik. Yang terlihat cuma kelurahan, kecamatan, dan jarak."
      >
        <div className="sm:col-span-2">
          <Kolom
            id="alamat"
            label="Alamat lengkap"
            required
            value={isi.alamat}
            onChange={(e) => ubah("alamat", e.target.value)}
            placeholder="Jl. Ketawanggede No. 141"
          />
        </div>
        <Kolom
          id="patokan"
          label="Patokan"
          value={isi.patokan}
          onChange={(e) => ubah("patokan", e.target.value)}
          placeholder="Seberang warung Bu Tini"
          bantuan="Dibuka bersamaan dengan alamat."
        />
        <PilihWilayah
          nilai={{
            kelurahan: isi.kelurahan,
            kecamatan: isi.kecamatan,
            kota: isi.kota,
          }}
          onGanti={(w) => setIsi((v) => ({ ...v, ...w }))}
        />
        <Kolom
          id="lat"
          label="Lintang"
          type="number"
          step="0.000001"
          required
          value={isi.lat}
          onChange={(e) => ubah("lat", angka(e.target.value))}
        />
        <Kolom
          id="lng"
          label="Bujur"
          type="number"
          step="0.000001"
          required
          value={isi.lng}
          onChange={(e) => ubah("lng", angka(e.target.value))}
        />
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={pakaiLokasiSaya}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
          >
            <Crosshair className="h-4 w-4" />
            Ambil dari lokasi saya sekarang
          </button>
          {pesanLokasi && <p className="mt-1.5 text-xs text-muted">{pesanLokasi}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-paper p-3.5">
            <input
              type="checkbox"
              checked={isi.terbuka_alamat}
              onChange={(e) => ubah("terbuka_alamat", e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-brand)]"
            />
            <span className="text-sm">
              Buka alamat lebih awal
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                Untuk ruang komersial seperti ruko, gudang, atau kios, alamatnya biasanya
                memang sudah publik. Jangan dinyalakan untuk ruang di rumah tinggal.
              </span>
            </span>
          </label>
        </div>
      </Bagian>

      {/*
        Untuk lahan terbuka, LEBAR adalah lebar muka jalan, dan itu sebabnya
        tidak ada isian "lebar muka jalan" tersendiri.

        Sempat ada, dan dibuang 10 September 2026 karena formulirnya terlalu
        panjang: pemiliknya harus mengukur satu angka lagi untuk sesuatu yang
        sudah ia sebutkan. Aturan di CLAUDE.md sudah menyebutnya, kalau
        sebuah keterangan bisa diturunkan dari kolom yang ada, turunkan,
        jangan simpan salinannya. Yang berubah cuma labelnya, dan justru itu
        yang membuat angkanya berarti: "lebar 3 m" jadi jawaban atas
        pertanyaan yang benar-benar dipikirkan pedagang.
      */}
      <Bagian
        judul="Ukuran"
        keterangan={
          terbuka
            ? `Kira-kira saja. Luas: ${luas((isi.panjang_m ?? 0) * (isi.lebar_m ?? 0))}`
            : `Luas ${luas((isi.panjang_m ?? 0) * (isi.lebar_m ?? 0))} · volume ${volume(
                (isi.panjang_m ?? 0) * (isi.lebar_m ?? 0) * (isi.tinggi_m ?? 0)
              )}`
        }
      >
        <KolomAngka
          id="lebar"
          label={terbuka ? "Lebar muka jalan" : "Lebar"}
          step="0.1"
          min="0.5"
          required
          satuan="m"
          nilai={isi.lebar_m}
          onNilai={(n) => ubah("lebar_m", n)}
          bantuan={terbuka ? "Sisi yang menghadap jalan." : undefined}
        />
        <KolomAngka
          id="panjang"
          label={terbuka ? "Panjang ke dalam" : "Panjang"}
          step="0.1"
          min="0.5"
          required
          satuan="m"
          nilai={isi.panjang_m}
          onNilai={(n) => ubah("panjang_m", n)}
          bantuan={terbuka ? "Dari pinggir jalan sampai batas yang disewakan." : undefined}
        />
        {!terbuka && (
          <KolomAngka
            id="tinggi"
            label="Tinggi"
            step="0.1"
            min="0.5"
            required
            satuan="m"
            nilai={isi.tinggi_m}
            onNilai={(n) => ubah("tinggi_m", n)}
          />
        )}
      </Bagian>

      <Bagian
        judul={terbuka ? "Akses dan parkir" : "Akses masuk"}
        keterangan={terbuka ? undefined : "Isi apa adanya. Ini yang paling sering membatalkan sewa."}
      >
        <Pilihan
          id="akses"
          label="Kendaraan terbesar yang bisa masuk"
          value={isi.akses_masuk}
          onChange={(e) => ubah("akses_masuk", e.target.value as IsiRuang["akses_masuk"])}
          opsi={opsi(LABEL_AKSES)}
        />
        {!terbuka && (
          <>
            <Pilihan
              id="posisi"
              label="Posisi lantai"
              value={isi.posisi_lantai}
              onChange={(e) =>
                ubah("posisi_lantai", e.target.value as IsiRuang["posisi_lantai"])
              }
              opsi={opsi(LABEL_POSISI)}
            />
            <KolomAngka
              id="pintu"
              label="Lebar pintu"
              min="30"
              required
              satuan="cm"
              nilai={isi.lebar_pintu_cm}
              onNilai={(n) => ubah("lebar_pintu_cm", n)}
              bantuan="Bagian tersempit yang harus dilewati barang."
            />
          </>
        )}
        <Pilihan
          id="parkir"
          label="Jarak dari parkir"
          value={isi.jarak_parkir}
          onChange={(e) => ubah("jarak_parkir", e.target.value as IsiRuang["jarak_parkir"])}
          opsi={opsi(LABEL_PARKIR)}
        />
      </Bagian>

      <Bagian judul="Kondisi">
        {!terbuka && (
          <>
            <Pilihan
              id="bangunan"
              label="Kondisi bangunan"
              value={isi.kondisi_bangunan}
              onChange={(e) =>
                ubah("kondisi_bangunan", e.target.value as IsiRuang["kondisi_bangunan"])
              }
              opsi={opsi(LABEL_BANGUNAN)}
            />
            <Pilihan
              id="lembap"
              label="Kelembapan"
              value={isi.kelembapan}
              onChange={(e) => ubah("kelembapan", e.target.value as IsiRuang["kelembapan"])}
              opsi={opsi(LABEL_KELEMBAPAN)}
            />
          </>
        )}
        <Pilihan
          id="banjir"
          label="Riwayat banjir"
          value={isi.riwayat_banjir}
          onChange={(e) => ubah("riwayat_banjir", e.target.value as IsiRuang["riwayat_banjir"])}
          opsi={opsi(LABEL_BANJIR)}
          bantuan="Tampil menonjol di kartu hasil."
        />
        {/*
          "Tinggi lahan dari jalan" dibuang untuk lahan terbuka, 10 September
          2026. Ia menuntut pengukuran dalam sentimeter untuk sesuatu yang
          hampir selalu nol atau satu anak tangga, dan pemiliknya berhenti
          mengisi formulir di situ. Riwayat banjir di sebelahnya sudah
          menjawab pertanyaan yang sama, apakah lahannya aman saat jalan
          tergenang, dan itu bisa dijawab tanpa alat ukur.

          Untuk ruang tertutup ia TETAP: di sana ia soal air yang masuk ke
          barang orang lain, dan lantai 20 cm di atas tanah adalah keterangan
          yang benar-benar dipakai penyewa memutuskan.
        */}
        {!terbuka && (
          <KolomAngka
            id="tinggilantai"
            label="Tinggi lantai dari tanah"
            min="0"
            required
            satuan="cm"
            nilai={isi.tinggi_lantai_cm}
            onNilai={(n) => ubah("tinggi_lantai_cm", n)}
          />
        )}
      </Bagian>

      <Bagian judul="Keamanan dan pemakaian">
        {!terbuka && (
          <Pilihan
            id="kunci"
            label="Penguncian"
            value={isi.penguncian}
            onChange={(e) => ubah("penguncian", e.target.value as IsiRuang["penguncian"])}
            opsi={opsi(LABEL_PENGUNCIAN)}
          />
        )}
        <Pilihan
          id="berbagi"
          label={terbuka ? "Pemakaian lahan" : "Pemakaian ruang"}
          value={isi.berbagi}
          onChange={(e) => ubah("berbagi", e.target.value as IsiRuang["berbagi"])}
          opsi={opsi(LABEL_BERBAGI)}
          bantuan={terbuka ? "Boleh dibagi ke beberapa pedagang." : undefined}
        />
        <div className="sm:col-span-2">
          <KotakCentangGanda
            label="Pengawasan"
            opsi={opsi(LABEL_PENGAWASAN)}
            nilai={isi.pengawasan}
            onChange={(v) => ubah("pengawasan", v)}
            bolehLain
            contohLain="mis. ada pos ronda depan gang"
          />
        </div>
        <div className="sm:col-span-2">
          <KotakCentangGanda
            label="Fasilitas"
            opsi={opsi(LABEL_FASILITAS)}
            nilai={isi.fasilitas}
            onChange={(v) => ubah("fasilitas", v)}
            bolehLain
            contohLain="mis. kamar mandi boleh dipakai"
          />
        </div>
      </Bagian>

      {terbuka && (
        <Bagian
          judul="Lahan usaha"
          keterangan="Yang tidak kamu centang otomatis ditolak sistem, termasuk yang menggoreng."
        >
          <div className="sm:col-span-2">
            <KotakCentangGanda
              label="Jenis usaha yang boleh"
              opsi={opsi(LABEL_USAHA)}
              nilai={isi.usaha_diizinkan}
              onChange={(v) => ubah("usaha_diizinkan", v)}
              bolehLain
              contohLain="mis. jual pulsa, warung kopi"
            />
          </div>
          <Pilihan
            id="kelas_jalan"
            label="Kelas jalan"
            value={isi.kelas_jalan ?? ""}
            onChange={(e) => ubah("kelas_jalan", e.target.value || null)}
            opsi={[["", "Pilih kelas jalan"], ...opsi(LABEL_KELAS_JALAN)]}
          />
          <Pilihan
            id="listrik"
            label="Listrik"
            value={isi.listrik ?? ""}
            onChange={(e) => ubah("listrik", e.target.value || null)}
            opsi={[["", "Pilih"], ...opsi(LABEL_LISTRIK)]}
          />
          <Pilihan
            id="air"
            label="Air"
            value={isi.air ?? ""}
            onChange={(e) => ubah("air", e.target.value || null)}
            opsi={[["", "Pilih"], ...opsi(LABEL_AIR)]}
          />
          <Pilihan
            id="atap"
            label="Atap"
            value={isi.atap ?? ""}
            onChange={(e) => ubah("atap", e.target.value || null)}
            opsi={[["", "Pilih"], ...opsi(LABEL_ATAP)]}
          />
        </Bagian>
      )}

      <Bagian
        judul="Aturan"
        keterangan={
          terbuka
            ? undefined
            : "Kategori yang tidak dicentang otomatis ditolak sistem."
        }
      >
        {!terbuka && (
          <div className="sm:col-span-2">
            <KotakCentangGanda
              label="Barang yang diterima"
              opsi={opsi(LABEL_KATEGORI)}
              nilai={isi.kategori_diterima}
              onChange={(v) => ubah("kategori_diterima", v)}
              bolehLain
              contohLain="mis. alat musik"
            />
          </div>
        )}
        <KolomAngka
          id="kuota"
          label={terbuka ? "Kuota kedatangan per bulan" : "Kuota kunjungan per bulan"}
          min="1"
          satuan="x"
          nilai={isi.kuota_akses_bulanan}
          onNilai={(n) => ubah("kuota_akses_bulanan", n)}
          bantuan="Kosongkan untuk tanpa batas."
        />
        <KolomAngka
          id="durasi"
          label="Sewa minimum"
          min="1"
          required
          satuan="hari"
          nilai={isi.durasi_min_hari}
          onNilai={(n) => ubah("durasi_min_hari", n)}
        />
      </Bagian>

      {/*
        Keterangannya dulu berbunyi "yang sewa 3 bulan membayar ...", dan tiga
        bulan itu angka karangan, tidak ada apa pun di aplikasi ini yang
        mewajibkannya. Sekarang yang dipakai sewa MINIMUM yang pemiliknya
        sendiri tetapkan sebaris di atas, jadi angkanya benar-benar berlaku.
      */}
      <Bagian
        judul="Harga"
        keterangan={
          isi.harga_bulanan && isi.durasi_min_hari
            ? `Sewa minimum ${isi.durasi_min_hari} hari berarti ${rupiah(
                isi.harga_bulanan * bulanDari(isi.durasi_min_hari)
              )}${isi.deposit ? `, plus deposit ${rupiah(isi.deposit)}` : ""}.`
            : "Bulan dibulatkan ke atas."
        }
      >
        <KolomAngka
          id="harga"
          label="Sewa per bulan"
          min="0"
          step="10000"
          required
          satuan="Rp"
          nilai={isi.harga_bulanan}
          onNilai={(n) => ubah("harga_bulanan", n)}
        />
        <KolomAngka
          id="deposit"
          label="Deposit"
          min="0"
          step="10000"
          satuan="Rp"
          nilai={isi.deposit}
          onNilai={(n) => ubah("deposit", n)}
          bantuan="Dikembalikan di akhir sewa. Kosongkan kalau tidak ada."
        />
        <Pilihan
          id="status"
          label="Status"
          value={isi.status}
          onChange={(e) => ubah("status", e.target.value as IsiRuang["status"])}
          opsi={[
            ["draf", "Draf, belum terlihat siapa pun"],
            ["tayang", "Tayang, muncul di pencarian"],
            ["ditangguhkan", "Ditangguhkan, sementara tidak menerima penyewa"],
          ]}
          bantuan="Tayangkan setelah fotonya ada."
        />
      </Bagian>

      {galat && (
        <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
      )}
      {tersimpan && (
        <p className="rounded-xl bg-good-soft px-3.5 py-2.5 text-sm text-good">
          Perubahan tersimpan.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={kirim}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {kirim && <Loader2 className="h-4 w-4 animate-spin" />}
          {ruangId
            ? "Simpan perubahan"
            : onDibuat
              ? "Lanjut ke foto"
              : terbuka
                ? "Simpan lahan"
                : "Simpan ruang"}
        </button>

        {ruangId && (
          <>
            {konfirmasiHapus ? (
              <span className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">
                  Hapus {terbuka ? "lahan" : "ruang"} ini permanen?
                </span>
                <button
                  type="button"
                  onClick={hapus}
                  disabled={kirim}
                  className="cursor-pointer rounded-full bg-warn px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  Ya, hapus
                </button>
                <button
                  type="button"
                  onClick={() => setKonfirmasiHapus(false)}
                  className="cursor-pointer rounded-full px-3 py-2 text-xs font-semibold text-muted hover:text-ink"
                >
                  Batal
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setKonfirmasiHapus(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-muted hover:text-warn"
              >
                <Trash2 className="h-4 w-4" />
                Hapus {terbuka ? "lahan" : "ruang"}
              </button>
            )}
          </>
        )}
      </div>
    </form>
  );
}
