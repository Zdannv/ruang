-- ============================================================
--  Ruang — jadwal kunjungan + pengerasan tabel bukti
--
--  Jalankan setelah 05_host.sql. Aman dijalankan ulang.
--
--  Kenapa ini yang dikerjakan, bukan serah terima: "akses bebas
--  terjadwal" adalah keputusan produk nomor satu, dan log akses
--  inilah yang menggantikan segel tamper-evident. Ia juga satu-
--  satunya alur inti yang TIDAK terhalang pembayaran — pemesanan
--  berstatus `aktif` sudah ada, jadi kunjungan bisa dijadwalkan
--  hari ini.
-- ============================================================

-- ---------- 1. status pemesanan yang membolehkan kunjungan ----------

-- Barang sudah di dalam ruangan. `menunggu_serah_terima_keluar` ikut, karena
-- di situlah penyewa datang justru untuk mengambil barangnya.
create or replace function status_boleh_akses()
returns text[]
language sql
immutable
as $$
  select array['aktif', 'menunggu_serah_terima_keluar', 'tunggakan'];
$$;

comment on function status_boleh_akses() is
  '`tunggakan` ikut disengaja: penyewa yang menunggak tetap berhak mengambil '
  'barangnya sendiri. Menahan akses ke barang orang sebagai alat tagih bukan '
  'sesuatu yang boleh dilakukan platform.';

-- ---------- 2. sisa kuota kunjungan ----------

/*
  Kuota dihitung per bulan kalender dari `diminta_untuk`, dan hanya kunjungan
  yang DISETUJUI atau SUDAH SELESAI yang memakannya.

  Permintaan yang masih menunggu jawaban sengaja tidak dihitung: kalau
  dihitung, penyewa bisa menghabiskan kuotanya sendiri hanya dengan mengirim
  permintaan yang tidak pernah dijawab host. Untuk menahan penyalahgunaan dari
  arah lain, jumlah permintaan yang menggantung dibatasi terpisah di
  `minta_akses`.
*/
create or replace function sisa_kuota_akses(p_pemesanan uuid, p_bulan date)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select greatest(0, r.kuota_akses_bulanan - (
    select count(*)::int from akses_log a
    where a.pemesanan_id = p_pemesanan
      and a.status in ('disetujui', 'selesai')
      and date_trunc('month', a.diminta_untuk at time zone 'Asia/Jakarta')
          = date_trunc('month', p_bulan::timestamp)
  ))
  from pemesanan pm
  join ruang r on r.id = pm.ruang_id
  where pm.id = p_pemesanan;
$$;

revoke all on function sisa_kuota_akses(uuid, date) from public, anon;
grant execute on function sisa_kuota_akses(uuid, date) to authenticated;

-- Batas permintaan menggantung per pemesanan.
create or replace function _batas_permintaan_menggantung()
returns int
language sql
immutable
as $$ select 3; $$;

-- ---------- 3. penyewa meminta kunjungan ----------

