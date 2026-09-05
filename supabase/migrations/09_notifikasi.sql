-- ============================================================
--  Ruang — notifikasi in-app
--
--  Jalankan setelah 08_jendela.sql. Aman dijalankan ulang.
--
--  Sampai sekarang host baru tahu ada permintaan masuk kalau ia
--  membuka /pemesanan sendiri. Untuk marketplace dua sisi itu
--  cacat mendasar: permintaan yang tidak dilihat sama saja dengan
--  permintaan yang ditolak, cuma lebih lambat.
--
--  WhatsApp dan email menunggu pihak luar. In-app tidak menunggu
--  siapa-siapa, jadi itu yang dibangun.
-- ============================================================

-- ---------- 1. tabel ----------

create table if not exists notifikasi (
  id           uuid primary key default gen_random_uuid(),
  profil_id    uuid not null references profil(id) on delete cascade,
  jenis        text not null check (jenis in ('pemesanan','akses')),
  judul        text not null,
  isi          text,
  tautan       text,
  pemesanan_id uuid references pemesanan(id) on delete cascade,
  dibaca_pada  timestamptz,
  dibuat_pada  timestamptz not null default now()
);

-- Kueri yang paling sering: "punyaku, yang belum dibaca, terbaru dulu".
create index if not exists notifikasi_penerima_idx
  on notifikasi (profil_id, dibuat_pada desc);
create index if not exists notifikasi_belum_dibaca_idx
  on notifikasi (profil_id) where dibaca_pada is null;

alter table notifikasi enable row level security;

-- Supabase memberi `all on tables to anon` lewat default privileges, jadi tabel
-- baru WAJIB dicabut dulu. Ini yang ditangkap `periksa_permukaan_publik()` saat
-- `jendela_akses` dibuat — jangan sampai terulang.
revoke all on notifikasi from anon, authenticated;

-- Pemilik boleh membaca dan menandai sudah dibaca. Tidak ada INSERT: seluruh
-- notifikasi ditulis trigger, bukan klien. Kalau klien boleh menyisipkan,
-- siapa pun bisa mengirim "Host menerima permintaanmu" palsu ke orang lain.
grant select, update on notifikasi to authenticated;

drop policy if exists notifikasi_milik_sendiri on notifikasi;
create policy notifikasi_milik_sendiri on notifikasi
  for select to authenticated
  using (profil_id = (select profil_saya()));

drop policy if exists notifikasi_tandai_dibaca on notifikasi;
create policy notifikasi_tandai_dibaca on notifikasi
  for update to authenticated
  using (profil_id = (select profil_saya()))
  with check (profil_id = (select profil_saya()));

-- ---------- 2. penulisan ----------

