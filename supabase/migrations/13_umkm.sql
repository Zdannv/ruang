-- ============================================================
--  Ruang — dua penopang untuk penyewa usaha
--
--  Jalankan setelah 12_balasan_cepat.sql. Aman dijalankan ulang.
--
--  Bukan fitur UMKM lengkap, dan itu disengaja. Yang ditambahkan
--  di sini hanya dua hal yang (a) memang celah nyata sekarang,
--  dan (b) tidak bergantung pada pembayaran:
--
--  1. Kategori barang bisa disaring di pencarian. `stok_dagangan`
--     sudah lama ada sebagai kategori yang boleh diterima host,
--     tapi penjual online tidak punya cara menemukan ruang yang
--     menerimanya — ia harus membuka satu per satu.
--  2. Identitas usaha di profil, supaya invoice nanti punya nama
--     yang benar untuk dicetak.
--
--  Yang TIDAK ditambahkan, beserta alasannya, ada di akhir berkas.
-- ============================================================

-- ---------- 1. identitas usaha ----------

alter table profil add column if not exists nama_usaha text;
alter table profil add column if not exists npwp text;

comment on column profil.nama_usaha is
  'Nama usaha untuk penyewa berbadan usaha. Dipakai nanti sebagai nama pada '
  'invoice. NULL untuk penyewa perorangan.';

comment on column profil.npwp is
  'Nomor NPWP, opsional. TIDAK BOLEH masuk view publik mana pun — '
  '`periksa_permukaan_publik()` menegakkan itu.';

-- Penjaga permukaan publik diperluas: `npwp` masuk daftar kolom yang tidak
-- boleh bisa dibaca anon, sama seperti `telepon`. Tanpa ditambahkan ke daftar,
-- penjaganya akan meloloskan kolom baru yang justru paling sensitif.
create or replace function periksa_permukaan_publik()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_bocor text;
  v_hak   text;
begin
  select string_agg(format('%s.%s', c.table_name, c.column_name), ', ')
    into v_bocor
  from information_schema.columns c
  join pg_class k on k.relname = c.table_name
  join pg_namespace n on n.oid = k.relnamespace and n.nspname = 'public'
  where k.relkind = 'v'
    and c.table_schema = 'public'
    and c.column_name in ('alamat','patokan','lat','lng','telepon','npwp',
                          'penyewa_id','pemesanan_id','penulis_id','user_id')
    and exists (
      select 1 from information_schema.role_table_grants g
      where g.grantee = 'anon'
        and g.table_schema = 'public'
        and g.table_name = c.table_name
        and g.privilege_type = 'SELECT'
    );

  if v_bocor is not null then
    raise exception 'View yang bisa dibaca anon memuat kolom rahasia: %', v_bocor;
  end if;

  select string_agg(distinct format('%s(%s)', g.table_name, g.privilege_type), ', ')
    into v_hak
  from information_schema.role_table_grants g
  join pg_class k on k.relname = g.table_name
  join pg_namespace n on n.oid = k.relnamespace and n.nspname = 'public'
  where g.grantee = 'anon'
    and k.relkind = 'r';

  if v_hak is not null then
    raise exception 'anon punya hak ke tabel dasar, seharusnya nol: %', v_hak;
  end if;
end
$fn$;

-- ---------- 2. kategori bisa disaring di pencarian ----------

/*
  `ruang_terdekat()` dibuat ulang, bukan diganti dengan `create or replace`.

  Postgres menolak mengubah daftar kolom yang dikembalikan sebuah fungsi lewat
  `create or replace` — "cannot change return type of existing function". Jadi
  ia harus dibuang dulu. Aman: tidak ada view atau constraint yang bergantung
  padanya, hanya aplikasi yang memanggilnya.

  Penyaringannya sendiri dikerjakan di sisi klien, sama seperti filter tipe:
  fungsi ini mengembalikan seluruh hasil dalam radius tanpa halaman, jadi
  menyaring di klien tetap menghasilkan hitungan yang benar — dan menambah
  parameter baru akan meninggalkan dua versi fungsi yang sama-sama hidup.
*/
drop function if exists ruang_terdekat(double precision, double precision, double precision, numeric, bigint);

create or replace function ruang_terdekat(
  p_lat        double precision,
  p_lng        double precision,
  p_radius_km  double precision default 10,
  p_volume_min numeric default 0,
  p_harga_maks bigint default 999999999
)
returns table (
  id uuid, judul text, tipe text, kecamatan text, kota text,
  lat_publik double precision, lng_publik double precision,
  volume_m3 numeric, harga_bulanan bigint,
  akses_masuk text, riwayat_banjir text, penguncian text,
  kategori_diterima text[],
  jarak_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.judul, r.tipe, r.kecamatan, r.kota,
         r.lat_publik, r.lng_publik,
         r.volume_m3, r.harga_bulanan,
         r.akses_masuk, r.riwayat_banjir, r.penguncian,
         r.kategori_diterima,
         round((
           6371 * acos(
             least(1, greatest(-1,
               cos(radians(p_lat)) * cos(radians(r.lat)) *
               cos(radians(r.lng) - radians(p_lng)) +
               sin(radians(p_lat)) * sin(radians(r.lat))
             ))
           )
         )::numeric, 2)::double precision as jarak_km
  from ruang r
  where r.status = 'tayang'
    and r.volume_m3 >= p_volume_min
    and r.harga_bulanan <= p_harga_maks
    and 6371 * acos(
          least(1, greatest(-1,
            cos(radians(p_lat)) * cos(radians(r.lat)) *
            cos(radians(r.lng) - radians(p_lng)) +
            sin(radians(p_lat)) * sin(radians(r.lat))
          ))
        ) <= p_radius_km
  order by jarak_km asc;
$$;

select periksa_permukaan_publik();

-- ============================================================
--  Yang TIDAK ditambahkan, dan kenapa
--
--  * INVOICE. Invoice adalah tagihan atau bukti pembayaran, dan
--    di sini belum ada satu pun pembayaran. Menerbitkan berkas
--    bertuliskan "Invoice — Rp1.200.000" untuk uang yang belum
--    pernah berpindah bukan cuma tidak berguna: itu dokumen palsu
--    yang akan dibawa orang ke pembukuannya. Terhalang pembayaran,
--    sama seperti serah terima.
--
--  * PENCATATAN STOK MASUK-KELUAR. Bisa dibangun sekarang —
--    `manifes_item` sudah punya kolom `versi` justru untuk itu, dan
--    log akses sudah mencatat tiap kedatangan. Tapi bentuknya
--    bergantung pada bagaimana penjual sungguhan bekerja: menghitung
--    satuan, SKU, atau kardus? Membangunnya dari tebakan berarti
--    membangun sesuatu yang harus dibongkar lagi.
--
--    Catatan yang lebih penting: AdaGudang — satu-satunya pesaing
--    sejenis di Indonesia — justru menjadikan manajemen stok fitur
--    utamanya, dan itu tidak menyelamatkannya. Fitur ini bukan yang
--    menentukan.
-- ============================================================
