-- ============================================================
--  22. Statistik listing untuk pemiliknya
--
--  Pertanyaan pertama setiap pemilik lahan setelah memasang listing: "ada
--  yang lihat nggak?". Sampai sekarang tidak ada satu pun jawaban di
--  aplikasi, dan pemilik yang tidak pernah dihubungi siapa pun tidak bisa
--  membedakan "tidak ada yang lihat" dari "banyak yang lihat tapi harganya
--  kemahalan". Dua keadaan itu butuh tindakan yang berbeda.
--
--  **Yang dihitung cuma tiga, dan ketiganya peristiwa yang benar-benar
--  terjadi:** halaman listing dibuka, nomor pemiliknya dilihat, percakapan
--  dimulai. Tidak ada "impresi", tidak ada perkiraan jangkauan, tidak ada
--  angka yang disusun dari rumus. Angka karangan di dasbor sama saja dengan
--  ulasan karangan, hanya saja terlihat lebih teknis.
--
--  **Disimpan sebagai agregat harian, bukan satu baris per kunjungan.** Satu
--  baris per kunjungan berarti tabel yang tumbuh selamanya untuk data yang
--  cuma dibaca sebagai jumlah per hari, dan di paket gratis itu yang habis
--  duluan. Agregat harian: satu baris per lahan per hari, selamanya.
--
--  **Yang TIDAK dihitung, dan ini harus jujur di layar:** kunjungan unik.
--  Tanpa cookie atau sidik peramban, satu orang yang membuka halaman lima
--  kali terhitung lima. Layar menyebutnya "dibuka", bukan "pengunjung".
-- ============================================================

-- ---------- 1. tabel agregat ----------

create table if not exists ruang_statistik (
  ruang_id  uuid    not null references ruang(id) on delete cascade,
  tanggal   date    not null,
  dibuka    int     not null default 0,
  kontak    int     not null default 0,
  chat      int     not null default 0,
  primary key (ruang_id, tanggal)
);

-- Tabel baru LAHIR dengan hak penuh untuk anon, karena Supabase memasang
-- `alter default privileges ... grant all on tables to anon`. Lihat catatan
-- di CLAUDE.md bagian "Bentuk keamanannya sekarang".
revoke all on ruang_statistik from anon, authenticated;

alter table ruang_statistik enable row level security;

-- Tidak ada policy sama sekali, dan itu disengaja: yang menulis fungsi
-- SECURITY DEFINER di bawah, yang membaca juga. Klien tidak pernah menyentuh
-- tabelnya langsung, jadi angkanya tidak bisa dinaikkan sendiri oleh pemilik
-- lahan yang ingin listingnya terlihat ramai.

-- ---------- 2. pencatat ----------

