-- ============================================================
--  16. Wilayah orangnya, berikut koordinatnya
--
--  `/cari` dulu selalu mulai dari titik bawaan (Kampus UB) untuk siapa pun
--  yang belum memberi izin lokasi. Untuk orang Malang itu kebetulan masuk
--  akal; untuk orang Surabaya ia salah, dan tidak ada apa pun di aplikasi
--  yang menyadarinya — padahal wilayahnya sudah ditanyakan saat mendaftar.
--
--  Yang menghalangi bukan datanya melainkan bentuknya: `profil.kota` adalah
--  NAMA, sedangkan `ruang_terdekat()` butuh lintang dan bujur. Jadi kolom
--  koordinat ditambahkan, diisi sekali dari nama wilayahnya lewat
--  `/api/titik-saya`, lalu dipakai terus.
--
--  Semuanya nullable, dan itu bukan kelonggaran: profil yang sudah ada
--  mendaftar sebelum kolom ini ada, dan tidak ada nilai yang benar untuk
--  ditebakkan ke mereka. Pembacanya wajib menangani NULL.
-- ============================================================

alter table profil add column if not exists kelurahan text;
alter table profil add column if not exists kecamatan text;
alter table profil add column if not exists lat double precision;
alter table profil add column if not exists lng double precision;

comment on column profil.lat is
  'Titik wilayah yang ia sebut saat mendaftar — pusat kelurahan atau kota, '
  'BUKAN alamat rumahnya. Dipakai sebagai titik awal pencarian. Diisi sekali '
  'oleh /api/titik-saya lalu tidak dihitung lagi.';

-- Tidak perlu menyentuh `periksa_permukaan_publik()`: daftar kolom
-- terlarangnya sudah memuat 'lat' dan 'lng' sejak semula, dan pemeriksaannya
-- berdasarkan NAMA kolom di view mana pun — jadi kedua kolom baru ini ikut
-- terjaga tanpa perubahan apa-apa. Diperiksa di bawah.

/*
  Trigger pendaftaran ikut membaca wilayah yang dipilih di formulir daftar.

  `kota` tetap punya cadangan 'Malang' seperti sebelumnya — trigger ini juga
  menyala untuk akun yang dibuat dari dashboard Supabase, yang tidak mengirim
  metadata apa pun, dan `kota` not null.

  Koordinatnya TIDAK diisi di sini. Menggeokode dari dalam trigger database
  berarti memanggil jaringan di tengah transaksi pendaftaran: kalau layanannya
  lambat, orangnya gagal daftar karena alasan yang tidak ada hubungannya
  dengan pendaftaran.
*/
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profil (user_id, nama, telepon, kota, kecamatan, kelurahan)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nama'), ''), split_part(new.email, '@', 1)),
    nullif(btrim(new.raw_user_meta_data ->> 'telepon'), ''),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'kota'), ''), 'Malang'),
    nullif(btrim(new.raw_user_meta_data ->> 'kecamatan'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'kelurahan'), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

select periksa_permukaan_publik();
