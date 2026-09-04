-- ============================================================
--  Ruang — alur pesan
--
--  Jalankan setelah 03_auth_rls.sql. Aman dijalankan ulang.
--
--  Kenapa semuanya lewat fungsi, bukan policy INSERT/UPDATE:
--  status pemesanan menentukan uang dan siapa yang berhak masuk
--  ke ruangan orang. Kalau klien boleh menulis kolom `status`,
--  siapa pun bisa menandai dirinya sudah membayar. Jadi tabel
--  `pemesanan` tetap tanpa hak tulis dari klien, dan setiap
--  perpindahan status punya fungsi sendiri yang memeriksa
--  (a) siapa pemanggilnya, (b) status asalnya benar, dan
--  (c) syarat isinya terpenuhi.
--
--  PEMBAYARAN BELUM ADA. Alur ini berhenti di
--  `menunggu_pembayaran` dan tidak ada satu pun fungsi di sini
--  yang bisa memindahkannya ke `menunggu_serah_terima`. Itu
--  disengaja: menulis "sudah dibayar" tanpa uang sungguhan
--  adalah kebohongan, bukan demo.
-- ============================================================

create extension if not exists btree_gist;

-- ---------- 1. status yang menahan ruangan ----------

-- Satu sumber kebenaran untuk "ruangnya sedang terpakai".
--
-- `tunggakan` dan `sengketa` termasuk, dan itu koreksi terhadap 03: di sana
-- keduanya terlewat, sehingga ruang yang penyewanya menunggak tampil
-- "Tersedia sekarang" padahal barang orang masih di dalamnya.
--
-- `menunggu_konfirmasi` sengaja TIDAK termasuk — lihat alasannya di
-- `buat_pemesanan`.
create or replace function status_menahan_ruang()
returns text[]
language sql
immutable
as $$
  select array[
    'menunggu_pembayaran',
    'menunggu_serah_terima',
    'aktif',
    'menunggu_serah_terima_keluar',
    'tunggakan',
    'sengketa'
  ];
$$;

-- Dua pemesanan yang menahan ruangan yang sama pada tanggal yang bertumpang
-- tindih dibuat MUSTAHIL di level database, bukan cuma diperiksa di fungsi.
-- Pemeriksaan di fungsi kalah balapan: dua host yang menekan "Terima" pada
-- detik yang sama sama-sama lolos pemeriksaan, lalu dua-duanya tersimpan.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pemesanan_tanpa_tumpang_tindih'
  ) then
    alter table pemesanan add constraint pemesanan_tanpa_tumpang_tindih
      exclude using gist (
        ruang_id with =,
        daterange(mulai, selesai, '[)') with &&
      ) where (status = any (status_menahan_ruang()));
  end if;
end $$;

-- Ketersediaan ikut dikoreksi dengan daftar status yang sama.
create or replace view ruang_ketersediaan as
select
  r.id as ruang_id,
  max(pm.selesai) filter (
    where pm.status = any (status_menahan_ruang())
  ) as tersewa_sampai
from ruang r
left join pemesanan pm on pm.ruang_id = r.id
where r.status = 'tayang'
group by r.id;

grant select on ruang_ketersediaan to anon, authenticated;

-- ---------- 2. daftar pemesanan untuk layar ----------

-- `security_invoker = true` — WAJIB, dan alasannya penting.
--
-- View lain di repo ini sengaja berjalan sebagai pemiliknya supaya bisa
-- melewati RLS tabel dasarnya; itu aman karena isinya memang publik. View ini
-- kebalikannya: ia memuat pemesanan orang. Tanpa `security_invoker`, ia akan
-- melewati RLS `pemesanan` dan menyajikan seluruh pemesanan semua orang ke
-- siapa pun yang boleh membacanya.
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
  ) as foto
from pemesanan pm
join ruang_publik rp on rp.id = pm.ruang_id;

revoke all on pemesanan_saya from anon;
grant select on pemesanan_saya to authenticated;

-- ---------- 3. helper internal ----------

