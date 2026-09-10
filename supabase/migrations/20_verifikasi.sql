-- ============================================================
--  20. Verifikasi lahan oleh petugas, dan peran admin
--
--  Pemilik mengajukan lahannya diperiksa; petugas datang, mencocokkan
--  keterangannya dengan kenyataan, lalu menyetujui atau menolak. Yang lolos
--  mendapat lencana di kartu dan di halaman detailnya.
--
--  Yang dijamin lencana ini SEMPIT, dan batasnya harus ditulis di layar:
--  "keterangannya sudah dicocokkan dengan kenyataan oleh petugas kami pada
--  tanggal sekian". Ia BUKAN jaminan keamanan, BUKAN asuransi, dan BUKAN
--  janji bahwa pemiliknya orang baik. Aturan di CLAUDE.md tetap berlaku
--  penuh: platform memutuskan siapa yang benar, platform tidak membayar
--  ganti rugi. Lencana yang dibaca lebih luas dari yang ia jamin justru
--  lebih berbahaya daripada tidak ada lencana sama sekali.
--
--  Kenapa statusnya di `ruang`, bukan tabel sendiri: satu lahan punya satu
--  keadaan verifikasi, dan riwayat pengajuannya belum ada gunanya sebelum
--  ada petugas sungguhan. Kalau nanti perlu jejak lengkap, tabelnya
--  ditambahkan dan kolom ini jadi ringkasannya — persis pola
--  `jendela_akses` dengan `ruang.jendela_akses`.
-- ============================================================

-- ---------- 1. peran admin ----------

/*
  Admin ditandai di `profil`, dan tidak ada satu pun jalur di aplikasi yang
  bisa menyalakannya. Ia dinyalakan tangan lewat SQL Editor:

    update profil set admin = true where id = '...';

  Itu disengaja. Layar yang bisa mengangkat admin adalah layar yang bisa
  dipakai mengangkat diri sendiri, dan seluruh gerbang di bawah ini
  bergantung pada satu boolean ini.
*/
alter table profil add column if not exists admin boolean not null default false;

revoke update (admin) on profil from anon, authenticated;

create or replace function saya_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.admin from profil p where p.user_id = auth.uid()),
    false
  );
$$;

comment on function saya_admin() is
  'Benar kalau pemanggilnya petugas aplikasi. Dipakai gerbang verifikasi; '
  'kolomnya tidak bisa ditulis klien.';

revoke all on function saya_admin() from public, anon;
grant execute on function saya_admin() to authenticated;

-- ---------- 2. keadaan verifikasi ----------

alter table ruang add column if not exists verifikasi text not null default 'belum';
alter table ruang add column if not exists verifikasi_diajukan_pada timestamptz;
alter table ruang add column if not exists verifikasi_pada timestamptz;
alter table ruang add column if not exists verifikasi_catatan text;

alter table ruang drop constraint if exists ruang_verifikasi_check;
alter table ruang add constraint ruang_verifikasi_check
  check (verifikasi in ('belum','diajukan','terverifikasi','ditolak'));

/*
  Klien tidak boleh menulis satu pun dari keempat kolom itu. Lencana yang
  bisa dipasang sendiri oleh yang diperiksa bukan verifikasi, ia hiasan.

  **Dijaga trigger, BUKAN `revoke update (kolom)`.** Versi pertama memakai
  pencabutan per kolom, dan itu TIDAK MENAHAN APA PUN: `authenticated` sudah
  punya hak UPDATE se-tabel atas `ruang`, dan di Postgres hak se-tabel
  meliputi semua kolom — mencabut hak per kolom di atasnya tidak
  mempersempitnya sedikit pun. Diuji: host memanggil
  `update ruang set verifikasi='terverifikasi'` dan Postgres menjawab
  `UPDATE 1`. Satu-satunya cara pencabutan per kolom bekerja adalah mencabut
  hak se-tabelnya lebih dulu lalu memberikan hak per kolom untuk ketiga
  puluhan kolom lain — daftar yang harus diingat setiap kali ada kolom baru,
  dan yang akan terlupa.

  Triggernya menyala di INSERT maupun UPDATE, sama seperti
  `ruang_pin_publik`. Fungsi resmi di bawah menyalakan penanda
  transaksi `app.verifikasi_sah` sebelum menulis; tanpa penanda itu nilainya
  dikembalikan diam-diam ke nilai lama. Diam-diam, bukan galat: host yang
  menyimpan listingnya tidak boleh gagal cuma karena badan permintaannya
  kebetulan memuat kolom ini.
*/
create or replace function ruang_jaga_verifikasi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('app.verifikasi_sah', true), '') = '1' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verifikasi := 'belum';
    new.verifikasi_diajukan_pada := null;
    new.verifikasi_pada := null;
    new.verifikasi_catatan := null;
  else
    new.verifikasi := old.verifikasi;
    new.verifikasi_diajukan_pada := old.verifikasi_diajukan_pada;
    new.verifikasi_pada := old.verifikasi_pada;
    new.verifikasi_catatan := old.verifikasi_catatan;
  end if;
  return new;
