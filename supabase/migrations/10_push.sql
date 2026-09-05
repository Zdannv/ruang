-- ============================================================
--  Ruang — langganan web push
--
--  Jalankan setelah 09_notifikasi.sql. Aman dijalankan ulang.
--
--  Notifikasi in-app sudah ada, tapi ia cuma terlihat kalau
--  aplikasinya sedang dibuka. Untuk host, justru sebaliknya yang
--  dibutuhkan: tahu ada permintaan masuk SAAT aplikasinya
--  tertutup.
--
--  Web push tidak butuh vendor mana pun — kunci VAPID dibuat
--  sendiri, dan service worker-nya sudah ada sejak PWA dibangun.
--  Ini jalur notifikasi keluar yang paling murah, jauh sebelum
--  WhatsApp Business API.
-- ============================================================

-- ---------- 1. langganan per perangkat ----------

create table if not exists push_langganan (
  id           uuid primary key default gen_random_uuid(),
  profil_id    uuid not null references profil(id) on delete cascade,
  -- URL layanan push milik peramban. Unik per perangkat per peramban;
  -- satu orang yang memakai HP dan laptop punya dua baris.
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  dibuat_pada  timestamptz not null default now(),
  dipakai_pada timestamptz
);

create index if not exists push_profil_idx on push_langganan (profil_id);

comment on table push_langganan is
  'Kunci enkripsi push per perangkat. BUKAN rahasia server: p256dh dan auth '
  'dibuat peramban penerima dan hanya berguna untuk mengirim ke perangkat itu. '
  'Yang rahasia adalah VAPID private key, dan itu tidak pernah masuk database.';

alter table push_langganan enable row level security;

-- Tabel baru: cabut dulu hak bawaan dari anon (default privileges Supabase
-- memberi `all on tables to anon`).
revoke all on push_langganan from anon, authenticated;
grant select, insert, delete on push_langganan to authenticated;

drop policy if exists push_milik_sendiri on push_langganan;
create policy push_milik_sendiri on push_langganan
  for all to authenticated
  using (profil_id = (select profil_saya()))
  with check (profil_id = (select profil_saya()));

-- ---------- 2. penanda sudah didorong ----------

/*
  Kolom ini yang membuat pengiriman push tidak pernah dobel.

  Pengirimnya berjalan di Route Handler yang dipanggil Database Webhook
  Supabase. Webhook bisa mengulang kirim kalau jawabannya lambat, dan tanpa
  penanda ini satu permintaan sewa bisa berbunyi tiga kali di HP host.
*/
alter table notifikasi add column if not exists didorong_pada timestamptz;

create index if not exists notifikasi_belum_didorong_idx
  on notifikasi (dibuat_pada) where didorong_pada is null;

-- ---------- 3. yang dilihat pengirim ----------

/*
  Dipanggil Route Handler dengan service role, bukan oleh pengguna.

  Sengaja TIDAK diberikan ke `authenticated`: fungsinya mengembalikan endpoint
  push milik orang lain, dan siapa pun yang bisa memanggilnya bisa mengirim
  notifikasi ke perangkat orang itu.
*/
create or replace function notifikasi_untuk_didorong(p_batas int default 20)
returns table (
  notifikasi_id uuid,
  judul         text,
  isi           text,
  tautan        text,
  endpoint      text,
  p256dh        text,
  auth          text
)
language sql
security definer
set search_path = public
as $$
  select n.id, n.judul, n.isi, n.tautan, s.endpoint, s.p256dh, s.auth
  from notifikasi n
  join push_langganan s on s.profil_id = n.profil_id
  where n.didorong_pada is null
    -- Notifikasi lama tidak dikejar: kalau pengirimnya mati semalam, orang
    -- tidak perlu dibangunkan dua puluh dering saat ia hidup lagi.
    and n.dibuat_pada > now() - interval '1 hour'
  order by n.dibuat_pada
  limit p_batas;
$$;

revoke all on function notifikasi_untuk_didorong(int) from public, anon, authenticated;

create or replace function tandai_sudah_didorong(p_ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update notifikasi set didorong_pada = now()
   where id = any (p_ids) and didorong_pada is null;
$$;

revoke all on function tandai_sudah_didorong(uuid[]) from public, anon, authenticated;

/*
  Langganan yang ditolak layanan push (kode 404/410) harus dibuang, kalau tidak
  ia dicoba lagi selamanya. Endpoint-nya cukup untuk mengenali barisnya, dan
  endpoint bukan rahasia siapa pun.
*/
create or replace function buang_langganan_push(p_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from push_langganan where endpoint = p_endpoint;
$$;

revoke all on function buang_langganan_push(text) from public, anon, authenticated;

select periksa_permukaan_publik();
