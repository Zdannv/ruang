-- ============================================================
--  21. Alamat dan kontak terbuka di listing
--
--  Konsekuensi langsung dari rilis pertama jadi papan iklan (nomor 43 di
--  CLAUDE.md). Begitu pemesanan dan pembayaran tidak ada lagi, TIDAK ADA
--  peristiwa apa pun di aplikasi yang bisa memicu "sekarang alamatnya boleh
--  dibuka" — tingkat 2 dan 3 di tabel keterbukaan alamat menggantung pada
--  alur yang sudah dibuang. Alamat yang tidak pernah terbuka berarti orang
--  harus chat dulu cuma untuk tahu lahannya di mana, dan sebagian besar
--  tidak akan melakukannya.
--
--  Yang dipakai sekarang: SATU saklar milik pemiliknya, `terbuka_alamat`,
--  yang kolomnya sudah ada sejak `01_schema.sql` dan selama ini cuma
--  memajukan tingkat awal. Menyala berarti alamat, patokan, dan titik
--  aslinya tampil ke siapa pun. Mati berarti yang tampil cuma kelurahan dan
--  pin yang digeser, persis seperti sebelumnya.
--
--  **Barisan yang sudah ada TIDAK diubah.** Pemiliknya mengisi alamat itu
--  saat layar berjanji "alamat lengkap tidak pernah ditampilkan ke publik",
--  dan menyalakannya massal lewat migrasi berarti menerbitkan alamat rumah
--  orang yang tidak pernah menyetujuinya. Yang berubah cuma NILAI BAWAAN
--  untuk lahan baru.
--
--  Nomor telepon TIDAK ikut ke view. Ia lewat `kontak_lahan()`, yang
--  menolak pemanggil yang belum masuk — lihat bagian 3.
-- ============================================================

-- ---------- 1. bawaan untuk lahan baru ----------

alter table ruang alter column terbuka_alamat set default true;

comment on column ruang.terbuka_alamat is
  'Menyala: alamat, patokan, dan titik asli tampil di listing publik. '
  'Mati: cuma kelurahan dan pin yang digeser 200 m. Dipilih pemiliknya.';

-- ---------- 2. penjaga permukaan publik ----------

/*
  Penjaganya DIUBAH SADAR, bukan dihindari.

  Godaannya besar: cukup menamai kolomnya `alamat_publik` dan penjaga ini
  tidak akan menyadarinya, karena ia mencocokkan NAMA kolom. Itu cara
  tercepat membunuh perlindungannya — penjaga yang bisa dilewati dengan
  mengganti nama sudah tidak menjaga apa pun.

  Jadi kolomnya tetap bernama apa adanya, daftar terlarangnya bertambah
  (`alamat_publik`, `patokan_publik`, `peta_lat`, `peta_lng`), dan yang
  ditambahkan adalah SATU pengecualian bernama: `ruang_publik`. View baru
  yang membocorkan alamat tetap menggagalkan migrasi, seperti seharusnya.

  `telepon` dan `npwp` TIDAK dapat pengecualian. Nomor telepon tetap tidak
  boleh ada di view mana pun yang bisa dibaca anon; ia lewat fungsi di
  bagian 3 yang menuntut pemanggilnya sudah masuk.
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
                          'penyewa_id','pemesanan_id','penulis_id','user_id',
                          'alamat_publik','patokan_publik','peta_lat','peta_lng')
    -- Satu-satunya pengecualian, dan disebut namanya. Lihat catatan di atas.
    and not (
      c.table_name = 'ruang_publik'
      and c.column_name in ('alamat_publik','patokan_publik','peta_lat','peta_lng')
    )
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

-- ---------- 3. nomor kontak, hanya untuk yang sudah masuk ----------

/*
  Fungsi, bukan kolom di view, dan syaratnya cuma satu: sudah masuk.

  Nomor telepon di view publik berarti seluruh nomor pemilik lahan bisa
  diambil satu permintaan oleh siapa pun tanpa akun. Itu bukan kekhawatiran
  teoretis untuk papan iklan; nomor yang dikumpulkan begitu berakhir di
  daftar telemarketing. Menuntut akun tidak menghentikan orang yang niat,
  tapi ia mengubah "satu permintaan" jadi "buat akun dulu", dan itu sudah
  membuang sebagian besar pengambilan massal.

  Yang TIDAK dilakukan: menyamarkan nomornya jadi "0812****". Di papan iklan,
  nomor itu justru alasan orang membuka halamannya.
*/
create or replace function kontak_lahan(p_ruang uuid)
returns table (nama text, telepon text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Masuk dulu untuk melihat nomor pemiliknya.';
  end if;

  return query
  select p.nama, p.telepon
  from ruang r
  join profil p on p.id = r.host_id
  where r.id = p_ruang
    -- Listing draf tidak punya nomor untuk dibagikan; ia belum tayang.
    and r.status = 'tayang';
end;
$$;

revoke all on function kontak_lahan(uuid) from public, anon;
grant execute on function kontak_lahan(uuid) to authenticated;

-- ---------- 4. alamat di permukaan publik ----------

/*
  Empat kolom baru, ditambahkan DI UJUNG seperti biasa.

  `peta_lat`/`peta_lng` selalu ada isinya, jadi halaman detail selalu bisa
  menggambar peta: titik ASLI kalau pemiliknya membuka alamat, pin yang
  digeser kalau tidak. `alamat_terbuka` yang memberi tahu layar mana yang
  sedang ia tampilkan — tanpa itu, peta pin geseran akan disajikan seolah
  titik persis, dan orang datang ke rumah tetangga.
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
  r.verifikasi_pada,
  r.terbuka_alamat                                   as alamat_terbuka,
  case when r.terbuka_alamat then r.alamat  end      as alamat_publik,
  case when r.terbuka_alamat then r.patokan end      as patokan_publik,
  case when r.terbuka_alamat then r.lat  else r.lat_publik end as peta_lat,
  case when r.terbuka_alamat then r.lng  else r.lng_publik end as peta_lng
from ruang r
join profil p on p.id = r.host_id
where r.status = 'tayang';

revoke all on ruang_publik from anon, authenticated;
grant select on ruang_publik to anon, authenticated;

select periksa_permukaan_publik();

-- ============================================================
--  Catatan untuk yang membaca ini nanti
--
--  Kalau lahan yang sudah terdaftar mau ikut membuka alamatnya, itu
--  keputusan pemiliknya, bukan keputusan migrasi. Yang benar: ia membuka
--  sendiri dari halaman kelola lahannya. Kalau memang perlu dinyalakan
--  massal di database yang isinya masih data uji sendiri:
--
--    update ruang set terbuka_alamat = true where host_id = '<id-kamu>';
--
--  Jangan pernah menjalankannya tanpa `where`.
-- ============================================================
