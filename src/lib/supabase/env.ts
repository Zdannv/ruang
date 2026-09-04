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
  const dikonfigurasi = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = (
    dikonfigurasi || (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