end;
$$;

drop trigger if exists ruang_jaga_verifikasi on ruang;
create trigger ruang_jaga_verifikasi
  before insert or update on ruang
  for each row execute function ruang_jaga_verifikasi();

-- ---------- 3. pemilik mengajukan ----------

create or replace function ajukan_verifikasi(p_ruang uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saya   uuid := profil_saya();
  v_ruang  ruang%rowtype;
begin
  select * into v_ruang from ruang where id = p_ruang;
  if not found then
    raise exception 'Lahannya tidak ditemukan.';
  end if;
  if v_ruang.host_id is distinct from v_saya then
    raise exception 'Cuma pemiliknya yang bisa mengajukan verifikasi.';
  end if;
  if v_ruang.verifikasi = 'diajukan' then
    raise exception 'Pengajuannya sudah masuk. Petugas kami akan menghubungimu.';
  end if;
  if v_ruang.verifikasi = 'terverifikasi' then
    raise exception 'Lahan ini sudah terverifikasi.';
  end if;

  /*
    Foto wajib ada sebelum diajukan, dan ini bukan formalitas: petugas
    berangkat ke lokasi berdasarkan keterangan di listing, dan listing tanpa
    foto tidak punya apa pun untuk dicocokkan di tempat. Menolaknya di sini
    lebih murah daripada satu perjalanan yang sia-sia.
  */
  if not exists (select 1 from ruang_foto f where f.ruang_id = p_ruang) then
    raise exception 'Unggah dulu fotonya. Petugas mencocokkan foto dengan keadaan di lokasi.';
  end if;

  perform set_config('app.verifikasi_sah', '1', true);
  update ruang
     set verifikasi = 'diajukan',
         verifikasi_diajukan_pada = now(),
         verifikasi_pada = null,
         verifikasi_catatan = null
   where id = p_ruang;
end;
$$;

revoke all on function ajukan_verifikasi(uuid) from public, anon;
grant execute on function ajukan_verifikasi(uuid) to authenticated;

-- ---------- 4. petugas memutuskan ----------

create or replace function putuskan_verifikasi(
  p_ruang   uuid,
  p_setujui boolean,
  p_catatan text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not saya_admin() then
    raise exception 'Cuma petugas aplikasi yang bisa memutuskan verifikasi.';
  end if;
  if not exists (select 1 from ruang where id = p_ruang) then
    raise exception 'Lahannya tidak ditemukan.';
  end if;

  /*
    Penolakan WAJIB berkatatan. Pemilik yang ditolak tanpa alasan tidak punya
    apa pun untuk diperbaiki, dan ia akan mengajukan lagi dengan lahan yang
    sama persis — biaya perjalanan petugasnya terbuang dua kali.
  */
  if not p_setujui and coalesce(btrim(p_catatan), '') = '' then
    raise exception 'Tulis alasan penolakannya supaya pemiliknya tahu apa yang harus diperbaiki.';
  end if;

  perform set_config('app.verifikasi_sah', '1', true);
  update ruang
     set verifikasi = case when p_setujui then 'terverifikasi' else 'ditolak' end,
         verifikasi_pada = now(),
         verifikasi_catatan = nullif(btrim(p_catatan), '')
   where id = p_ruang;
end;
$$;

revoke all on function putuskan_verifikasi(uuid, boolean, text) from public, anon;
grant execute on function putuskan_verifikasi(uuid, boolean, text) to authenticated;

-- ---------- 5. antrean petugas ----------

/*
  Fungsi, bukan view — dan itu keputusan keamanan.

  Antrean ini memuat ALAMAT LENGKAP dan nomor telepon pemiliknya; petugas
  memang butuh keduanya untuk datang. View tidak bisa membatasi diri ke
  admin tanpa RLS di tabel dasarnya, sedangkan fungsi SECURITY DEFINER bisa
  menolak di baris pertama. Kalau ini ditulis sebagai view lalu diberi
  `grant select ... to authenticated`, setiap pengguna yang login bisa
  membaca alamat seluruh lahan yang sedang diajukan.
*/
drop function if exists antrean_verifikasi();

create or replace function antrean_verifikasi()
returns table (
  id                       uuid,
  judul                    text,
  tipe                     text,
  status                   text,
  alamat                   text,
  patokan                  text,
  kelurahan                text,
  kecamatan                text,
  kota                     text,
  lat                      double precision,
  lng                      double precision,
  verifikasi               text,
  verifikasi_diajukan_pada timestamptz,
  verifikasi_pada          timestamptz,
  verifikasi_catatan       text,
  jumlah_foto              int,
  host_nama                text,
  host_telepon             text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not saya_admin() then
    raise exception 'Halaman ini cuma untuk petugas aplikasi.';
  end if;

  return query
  select
    r.id, r.judul, r.tipe, r.status,
    r.alamat, r.patokan, r.kelurahan, r.kecamatan, r.kota,
    r.lat, r.lng,
    r.verifikasi, r.verifikasi_diajukan_pada, r.verifikasi_pada, r.verifikasi_catatan,
    (select count(*) from ruang_foto f where f.ruang_id = r.id)::int,
    p.nama, p.telepon
  from ruang r
  join profil p on p.id = r.host_id
  where r.verifikasi <> 'belum'
  -- Yang menunggu jawaban di atas, lalu yang paling lama menunggu.
  order by (r.verifikasi = 'diajukan') desc, r.verifikasi_diajukan_pada;
end;
$$;

revoke all on function antrean_verifikasi() from public, anon;
grant execute on function antrean_verifikasi() to authenticated;

-- ---------- 6. isian bebas yang tidak boleh liar ----------

/*
  `usaha_diizinkan`, `kategori_diterima`, `pengawasan`, dan `fasilitas`
  sekarang menerima isian yang diketik pemiliknya sendiri — daftar tertutup
  selalu salah untuk sebagian orang, dan yang tidak menemukan pilihannya
  akan mencentang yang paling mendekati, yang artinya keterangannya jadi
  SALAH, bukan kosong.

  Yang dijaga di sini bentuknya, bukan isinya: panjang per isian dan jumlah
  isian. Tanpa batas, satu permintaan API bisa menaruh berkas satu megabita
  ke dalam kolom yang dirender di kartu hasil pencarian.

  Ditulis sebagai fungsi karena CHECK tidak menerima subkueri, dan `unnest`
  di dalam CHECK adalah subkueri.
*/
create or replace function daftar_teks_wajar(p text[], p_maks int default 20)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p is null
      or (coalesce(array_length(p, 1), 0) <= p_maks
          and not exists (
            select 1 from unnest(p) t
             where btrim(t) = '' or length(t) > 40
          ));
$$;

alter table ruang drop constraint if exists ruang_daftar_teks_check;
alter table ruang add constraint ruang_daftar_teks_check
  check (
    daftar_teks_wajar(usaha_diizinkan)
    and daftar_teks_wajar(kategori_diterima)
    and daftar_teks_wajar(pengawasan)
    and daftar_teks_wajar(fasilitas)
  );

-- ---------- 7. permukaan publik ----------

/*
  Kolom baru ditambahkan di UJUNG. `verifikasi_catatan` TIDAK ikut: ia
  catatan internal petugas untuk pemiliknya ("pagarnya beda dengan foto"),
  dan tidak ada gunanya dibaca publik.
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
  r.usaha_diizinkan, r.lebar_muka_m, r.listrik, r.air, r.atap, r.kelas_jalan,
  (r.verifikasi = 'terverifikasi') as tempat_terverifikasi,
  r.verifikasi_pada
from ruang r
join profil p on p.id = r.host_id
where r.status = 'tayang';

revoke all on ruang_publik from anon, authenticated;
grant select on ruang_publik to anon, authenticated;

/*
  `ruang_saya` ikut membawa keadaan verifikasinya BESERTA catatannya —
  pemiliknya memang penerima catatan itu, dan tanpa itu penolakan sampai ke
  layar sebagai kata "ditolak" tanpa satu pun petunjuk apa yang salah.
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
  r.usaha_diizinkan, r.lebar_muka_m, r.listrik, r.air, r.atap, r.kelas_jalan,
  r.verifikasi, r.verifikasi_diajukan_pada, r.verifikasi_pada, r.verifikasi_catatan
from ruang r;

revoke all on ruang_saya from anon, authenticated;
grant select on ruang_saya to authenticated;

/*
  `ruang_terdekat()` ikut mengembalikan penanda verifikasinya, supaya kartu
  hasil pencarian bisa menampilkan lencananya tanpa satu kueri tambahan per
  kartu. Di-drop dulu karena tipe kembaliannya berubah.
*/
drop function if exists ruang_terdekat(double precision, double precision, double precision, numeric, bigint);

create or replace function ruang_terdekat(
  p_lat        double precision,
  p_lng        double precision,
  p_radius_km  double precision default 5,
  p_volume_min numeric default 0,
  p_harga_maks bigint default 999999999
)
returns table (
  id                   uuid,
  judul                text,
  tipe                 text,
  kelurahan            text,
  kecamatan            text,
  kota                 text,
  lat_publik           double precision,
  lng_publik           double precision,
  panjang_m            numeric,
  lebar_m              numeric,
  tinggi_m             numeric,
  luas_m2              numeric,
  volume_m3            numeric,
  akses_masuk          text,
  posisi_lantai        text,
  lebar_pintu_cm       int,
  jarak_parkir         text,
  kondisi_bangunan     text,
  penguncian           text,
  berbagi              text,
  kelembapan           text,
  riwayat_banjir       text,
  tinggi_lantai_cm     int,
  pengawasan           text[],
  fasilitas            text[],
  kategori_diterima    text[],
  jendela_akses        text,
  kuota_akses_bulanan  int,
  durasi_min_hari      int,
  harga_bulanan        bigint,
  deposit              bigint,
  kepemilikan          text,
  host_nama            text,
  host_terverifikasi   boolean,
  jarak_km             double precision,
  usaha_diizinkan      text[],
  lebar_muka_m         numeric,
  listrik              text,
  kelas_jalan          text,
  tempat_terverifikasi boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id, r.judul, r.tipe, r.kelurahan, r.kecamatan, r.kota,
    r.lat_publik, r.lng_publik,
    r.panjang_m, r.lebar_m, r.tinggi_m, r.luas_m2, r.volume_m3,
    r.akses_masuk, r.posisi_lantai, r.lebar_pintu_cm, r.jarak_parkir,
    r.kondisi_bangunan, r.penguncian, r.berbagi, r.kelembapan,
    r.riwayat_banjir, r.tinggi_lantai_cm,
    r.pengawasan, r.fasilitas, r.kategori_diterima,
    r.jendela_akses, r.kuota_akses_bulanan, r.durasi_min_hari,
    r.harga_bulanan, r.deposit, r.kepemilikan,
    p.nama, p.terverifikasi,
    -- Haversine dari koordinat ASLI, bukan dari pin yang digeser. Jaraknya
    -- ditampilkan persis; penyamaran alamat tidak boleh merusak pencarian.
    (6371 * acos(
      least(1, greatest(-1,
        cos(radians(p_lat)) * cos(radians(r.lat)) *
        cos(radians(r.lng) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(r.lat))
      ))
    ))::double precision as jarak_km,
    r.usaha_diizinkan, r.lebar_muka_m, r.listrik, r.kelas_jalan,
    (r.verifikasi = 'terverifikasi')
  from ruang r
  join profil p on p.id = r.host_id
  where r.status = 'tayang'
    and r.volume_m3 >= coalesce(p_volume_min, 0)
    and r.harga_bulanan <= coalesce(p_harga_maks, 999999999)
    and (6371 * acos(
      least(1, greatest(-1,
        cos(radians(p_lat)) * cos(radians(r.lat)) *
        cos(radians(r.lng) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(r.lat))
      ))
    )) <= coalesce(p_radius_km, 5)
  order by jarak_km;
$$;

revoke all on function ruang_terdekat(double precision, double precision, double precision, numeric, bigint) from public;
grant execute on function ruang_terdekat(double precision, double precision, double precision, numeric, bigint) to anon, authenticated;

select periksa_permukaan_publik();

-- ============================================================
--  Yang MASIH belum: pemberitahuan hasil verifikasi.
--
--  Pemilik baru tahu lahannya disetujui atau ditolak kalau ia membuka
--  dasbornya sendiri. Trigger notifikasi yang ada menempel di
--  `pemesanan_transisi` dan `akses_log`, bukan di `ruang`, jadi menambahkan
--  ini berarti sumber pemicu ketiga — dan bentuknya lebih baik diputuskan
--  bersamaan dengan pemberitahuan lain yang belum ada (mis. listing yang
--  ditangguhkan moderasi).
-- ============================================================
