/**
 * Video lahan: pemeriksaan, poster, dan unggahan.
 *
 * Diminta client, 8 September 2026 — lihat kepala `18_video.sql` untuk alasan
 * dan untuk aritmatika kuotanya.
 *
 * Tiga hal ditegakkan di sini, dan ketiganya soal BANDWIDTH, bukan kerapian:
 *
 *   1. Durasi maksimum 45 detik. Video lahan yang berguna adalah satu jalan
 *      dari pinggir jalan ke lahannya; yang lebih panjang dari itu tidak
 *      menambah keterangan, cuma menambah megabita.
 *   2. Ukuran maksimum 20 MB, sama dengan batas bucket-nya. Diperiksa di sini
 *      juga supaya orangnya tahu SEBELUM mengunggah 20 MB lewat data seluler
 *      dan baru ditolak di ujung.
 *   3. Satu bingkai diambil jadi poster. Ini penghemat terbesarnya: pemutar
 *      di halaman lahan memakai `preload="none"`, jadi videonya hanya
 *      terunduh kalau ada yang menekan putar — dan tanpa poster, yang perlu
 *      ditekan itu cuma kotak hitam.
 *
 * Videonya TIDAK dikompres ulang di peramban. Satu-satunya cara melakukannya
 * dengan hasil yang bisa diandalkan adalah ffmpeg.wasm, dan itu unduhan 25 MB
 * demi menghemat beberapa MB — pertukaran yang arahnya salah. Yang dipakai
 * adalah penolakan: batasi durasinya, dan minta host merekam potret pendek.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_VIDEO = "ruang-video";

export const DURASI_MAKS_DETIK = 45;
export const UKURAN_MAKS_MB = 20;
const LEBAR_POSTER = 800;

export type VideoMilikSaya = {
  id: string;
  url: string;
  poster_url: string | null;
  durasi_detik: number | null;
  keterangan: string | null;
};

/** Keterangan yang disarankan — sengaja spesifik, bukan "video 1". */
export const KETERANGAN_VIDEO = [
  "jalan masuk dari jalan raya",
  "keliling lahan",
  "lahan dari seberang jalan",
  "kondisi saat jam ramai",
];

class GalatVideo extends Error {}

/**
 * Baca durasi, dan ambil satu bingkai jadi poster.
 *
 * Posternya boleh gagal. Di sebagian peramban HP, menggambar bingkai video ke
 * canvas ditolak atau menghasilkan bingkai kosong, dan itu bukan alasan
 * membatalkan unggahan — videonya tetap berguna, cuma tampil tanpa gambar
 * pratinjau.
 */
async function periksaDanPoster(
  file: File
): Promise<{ durasi: number; poster: Blob | null }> {
  if (file.size > UKURAN_MAKS_MB * 1024 * 1024) {
    throw new GalatVideo(
      `Videonya ${(file.size / 1024 / 1024).toFixed(1)} MB, maksimum ${UKURAN_MAKS_MB} MB. ` +
        "Rekam lebih pendek, atau pakai kualitas yang lebih rendah di pengaturan kamera."
    );
  }

  const alamat = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.preload = "metadata";
  v.muted = true;
  v.playsInline = true;
  v.src = alamat;

  try {
    const durasi = await new Promise<number>((selesai, tolak) => {
      v.onloadedmetadata = () => selesai(v.duration);
      v.onerror = () =>
        tolak(new GalatVideo("Berkasnya tidak bisa dibaca sebagai video."));
    });

    if (!Number.isFinite(durasi) || durasi <= 0) {
      throw new GalatVideo("Durasi videonya tidak terbaca.");
    }
    if (durasi > DURASI_MAKS_DETIK) {
      throw new GalatVideo(
        `Videonya ${Math.round(durasi)} detik, maksimum ${DURASI_MAKS_DETIK} detik. ` +
          "Satu jalan dari pinggir jalan ke lahannya biasanya cukup."
      );
    }

    return { durasi: Math.round(durasi), poster: await ambilBingkai(v, durasi) };
  } finally {
    URL.revokeObjectURL(alamat);
  }
}

