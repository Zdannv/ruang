-- ============================================================
--  Ruang — balasan cepat host
--
--  Jalankan setelah 11_pesan_chat.sql. Aman dijalankan ulang.
--
--  Host menerima pertanyaan yang sama berulang kali. Yang paling
--  sering justru pertanyaan yang jawabannya SUDAH ada di halaman
--  detail — muat motor tidak, jam berapa boleh datang, minimal
--  berapa lama. Itu bukan kesalahan penanya: orang bertanya
--  karena ingin dipastikan manusia, bukan karena tidak membaca.
--
--  Karena itu balasan cepat di sini ada dua macam, dan hanya SATU
--  yang butuh tabel:
--
--  1. Balasan yang disusun dari data ruangnya sendiri (lebar
--     pintu, jendela akses, sewa minimum). Tidak disimpan di mana
--     pun — dihitung di layar dari kolom yang sudah ada, jadi
--     jawabannya selalu ikut kalau hostnya mengubah ruangnya.
--     Menyimpannya justru berbahaya: balasan tersimpan bisa
--     menyebut lebar pintu lama setelah pintunya diganti.
--
--  2. Balasan yang ditulis host sendiri, untuk hal yang memang
--     tidak ada di rubrik ("sebaiknya datang sore, pagi ramai").
--     Yang ini disimpan — dan tabel di bawah untuk itu.
-- ============================================================

create table if not exists balasan_cepat (
  id          uuid primary key default gen_random_uuid(),
  profil_id   uuid not null references profil(id) on delete cascade,
  isi         text not null check (length(btrim(isi)) between 1 and 500),
  dibuat_pada timestamptz not null default now()
);

create index if not exists balasan_pemilik_idx on balasan_cepat (profil_id, dibuat_pada);

alter table balasan_cepat enable row level security;

-- Tabel baru: cabut hak bawaan anon lebih dulu (default privileges Supabase).
revoke all on balasan_cepat from anon, authenticated;
grant select, insert, delete on balasan_cepat to authenticated;

-- Tidak ada UPDATE: mengubah balasan tersimpan sama saja dengan menghapus lalu
-- membuat yang baru, dan satu jalan lebih sedikit berarti satu policy lebih
-- sedikit untuk salah ditulis.
drop policy if exists balasan_milik_sendiri on balasan_cepat;
create policy balasan_milik_sendiri on balasan_cepat
  for all to authenticated
  using (profil_id = (select profil_saya()))
  with check (profil_id = (select profil_saya()));

comment on table balasan_cepat is
  'Balasan yang ditulis host sendiri. Balasan yang bisa disusun dari data ruang '
  'TIDAK disimpan di sini — ia dihitung di layar, supaya tidak pernah menyebut '
  'lebar pintu lama setelah pintunya diganti.';

select periksa_permukaan_publik();
