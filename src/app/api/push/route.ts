import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  PUSH_RAHASIA,
  klienServiceRole,
  pushSiap,
  siapkanWebPush,
} from "@/lib/push/server";

type Baris = {
  notifikasi_id: string;
  judul: string;
  isi: string | null;
  tautan: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** Perbandingan rahasia yang tidak bocor lewat lama waktu bandingnya. */
function rahasiaCocok(diberi: string | null): boolean {
  if (!diberi || !PUSH_RAHASIA) return false;
  const a = Buffer.from(diberi);
  const b = Buffer.from(PUSH_RAHASIA);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Mengirim notifikasi yang belum didorong ke perangkat pemiliknya.
 *
 * Dipanggil Database Webhook Supabase setiap kali baris `notifikasi` dibuat.
 * Bukan dipanggil peramban: ia memakai service role dan kunci privat VAPID.
 *
 * Sengaja TIDAK mengambil isi notifikasi dari badan permintaan webhook,
 * melainkan membacanya sendiri dari database. Kalau ia memercayai badan
 * permintaan, siapa pun yang tahu alamat ini dan menebak rahasianya bisa
 * mengirim pemberitahuan berisi apa saja ke perangkat orang lain. Dengan
 * membaca sendiri, yang terkirim selalu apa yang benar-benar ada di tabel.
 *
 * Aman dipanggil berulang: baris yang sudah didorong ditandai, dan webhook
 * yang mengulang kirim karena jawabannya lambat tidak akan berbunyi dua kali.
 */
export async function POST(request: NextRequest) {
  if (!pushSiap) {
    // 200, bukan 500: kalau push belum dikonfigurasi, webhook tidak perlu
    // mengulang-ulang permintaan yang tidak akan pernah berhasil.
    return NextResponse.json({ lewati: "push belum dikonfigurasi" });
  }

  if (!rahasiaCocok(request.headers.get("x-ruang-rahasia"))) {
    return NextResponse.json({ galat: "rahasia tidak cocok" }, { status: 401 });
  }

  const db = klienServiceRole();
  const { data, error } = await db.rpc("notifikasi_untuk_didorong", { p_batas: 20 });
  if (error) {
    return NextResponse.json({ galat: error.message }, { status: 500 });
  }

  const baris = (data ?? []) as Baris[];
  if (baris.length === 0) return NextResponse.json({ dikirim: 0 });

  const webpush = siapkanWebPush();
  const terkirim = new Set<string>();
  const dibuang: string[] = [];

  await Promise.all(
    baris.map(async (b) => {
      try {
        await webpush.sendNotification(
          { endpoint: b.endpoint, keys: { p256dh: b.p256dh, auth: b.auth } },
          JSON.stringify({ judul: b.judul, isi: b.isi, tautan: b.tautan })
        );
        terkirim.add(b.notifikasi_id);
      } catch (e: unknown) {
        const kode = (e as { statusCode?: number }).statusCode;
        // 404/410 berarti langganannya sudah mati — perangkatnya mencabut izin
        // atau peramban membuangnya. Kalau tidak dihapus, ia dicoba lagi
        // selamanya.
        if (kode === 404 || kode === 410) {
          dibuang.push(b.endpoint);
          terkirim.add(b.notifikasi_id);
        }
        // Galat lain (jaringan, 5xx layanan push) dibiarkan: barisnya tetap
        // belum ditandai, jadi percobaan berikutnya mengambilnya lagi.
      }
    })
  );

  if (dibuang.length > 0) {
    await Promise.all(
      dibuang.map((endpoint) => db.rpc("buang_langganan_push", { p_endpoint: endpoint }))
    );
  }

  if (terkirim.size > 0) {
    await db.rpc("tandai_sudah_didorong", { p_ids: [...terkirim] });
  }

  return NextResponse.json({
    dikirim: terkirim.size,
    langganan_dibuang: dibuang.length,
  });
}
