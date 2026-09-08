-- ============================================================
--  18. Video lahan
--
--  Diminta client, 8 September 2026. Sebelumnya sengaja ditunda karena host
--  tidak akan merekam video sendiri — tapi permintaan yang nyata mengalahkan
--  perkiraan itu.
--
--  Yang paling menentukan di sini bukan tabelnya melainkan KUOTA. Satu video
--  30 detik dari HP sekitar 8 MB; paket gratis Supabase memberi 1 GB
--  penyimpanan dan 5 GB egress per bulan. Kalau setiap kunjungan halaman
--  lahan mengunduh videonya, 5 GB habis di sekitar 600 kunjungan — dan itu
--  bukan angka yang besar untuk aplikasi yang sedang dipromosikan.
--
--  Karena itu tiga hal ditegakkan, dua di antaranya di luar SQL:
--
--    1. Bucket dibatasi 20 MB per berkas (di bawah).
--    2. Peramban menolak video lebih dari 45 detik sebelum mengunggah, dan
--       mengambil satu bingkai jadi poster (lihat `src/lib/video.ts`).
--    3. Pemutarnya `preload="none"` dengan poster — video HANYA terunduh
--       kalau ada yang menekan putar. Ini penghemat terbesarnya: biaya
--       berpindah dari "setiap kunjungan" ke "setiap penonton".
--
--  Kalau egress-nya tetap sempit, bucket-nya dipindah ke penyimpanan objek
--  lain tanpa migrasi data: `url` disimpan per baris, jadi video lama dan
--  baru boleh tinggal di tempat berbeda — persis seperti foto.
-- ============================================================

-- ---------- 1. tabel ----------

create table if not exists ruang_video (
  id           uuid primary key default gen_random_uuid(),
  ruang_id     uuid not null references ruang(id) on delete cascade,
  url          text not null,
  -- Satu bingkai dari videonya, diambil di peramban. Yang tampil di halaman
  -- sebelum ada yang menekan putar; tanpa ini pemutar `preload="none"` cuma
  -- kotak hitam, dan orang tidak menekan kotak hitam.
  poster_url   text,
  durasi_detik int,
  keterangan   text,
  dibuat_pada  timestamptz not null default now(),
  constraint ruang_video_durasi_masuk_akal
    check (durasi_detik is null or (durasi_detik > 0 and durasi_detik <= 120))
);

create index if not exists ruang_video_ruang_idx on ruang_video (ruang_id);

comment on table ruang_video is
  'Video lahan. Satu-dua per lahan; pembatasan durasi dan ukurannya ada di '
  'peramban dan di bucket, bukan cuma di sini.';

-- Supabase memasang `alter default privileges ... grant all on tables to anon`,
-- jadi tabel baru langsung bisa dibaca-tulis anon kalau tidak dicabut. Ini
-- bukan kehati-hatian berlebihan: begitulah `jendela_akses` bocor di migrasi 08.
revoke all on ruang_video from anon, authenticated;
grant select, insert, delete on ruang_video to authenticated;

alter table ruang_video enable row level security;

drop policy if exists video_host_kelola on ruang_video;
create policy video_host_kelola on ruang_video
  for all to authenticated
  using (saya_host_ruang(ruang_id))
  with check (saya_host_ruang(ruang_id));

-- ---------- 2. permukaan publik ----------

/*
  Anon membaca lewat view, bukan lewat tabel — sama seperti seluruh bacaan
  publik lain di aplikasi ini. Yang membatasi bukan policy melainkan view-nya:
  hanya lahan berstatus `tayang` yang videonya ikut keluar.
*/
create or replace view ruang_video_publik as
select v.id, v.ruang_id, v.url, v.poster_url, v.durasi_detik, v.keterangan
from ruang_video v
join ruang r on r.id = v.ruang_id
where r.status = 'tayang';

alter view ruang_video_publik set (security_invoker = false);

-- REVOKE dulu, baru GRANT. `grant select` saja TIDAK cukup: Supabase memasang
-- `alter default privileges in schema public grant all on tables to anon`,
-- jadi view yang baru dibuat sudah membawa INSERT, UPDATE, DELETE, dan
-- TRUNCATE untuk anon sebelum baris ini dijalankan.
--
-- Lima view publik pertama tidak kena karena `03_auth_rls.sql` mencabut semua
-- hak SETELAH view-view itu dibuat. Yang dibuat sesudahnya tidak pernah
-- dicabut lagi — dan `jendela_akses_publik` di migrasi 08 memang begitu
-- keadaannya sampai sekarang; diperbaiki di bawah.
revoke all on ruang_video_publik from anon, authenticated;
grant select on ruang_video_publik to anon, authenticated;

-- ---------- 2b. cacat yang sama di migrasi 08 ----------

