-- ============================================================
--  Ruang — menutup temuan Supabase Advisor
--
--  Jalankan setelah 06_akses.sql. Aman dijalankan ulang.
--
--  Tidak semua temuan advisor diperbaiki, dan yang tidak
--  diperbaiki dijelaskan alasannya di bagian 5. Advisor itu
--  daftar pemeriksaan otomatis, bukan atasan — tapi tiap
--  temuan yang dilewati harus punya alasan tertulis, bukan
--  didiamkan.
-- ============================================================

-- ---------- 1. Function Search Path Mutable ----------

/*
  Empat fungsi ini dibuat tanpa `set search_path`, dan itu memang kelalaian.

  Bahayanya: `search_path` diambil dari sesi pemanggil. Kalau seseorang bisa
  membuat objek di skema yang lebih awal di jalur itu, ia bisa membayangi nama
  yang dipakai di dalam fungsi. Untuk `_set_pin_publik` — trigger yang menghitung
  penyamaran pin — itu berarti perhitungannya bisa dibelokkan.

  Dipakai `alter function`, bukan `create or replace`: `status_menahan_ruang()`
  ikut dipakai di predikat constraint `pemesanan_tanpa_tumpang_tindih`, dan
  mengganti badan fungsi yang jadi tumpuan indeks jauh lebih berisiko daripada
  cuma mengubah setelannya.
*/
alter function status_menahan_ruang()            set search_path = public;
alter function status_boleh_akses()              set search_path = public;
alter function _batas_permintaan_menggantung()   set search_path = public;
alter function _set_pin_publik()                 set search_path = public;

-- ---------- 2. Auth RLS Initialization Plan ----------

/*
  `auth.uid()` dan `profil_saya()` yang ditulis langsung di policy dievaluasi
  ULANG untuk setiap baris yang diperiksa. Dibungkus jadi subkueri skalar
  — `(select auth.uid())` — Postgres menghitungnya sekali sebagai InitPlan lalu
  memakai hasilnya untuk seluruh baris.

  Bedanya tidak terasa di 14 ruang. Ia terasa saat satu host punya 400 ruang
  dan setiap pemuatan dasbor memanggil `profil_saya()` 400 kali, yang
  masing-masing membaca tabel `profil`.

  Yang TIDAK bisa dibungkus: pemanggilan yang menerima kolom baris sebagai
  argumen (`saya_penyewa_terbayar(id)`, `saya_host_ruang(ruang_id)`,
  `saya_pihak_pemesanan(pemesanan_id)`). Nilainya berbeda tiap baris, jadi
  memang harus dihitung tiap baris — itu bukan sesuatu yang bisa dioptimalkan,
  dan advisor juga tidak memintanya.
*/

drop policy if exists profil_baca_sendiri on profil;
create policy profil_baca_sendiri on profil
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists profil_ubah_sendiri on profil;
create policy profil_ubah_sendiri on profil
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists ruang_host_kelola on ruang;
create policy ruang_host_kelola on ruang
  for all to authenticated
  using (host_id = (select profil_saya()))
  with check (host_id = (select profil_saya()));

drop policy if exists ulasan_baca_pihak on ulasan;
create policy ulasan_baca_pihak on ulasan
  for select to authenticated
  using (penulis_id = (select profil_saya()) or saya_pihak_pemesanan(pemesanan_id));

drop policy if exists ulasan_tulis_setelah_selesai on ulasan;
create policy ulasan_tulis_setelah_selesai on ulasan
  for insert to authenticated
  with check (penulis_id = (select profil_saya()) and boleh_ulas(pemesanan_id, arah));

drop policy if exists permintaan_milik_sendiri on permintaan_ruang;
create policy permintaan_milik_sendiri on permintaan_ruang
  for all to authenticated
  using (penyewa_id = (select profil_saya()))
  with check (penyewa_id = (select profil_saya()));

drop policy if exists pemesanan_baca_pihak on pemesanan;
create policy pemesanan_baca_pihak on pemesanan
  for select to authenticated
  using (
    penyewa_id = (select profil_saya())
    or exists (
      select 1 from ruang r
      where r.id = pemesanan.ruang_id and r.host_id = (select profil_saya())
    )
  );

-- Policy penyimpanan foto juga memanggilnya per baris.
do $$
begin
  execute 'drop policy if exists ruang_foto_tulis_pemilik on storage.objects';
  execute 'drop policy if exists ruang_foto_hapus_pemilik on storage.objects';

  execute $p$
    create policy ruang_foto_tulis_pemilik on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'ruang-foto'
        and (storage.foldername(name))[1] = (select profil_saya())::text
      )
  $p$;

  execute $p$
    create policy ruang_foto_hapus_pemilik on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'ruang-foto'
        and (storage.foldername(name))[1] = (select profil_saya())::text
      )
  $p$;