-- Mencatat perpindahan status sekalian menulis jejaknya. Tidak ada satu pun
-- fungsi di bawah yang meng-UPDATE `pemesanan.status` tanpa lewat sini, jadi
-- `pemesanan_transisi` tidak bisa ketinggalan.
create or replace function _pindah_status(
  p_pemesanan uuid,
  p_dari      text,
  p_ke        text,
  p_catatan   text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update pemesanan set status = p_ke
   where id = p_pemesanan and status = p_dari;

  if not found then
    raise exception 'Status pemesanan sudah berubah. Muat ulang halamannya.'
      using errcode = 'check_violation';
  end if;

  insert into pemesanan_transisi (pemesanan_id, dari, ke, oleh, catatan)
  values (p_pemesanan, p_dari, p_ke, profil_saya(), p_catatan);
end;
$$;

revoke all on function _pindah_status(uuid, text, text, text) from public, anon, authenticated;

-- ---------- 4. buat pemesanan ----------

/*
  Dipanggil penyewa. Membuat pemesanan berstatus `menunggu_konfirmasi`
  sekaligus manifes versi 1 dan jejak transisinya, dalam satu transaksi.

  Manifes wajib dan kategorinya dicocokkan dengan `kategori_diterima` host DI
  SINI, bukan di layar. Pencocokan di layar bisa dilewati siapa pun yang
  memanggil API langsung, dan aturannya ("host berhak menolak barang") adalah
  keputusan produk yang dikunci — jadi tempatnya di database.

  `menunggu_konfirmasi` tidak menahan ruangan. Kalau ia menahan, satu orang
  bisa mengunci ruang orang lain gratis hanya dengan mengirim permintaan dan
  tidak pernah membayar. Konsekuensinya: dua orang boleh meminta tanggal yang
  sama, dan yang menentukan adalah host lewat `konfirmasi_pemesanan` — yang
  memeriksa ulang tumpang tindihnya saat itu.
*/
create or replace function buat_pemesanan(
  p_ruang   uuid,
  p_mulai   date,
  p_selesai date,
  p_manifes jsonb
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
  v_id      uuid;
begin
  if v_saya is null then
    raise exception 'Masuk dulu sebelum memesan.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_ruang from ruang where id = p_ruang and status = 'tayang';
  if not found then
    raise exception 'Ruangnya tidak ada atau sedang tidak disewakan.'
      using errcode = 'no_data_found';
  end if;

  if v_ruang.host_id = v_saya then
    raise exception 'Ini ruangmu sendiri.' using errcode = 'check_violation';
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
    raise exception 'Sewa minimum di ruang ini % hari, yang diminta % hari.',
      v_ruang.durasi_min_hari, v_hari using errcode = 'check_violation';
  end if;

  if p_manifes is null or jsonb_typeof(p_manifes) <> 'array'
     or jsonb_array_length(p_manifes) = 0 then
    raise exception 'Manifes barang wajib diisi minimal satu baris.'
      using errcode = 'check_violation';
  end if;

  for v_item in select * from jsonb_array_elements(p_manifes) loop
    if coalesce(btrim(v_item ->> 'nama'), '') = '' then
      raise exception 'Ada baris manifes tanpa nama barang.' using errcode = 'check_violation';
    end if;
    if not (v_item ->> 'kategori' = any (v_ruang.kategori_diterima)) then
      raise exception 'Host tidak menerima kategori "%" di ruang ini.',
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

  -- Ruangan yang sudah dipegang pemesanan lain pada tanggal itu tidak bisa
  -- diminta lagi. Constraint di atas menjaga sisi tulisnya; pemeriksaan ini
  -- ada supaya pesannya bisa dibaca orang, bukan "conflicting key value".
  if exists (
    select 1 from pemesanan pm
    where pm.ruang_id = p_ruang
      and pm.status = any (status_menahan_ruang())
      and daterange(pm.mulai, pm.selesai, '[)') && daterange(p_mulai, p_selesai, '[)')
  ) then
    raise exception 'Ruangnya sudah dipesan orang lain di tanggal itu.'
      using errcode = 'check_violation';
  end if;

  -- Sewa dihitung per bulan dibulatkan ke atas: 45 hari dihitung dua bulan.
  -- Deposit TIDAK ikut di `total` — ia ditagih terpisah saat pembayaran, dan
  -- dikembalikan di akhir sewa, jadi menjumlahkannya akan salah dua kali.
  v_bulan := ceil(v_hari::numeric / 30);

  insert into pemesanan (ruang_id, penyewa_id, mulai, selesai, harga_bulanan, total, status)
  values (p_ruang, v_saya, p_mulai, p_selesai, v_ruang.harga_bulanan,
          v_ruang.harga_bulanan * v_bulan, 'menunggu_konfirmasi')
  returning id into v_id;

  insert into manifes_item (pemesanan_id, versi, nama, kategori, jumlah, taksiran_nilai, foto_url)
  select v_id, 1,
         btrim(item ->> 'nama'),
         item ->> 'kategori',
         coalesce((item ->> 'jumlah')::int, 1),
         coalesce((item ->> 'taksiran_nilai')::bigint, 0),
         nullif(btrim(item ->> 'foto_url'), '')
    from jsonb_array_elements(p_manifes) as item;

  insert into pemesanan_transisi (pemesanan_id, dari, ke, oleh, catatan)
  values (v_id, null, 'menunggu_konfirmasi', v_saya,
          format('Pemesanan dibuat dengan %s baris manifes', v_jumlah));

  return v_id;
end;
$$;

-- ---------- 5. keputusan host ----------

/*
  Host menerima permintaan. Tumpang tindih diperiksa ULANG di sini, bukan cuma
  saat permintaan dibuat: sejak permintaan masuk, bisa saja permintaan lain di
  tanggal yang sama sudah diterima lebih dulu.
*/
create or replace function konfirmasi_pemesanan(p_pemesanan uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pm pemesanan;
begin
  select * into v_pm from pemesanan where id = p_pemesanan;
  if not found then
    raise exception 'Pemesanannya tidak ada.' using errcode = 'no_data_found';
  end if;

  if not saya_host_ruang(v_pm.ruang_id) then
    raise exception 'Hanya host ruangnya yang bisa menerima permintaan ini.'
      using errcode = 'insufficient_privilege';
  end if;

  if v_pm.status <> 'menunggu_konfirmasi' then
    raise exception 'Permintaan ini sudah tidak menunggu konfirmasi.'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from pemesanan lain
    where lain.ruang_id = v_pm.ruang_id
      and lain.id <> v_pm.id
      and lain.status = any (status_menahan_ruang())
      and daterange(lain.mulai, lain.selesai, '[)')
          && daterange(v_pm.mulai, v_pm.selesai, '[)')
  ) then
    raise exception 'Tanggal itu sudah terisi pemesanan lain yang kamu terima.'
      using errcode = 'check_violation';
  end if;

  perform _pindah_status(p_pemesanan, 'menunggu_konfirmasi', 'menunggu_pembayaran',
                         'Diterima host');
end;
$$;

create or replace function tolak_pemesanan(p_pemesanan uuid, p_catatan text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pm pemesanan;
begin
  select * into v_pm from pemesanan where id = p_pemesanan;
  if not found then
    raise exception 'Pemesanannya tidak ada.' using errcode = 'no_data_found';
  end if;

  if not saya_host_ruang(v_pm.ruang_id) then
    raise exception 'Hanya host ruangnya yang bisa menolak permintaan ini.'
      using errcode = 'insufficient_privilege';
  end if;

  if v_pm.status <> 'menunggu_konfirmasi' then
    raise exception 'Permintaan ini sudah tidak menunggu konfirmasi.'
      using errcode = 'check_violation';
  end if;

  perform _pindah_status(p_pemesanan, 'menunggu_konfirmasi', 'dibatalkan',
                         coalesce(nullif(btrim(p_catatan), ''), 'Ditolak host'));
end;
$$;

-- ---------- 6. penyewa membatalkan ----------

/*
  Penyewa membatalkan permintaannya sendiri.

  Hanya selama belum dibayar. Setelah pembayaran, pembatalan menyangkut
  pengembalian uang dan itu tidak bisa diputuskan tanpa jalur pembayaran —
  jadi statusnya sengaja tidak bisa disentuh dari sini.
*/
create or replace function batalkan_pemesanan(p_pemesanan uuid, p_catatan text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pm pemesanan;
begin
  select * into v_pm from pemesanan where id = p_pemesanan;
  if not found then
    raise exception 'Pemesanannya tidak ada.' using errcode = 'no_data_found';
  end if;

  if v_pm.penyewa_id <> profil_saya() then
    raise exception 'Ini bukan pemesananmu.' using errcode = 'insufficient_privilege';
  end if;

  if v_pm.status not in ('menunggu_konfirmasi', 'menunggu_pembayaran') then
    raise exception 'Pemesanan yang sudah dibayar tidak bisa dibatalkan sendiri. Hubungi host lewat aplikasi.'
      using errcode = 'check_violation';
  end if;

  perform _pindah_status(p_pemesanan, v_pm.status, 'dibatalkan',
                         coalesce(nullif(btrim(p_catatan), ''), 'Dibatalkan penyewa'));
end;
$$;

-- ---------- 7. hak jalankan ----------

-- anon tidak boleh memanggil satu pun: semuanya butuh identitas, dan
-- membiarkannya terbuka berarti pesan galat berubah dari "masuk dulu" menjadi
-- kegagalan yang membingungkan.
do $$
declare
  f text;
begin
  foreach f in array array[
    'buat_pemesanan(uuid, date, date, jsonb)',
    'konfirmasi_pemesanan(uuid)',
    'tolak_pemesanan(uuid, text)',
    'batalkan_pemesanan(uuid, text)'
  ]
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ============================================================
--  Yang TIDAK ada di sini, dan alasannya
--
--  * Tidak ada fungsi yang memindahkan status ke
--    `menunggu_serah_terima`. Itu langkah setelah pembayaran, dan
--    pembayaran menunggu payment gateway berlisensi.
--  * Tidak ada `bayar_pemesanan()`, bahkan sebagai simulasi.
--  * Tidak ada pengubahan manifes. Perubahan manifes membuat
--    versi baru (kolom `versi` sudah ada); fungsinya ditulis saat
--    serah terima dibangun, karena di sanalah manifes dicocokkan.
-- ============================================================