/*
  `jendela_akses_publik` juga membawa INSERT/UPDATE/DELETE/TRUNCATE untuk anon,
  dengan sebab yang sama persis.

  Tidak bisa dieksploitasi hari ini — ia view atas JOIN, dan Postgres menolak
  penulisan lewat view semacam itu (`is_insertable_into = NO`). Jadi ini bukan
  kebocoran yang sedang terjadi, melainkan hak yang tidak seharusnya ada, dan
  yang akan menjadi kebocoran sungguhan pada hari seseorang menambahkan
  `instead of` trigger atau menyederhanakan view-nya jadi satu tabel.
*/
revoke all on jendela_akses_publik from anon, authenticated;
grant select on jendela_akses_publik to anon, authenticated;

/*
  Tiga view "milik saya" juga membawa hak tulis untuk `authenticated`, dengan
  sebab yang sama.

  Ini pun tidak bisa dieksploitasi hari ini, dan itu SUDAH DIUJI: ketiganya
  `security_invoker = true`, jadi RLS tetap berlaku, dan percobaan mengubah
  lahan milik orang lain lewat `ruang_saya` menghasilkan `UPDATE 0`.

  Dicabut tetap, karena `ruang_saya` adalah view SATU TABEL — Postgres
  menerimanya sebagai view yang bisa ditulis. Yang menahannya cuma satu opsi,
  `security_invoker`. Hari ada orang yang membuat view serupa tanpa opsi itu,
  atau mematikannya, hak tulis yang menganggur ini langsung jadi jalan
  menembus RLS. Tidak ada satu pun bagian aplikasi yang menulis lewat view;
  semuanya lewat tabel atau lewat fungsi SECURITY DEFINER.
*/
revoke all on ruang_saya, pemesanan_saya, percakapan_saya from anon, authenticated;
grant select on ruang_saya, pemesanan_saya, percakapan_saya to authenticated;

-- ---------- 3. bucket ----------

/*
  Bucket terpisah dari `ruang-foto`, dan batasnya jauh lebih ketat: 20 MB per
  berkas, dan hanya tiga tipe video yang benar-benar bisa diputar di peramban
  HP. `image/webp` ikut diizinkan karena posternya disimpan di bucket yang
  sama — memisahkannya lagi cuma menambah satu tempat untuk salah policy.
*/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ruang-video', 'ruang-video', true, 20971520,
        array['video/mp4','video/webm','video/quicktime','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = array['video/mp4','video/webm','video/quicktime','image/webp'];

do $$
begin
  execute 'drop policy if exists ruang_video_baca_publik on storage.objects';
  execute 'drop policy if exists ruang_video_tulis_pemilik on storage.objects';
  execute 'drop policy if exists ruang_video_hapus_pemilik on storage.objects';

  execute $p$
    create policy ruang_video_baca_publik on storage.objects
      for select using (bucket_id = 'ruang-video')
  $p$;

  -- Folder pertama WAJIB id profil pengunggahnya, sama seperti `ruang-foto`.
  -- Tanpa itu, siapa pun yang sudah masuk bisa menimpa video lahan orang
  -- lain — nama berkasnya bisa ditebak dari URL publiknya.
  execute $p$
    create policy ruang_video_tulis_pemilik on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'ruang-video'
        and (storage.foldername(name))[1] = profil_saya()::text
      )
  $p$;

  execute $p$
    create policy ruang_video_hapus_pemilik on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'ruang-video'
        and (storage.foldername(name))[1] = profil_saya()::text
      )
  $p$;
end $$;

-- ---------- 4. penjaga diperluas ----------

/*
  Penjaganya sudah memeriksa dua hal: kolom rahasia yang bisa dibaca anon, dan
  hak anon ke tabel dasar. Ia TIDAK memeriksa hal ketiga yang barusan ketemu —
  anon yang punya hak selain SELECT pada sebuah view.

  Ditambahkan sekarang, karena sebabnya struktural: setiap view baru di skema
  ini lahir dengan `grant all to anon` dari default privileges Supabase, dan
  mengandalkan ingatan penulis migrasi untuk mencabutnya sudah gagal sekali
  (migrasi 08) dan hampir gagal dua kali (migrasi ini).
*/
create or replace function periksa_permukaan_publik()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_bocor text;
  v_hak   text;
  v_tulis text;
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

  select string_agg(distinct g.table_name, ', ')
    into v_hak
  from information_schema.role_table_grants g
  join pg_class k on k.relname = g.table_name
  join pg_namespace n on n.oid = k.relnamespace and n.nspname = 'public'
  where g.grantee = 'anon'
    and g.table_schema = 'public'
    and k.relkind = 'r';
  if v_hak is not null then
    raise exception 'anon punya hak ke tabel dasar: %', v_hak;
  end if;

  -- Baru: anon tidak boleh punya apa pun selain SELECT di view mana pun.
  select string_agg(distinct format('%s (%s)', g.table_name, g.privilege_type), ', ')
    into v_tulis
  from information_schema.role_table_grants g
  join pg_class k on k.relname = g.table_name
  join pg_namespace n on n.oid = k.relnamespace and n.nspname = 'public'
  where g.grantee in ('anon', 'authenticated')
    and g.table_schema = 'public'
    and k.relkind = 'v'
    and g.privilege_type <> 'SELECT';
  if v_tulis is not null then
    raise exception 'View punya hak selain SELECT: %', v_tulis;
  end if;
end;
$fn$;

select periksa_permukaan_publik();
