-- ============================================================
--  15. Hapus data contoh
--
--  Dijalankan sekali, saat isi sungguhan mulai masuk. Setelah ini `02_seed.sql`
--  tidak boleh dijalankan lagi di database yang sama.
--
--  Yang dihapus HANYA baris dengan id yang tertulis di `02_seed.sql`. Bukan
--  `truncate`, bukan `delete from ruang` — pada saat migrasi ini ditulis,
--  database sasarannya sudah memuat satu ruang sungguhan, dan penghapusan
--  menyeluruh akan ikut membawanya.
--
--  Profil seed yang sudah DIKLAIM akun sungguhan (`user_id is not null`)
--  sengaja ditinggalkan. Petunjuk lama menyarankan mengklaim profil host seed
--  agar bisa mencoba dasbornya; menghapusnya berarti menghapus baris profil
--  milik akun yang sedang dipakai, dan pemiliknya akan mendapati layar
--  "Profilmu belum terbentuk" tanpa tahu sebabnya.
-- ============================================================

do $$
declare
  profil_seed uuid[] := array[
    '16131fdd-c187-467e-8516-8111997d5149',
    '2098ce50-5686-47e7-b298-f1cccc2caf72',
    '28322a78-bb8d-4e5e-a890-bcae10f2a867',
    '40730448-4fb5-4ec1-b3a9-ed91a1f92877',
    '465eee4b-c06a-4faf-b9cd-7d5ffd8dbcc2',
    '46dfd2e8-f9d8-4602-9c8f-32594cdbdc58',
    '519e1735-f91b-4592-be7e-b3e3cdebf207',
    '66919d99-85bd-4a23-9285-b67dc095ebf2',
    '79f97230-8893-4c19-9f7e-81c6d84b93a3',
    'dc41e62e-83af-4847-8b9c-0f955a6c83b0'
  ];
  ruang_seed uuid[] := array[
    '0bffdf72-8b1a-46d4-9474-89ebd5018299',
    '1764734d-3172-4edc-a73f-9588d81281d2',
    '32fc3143-0e5f-4fd9-a3d4-27051fe3a2c0',
    '3a7303b6-4d2a-4a5a-89a3-ac0830495cf2',
    '626ed72a-5d62-48ba-9a4c-f2e4ccea67db',
    '6a75a582-2566-4dc9-9412-99309d61a425',
    '81fb5be3-45e4-49c8-9329-8fbd67eb7a0d',
    '85a33469-2dea-4d9f-8d9c-0b469dba46d9',
    '9474dc15-0045-4d68-b710-9bf89e187359',
    '9f0e8294-cf37-4ce8-96c1-1a51cbcba258',
    'b0419fdc-a6d2-45b6-a1cb-53d6ead36b04',
    'b64d29a2-dab3-4805-90be-da1f34a61176',
    'dfcaf762-e00d-4271-8b3d-f687b0b34bf5',
    'fd39f016-da91-474a-a22a-b19fb8abbc6e'
  ];
  n_pesanan  int;
  n_minta    int;
  n_ruang    int;
  n_profil   int;
  n_ditahan  int;
begin
  -- Urutannya bukan selera. `pemesanan.ruang_id` dan `pemesanan.penyewa_id`
  -- TIDAK cascade, jadi menghapus ruang atau profil lebih dulu akan ditolak
  -- Postgres. Anaknya (manifes_item, pemesanan_transisi, serah_terima,
  -- akses_log, ulasan) semuanya cascade dari pemesanan, jadi cukup induknya.
  delete from pemesanan
   where ruang_id = any(ruang_seed) or penyewa_id = any(profil_seed);
  get diagnostics n_pesanan = row_count;

  delete from permintaan_ruang where penyewa_id = any(profil_seed);
  get diagnostics n_minta = row_count;

  -- ruang_foto, jendela_akses, dan percakapan cascade dari ruang.
  delete from ruang where id = any(ruang_seed);
  get diagnostics n_ruang = row_count;

  select count(*) into n_ditahan
    from profil where id = any(profil_seed) and user_id is not null;

  delete from profil where id = any(profil_seed) and user_id is null;
  get diagnostics n_profil = row_count;

  raise notice 'Seed dihapus: % pemesanan, % permintaan, % ruang, % profil.',
    n_pesanan, n_minta, n_ruang, n_profil;
  if n_ditahan > 0 then
    raise notice 'DITAHAN: % profil seed sudah diklaim akun sungguhan dan tidak dihapus.',
      n_ditahan;
  end if;
end $$;

-- Berkas gambar seed tidak perlu dihapus dari Storage: seluruhnya menunjuk
-- picsum.photos, tidak satu pun pernah ada di bucket `ruang-foto`.

select periksa_permukaan_publik();
