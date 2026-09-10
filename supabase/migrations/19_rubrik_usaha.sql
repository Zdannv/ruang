-- ============================================================
--  19. Rubrik lahan usaha, dan pemesanan tanpa manifes
--
--  Migrasi 17 menambahkan TIPE lahan terbuka, tapi seluruh isi fiturnya masih
--  dirancang untuk penyimpanan. Empat hal yang ditulis sebagai belum
--  dikerjakan di ekor berkas itu, tiga di antaranya dikerjakan di sini.
--
--  Yang paling keras: `buat_pemesanan` MEWAJIBKAN manifes tidak kosong.
--  Pedagang yang menyewa halaman depan tidak menitipkan barang — ia membawa
--  gerobaknya pulang setiap hari. Jadi sampai sekarang ia secara harfiah
--  tidak bisa memesan, dan "fokus ke UMKM" masih berhenti di copy.
--
--  Padanan manifes untuk lahan usaha bukan daftar barang melainkan JENIS
--  USAHA yang akan dijalankan — dan itu yang dicocokkan dengan kebijakan
--  pemilik, persis seperti kategori barang dicocokkan sekarang. "Boleh
--  menggoreng atau tidak" adalah pertanyaan yang jawabannya membatalkan sewa.
-- ============================================================

-- ---------- 1. penanda kelompok tipe ----------

/*
  Dipakai di beberapa fungsi di bawah. Ditulis sebagai fungsi, bukan diulang
  sebagai `tipe in (...)` di tiap tempat: kalau nanti ada tipe lahan terbuka
  baru, ia ditambahkan di SATU tempat. Versi tersebar pasti akan ketinggalan
  di salah satunya.
*/
create or replace function lahan_terbuka(p_tipe text)
returns boolean
language sql
immutable
as $$
  select p_tipe in ('halaman_depan', 'lahan_kosong', 'teras', 'kios');
$$;

comment on function lahan_terbuka(text) is
  'Benar untuk tipe yang disewa PERMUKAANNYA. Sumber kebenaran tunggal; '
  'jangan mengulang daftarnya di tempat lain.';

-- ---------- 2. jenis usaha yang diizinkan ----------

alter table ruang add column if not exists usaha_diizinkan text[] not null default '{}';

comment on column ruang.usaha_diizinkan is
  'Jenis usaha yang pemilik izinkan berjalan di lahannya. Padanan '
  '`kategori_diterima` untuk lahan terbuka — dan yang dicocokkan '
  '`buat_pemesanan`. Kosong berarti pemilik belum menentukan, dan '
  'pemesanan lahan terbuka akan ditolak sampai ia mengisinya.';

-- ---------- 3. rubrik yang menentukan bagi pedagang ----------

/*
  Kelimanya NULLABLE, dan itu bukan kelonggaran: ruang tertutup tidak punya
  muka jalan, dan menanyakan kelas jalan untuk sebuah loteng tidak ada
  artinya. Formulir hanya menampilkannya untuk tipe lahan terbuka.
*/
alter table ruang add column if not exists lebar_muka_m numeric(5,2);
alter table ruang add column if not exists listrik     text;
alter table ruang add column if not exists air         text;
alter table ruang add column if not exists atap        text;
alter table ruang add column if not exists kelas_jalan text;

alter table ruang drop constraint if exists ruang_lebar_muka_check;
alter table ruang add constraint ruang_lebar_muka_check
  check (lebar_muka_m is null or (lebar_muka_m > 0 and lebar_muka_m <= 100));

alter table ruang drop constraint if exists ruang_listrik_check;
alter table ruang add constraint ruang_listrik_check
  check (listrik is null or listrik in ('tidak_ada', 'berbagi', 'meteran_sendiri'));

alter table ruang drop constraint if exists ruang_air_check;
alter table ruang add constraint ruang_air_check
  check (air is null or air in ('tidak_ada', 'boleh_pakai'));

alter table ruang drop constraint if exists ruang_atap_check;
alter table ruang add constraint ruang_atap_check
  check (atap is null or atap in ('tidak_ada', 'kanopi', 'permanen'));

