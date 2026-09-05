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
