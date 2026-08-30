-- ============================================================
--  Ruang — skema demo
--  Postgres / Supabase. Sengaja disederhanakan untuk prototipe:
--  tanpa escrow, tanpa e-KYC, tanpa tabel bukti append-only.
--  Jangan dipakai untuk transaksi nyata.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- 1. profil ----------
-- Untuk demo, profil berdiri sendiri (tidak terikat auth.users)
-- supaya bisa berpindah peran lewat switcher tanpa login.
create table profil (
  id            uuid primary key default gen_random_uuid(),
  nama          text not null,
  telepon       text not null,
  kota          text not null,
  foto_url      text,
  terverifikasi boolean not null default false,
  bergabung     date not null default current_date
);

-- ---------- 2. ruang ----------
-- Properti dan ruang sengaja digabung untuk demo.
-- Di produk sebenarnya keduanya terpisah (satu properti, banyak ruang).
create table ruang (
  id                  uuid primary key default gen_random_uuid(),
  host_id             uuid not null references profil(id) on delete cascade,
  judul               text not null,
  tipe                text not null check (tipe in
                        ('kamar','garasi','gudang','lantai_ruko','mezanin',
                         'bawah_tangga','loteng','kontainer')),

  -- lokasi
  alamat              text not null,          -- tingkat 2: terbuka setelah survei disetujui
  patokan             text,
  kelurahan           text not null,
  kecamatan           text not null,
  kota                text not null,
  lat                 double precision not null,
  lng                 double precision not null,
  lat_publik          double precision not null,  -- digeser tetap ±200 m
  lng_publik          double precision not null,

  -- dimensi
  panjang_m           numeric(4,1) not null,
  lebar_m             numeric(4,1) not null,
  tinggi_m            numeric(4,1) not null,
  luas_m2             numeric(6,2) generated always as (panjang_m * lebar_m) stored,
  volume_m3           numeric(7,2) generated always as (panjang_m * lebar_m * tinggi_m) stored,

  -- rubrik kondisi (bagian 06 blueprint)
  akses_masuk         text not null check (akses_masuk in
                        ('truk_engkel','mobil_pikap','hanya_motor','jalan_kaki')),
  posisi_lantai       text not null check (posisi_lantai in
                        ('dasar_rata','dasar_tangga','lantai_2','lantai_3_plus')),
  lebar_pintu_cm      int  not null,
  jarak_parkir        text not null check (jarak_parkir in ('lt10m','10_30m','gt30m')),
  kondisi_bangunan    text not null check (kondisi_bangunan in
                        ('dinding_atap','atap_saja','terbuka')),
  penguncian          text not null check (penguncian in
                        ('kunci_penyewa','kunci_host','tanpa_kunci')),
  berbagi             text not null check (berbagi in
                        ('eksklusif','dengan_penyewa_lain','dengan_barang_host')),
  kelembapan          text not null check (kelembapan in
                        ('kering_ventilasi','kering_tanpa_ventilasi','cenderung_lembap')),
  riwayat_banjir      text not null check (riwayat_banjir in
                        ('tidak_pernah','lebih_5_tahun','dalam_5_tahun')),
  tinggi_lantai_cm    int  not null default 0,
  pengawasan          text[] not null default '{}',   -- cctv, penghuni_24jam, satpam, pagar
  fasilitas           text[] not null default '{}',   -- rak, palet, listrik, lampu, troli

  -- kebijakan
  kategori_diterima   text[] not null default '{}',
  jendela_akses       text not null,           -- mis. 'Sen-Sab 08.00-17.00'
  kuota_akses_bulanan int  not null default 4,
  durasi_min_hari     int  not null default 30,

  -- harga (rupiah penuh, tanpa desimal)
  harga_bulanan       bigint not null,
  deposit             bigint not null default 0,

  -- status
  kepemilikan         text not null default 'milik_sendiri'
                        check (kepemilikan in ('milik_sendiri','menyewa')),
  terbuka_alamat      boolean not null default false,  -- true untuk ruang komersial
  status              text not null default 'tayang'
                        check (status in ('draf','moderasi','tayang','ditangguhkan')),
  dibuat_pada         timestamptz not null default now()
);

create index ruang_lokasi_idx on ruang (lat_publik, lng_publik);
create index ruang_kota_idx   on ruang (kota, status);

-- ---------- 3. foto ruang ----------
create table ruang_foto (
  id         uuid primary key default gen_random_uuid(),
  ruang_id   uuid not null references ruang(id) on delete cascade,
  url        text not null,
  urutan     int  not null default 0,
  keterangan text not null   -- 'mulut gang' | 'tampak depan' | 'jalur akses' | 'sudut A' | 'sudut B' | 'kunci'
);