async function ambilBingkai(v: HTMLVideoElement, durasi: number): Promise<Blob | null> {
  try {
    // Bingkai pertama sering masih gelap atau kabur karena kamera belum fokus.
    // Diambil dari sekitar sepersepuluh durasinya.
    await new Promise<void>((selesai, tolak) => {
      v.onseeked = () => selesai();
      v.onerror = () => tolak(new Error("gagal seek"));
      v.currentTime = Math.min(durasi * 0.1 + 0.2, durasi - 0.05);
    });

    const skala = Math.min(1, LEBAR_POSTER / Math.max(v.videoWidth, v.videoHeight));
    const kanvas = document.createElement("canvas");
    kanvas.width = Math.max(1, Math.round(v.videoWidth * skala));
    kanvas.height = Math.max(1, Math.round(v.videoHeight * skala));

    const ctx = kanvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, kanvas.width, kanvas.height);

    return await new Promise<Blob | null>((selesai) =>
      kanvas.toBlob(selesai, "image/webp", 0.75)
    );
  } catch {
    return null;
  }
}

/**
 * Unggah satu video beserta posternya, lalu catat barisnya.
 *
 * Berkasnya dikirim langsung ke Storage dari peramban, bukan lewat route
 * aplikasi. Untuk foto itu sudah jadi aturan di CLAUDE.md; untuk video 20 MB
 * ia bukan lagi penghematan melainkan syarat, karena route Vercel punya batas
 * waktu dan batas ukuran badan permintaan.
 */
export async function unggahVideo(
  db: SupabaseClient,
  opsi: { hostId: string; ruangId: string; file: File; keterangan: string }
): Promise<void> {
  const { durasi, poster } = await periksaDanPoster(opsi.file);

  const dasar = `${opsi.hostId}/${opsi.ruangId}/${crypto.randomUUID()}`;
  const ekstensi = opsi.file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const namaVideo = `${dasar}.${ekstensi === "mov" ? "mov" : ekstensi}`;

  const naik = await db.storage
    .from(BUCKET_VIDEO)
    .upload(namaVideo, opsi.file, { contentType: opsi.file.type, upsert: false });
  if (naik.error) throw naik.error;

  let posterUrl: string | null = null;
  if (poster) {
    const namaPoster = `${dasar}-poster.webp`;
    const naikPoster = await db.storage
      .from(BUCKET_VIDEO)
      .upload(namaPoster, poster, { contentType: "image/webp", upsert: false });
    // Poster gagal bukan alasan membatalkan videonya yang sudah terunggah.
    if (!naikPoster.error) {
      posterUrl = db.storage.from(BUCKET_VIDEO).getPublicUrl(namaPoster).data.publicUrl;
    }
  }

  const { error } = await db.from("ruang_video").insert({
    ruang_id: opsi.ruangId,
    url: db.storage.from(BUCKET_VIDEO).getPublicUrl(namaVideo).data.publicUrl,
    poster_url: posterUrl,
    durasi_detik: durasi,
    keterangan: opsi.keterangan,
  });
  if (error) throw error;
}

export async function daftarVideo(
  db: SupabaseClient,
  ruangId: string
): Promise<VideoMilikSaya[]> {
  const { data, error } = await db
    .from("ruang_video")
    .select("id, url, poster_url, durasi_detik, keterangan")
    .eq("ruang_id", ruangId)
    .order("dibuat_pada");
  if (error) throw error;
  return (data ?? []) as VideoMilikSaya[];
}

export async function hapusVideo(
  db: SupabaseClient,
  video: { id: string; url: string; poster_url: string | null }
): Promise<void> {
  const jalur = [video.url, video.poster_url]
    .filter((u): u is string => Boolean(u))
    .map((u) => u.split(`/${BUCKET_VIDEO}/`)[1])
    .filter((j): j is string => Boolean(j));

  if (jalur.length > 0) await db.storage.from(BUCKET_VIDEO).remove(jalur);

  const { error } = await db.from("ruang_video").delete().eq("id", video.id);
  if (error) throw error;
}