alter table ruang drop constraint if exists ruang_kelas_jalan_check;
alter table ruang add constraint ruang_kelas_jalan_check
  check (kelas_jalan is null or kelas_jalan in
         ('jalan_raya', 'jalan_kolektor', 'perumahan', 'dalam_gang'));

comment on column ruang.lebar_muka_m is
  'Lebar lahan yang menghadap jalan, meter. Ukuran yang paling menentukan '
  'bagi pedagang — bukan luasnya, karena gerobak berdiri menghadap jalan.';
comment on column ruang.listrik is
  'tidak_ada | berbagi (nyambung dari rumah pemilik) | meteran_sendiri.';

-- ---------- 4. kuota akses boleh tanpa batas ----------

/*
  `kuota_akses_bulanan` wajib dan berbawaan 4. Untuk penyimpanan itu benar —
  orang datang beberapa kali sebulan. Untuk pedagang ia salah: ia di lahan itu
  SETIAP HARI, dan kuota 4 berarti ia melanggar sewanya sendiri di hari kelima.

  NULL sekarang berarti tanpa batas. Sengaja NULL dan bukan angka besar:
  angka besar tetap harus dibaca sebagai batas oleh setiap layar yang
  menampilkannya, dan "kuota 9999" adalah cara yang buruk untuk mengatakan
  "tidak ada kuota".
*/
alter table ruang alter column kuota_akses_bulanan drop not null;

comment on column ruang.kuota_akses_bulanan is
  'Batas kunjungan per bulan. NULL berarti tanpa batas — yang benar untuk '
  'lahan usaha, karena pedagang ada di sana setiap hari.';

/*
  `sisa_kuota_akses` mengembalikan NULL saat kuotanya NULL, dan pemanggilnya
  wajib membaca NULL sebagai "tanpa batas".

  Versi sebelumnya sudah kebetulan bekerja — `greatest(0, NULL - n)` = NULL,
  dan `NULL <= 0` tidak pernah benar, jadi pemeriksaannya lewat. Tapi
  mengandalkan perambatan NULL untuk aturan bisnis adalah cara paling mudah
  membuat orang berikutnya "memperbaiki"nya jadi rusak. Ditulis eksplisit.
*/
create or replace function sisa_kuota_akses(p_pemesanan uuid, p_bulan date)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case
           when r.kuota_akses_bulanan is null then null
           else greatest(0, r.kuota_akses_bulanan - (
             select count(*)::int from akses_log a
             where a.pemesanan_id = p_pemesanan
               and a.status in ('disetujui', 'selesai')
               and date_trunc('month', a.diminta_untuk at time zone 'Asia/Jakarta')
                   = date_trunc('month', p_bulan::timestamp)
           ))
         end
  from pemesanan pm
  join ruang r on r.id = pm.ruang_id
  where pm.id = p_pemesanan;
$$;

revoke all on function sisa_kuota_akses(uuid, date) from public, anon;
grant execute on function sisa_kuota_akses(uuid, date) to authenticated;

-- ---------- 5. pemesanan mencatat jenis usaha ----------

alter table pemesanan add column if not exists usaha text;

comment on column pemesanan.usaha is
  'Jenis usaha yang akan dijalankan penyewa di lahan itu. Wajib untuk lahan '
  'terbuka, dan dicocokkan dengan `ruang.usaha_diizinkan` — padanan manifes '
  'barang untuk sewa lahan usaha.';

/*
  `buat_pemesanan` dibuat ulang dengan parameter `p_usaha`.

  Di-DROP dulu, bukan `create or replace`: menambah parameter berarti tanda
  tangan yang berbeda, dan tanpa drop kedua versi hidup bersama — panggilan
  empat argumen jadi ambigu dan Postgres menolaknya.

  Aturannya sekarang bercabang menurut tipe, dan itu satu-satunya cabang di
  seluruh fungsi ini:

    * Lahan terbuka  → `p_usaha` WAJIB dan harus ada di `usaha_diizinkan`.
                       Manifes boleh kosong; pedagang membawa gerobaknya
                       pulang.
    * Ruang tertutup → seperti sebelumnya. Manifes wajib minimal satu baris,
                       tiap kategori dicocokkan `kategori_diterima`.
                       `p_usaha` diabaikan.
*/
drop function if exists buat_pemesanan(uuid, date, date, jsonb);