-- ---------- 4. pemesanan ----------
create table pemesanan (
  id            uuid primary key default gen_random_uuid(),
  ruang_id      uuid not null references ruang(id),
  penyewa_id    uuid not null references profil(id),
  mulai         date not null,
  selesai       date not null,
  harga_bulanan bigint not null,
  total         bigint not null,
  status        text not null default 'menunggu_konfirmasi' check (status in (
                  'draf','menunggu_konfirmasi','menunggu_pembayaran',
                  'menunggu_serah_terima','aktif','menunggu_serah_terima_keluar',
                  'selesai','dibatalkan','tunggakan','sengketa')),
  dibuat_pada   timestamptz not null default now()
);

create index pemesanan_ruang_idx   on pemesanan (ruang_id, status);
create index pemesanan_penyewa_idx on pemesanan (penyewa_id, status);

-- ---------- 5. jejak transisi status ----------
-- Di produk sebenarnya tabel ini append-only di tingkat GRANT.
create table pemesanan_transisi (
  id           uuid primary key default gen_random_uuid(),
  pemesanan_id uuid not null references pemesanan(id) on delete cascade,
  dari         text,
  ke           text not null,
  oleh         uuid references profil(id),
  catatan      text,
  pada         timestamptz not null default now()
);

-- ---------- 6. manifes ----------
create table manifes_item (
  id             uuid primary key default gen_random_uuid(),
  pemesanan_id   uuid not null references pemesanan(id) on delete cascade,
  versi          int  not null default 1,
  nama           text not null,
  kategori       text not null,
  jumlah         int  not null default 1,
  taksiran_nilai bigint not null default 0,
  foto_url       text,
  dicatat_pada   timestamptz not null default now()
);

create index manifes_pemesanan_idx on manifes_item (pemesanan_id, versi);

-- ---------- 7. serah terima ----------
create table serah_terima (
  id           uuid primary key default gen_random_uuid(),
  pemesanan_id uuid not null references pemesanan(id) on delete cascade,
  jenis        text not null check (jenis in ('masuk','keluar')),
  foto_urls    text[] not null default '{}',
  catatan      text,
  ttd_host     boolean not null default false,
  ttd_penyewa  boolean not null default false,
  pada         timestamptz not null default now()
);

-- ---------- 8. log akses ----------
create table akses_log (
  id             uuid primary key default gen_random_uuid(),
  pemesanan_id   uuid not null references pemesanan(id) on delete cascade,
  diminta_untuk  timestamptz not null,
  status         text not null default 'diminta'
                   check (status in ('diminta','disetujui','ditolak','selesai')),
  tiba_pada      timestamptz,
  catatan        text,
  dibuat_pada    timestamptz not null default now()
);

-- ---------- 9. ulasan ----------
create table ulasan (
  id           uuid primary key default gen_random_uuid(),
  pemesanan_id uuid not null references pemesanan(id) on delete cascade,
  penulis_id   uuid not null references profil(id),
  arah         text not null check (arah in ('untuk_host','untuk_penyewa')),
  skor         int  not null check (skor between 1 and 5),
  akurasi      int  check (akurasi between 1 and 5),   -- kesesuaian rubrik
  komentar     text,
  pada         timestamptz not null default now()
);

-- ---------- 10. permintaan ruang (waitlist) ----------
create table permintaan_ruang (
  id            uuid primary key default gen_random_uuid(),
  penyewa_id    uuid references profil(id),
  kecamatan     text not null,
  kota          text not null,
  volume_m3     numeric(7,2) not null,
  harga_maks    bigint not null,
  mulai         date not null,
  frekuensi_akses text not null check (frekuensi_akses in ('jarang','bulanan','mingguan','harian')),
  dibuat_pada   timestamptz not null default now()
);

-- ============================================================
--  Pencarian terdekat (haversine, tanpa PostGIS)
--  Jarak dihitung dari koordinat ASLI; yang ditampilkan di peta
--  tetap koordinat publik yang sudah digeser.
-- ============================================================
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
  jarak_km double precision
)
language sql stable as $$
  select r.id, r.judul, r.tipe, r.kecamatan, r.kota,
         r.lat_publik, r.lng_publik,
         r.volume_m3, r.harga_bulanan,
         r.akses_masuk, r.riwayat_banjir, r.penguncian,
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

-- ============================================================
--  RLS — demo saja: semua boleh baca, tulis lewat service key.
--  Kebijakan sebenarnya (pemisahan publik/privat) menyusul.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['profil','ruang','ruang_foto','pemesanan',
                           'pemesanan_transisi','manifes_item','serah_terima',
                           'akses_log','ulasan','permintaan_ruang']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy demo_baca on %I for select using (true)', t);
    execute format('create policy demo_tulis on %I for all using (true) with check (true)', t);
  end loop;
end $$;