end $$;

-- ---------- 3. Extension in Public ----------

/*
  `btree_gist` mendarat di skema `public` karena dibuat tanpa menyebut skema.
  Isinya operator dan opclass dengan nama umum, dan menaruhnya di jalur yang
  sama dengan tabel aplikasi memperbesar permukaan pembayangan nama.

  Dipindahkan, bukan dibuat ulang: constraint `pemesanan_tanpa_tumpang_tindih`
  bergantung pada opclass di dalamnya, dan rujukannya lewat OID — pindah skema
  tidak memutuskannya. Membuang lalu membuat ulang extension-nya JUSTRU akan
  ikut membuang constraint itu.
*/
create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated;

do $$
begin
  if exists (
    select 1 from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'btree_gist' and n.nspname = 'public'
  ) then
    execute 'alter extension btree_gist set schema extensions';
  end if;
end $$;

-- ---------- 4. Penjaga tetap, bukan sekali periksa ----------

/*
  Advisor menandai kelima view publik sebagai "Security Definer View", dan itu
  memang pilihan sadar (lihat bagian 5). Tapi pilihan itu punya satu risiko
  nyata: kalau nanti seseorang menambahkan kolom ke salah satu view — atau lebih
  buruk, menulis `select r.*` — tidak ada RLS yang menahannya, dan alamat
  seluruh ruang bocor tanpa ada yang menyadarinya.

  Blok di bawah menutup risiko itu dengan cara yang lebih keras daripada
  peringatan linter: kalau ada kolom terlarang muncul di view publik, atau anon
  punya hak ke tabel dasar mana pun, MIGRASINYA GAGAL. Jadi keadaan yang salah
  tidak bisa sampai ke database.
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
begin
  -- Yang diperiksa bukan daftar nama view, tapi apa pun yang bisa dibaca anon.
  -- Daftar nama harus diingat dan pasti akan ketinggalan saat view baru
  -- ditambahkan; "semua yang publik" tidak bisa ketinggalan.
  select string_agg(format('%s.%s', c.table_name, c.column_name), ', ')
    into v_bocor
  from information_schema.columns c
  join pg_class k on k.relname = c.table_name
  join pg_namespace n on n.oid = k.relnamespace and n.nspname = 'public'
  where k.relkind = 'v'
    and c.table_schema = 'public'
    and c.column_name in ('alamat','patokan','lat','lng','telepon',
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

comment on function periksa_permukaan_publik() is
  'Penjaga permukaan baca publik. Panggil di akhir SETIAP migrasi yang '
  'menambah view atau mengubah hak akses — kalau ada kolom rahasia yang bisa '
  'dibaca anon, atau anon punya hak ke tabel dasar, migrasinya gagal.';

select periksa_permukaan_publik();

-- ============================================================
--  5. Temuan advisor yang SENGAJA tidak diperbaiki
--
--  "Security Definer View" pada ruang_publik, ruang_foto_publik,
--  ulasan_publik, ruang_ketersediaan, permintaan_kecamatan.
--
--  Advisor benar bahwa view ini berjalan sebagai pemiliknya dan
--  melewati RLS tabel dasarnya. Itu memang yang diminta, dan
--  tiga dari lima TIDAK punya alternatif:
--
--  * `permintaan_kecamatan` menghitung permintaan orang lain.
--    Dengan security_invoker, anon melihat nol — padahal justru
--    hitungan itu yang perlu publik supaya calon host tahu ada
--    permintaan di kecamatannya.
--  * `ruang_ketersediaan` meringkas `pemesanan`, yang isinya
--    siapa menyewa apa. Yang publik cuma tanggal kosongnya.
--  * `ulasan_publik` menggabungkan ulasan ke pemesanan dan
--    profil penulisnya.
--
--  Ketiganya adalah pola "agregat publik di atas baris privat",
--  dan security definer view justru cara yang benar untuk itu.
--
--  Dua sisanya (`ruang_publik`, `ruang_foto_publik`) menyaring
--  KOLOM, dan RLS tidak bisa menyaring kolom. Bisa saja diganti
--  hak select per kolom + policy + fungsi bantu, tapi hasilnya
--  bukan lebih aman: permukaannya jadi tersebar di tiga tempat
--  alih-alih satu definisi view yang bisa dibaca sekali.
--
--  Yang membuat pilihan ini bisa dipertanggungjawabkan bukan
--  penjelasan ini, melainkan bagian 4 di atas: kalau view publik
--  sampai memuat kolom terlarang, migrasinya gagal.
--
--  Kalau di dashboard Supabase temuan ini bisa ditandai
--  "ignore", tandai dengan alasan yang menunjuk ke berkas ini.
-- ============================================================