create or replace function buat_pemesanan(
  p_ruang   uuid,
  p_mulai   date,
  p_selesai date,
  p_manifes jsonb default '[]'::jsonb,
  p_usaha   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saya    uuid := profil_saya();
  v_ruang   ruang;
  v_hari    int;
  v_bulan   int;
  v_item    jsonb;
  v_jumlah  int := 0;
  v_terbuka boolean;
  v_id      uuid;
begin
  if v_saya is null then
    raise exception 'Masuk dulu sebelum memesan.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_ruang from ruang where id = p_ruang and status = 'tayang';
  if not found then
    raise exception 'Lahannya tidak ada atau sedang tidak disewakan.'
      using errcode = 'no_data_found';
  end if;

  if v_ruang.host_id = v_saya then
    raise exception 'Ini lahanmu sendiri.' using errcode = 'check_violation';
  end if;

  if p_mulai < current_date then
    raise exception 'Tanggal mulai tidak boleh di masa lalu.' using errcode = 'check_violation';
  end if;

  v_hari := p_selesai - p_mulai;
  if v_hari <= 0 then
    raise exception 'Tanggal selesai harus setelah tanggal mulai.'
      using errcode = 'check_violation';
  end if;

  if v_hari < v_ruang.durasi_min_hari then
    raise exception 'Sewa minimum di lahan ini % hari, yang diminta % hari.',
      v_ruang.durasi_min_hari, v_hari using errcode = 'check_violation';
  end if;

  v_terbuka := lahan_terbuka(v_ruang.tipe);

  if v_terbuka then
    if coalesce(btrim(p_usaha), '') = '' then
      raise exception 'Pilih dulu jenis usaha yang mau kamu jalankan di lahan ini.'
        using errcode = 'check_violation';
    end if;
    if not (p_usaha = any (v_ruang.usaha_diizinkan)) then
      raise exception 'Pemilik lahan ini tidak mengizinkan usaha "%".', p_usaha
        using errcode = 'check_violation';
    end if;
  else
    if p_manifes is null or jsonb_typeof(p_manifes) <> 'array'
       or jsonb_array_length(p_manifes) = 0 then
      raise exception 'Manifes barang wajib diisi minimal satu baris.'
        using errcode = 'check_violation';
    end if;
  end if;

  -- Manifes tetap DIPERIKSA kalau ada isinya, termasuk untuk lahan terbuka:
  -- pedagang boleh menitipkan sesuatu, dan kalau ia mengisinya, isinya harus
  -- tetap sah.
  if p_manifes is not null and jsonb_typeof(p_manifes) = 'array' then
    for v_item in select * from jsonb_array_elements(p_manifes) loop
      if coalesce(btrim(v_item ->> 'nama'), '') = '' then
        raise exception 'Ada baris manifes tanpa nama barang.' using errcode = 'check_violation';
      end if;
      if not (v_item ->> 'kategori' = any (v_ruang.kategori_diterima)) then
        raise exception 'Pemilik tidak menerima kategori "%" di lahan ini.',
          coalesce(v_item ->> 'kategori', '(kosong)') using errcode = 'check_violation';
      end if;
      if coalesce((v_item ->> 'jumlah')::int, 0) < 1 then
        raise exception 'Jumlah barang "%" harus minimal 1.', v_item ->> 'nama'
          using errcode = 'check_violation';
      end if;
      if coalesce((v_item ->> 'taksiran_nilai')::bigint, 0) < 0 then
        raise exception 'Taksiran nilai tidak boleh negatif.' using errcode = 'check_violation';
      end if;
      v_jumlah := v_jumlah + 1;
    end loop;
  end if;

  if exists (
    select 1 from pemesanan pm
    where pm.ruang_id = p_ruang
      and pm.status = any (status_menahan_ruang())
      and daterange(pm.mulai, pm.selesai, '[)') && daterange(p_mulai, p_selesai, '[)')
  ) then
    raise exception 'Lahannya sudah dipesan orang lain di tanggal itu.'
      using errcode = 'check_violation';
  end if;

  v_bulan := ceil(v_hari::numeric / 30);

  insert into pemesanan (ruang_id, penyewa_id, mulai, selesai, harga_bulanan,
                         total, status, usaha)
  values (p_ruang, v_saya, p_mulai, p_selesai, v_ruang.harga_bulanan,
          v_ruang.harga_bulanan * v_bulan, 'menunggu_konfirmasi',
          case when v_terbuka then btrim(p_usaha) else null end)
  returning id into v_id;

  if v_jumlah > 0 then
    insert into manifes_item (pemesanan_id, versi, nama, kategori, jumlah,
                              taksiran_nilai, foto_url)
    select v_id, 1,
           btrim(item ->> 'nama'),
           item ->> 'kategori',
           coalesce((item ->> 'jumlah')::int, 1),
           coalesce((item ->> 'taksiran_nilai')::bigint, 0),
           nullif(btrim(item ->> 'foto_url'), '')
      from jsonb_array_elements(p_manifes) as item;
  end if;

  insert into pemesanan_transisi (pemesanan_id, dari, ke, oleh, catatan)
  values (v_id, null, 'menunggu_konfirmasi', v_saya,
          case when v_terbuka
               then format('Pemesanan lahan usaha: %s', btrim(p_usaha))
               else format('Pemesanan dibuat dengan %s baris manifes', v_jumlah)
          end);

  return v_id;
end;
$$;

revoke all on function buat_pemesanan(uuid, date, date, jsonb, text) from public, anon;
grant execute on function buat_pemesanan(uuid, date, date, jsonb, text) to authenticated;

-- ---------- 6. view "milik saya" ikut membawa kolom baru ----------

/*
  `ruang_saya` adalah satu-satunya sumber isi formulir ubah ruang. Kalau ia
  tidak memuat keenam kolom baru, host bisa MENGISI rubrik lahan usaha lalu
  membuka lagi halaman yang sama dan menemukannya kosong — dan menyimpannya
  sekali lagi akan menimpanya dengan null. Jadi menambahkannya di sini bukan
  kelengkapan, ia yang menahan kehilangan data.

  Ditambahkan di ujung, sesudah `sedang_terpakai`, dengan alasan yang sama
  seperti di `ruang_publik` di bawah.
*/
create or replace view ruang_saya with (security_invoker = true) as
select
  r.id, r.judul, r.tipe, r.status,
  r.alamat, r.patokan, r.kelurahan, r.kecamatan, r.kota,
  r.lat, r.lng, r.lat_publik, r.lng_publik,
  r.panjang_m, r.lebar_m, r.tinggi_m, r.luas_m2, r.volume_m3,
  r.akses_masuk, r.posisi_lantai, r.lebar_pintu_cm, r.jarak_parkir,
  r.kondisi_bangunan, r.penguncian, r.berbagi, r.kelembapan,
  r.riwayat_banjir, r.tinggi_lantai_cm,
  r.pengawasan, r.fasilitas, r.kategori_diterima,
  r.jendela_akses, r.kuota_akses_bulanan, r.durasi_min_hari,
  r.harga_bulanan, r.deposit, r.kepemilikan, r.terbuka_alamat,
  r.dibuat_pada,
  (select count(*) from ruang_foto f where f.ruang_id = r.id)::int as jumlah_foto,
  (
    select count(*) from pemesanan pm
    where pm.ruang_id = r.id and pm.status = 'menunggu_konfirmasi'
  )::int as permintaan_baru,
  (
    select count(*) from pemesanan pm
    where pm.ruang_id = r.id and pm.status = any (status_menahan_ruang())
  )::int as sedang_terpakai,
  r.usaha_diizinkan, r.lebar_muka_m, r.listrik, r.air, r.atap, r.kelas_jalan
from ruang r;

revoke all on ruang_saya from anon, authenticated;
grant select on ruang_saya to authenticated;

/*
  `pemesanan_saya` ikut membawa `usaha`, karena halaman pemesanan lahan usaha
  tidak punya manifes barang untuk ditampilkan — jenis usaha itulah isi
  kesepakatannya, dan tanpa kolomnya halaman itu tidak punya apa pun untuk
  menunjukkan apa yang sebenarnya disetujui host.
*/
create or replace view pemesanan_saya with (security_invoker = true) as
select
  pm.id, pm.ruang_id, pm.penyewa_id, pm.mulai, pm.selesai,
  pm.harga_bulanan, pm.total, pm.status, pm.dibuat_pada,
  rp.judul, rp.tipe, rp.kecamatan, rp.kota, rp.deposit,
  rp.jendela_akses, rp.kuota_akses_bulanan,
  rp.host_id, rp.host_nama,
  (
    select f.url from ruang_foto_publik f
    where f.ruang_id = pm.ruang_id
    order by f.urutan
    limit 1
  ) as foto,
  pm.usaha
from pemesanan pm
join ruang_publik rp on rp.id = pm.ruang_id;

revoke all on pemesanan_saya from anon, authenticated;
grant select on pemesanan_saya to authenticated;

-- ---------- 7. permukaan publik ----------

/*
  Kolom baru ditambahkan di UJUNG, dan urutan sebelumnya harus sama persis
  dengan view yang sedang hidup — termasuk `host_id`, yang ditambahkan migrasi
  lain dan mudah terlewat kalau definisinya ditulis ulang dari ingatan.
  `create or replace view` menolak perubahan urutan dengan pesan "cannot
  change name of view column", dan itu justru yang menyelamatkan: ia menolak
  daripada diam-diam menggeser arti kolom.
*/
create or replace view ruang_publik as
select
  r.id, r.judul, r.tipe,
  r.kelurahan, r.kecamatan, r.kota,
  r.lat_publik, r.lng_publik,
  r.panjang_m, r.lebar_m, r.tinggi_m, r.luas_m2, r.volume_m3,
  r.akses_masuk, r.posisi_lantai, r.lebar_pintu_cm, r.jarak_parkir,
  r.kondisi_bangunan, r.penguncian, r.berbagi, r.kelembapan,
  r.riwayat_banjir, r.tinggi_lantai_cm,
  r.pengawasan, r.fasilitas, r.kategori_diterima,
  r.jendela_akses, r.kuota_akses_bulanan, r.durasi_min_hari,
  r.harga_bulanan, r.deposit,
  r.kepemilikan, r.terbuka_alamat, r.status, r.dibuat_pada,
  r.host_id,
  p.nama          as host_nama,
  p.foto_url      as host_foto_url,
  p.terverifikasi as host_terverifikasi,
  p.bergabung     as host_bergabung,
  p.kota          as host_kota,
  r.usaha_diizinkan, r.lebar_muka_m, r.listrik, r.air, r.atap, r.kelas_jalan
from ruang r
join profil p on p.id = r.host_id
where r.status = 'tayang';

revoke all on ruang_publik from anon, authenticated;
grant select on ruang_publik to anon, authenticated;

/*
  `ruang_terdekat()` ikut mengembalikan jenis usaha dan lebar muka jalan —
  dua hal yang dipakai menyaring dan ditampilkan di kartu hasil. Di-drop dulu
  karena tipe kembaliannya berubah.
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
  luas_m2 numeric, volume_m3 numeric, harga_bulanan bigint,
  akses_masuk text, riwayat_banjir text, penguncian text,
  kategori_diterima text[],
  usaha_diizinkan text[], lebar_muka_m numeric, listrik text, kelas_jalan text,
  jarak_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.judul, r.tipe, r.kecamatan, r.kota,
         r.lat_publik, r.lng_publik,
         r.luas_m2, r.volume_m3, r.harga_bulanan,
         r.akses_masuk, r.riwayat_banjir, r.penguncian,
         r.kategori_diterima,
         r.usaha_diizinkan, r.lebar_muka_m, r.listrik, r.kelas_jalan,
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

revoke all on function ruang_terdekat(double precision, double precision, double precision, numeric, bigint) from public;
grant execute on function ruang_terdekat(double precision, double precision, double precision, numeric, bigint) to anon, authenticated;

select periksa_permukaan_publik();

-- ============================================================
--  Yang MASIH belum: serah terima per tipe
--
--  Untuk lahan usaha, "serah terima barang" tidak ada artinya — yang ada
--  serah terima LAHAN: kunci pagar, titik colokan, kondisi awal. Bentuknya
--  belum diputuskan, dan seluruh alurnya masih terhalang pembayaran, jadi
--  lebih baik dikerjakan bersamaan dengan serah terimanya sendiri daripada
--  ditebak sekarang.
-- ============================================================
