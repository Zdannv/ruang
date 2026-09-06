"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Loader2, Trash2 } from "lucide-react";
import { Bagian, Kolom, KotakCentangGanda, Pilihan } from "@/components/host/Kolom";
import PilihWilayah from "@/components/host/PilihWilayah";
import { klienBrowser } from "@/lib/supabase/browser";
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
} from "@/lib/label";

const opsi = (peta: Record<string, string>): [string, string][] => Object.entries(peta);

/** Titik tengah Malang — dipakai kalau host belum menempelkan lokasinya. */
const AWAL: IsiRuang = {
  judul: "",
  tipe: "garasi",
  kepemilikan: "milik_sendiri",
  alamat: "",
  patokan: "",
  kelurahan: "",
  kecamatan: "",
  kota: "",
  lat: -7.9666,
  lng: 112.6326,
  terbuka_alamat: false,
  panjang_m: 3,
  lebar_m: 3,
  tinggi_m: 2.5,
  akses_masuk: "mobil_pikap",
  posisi_lantai: "dasar_rata",
  lebar_pintu_cm: 90,
  jarak_parkir: "lt10m",
  kondisi_bangunan: "dinding_atap",
  kelembapan: "kering_ventilasi",
  riwayat_banjir: "tidak_pernah",
  tinggi_lantai_cm: 20,
  penguncian: "kunci_penyewa",
  berbagi: "eksklusif",
  pengawasan: [],
  fasilitas: [],
  kategori_diterima: ["kardus"],
  kuota_akses_bulanan: 4,
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
  onDibuat?: (id: string) => void;
}) {
  const router = useRouter();
  const [isi, setIsi] = useState<IsiRuang>(awal ?? AWAL);
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);

  const ubah = <K extends keyof IsiRuang>(kunci: K, nilai: IsiRuang[K]) =>
    setIsi((v) => ({ ...v, [kunci]: nilai }));

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
    if (isi.kategori_diterima.length === 0) {
      setGalat("Pilih minimal satu kategori barang yang kamu terima.");
      return;
    }
    // Wilayah dipilih lewat select berjenjang, dan `required` pada select tidak
    // menahan apa pun kalau nilainya string kosong dari <option> pertama.
    if (!isi.kelurahan || !isi.kecamatan || !isi.kota) {
      setGalat("Lengkapi wilayahnya sampai kelurahan.");
      return;
    }
    setKirim(true);
    setGalat(null);
    setTersimpan(false);
    try {
      const db = klienBrowser();
      if (ruangId) {
        await ubahRuang(db, ruangId, isi);
        // Versi sebelumnya memanggil `router.replace` ke alamat yang SEDANG
        // dibuka. Itu bukan perpindahan halaman, jadi komponennya tidak pernah
        // dilepas — dan karena `setKirim(false)` cuma ada di cabang galat,
        // tombolnya berputar selamanya setiap kali penyimpanannya berhasil.
        // Yang dibutuhkan halaman ini cuma memuat ulang datanya.
        setKirim(false);
        setTersimpan(true);
        router.refresh();
      } else {
        const id = await buatRuang(db, hostId, isi);
        if (onDibuat) {
          // Tidak ada perpindahan halaman di jalur ini, jadi pemintalnya harus
          // dimatikan sendiri — persis jenis kelalaian yang dulu membuat
          // tombol simpan berputar selamanya.
          setKirim(false);
          onDibuat(id);
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
            placeholder="mis. Garasi kering, mobil sudah dijual"
            bantuan="Sebutkan yang paling menentukan: kering, muat truk, dekat kampus."
          />
        </div>
        <Pilihan
          id="tipe"
          label="Tipe ruang"
          value={isi.tipe}
          onChange={(e) => ubah("tipe", e.target.value as IsiRuang["tipe"])}
          opsi={opsi(LABEL_TIPE)}
        />
        <Pilihan
          id="kepemilikan"
          label="Status kepemilikan"
          value={isi.kepemilikan}
          onChange={(e) => ubah("kepemilikan", e.target.value as IsiRuang["kepemilikan"])}
          opsi={opsi(LABEL_KEPEMILIKAN)}
          bantuan="Kalau kamu menyewa tempatnya, pastikan pemiliknya mengizinkan disewakan lagi."
        />
      </Bagian>

      <Bagian
        judul="Lokasi"
        keterangan="Alamat lengkap tidak pernah ditampilkan ke publik — yang terlihat cuma kelurahan, kecamatan, dan jarak. Titik di peta digeser sekitar 200 m otomatis, dan pergeserannya tidak bisa dimatikan."
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
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#1f5fff]"
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

      <Bagian
        judul="Ukuran"
        keterangan={`Luas dan volume dihitung otomatis: ${luas(
          isi.panjang_m * isi.lebar_m
        )} · ${volume(isi.panjang_m * isi.lebar_m * isi.tinggi_m)}`}
      >
        <Kolom
          id="panjang"
          label="Panjang"
          type="number"
          step="0.1"
          min="0.5"
          required
          satuan="m"
          value={isi.panjang_m}
          onChange={(e) => ubah("panjang_m", angka(e.target.value))}
        />
        <Kolom
          id="lebar"
          label="Lebar"
          type="number"
          step="0.1"
          min="0.5"
          required
          satuan="m"
          value={isi.lebar_m}
          onChange={(e) => ubah("lebar_m", angka(e.target.value))}
        />
        <Kolom
          id="tinggi"
          label="Tinggi"
          type="number"
          step="0.1"
          min="0.5"
          required
          satuan="m"
          value={isi.tinggi_m}
          onChange={(e) => ubah("tinggi_m", angka(e.target.value))}
        />
      </Bagian>

      <Bagian
        judul="Akses masuk"
        keterangan="Ini yang paling sering membatalkan sewa setelah orang datang melihat. Isi apa adanya."
      >
        <Pilihan
          id="akses"
          label="Kendaraan terbesar yang bisa masuk"
          value={isi.akses_masuk}
          onChange={(e) => ubah("akses_masuk", e.target.value as IsiRuang["akses_masuk"])}
          opsi={opsi(LABEL_AKSES)}
        />
        <Pilihan
          id="posisi"
          label="Posisi lantai"
          value={isi.posisi_lantai}
          onChange={(e) => ubah("posisi_lantai", e.target.value as IsiRuang["posisi_lantai"])}
          opsi={opsi(LABEL_POSISI)}
        />
        <Kolom
          id="pintu"
          label="Lebar pintu"
          type="number"
          min="30"
          required
          satuan="cm"
          value={isi.lebar_pintu_cm}
          onChange={(e) => ubah("lebar_pintu_cm", angka(e.target.value))}
          bantuan="Ukur bagian tersempit yang harus dilewati barang."
        />
        <Pilihan
          id="parkir"
          label="Jarak dari parkir"
          value={isi.jarak_parkir}
          onChange={(e) => ubah("jarak_parkir", e.target.value as IsiRuang["jarak_parkir"])}
          opsi={opsi(LABEL_PARKIR)}
        />
      </Bagian>

      <Bagian judul="Kondisi">
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
        <Pilihan
          id="banjir"
          label="Riwayat banjir"
          value={isi.riwayat_banjir}
          onChange={(e) => ubah("riwayat_banjir", e.target.value as IsiRuang["riwayat_banjir"])}
          opsi={opsi(LABEL_BANJIR)}
          bantuan="Ini ditampilkan menonjol di kartu hasil. Menyembunyikannya cuma menunda pembatalan."
        />
        <Kolom
          id="tinggilantai"
          label="Tinggi lantai dari tanah"
          type="number"
          min="0"
          required
          satuan="cm"
          value={isi.tinggi_lantai_cm}
          onChange={(e) => ubah("tinggi_lantai_cm", angka(e.target.value))}
        />
      </Bagian>

      <Bagian judul="Keamanan dan pemakaian">
        <Pilihan
          id="kunci"
          label="Penguncian"
          value={isi.penguncian}
          onChange={(e) => ubah("penguncian", e.target.value as IsiRuang["penguncian"])}
          opsi={opsi(LABEL_PENGUNCIAN)}
        />
        <Pilihan
          id="berbagi"
          label="Pemakaian ruang"
          value={isi.berbagi}
          onChange={(e) => ubah("berbagi", e.target.value as IsiRuang["berbagi"])}
          opsi={opsi(LABEL_BERBAGI)}
        />
        <div className="sm:col-span-2">
          <KotakCentangGanda
            label="Pengawasan"
            opsi={opsi(LABEL_PENGAWASAN)}
            nilai={isi.pengawasan}
            onChange={(v) => ubah("pengawasan", v)}
          />
        </div>
        <div className="sm:col-span-2">
          <KotakCentangGanda
            label="Fasilitas"
            opsi={opsi(LABEL_FASILITAS)}
            nilai={isi.fasilitas}
            onChange={(v) => ubah("fasilitas", v)}
          />
        </div>
      </Bagian>

      <Bagian
        judul="Aturan"
        keterangan="Manifes penyewa dicocokkan dengan kategori di bawah sebelum permintaannya sampai ke kamu. Kategori yang tidak dicentang otomatis ditolak sistem. Jam aksesnya diatur terpisah di bagian Jendela akses."
      >
        <div className="sm:col-span-2">
          <KotakCentangGanda
            label="Barang yang diterima"
            opsi={opsi(LABEL_KATEGORI)}
            nilai={isi.kategori_diterima}
            onChange={(v) => ubah("kategori_diterima", v)}
          />
        </div>
        <Kolom
          id="kuota"
          label="Kuota kunjungan per bulan"
          type="number"
          min="1"
          required
          satuan="x"
          value={isi.kuota_akses_bulanan}
          onChange={(e) => ubah("kuota_akses_bulanan", angka(e.target.value))}
        />
        <Kolom
          id="durasi"
          label="Sewa minimum"
          type="number"
          min="1"
          required
          satuan="hari"
          value={isi.durasi_min_hari}
          onChange={(e) => ubah("durasi_min_hari", angka(e.target.value))}
        />
      </Bagian>

      <Bagian
        judul="Harga"
        keterangan={`Penyewa 3 bulan membayar ${rupiah(isi.harga_bulanan * 3)} sewa${
          isi.deposit > 0 ? `, plus deposit ${rupiah(isi.deposit)}` : ""
        }.`}
      >
        <Kolom
          id="harga"
          label="Sewa per bulan"
          type="number"
          min="0"
          step="10000"
          required
          satuan="Rp"
          value={isi.harga_bulanan}
          onChange={(e) => ubah("harga_bulanan", angka(e.target.value))}
        />
        <Kolom
          id="deposit"
          label="Deposit"
          type="number"
          min="0"
          step="10000"
          satuan="Rp"
          value={isi.deposit}
          onChange={(e) => ubah("deposit", angka(e.target.value))}
          bantuan="Dikembalikan di akhir sewa. Isi 0 kalau tidak ada."
        />
        <Pilihan
          id="status"
          label="Status"
          value={isi.status}
          onChange={(e) => ubah("status", e.target.value as IsiRuang["status"])}
          opsi={[
            ["draf", "Draf — belum terlihat siapa pun"],
            ["tayang", "Tayang — muncul di pencarian"],
            ["ditangguhkan", "Ditangguhkan — sementara tidak menerima penyewa"],
          ]}
          bantuan="Tayangkan setelah fotonya ada. Ruang tanpa foto hampir tidak pernah diklik."
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
          {ruangId ? "Simpan perubahan" : onDibuat ? "Lanjut ke foto" : "Simpan ruang"}
        </button>

        {ruangId && (
          <>
            {konfirmasiHapus ? (
              <span className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">Hapus ruang ini permanen?</span>
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
                Hapus ruang
              </button>
            )}
          </>
        )}
      </div>
    </form>
  );
}