/*
  CATATAN PENTING soal `ruang.jendela_akses`.

  Aturan produknya: kunjungan hanya boleh di dalam jendela akses yang
  ditetapkan host. Aturan itu TIDAK bisa ditegakkan di sini, karena
  `jendela_akses` berupa teks bebas ("Sen-Sab 08.00-17.00", "Setiap hari
  08.00-20.00"). Menguraikan kalimat itu dengan regex akan salah pada bentuk
  yang tidak terduga, dan salah menolak permintaan yang sah lebih buruk
  daripada tidak memeriksa.

  Jadi untuk sekarang jendelanya ditampilkan ke penyewa dan host yang
  memutuskan. Tercatat sebagai utang: jendela akses perlu jadi data
  terstruktur (hari + jam mulai + jam selesai) sebelum bisa ditegakkan.
*/
create or replace function minta_akses(
  p_pemesanan uuid,
  p_untuk     timestamptz,
  p_catatan   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saya      uuid := profil_saya();
  v_pm        pemesanan;
  v_menggantung int;
  v_sisa      int;
  v_id        uuid;
begin
  if v_saya is null then
    raise exception 'Masuk dulu.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_pm from pemesanan where id = p_pemesanan;
  if not found then
    raise exception 'Pemesanannya tidak ada.' using errcode = 'no_data_found';
  end if;

  if v_pm.penyewa_id <> v_saya then
    raise exception 'Hanya penyewa yang bisa meminta jadwal kunjungan.'
      using errcode = 'insufficient_privilege';
  end if;

  if not (v_pm.status = any (status_boleh_akses())) then
    raise exception 'Kunjungan baru bisa dijadwalkan setelah serah terima masuk.'
      using errcode = 'check_violation';
  end if;

  if p_untuk <= now() then
    raise exception 'Jadwalnya harus di waktu yang belum lewat.'
      using errcode = 'check_violation';
  end if;

  if p_untuk > now() + interval '90 days' then
    raise exception 'Jadwal paling jauh 90 hari dari sekarang.'
      using errcode = 'check_violation';
  end if;

  if p_untuk::date > v_pm.selesai then
    raise exception 'Jadwalnya melewati tanggal berakhirnya sewa (%).', v_pm.selesai
      using errcode = 'check_violation';
  end if;

  select count(*)::int into v_menggantung
    from akses_log where pemesanan_id = p_pemesanan and status = 'diminta';
  if v_menggantung >= _batas_permintaan_menggantung() then
    raise exception 'Masih ada % permintaan yang belum dijawab host. Tunggu jawabannya dulu.',
      v_menggantung using errcode = 'check_violation';
  end if;

  v_sisa := sisa_kuota_akses(p_pemesanan, p_untuk::date);
  if v_sisa <= 0 then
    raise exception 'Kuota kunjungan bulan itu sudah habis.'
      using errcode = 'check_violation';
  end if;

  insert into akses_log (pemesanan_id, diminta_untuk, status, catatan)
  values (p_pemesanan, p_untuk, 'diminta', nullif(btrim(p_catatan), ''))
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------- 4. host menjawab ----------

create or replace function setujui_akses(p_akses uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a akses_log;
  v_pm pemesanan;
begin
  select * into v_a from akses_log where id = p_akses;
  if not found then
    raise exception 'Permintaan aksesnya tidak ada.' using errcode = 'no_data_found';
  end if;

  select * into v_pm from pemesanan where id = v_a.pemesanan_id;
  if not saya_host_ruang(v_pm.ruang_id) then
    raise exception 'Hanya host ruangnya yang bisa menyetujui.'
      using errcode = 'insufficient_privilege';
  end if;

  if v_a.status <> 'diminta' then
    raise exception 'Permintaan ini sudah dijawab.' using errcode = 'check_violation';
  end if;

  -- Diperiksa ULANG di sini: sejak permintaan masuk, permintaan lain di bulan
  -- yang sama bisa saja sudah disetujui dan menghabiskan kuotanya.
  if sisa_kuota_akses(v_a.pemesanan_id, v_a.diminta_untuk::date) <= 0 then
    raise exception 'Kuota kunjungan bulan itu sudah habis terpakai permintaan lain.'
      using errcode = 'check_violation';
  end if;

  update akses_log set status = 'disetujui' where id = p_akses;
end;
$$;

create or replace function tolak_akses(p_akses uuid, p_catatan text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a akses_log;
  v_pm pemesanan;
begin
  select * into v_a from akses_log where id = p_akses;
  if not found then
    raise exception 'Permintaan aksesnya tidak ada.' using errcode = 'no_data_found';
  end if;

  select * into v_pm from pemesanan where id = v_a.pemesanan_id;
  if not saya_host_ruang(v_pm.ruang_id) then
    raise exception 'Hanya host ruangnya yang bisa menolak.'
      using errcode = 'insufficient_privilege';
  end if;

  if v_a.status <> 'diminta' then
    raise exception 'Permintaan ini sudah dijawab.' using errcode = 'check_violation';
  end if;

  update akses_log
     set status = 'ditolak',
         catatan = coalesce(nullif(btrim(p_catatan), ''), catatan)
   where id = p_akses;
end;
$$;

-- ---------- 5. kedatangan dicatat ----------

/*
  Boleh dicatat kedua pihak, dan itu disengaja.

  Kalau hanya host yang boleh, host yang lupa mencatat membuat kunjungan yang
  benar-benar terjadi hilang dari log — dan log inilah yang jadi bukti kalau
  nanti ada sengketa soal siapa terakhir masuk. Kalau hanya penyewa, sebaliknya.
  Dua-duanya boleh, dan waktunya diambil dari jam server, bukan dari kiriman
  klien.
*/
create or replace function tandai_akses_tiba(p_akses uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a akses_log;
begin
  select * into v_a from akses_log where id = p_akses;
  if not found then
    raise exception 'Permintaan aksesnya tidak ada.' using errcode = 'no_data_found';
  end if;

  if not saya_pihak_pemesanan(v_a.pemesanan_id) then
    raise exception 'Ini bukan pemesananmu.' using errcode = 'insufficient_privilege';
  end if;

  if v_a.status <> 'disetujui' then
    raise exception 'Yang bisa ditandai tiba hanya kunjungan yang sudah disetujui.'
      using errcode = 'check_violation';
  end if;

  update akses_log set status = 'selesai', tiba_pada = now() where id = p_akses;
end;
$$;

-- ---------- 6. tanda tangan serah terima ----------

/*
  Menutup utang nomor 2: `serah_terima` tidak lagi bisa di-UPDATE klien.

  Dua tanda tangan memang ditulis ke satu baris — bentuk datanya belum ideal —
  tapi masalah keamanannya bisa ditutup sekarang tanpa mengubah bentuknya:
  cabut hak UPDATE dari klien, dan sediakan satu fungsi yang hanya bisa
  menyalakan tanda tangan MILIK PEMANGGIL. Dengan begitu host tidak bisa
  menandatangani atas nama penyewa, dan sebaliknya.

  Fungsi pembuat baris serah terimanya sendiri belum ada — itu bagian langkah
  serah terima, yang masih terhalang pembayaran.
*/
create or replace function tandatangani_serah_terima(p_serah uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s  serah_terima;
  v_pm pemesanan;
  v_saya uuid := profil_saya();
begin
  select * into v_s from serah_terima where id = p_serah;
  if not found then
    raise exception 'Berita acaranya tidak ada.' using errcode = 'no_data_found';
  end if;

  select * into v_pm from pemesanan where id = v_s.pemesanan_id;

  if v_pm.penyewa_id = v_saya then
    update serah_terima set ttd_penyewa = true where id = p_serah;
  elsif saya_host_ruang(v_pm.ruang_id) then
    update serah_terima set ttd_host = true where id = p_serah;
  else
    raise exception 'Kamu bukan pihak di pemesanan ini.'
      using errcode = 'insufficient_privilege';
  end if;
end;
$$;

-- ---------- 7. tabel bukti jadi benar-benar append-only ----------

/*
  Sebelum ini, klien masih punya hak tulis langsung ke beberapa tabel bukti
  meski semua penulisan sahnya sudah lewat fungsi SECURITY DEFINER. Hak yang
  tidak terpakai itu bukan tidak berbahaya:

  * `manifes_item` INSERT — penyewa bisa menambah baris manifes setelah host
    menyetujui, di luar pencocokan kategori.
  * `pemesanan_transisi` INSERT — siapa pun pihaknya bisa mengarang jejak
    status yang tidak pernah terjadi. Justru tabel ini yang jadi bukti.
  * `akses_log` INSERT/UPDATE — melewati kuota kunjungan sepenuhnya.
  * `serah_terima` INSERT/UPDATE — menandatangani atas nama orang lain.

  Semuanya dicabut. Yang tersisa untuk klien cuma SELECT.
*/
revoke insert, update, delete on manifes_item       from authenticated;
revoke insert, update, delete on pemesanan_transisi from authenticated;
revoke insert, update, delete on akses_log          from authenticated;
revoke insert, update, delete on serah_terima       from authenticated;

-- ---------- 8. hak jalankan ----------

do $$
declare f text;
begin
  foreach f in array array[
    'minta_akses(uuid, timestamptz, text)',
    'setujui_akses(uuid)',
    'tolak_akses(uuid, text)',
    'tandai_akses_tiba(uuid)',
    'tandatangani_serah_terima(uuid)'
  ]
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ============================================================
--  Kebijakan pembatalan — diputuskan 4 September 2026
--
--  Ditulis di sini supaya keputusannya ada di tempat yang sama
--  dengan kode yang menegakkannya.
--
--  1. Sebelum host menjawab (`menunggu_konfirmasi`)
--     Penyewa boleh membatalkan bebas. Tidak ada uang berpindah,
--     ruangnya juga belum tertahan. SUDAH BERJALAN.
--
--  2. Sudah diterima, belum dibayar (`menunggu_pembayaran`)
--     Penyewa boleh membatalkan bebas. Ruangnya tertahan, tapi
--     host belum kehilangan uang. SUDAH BERJALAN.
--
--  3. Sudah dibayar, belum serah terima (`menunggu_serah_terima`)
--     Boleh dibatalkan, sewa dikembalikan PENUH dikurangi tidak
--     ada, deposit penuh. Alasannya: barang belum masuk, dan
--     yang hilang dari host cuma waktu — sama seperti nomor 2.
--     BELUM BISA DIJALANKAN: butuh pengembalian dana.
--
--  4. Sewa berjalan (`aktif`, `tunggakan`)
--     TIDAK ADA pembatalan. Yang ada pengakhiran lebih awal, dan
--     itu wajib lewat serah terima keluar — barang harus keluar
--     dulu, dan keluarnya harus tercatat. Sisa bulan yang belum
--     dijalani dikembalikan; bulan yang sedang berjalan tidak.
--     BELUM BISA DIJALANKAN: butuh serah terima + pengembalian.
--
--  Yang penting dari daftar ini: nomor 3 dan 4 sengaja TIDAK
--  ditulis sebagai kode yang berpura-pura jalan. `batalkan_pemesanan`
--  menolak keduanya dengan pesan yang menyebut alasannya.
-- ============================================================