/*
  Dipanggil dari server, bukan dari peramban.

  Kalau ia bisa dipanggil peramban, satu perulangan `fetch` menaikkan
  hitungannya seribu dalam semenit — dan angka yang bisa dikarang pemiliknya
  sendiri lebih buruk daripada tidak ada angka. Jadi hak `execute`-nya cuma
  untuk `anon`/`authenticated` lewat halaman yang dirender server, dan
  fungsinya sengaja tidak mengembalikan apa pun yang berguna untuk disalahgunakan.

  Kunjungan pemiliknya sendiri TIDAK dihitung. Pemilik yang membuka
  listingnya sepuluh kali sehari untuk memeriksa fotonya akan melihat
  angkanya naik sendiri, lalu berhenti memercayainya sama sekali.
*/
create or replace function catat_statistik(p_ruang uuid, p_jenis text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid;
begin
  if p_jenis not in ('dibuka', 'kontak', 'chat') then
    return;
  end if;

  select host_id into v_host from ruang where id = p_ruang and status = 'tayang';
  if v_host is null then
    return;                       -- listing draf atau sudah dihapus
  end if;
  if v_host = profil_saya() then
    return;                       -- pemiliknya sendiri
  end if;

  insert into ruang_statistik (ruang_id, tanggal, dibuka, kontak, chat)
  values (
    p_ruang,
    (now() at time zone 'Asia/Jakarta')::date,
    case when p_jenis = 'dibuka' then 1 else 0 end,
    case when p_jenis = 'kontak' then 1 else 0 end,
    case when p_jenis = 'chat'   then 1 else 0 end
  )
  on conflict (ruang_id, tanggal) do update
     set dibuka = ruang_statistik.dibuka + excluded.dibuka,
         kontak = ruang_statistik.kontak + excluded.kontak,
         chat   = ruang_statistik.chat   + excluded.chat;
end;
$$;

revoke all on function catat_statistik(uuid, text) from public;
grant execute on function catat_statistik(uuid, text) to anon, authenticated;

-- ---------- 3. bacaan untuk pemiliknya ----------

/*
  Satu baris per lahan, dengan jumlah `p_hari` terakhir. Fungsi, bukan view,
  karena ia menjumlahkan rentang yang ditentukan pemanggilnya, dan karena
  pembatasan "cuma lahan milikku" lebih jelas dibaca di satu tempat.

  `left join`: lahan yang belum pernah dibuka siapa pun tetap muncul dengan
  angka nol. Kalau ia hilang dari daftar, pemiliknya akan mengira ada yang
  salah dengan listingnya, padahal jawabannya memang nol.
*/
create or replace function statistik_saya(p_hari int default 30)
returns table (
  ruang_id uuid,
  judul    text,
  status   text,
  dibuka   bigint,
  kontak   bigint,
  chat     bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.judul,
    r.status,
    coalesce(sum(s.dibuka), 0)::bigint,
    coalesce(sum(s.kontak), 0)::bigint,
    coalesce(sum(s.chat),   0)::bigint
  from ruang r
  left join ruang_statistik s
    on s.ruang_id = r.id
   and s.tanggal >= (now() at time zone 'Asia/Jakarta')::date
                    - (greatest(coalesce(p_hari, 30), 1) - 1)
  where r.host_id = profil_saya()
  group by r.id, r.judul, r.status, r.dibuat_pada
  order by coalesce(sum(s.dibuka), 0) desc, r.dibuat_pada desc;
$$;

revoke all on function statistik_saya(int) from public, anon;
grant execute on function statistik_saya(int) to authenticated;

/*
  Deret harian untuk seluruh lahan pemanggilnya, dipakai grafik di dasbor.
  Hari yang tidak ada barisnya TIDAK diisi nol di sini; yang mengisinya
  layar, karena hanya layar yang tahu rentang mana yang sedang digambar.
*/
create or replace function statistik_harian_saya(p_hari int default 30)
returns table (tanggal date, dibuka bigint, kontak bigint, chat bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.tanggal,
    sum(s.dibuka)::bigint,
    sum(s.kontak)::bigint,
    sum(s.chat)::bigint
  from ruang_statistik s
  join ruang r on r.id = s.ruang_id
  where r.host_id = profil_saya()
    and s.tanggal >= (now() at time zone 'Asia/Jakarta')::date
                     - (greatest(coalesce(p_hari, 30), 1) - 1)
  group by s.tanggal
  order by s.tanggal;
$$;

revoke all on function statistik_harian_saya(int) from public, anon;
grant execute on function statistik_harian_saya(int) to authenticated;

-- ---------- 4. kontak ikut tercatat ----------

/*
  `kontak_lahan()` dari migrasi 21 sekarang mencatat sendiri, jadi pemanggilnya
  tidak perlu ingat melakukannya. Pola yang sama dipakai notifikasi: pemicunya
  ditempel di tempat peristiwanya terjadi, bukan dititipkan ke setiap
  pemanggil, supaya jalur baru tidak diam-diam berhenti tercatat.
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
    and r.status = 'tayang';
end;
$$;

revoke all on function kontak_lahan(uuid) from public, anon;
grant execute on function kontak_lahan(uuid) to authenticated;

select periksa_permukaan_publik();

-- ============================================================
--  Yang MASIH belum: kunjungan unik, dan asal pengunjungnya.
--
--  Keduanya butuh penanda per peramban, dan penanda itu punya harga sendiri
--  (persetujuan cookie, dan satu lagi hal yang bisa bocor). Belum sebanding
--  untuk lima belas lahan pertama. Yang ada sekarang sudah menjawab
--  pertanyaan yang benar-benar ditanyakan pemilik lahan: ada yang lihat
--  nggak, dan ada yang lanjut menghubungi nggak.
-- ============================================================