create or replace function _kirim_notifikasi(
  p_profil    uuid,
  p_jenis     text,
  p_judul     text,
  p_isi       text,
  p_tautan    text,
  p_pemesanan uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Penerima yang tidak ada (mis. profil sudah dihapus) dilewati diam-diam:
  -- kegagalan mengirim notifikasi tidak boleh menggagalkan transaksi yang
  -- sedang berjalan. Yang penting pemesanannya tersimpan, bukan loncengnya.
  if p_profil is null then
    return;
  end if;

  insert into notifikasi (profil_id, jenis, judul, isi, tautan, pemesanan_id)
  values (p_profil, p_jenis, p_judul, p_isi, p_tautan, p_pemesanan);
end;
$$;

revoke all on function _kirim_notifikasi(uuid, text, text, text, text, uuid)
  from public, anon, authenticated;

-- ---------- 3. notifikasi dari perpindahan status pemesanan ----------

/*
  Dipasang di `pemesanan_transisi`, BUKAN di dalam masing-masing fungsi
  transisi.

  Alasannya bukan kerapian: setiap perpindahan status wajib lewat
  `_pindah_status`, yang selalu menulis satu baris ke sini. Jadi trigger di
  tabel ini otomatis mencakup transisi yang ADA SEKARANG maupun yang ditambahkan
  nanti — termasuk pembayaran dan serah terima, saat keduanya akhirnya ada.
  Kalau ditaruh di tiap fungsi, yang menambah fungsi baru harus ingat
  menambahkan notifikasinya juga, dan cepat atau lambat ada yang lupa.

  Penerimanya selalu pihak yang TIDAK melakukan perpindahan itu. Memberi tahu
  orang tentang tindakannya sendiri cuma kebisingan.
*/
create or replace function _notifikasi_transisi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pm       pemesanan;
  v_host     uuid;
  v_judul    text;
  v_ruang    text;
  v_penerima uuid;
  v_pesan    text;
begin
  select * into v_pm from pemesanan where id = new.pemesanan_id;
  if not found then
    return null;
  end if;

  select r.host_id, r.judul into v_host, v_ruang from ruang r where r.id = v_pm.ruang_id;

  -- Pihak lawan dari yang melakukan perpindahan.
  v_penerima := case
    when new.oleh is null then v_host
    when new.oleh = v_pm.penyewa_id then v_host
    else v_pm.penyewa_id
  end;

  v_pesan := case new.ke
    when 'menunggu_konfirmasi'  then 'Ada permintaan sewa baru untuk ' || v_ruang
    when 'menunggu_pembayaran'  then 'Permintaanmu untuk ' || v_ruang || ' diterima host'
    when 'dibatalkan'           then 'Pemesanan ' || v_ruang || ' dibatalkan'
    when 'menunggu_serah_terima' then 'Pembayaran diterima untuk ' || v_ruang
    when 'aktif'                then 'Sewa ' || v_ruang || ' resmi berjalan'
    when 'selesai'              then 'Sewa ' || v_ruang || ' selesai'
    when 'tunggakan'            then 'Pembayaran ' || v_ruang || ' tertunggak'
    when 'sengketa'             then 'Ada sengketa pada pemesanan ' || v_ruang
    else 'Status pemesanan ' || v_ruang || ' berubah'
  end;

  perform _kirim_notifikasi(
    v_penerima, 'pemesanan', v_pesan, new.catatan,
    '/pemesanan/' || new.pemesanan_id, new.pemesanan_id
  );

  return null;
end;
$$;

drop trigger if exists transisi_kirim_notifikasi on pemesanan_transisi;
create trigger transisi_kirim_notifikasi
  after insert on pemesanan_transisi
  for each row execute function _notifikasi_transisi();

-- ---------- 4. notifikasi dari kunjungan ----------

create or replace function _notifikasi_akses()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pm    pemesanan;
  v_host  uuid;
  v_ruang text;
  v_kapan text;
begin
  select * into v_pm from pemesanan where id = new.pemesanan_id;
  if not found then
    return null;
  end if;

  select r.host_id, r.judul into v_host, v_ruang from ruang r where r.id = v_pm.ruang_id;

  -- Jam ditulis waktu Jakarta, sama seperti di seluruh UI.
  v_kapan := to_char(new.diminta_untuk at time zone 'Asia/Jakarta', 'DD Mon YYYY HH24.MI');

  if tg_op = 'INSERT' then
    perform _kirim_notifikasi(
      v_host, 'akses',
      'Permintaan kunjungan ' || v_kapan,
      'Untuk ' || v_ruang || (case when new.catatan is not null then ' — ' || new.catatan else '' end),
      '/pemesanan/' || new.pemesanan_id, new.pemesanan_id
    );
    return null;
  end if;

  -- Perubahan status: yang perlu tahu penyewanya, kecuali kedatangan yang
  -- dicatat penyewa sendiri — itu untuk host.
  if new.status is distinct from old.status then
    if new.status = 'disetujui' then
      perform _kirim_notifikasi(v_pm.penyewa_id, 'akses',
        'Kunjungan ' || v_kapan || ' disetujui', 'Di ' || v_ruang,
        '/pemesanan/' || new.pemesanan_id, new.pemesanan_id);
    elsif new.status = 'ditolak' then
      perform _kirim_notifikasi(v_pm.penyewa_id, 'akses',
        'Kunjungan ' || v_kapan || ' ditolak', new.catatan,
        '/pemesanan/' || new.pemesanan_id, new.pemesanan_id);
    elsif new.status = 'selesai' then
      perform _kirim_notifikasi(v_host, 'akses',
        'Kunjungan ' || v_kapan || ' tercatat selesai', 'Di ' || v_ruang,
        '/pemesanan/' || new.pemesanan_id, new.pemesanan_id);
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists akses_kirim_notifikasi on akses_log;
create trigger akses_kirim_notifikasi
  after insert or update on akses_log
  for each row execute function _notifikasi_akses();

-- ---------- 5. penghitung ----------

create or replace function notifikasi_belum_dibaca()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from notifikasi
   where profil_id = profil_saya() and dibaca_pada is null;
$$;

revoke all on function notifikasi_belum_dibaca() from public, anon;
grant execute on function notifikasi_belum_dibaca() to authenticated;

/*
  Menandai semua sudah dibaca lewat fungsi, bukan UPDATE dari klien.

  Klien memang punya hak UPDATE (untuk menandai satu per satu), tapi "tandai
  semua" yang ditulis sebagai `update notifikasi set dibaca_pada = now()` tanpa
  WHERE yang benar akan menyentuh baris orang lain kalau policy-nya suatu saat
  dilonggarkan. Lewat fungsi, cakupannya tertulis sekali di sini.
*/
create or replace function tandai_semua_dibaca()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saya uuid := profil_saya();
  v_baris int;
begin
  if v_saya is null then
    return 0;
  end if;

  update notifikasi set dibaca_pada = now()
   where profil_id = v_saya and dibaca_pada is null;

  get diagnostics v_baris = row_count;
  return v_baris;
end;
$$;

revoke all on function tandai_semua_dibaca() from public, anon;
grant execute on function tandai_semua_dibaca() to authenticated;

select periksa_permukaan_publik();
