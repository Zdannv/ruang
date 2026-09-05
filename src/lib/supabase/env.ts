/**
 * Kredensial Supabase, dibaca sekali di satu tempat.
 *
 * Dipisah dari pembuatan klien supaya modul server dan browser bisa memakainya
 * tanpa saling mengimpor — `createBrowserClient` menyentuh `document`, dan
 * `createServerClient` menyentuh `next/headers`; keduanya tidak boleh sampai
 * ikut terbundel ke sisi yang salah.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

/**
 * Apakah kredensialnya sudah diisi. Dipakai layar untuk menampilkan petunjuk
 * pemasangan alih-alih layar putih — repo ini akan dibuka di laptop lain.
 */
export const supabaseSiap = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function pastikanSiap(): void {
  if (!supabaseSiap) {
    throw new Error(
      "Supabase belum dikonfigurasi. Salin .env.example menjadi .env.local, " +
        "lalu isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
}

/**
 * Alamat dasar aplikasi untuk tautan yang dikirim lewat email.
 *
 * Kenapa bukan `window.location.origin` saja: nilai itu dibekukan ke dalam
 * email pada detik orang menekan tombol daftar. Kalau ia mendaftar dari
 * `http://localhost:3000`, tautan konfirmasinya selamanya menunjuk ke sana —
 * dan email itu biasanya dibuka beberapa menit kemudian saat dev server sudah
 * mati, atau dibuka di HP, di mana `localhost` berarti HP itu sendiri.
 *
 * Alamat yang dihasilkan di sini juga harus terdaftar di Supabase Dashboard ->
 * Authentication -> URL Configuration -> Redirect URLs. Kalau tidak, Supabase
 * mengabaikannya dan diam-diam memakai Site URL.
 */
export function siteUrl(path = "/"): string {
  const base = (alamatDasar() || "").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Urutan sumber alamat dasar, dari yang paling bisa dipercaya.
 *
 * Yang penting bukan cuma "ada nilainya", tapi bahwa nilainya STABIL. Tiap
 * deployment Vercel punya URL sendiri yang mengandung hash acak
 * (`ruang-96ozoct4d-....vercel.app`), dan URL itu berganti tiap kali deploy.
 * Tautan konfirmasi yang menunjuk ke sana akan mati begitu ada deployment
 * berikutnya — padahal email biasanya dibuka beberapa menit kemudian.
 *
 * Karena itu `VERCEL_URL` (URL deployment) sengaja TIDAK dipakai, sedangkan
 * `VERCEL_PROJECT_PRODUCTION_URL` (domain produksi yang tetap) dipakai.
 */
function alamatDasar(): string {
  const disetel = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (disetel) return disetel;

  // Disediakan Vercel otomatis untuk project Next.js, dan nilainya tetap
  // lintas deployment. Cadangan kalau NEXT_PUBLIC_SITE_URL lupa diisi.
  const produksi = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (produksi) return `https://${produksi.replace(/^https?:\/\//, "")}`;

  // Terakhir: alamat yang sedang dibuka. Cukup untuk pengembangan lokal, tapi
  // inilah sumber masalah "tautan konfirmasi menunjuk ke localhost".
  return typeof window !== "undefined" ? window.location.origin : "";
}
