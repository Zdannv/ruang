/**
 * Service worker Ruang.
 *
 * ATURAN PALING PENTING DI BERKAS INI: jangan pernah menyimpan HTML halaman.
 *
 * Hampir semua halaman di sini dirender di server dan isinya bergantung pada
 * siapa yang sedang masuk — nama di header, daftar pemesanan, alamat lengkap
 * ruang yang sudah dibayar. Menyimpan HTML-nya ke Cache Storage berarti
 * halaman berisi data satu orang bisa tersaji lagi setelah ia keluar, atau
 * setelah orang lain memakai peramban yang sama. Karena itu navigasi selalu
 * mengambil dari jaringan, dan yang disimpan hanya aset statis yang namanya
 * sudah mengandung hash isi.
 *
 * Yang didapat dari service worker ini: aset statis termuat instan saat
 * kembali, dan halaman offline yang menjelaskan keadaan alih-alih layar dinosaurus.
 */

const VERSI = "ruang-v1";
const ASET = [
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSI)
      .then((cache) => cache.addAll(ASET))
      // Versi baru langsung menggantikan yang lama. Tanpa ini, perbaikan di
      // service worker baru berlaku setelah semua tab ditutup — dan orang
      // jarang menutup semua tab.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((kunci) =>
        Promise.all(kunci.filter((k) => k !== VERSI).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const permintaan = event.request;

  // Hanya GET. POST ke Supabase, keluar akun, dan pengunggahan foto tidak boleh
  // disentuh sama sekali.
  if (permintaan.method !== "GET") return;

  const url = new URL(permintaan.url);

  // Lintas origin: panggilan ke Supabase dan Storage. Biarkan lewat apa adanya —
  // menyimpannya berarti menyimpan data pribadi orang di luar kendali RLS.
  if (url.origin !== self.location.origin) return;

  // Aset statis Next.js namanya mengandung hash isi, jadi tidak pernah basi.
  const statis =
    url.pathname.startsWith("/_next/static/") ||
    ASET.includes(url.pathname) ||
    url.pathname === "/favicon.ico";

  if (statis) {
    event.respondWith(
      caches.match(permintaan).then(
        (tersimpan) =>
          tersimpan ||
          fetch(permintaan).then((jawaban) => {
            if (jawaban.ok) {
              const salinan = jawaban.clone();
              caches.open(VERSI).then((cache) => cache.put(permintaan, salinan));
            }
            return jawaban;
          })
      )
    );
    return;
  }

  // Navigasi: selalu dari jaringan, tidak pernah disimpan. Kalau jaringannya
  // mati, tampilkan halaman offline — bukan versi lama halaman ini.
  if (permintaan.mode === "navigate") {
    event.respondWith(
      fetch(permintaan).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Sisanya (mis. data rute Next) lewat begitu saja tanpa disimpan.
});

/**
 * Web push.
 *
 * Isi pemberitahuan dikirim server dalam bentuk JSON sederhana. Kalau isinya
 * tidak bisa dibaca — versi lama, atau push kosong yang dikirim layanan untuk
 * menguji langganan — tetap ditampilkan sesuatu, karena `userVisibleOnly`
 * mewajibkan setiap push berakhir dengan pemberitahuan yang terlihat. Diam
 * saja akan membuat peramban mencabut izin push situs ini.
 */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const judul = data.judul || "Ruang";
  const opsi = {
    body: data.isi || "Ada pembaruan di Ruang.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    lang: "id",
    // Notifikasi untuk satu pemesanan saling menimpa alih-alih menumpuk:
    // host yang meninggalkan HP semalam tidak perlu menemukan dua puluh
    // baris tentang satu pemesanan yang sama.
    tag: data.tautan || "ruang",
    renotify: false,
    data: { tautan: data.tautan || "/notifikasi" },
  };

  event.waitUntil(self.registration.showNotification(judul, opsi));
});

/**
 * Mengetuk pemberitahuan membuka halaman yang dituju.
 *
 * Kalau aplikasinya sudah terbuka di suatu tab, tab itu yang dipakai dan
 * diarahkan — bukan membuka tab baru. Orang yang mengetuk tiga pemberitahuan
 * tidak seharusnya berakhir dengan tiga salinan aplikasi yang sama.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const tujuan = event.notification.data?.tautan || "/notifikasi";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((daftar) => {
        for (const klien of daftar) {
          if (new URL(klien.url).origin === self.location.origin && "focus" in klien) {
            return klien.navigate(tujuan).then((k) => k && k.focus());
          }
        }
        return self.clients.openWindow(tujuan);
      })
  );
});
