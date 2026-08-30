-- Ruang — data contoh (Malang). Jalankan setelah 01_schema.sql.

begin;
truncate ulasan, akses_log, serah_terima, manifes_item, pemesanan_transisi, pemesanan, ruang_foto, ruang, permintaan_ruang, profil restart identity cascade;

-- profil
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('28322a78-bb8d-4e5e-a890-bcae10f2a867','Pak Slamet Riyadi','0812-3344-7781','Malang',true,'2026-01-10');
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('79f97230-8893-4c19-9f7e-81c6d84b93a3','Bu Endang Kusuma','0813-5566-2140','Malang',true,'2026-02-11');
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('40730448-4fb5-4ec1-b3a9-ed91a1f92877','Hendra Wijaya','0857-7788-9012','Malang',true,'2026-03-12');
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('16131fdd-c187-467e-8516-8111997d5149','Bu Sri Wahyuni','0821-4455-6677','Malang',true,'2026-04-13');
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('46dfd2e8-f9d8-4602-9c8f-32594cdbdc58','Toko Berkah Jaya','0811-3322-5566','Malang',true,'2026-05-14');
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('66919d99-85bd-4a23-9285-b67dc095ebf2','Rizal Fadhillah','0895-6677-1234','Malang',false,'2026-06-15');
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('465eee4b-c06a-4faf-b9cd-7d5ffd8dbcc2','Nadia Puspita','0852-1122-3344','Malang',true,'2026-02-20');
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('519e1735-f91b-4592-be7e-b3e3cdebf207','Bagas Prakoso','0878-9900-1122','Malang',true,'2026-03-21');
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('dc41e62e-83af-4847-8b9c-0f955a6c83b0','Olshop Rumah Mungil','0813-7788-4455','Malang',true,'2026-04-22');
insert into profil (id,nama,telepon,kota,terverifikasi,bergabung) values ('2098ce50-5686-47e7-b298-f1cccc2caf72','Yoga Ardiansyah','0896-3344-8899','Malang',false,'2026-05-23');

-- ruang
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('32fc3143-0e5f-4fd9-a3d4-27051fe3a2c0','28322a78-bb8d-4e5e-a890-bcae10f2a867','Garasi kering, mobil sudah dijual','garasi','Jl. Ketawanggede No. 141','Seberang warung Bu Tini',
 'Ketawanggede','Lowokwaru','Malang',-7.9526,112.6142,-7.954063,112.615184,
 5.5,3.0,2.6,'mobil_pikap','dasar_rata',200,'lt10m','dinding_atap','kunci_penyewa','eksklusif',
 'kering_ventilasi','tidak_pernah',25,'{"penghuni_24jam","pagar"}','{"lampu","listrik"}','{"perabot","kardus","stok_dagangan","sepeda_motor"}','Sen-Sab 07.00-19.00',6,
 30,450000,200000,'milik_sendiri',false,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('3a7303b6-4d2a-4a5a-89a3-ac0830495cf2','79f97230-8893-4c19-9f7e-81c6d84b93a3','Kamar belakang lantai dasar, dekat UB','kamar','Jl. Sumbersari No. 129','Seberang lapangan voli',
 'Sumbersari','Lowokwaru','Malang',-7.9558,112.6098,-7.956574,112.611562,
 3.0,3.0,3.0,'hanya_motor','dasar_rata',80,'10_30m','dinding_atap','kunci_penyewa','eksklusif',
 'kering_tanpa_ventilasi','tidak_pernah',40,'{"cctv","penghuni_24jam"}','{"rak","lampu"}','{"kardus","perabot","dokumen"}','Setiap hari 08.00-20.00',4,
 30,380000,150000,'milik_sendiri',false,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('1764734d-3172-4edc-a73f-9588d81281d2','46dfd2e8-f9d8-4602-9c8f-32594cdbdc58','Lantai 2 ruko kosong, luas & bisa truk','lantai_ruko','Jl. Dinoyo No. 56','Seberang bengkel motor',
 'Dinoyo','Lowokwaru','Malang',-7.9389,112.6055,-7.937411,112.605445,
 8.0,5.0,3.2,'truk_engkel','lantai_2',240,'lt10m','dinding_atap','kunci_penyewa','eksklusif',
 'kering_ventilasi','tidak_pernah',60,'{"cctv","satpam"}','{"listrik","lampu","troli","palet"}','{"stok_dagangan","perabot","kardus","elektronik","dokumen"}','Sen-Sab 08.00-17.00',8,
 30,1750000,1000000,'milik_sendiri',true,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('6a75a582-2566-4dc9-9412-99309d61a425','16131fdd-c187-467e-8516-8111997d5149','Bawah tangga, murah buat kardus','bawah_tangga','Jl. Merjosari No. 162','Seberang masjid kampung',
 'Merjosari','Lowokwaru','Malang',-7.9421,112.5962,-7.941412,112.596979,
 2.0,1.2,1.8,'jalan_kaki','dasar_rata',70,'10_30m','dinding_atap','kunci_host','dengan_barang_host',
 'cenderung_lembap','tidak_pernah',15,'{"penghuni_24jam"}','{"lampu"}','{"kardus"}','Sen-Jum 09.00-17.00',2,
 30,110000,0,'milik_sendiri',false,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('b64d29a2-dab3-4805-90be-da1f34a61176','46dfd2e8-f9d8-4602-9c8f-32594cdbdc58','Gudang belakang toko, akses truk','gudang','Jl. Tlogomas No. 173','Seberang warung Bu Tini',
 'Tlogomas','Lowokwaru','Malang',-7.9337,112.5989,-7.934985,112.600023,
 6.0,5.0,3.5,'truk_engkel','dasar_rata',220,'lt10m','dinding_atap','kunci_penyewa','eksklusif',
 'kering_ventilasi','lebih_5_tahun',30,'{"cctv","satpam","pagar"}','{"rak","palet","listrik","troli"}','{"stok_dagangan","kardus","ban_perkakas","perabot"}','Sen-Sab 07.00-18.00',12,
 30,1450000,700000,'milik_sendiri',true,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('81fb5be3-45e4-49c8-9329-8fbd67eb7a0d','40730448-4fb5-4ec1-b3a9-ed91a1f92877','Garasi motor, muat 4 unit','garasi','Jl. Jatimulyo No. 55','Seberang bengkel motor',
 'Jatimulyo','Lowokwaru','Malang',-7.9412,112.6141,-7.939815,112.615448,
 4.0,3.0,2.4,'hanya_motor','dasar_rata',150,'lt10m','dinding_atap','kunci_host','eksklusif',
 'kering_ventilasi','tidak_pernah',20,'{"penghuni_24jam","pagar"}','{"lampu"}','{"sepeda_motor","ban_perkakas"}','Setiap hari 06.00-21.00',8,
 30,320000,150000,'milik_sendiri',false,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('dfcaf762-e00d-4271-8b3d-f687b0b34bf5','66919d99-85bd-4a23-9285-b67dc095ebf2','Kamar kos kosong lantai 2','kamar','Jl. Tunggulwulung No. 22','Seberang lapangan voli',
 'Tunggulwulung','Lowokwaru','Malang',-7.9298,112.6112,-7.928489,112.612641,
 3.0,3.5,2.8,'hanya_motor','lantai_2',75,'10_30m','dinding_atap','kunci_penyewa','eksklusif',
 'kering_tanpa_ventilasi','tidak_pernah',350,'{"cctv","penghuni_24jam"}','{"lampu"}','{"kardus","dokumen","perabot"}','Sen-Sab 08.00-18.00',4,
 30,340000,100000,'menyewa',false,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('9474dc15-0045-4d68-b710-9bf89e187359','28322a78-bb8d-4e5e-a890-bcae10f2a867','Mezanin ruko, kering dan aman','mezanin','Jl. Mojolangu No. 163','Seberang bengkel motor',
 'Mojolangu','Lowokwaru','Malang',-7.9351,112.625,-7.936753,112.625031,
 5.0,4.0,2.2,'mobil_pikap','dasar_tangga',90,'lt10m','dinding_atap','kunci_penyewa','eksklusif',
 'kering_ventilasi','tidak_pernah',45,'{"cctv","satpam"}','{"rak","listrik","lampu"}','{"stok_dagangan","elektronik","dokumen","alat_musik"}','Sen-Sab 09.00-17.00',6,
 30,950000,500000,'milik_sendiri',true,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('85a33469-2dea-4d9f-8d9c-0b469dba46d9','46dfd2e8-f9d8-4602-9c8f-32594cdbdc58','Gudang kecil dekat Pasar Blimbing','gudang','Jl. Purwodadi No. 179','Seberang lapangan voli',
 'Purwodadi','Blimbing','Malang',-7.9415,112.6389,-7.943164,112.638085,
 4.0,4.0,3.0,'mobil_pikap','dasar_rata',180,'10_30m','dinding_atap','kunci_penyewa','dengan_penyewa_lain',
 'kering_ventilasi','dalam_5_tahun',10,'{"cctv"}','{"rak","palet","lampu"}','{"stok_dagangan","kardus","ban_perkakas"}','Sen-Sab 07.00-17.00',10,
 30,780000,300000,'milik_sendiri',true,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('fd39f016-da91-474a-a22a-b19fb8abbc6e','16131fdd-c187-467e-8516-8111997d5149','Loteng rumah, khusus barang ringan','loteng','Jl. Tulusrejo No. 149','Seberang bengkel motor',
 'Tulusrejo','Lowokwaru','Malang',-7.944,112.6301,-7.945061,112.630563,
 4.0,3.0,1.7,'jalan_kaki','lantai_2',65,'gt30m','dinding_atap','kunci_host','dengan_barang_host',
 'cenderung_lembap','tidak_pernah',400,'{"penghuni_24jam"}','{"lampu"}','{"kardus","perabot"}','Sab-Min 09.00-16.00',2,
 30,180000,0,'milik_sendiri',false,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('0bffdf72-8b1a-46d4-9474-89ebd5018299','40730448-4fb5-4ec1-b3a9-ed91a1f92877','Kontainer 20 ft di lahan pribadi','kontainer','Jl. Arjowinangun No. 148','Seberang masjid kampung',
 'Arjowinangun','Kedungkandang','Malang',-8.0169,112.6501,-8.017884,112.649128,
 6.0,2.4,2.4,'truk_engkel','dasar_rata',235,'lt10m','dinding_atap','kunci_penyewa','eksklusif',
 'kering_tanpa_ventilasi','tidak_pernah',50,'{"cctv","pagar"}','{"palet"}','{"stok_dagangan","ban_perkakas","perabot","kardus"}','Sen-Sab 08.00-16.00',6,
 30,1200000,600000,'milik_sendiri',true,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('b0419fdc-a6d2-45b6-a1cb-53d6ead36b04','79f97230-8893-4c19-9f7e-81c6d84b93a3','Kamar kosong dekat kampus, rapi','kamar','Jl. Ketawanggede No. 136','Seberang warung Bu Tini',
 'Ketawanggede','Lowokwaru','Malang',-7.9541,112.6165,-7.955178,112.615787,
 3.2,3.0,2.9,'hanya_motor','dasar_rata',80,'lt10m','dinding_atap','kunci_penyewa','eksklusif',
 'kering_ventilasi','tidak_pernah',30,'{"cctv","penghuni_24jam","pagar"}','{"rak","lampu","listrik"}','{"kardus","perabot","elektronik","dokumen","alat_musik"}','Setiap hari 07.00-21.00',6,
 30,520000,250000,'milik_sendiri',false,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('626ed72a-5d62-48ba-9a4c-f2e4ccea67db','66919d99-85bd-4a23-9285-b67dc095ebf2','Garasi luas Sukun, cocok pindahan','garasi','Jl. Bandungrejosari No. 10','Seberang masjid kampung',
 'Bandungrejosari','Sukun','Malang',-7.9805,112.6183,-7.979604,112.61909,
 6.0,3.5,2.7,'mobil_pikap','dasar_rata',210,'lt10m','dinding_atap','kunci_penyewa','eksklusif',
 'kering_ventilasi','lebih_5_tahun',22,'{"penghuni_24jam","pagar"}','{"lampu","listrik"}','{"perabot","kardus","ban_perkakas","sepeda_motor"}','Sen-Min 07.00-19.00',8,
 30,600000,250000,'milik_sendiri',false,'tayang');
insert into ruang (id,host_id,judul,tipe,alamat,patokan,kelurahan,kecamatan,kota,lat,lng,lat_publik,lng_publik,
 panjang_m,lebar_m,tinggi_m,akses_masuk,posisi_lantai,lebar_pintu_cm,jarak_parkir,kondisi_bangunan,penguncian,berbagi,
 kelembapan,riwayat_banjir,tinggi_lantai_cm,pengawasan,fasilitas,kategori_diterima,jendela_akses,kuota_akses_bulanan,
 durasi_min_hari,harga_bulanan,deposit,kepemilikan,terbuka_alamat,status)
values ('9f0e8294-cf37-4ce8-96c1-1a51cbcba258','16131fdd-c187-467e-8516-8111997d5149','Ruang belakang toko Klojen','gudang','Jl. Kasin No. 36','Seberang masjid kampung',
 'Kasin','Klojen','Malang',-7.9857,112.6259,-7.986636,112.62695,
 3.5,3.0,2.8,'hanya_motor','dasar_rata',95,'10_30m','dinding_atap','kunci_host','dengan_barang_host',
 'kering_tanpa_ventilasi','dalam_5_tahun',8,'{"cctv","penghuni_24jam"}','{"rak","lampu"}','{"stok_dagangan","kardus","dokumen"}','Sen-Sab 08.00-17.00',4,
 30,420000,150000,'menyewa',false,'tayang');

-- foto
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('32fc3143-0e5f-4fd9-a3d4-27051fe3a2c0','https://picsum.photos/seed/tr00/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('32fc3143-0e5f-4fd9-a3d4-27051fe3a2c0','https://picsum.photos/seed/tr01/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('32fc3143-0e5f-4fd9-a3d4-27051fe3a2c0','https://picsum.photos/seed/tr02/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('32fc3143-0e5f-4fd9-a3d4-27051fe3a2c0','https://picsum.photos/seed/tr03/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('32fc3143-0e5f-4fd9-a3d4-27051fe3a2c0','https://picsum.photos/seed/tr04/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('32fc3143-0e5f-4fd9-a3d4-27051fe3a2c0','https://picsum.photos/seed/tr05/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('3a7303b6-4d2a-4a5a-89a3-ac0830495cf2','https://picsum.photos/seed/tr10/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('3a7303b6-4d2a-4a5a-89a3-ac0830495cf2','https://picsum.photos/seed/tr11/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('3a7303b6-4d2a-4a5a-89a3-ac0830495cf2','https://picsum.photos/seed/tr12/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('3a7303b6-4d2a-4a5a-89a3-ac0830495cf2','https://picsum.photos/seed/tr13/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('3a7303b6-4d2a-4a5a-89a3-ac0830495cf2','https://picsum.photos/seed/tr14/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('3a7303b6-4d2a-4a5a-89a3-ac0830495cf2','https://picsum.photos/seed/tr15/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('1764734d-3172-4edc-a73f-9588d81281d2','https://picsum.photos/seed/tr20/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('1764734d-3172-4edc-a73f-9588d81281d2','https://picsum.photos/seed/tr21/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('1764734d-3172-4edc-a73f-9588d81281d2','https://picsum.photos/seed/tr22/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('1764734d-3172-4edc-a73f-9588d81281d2','https://picsum.photos/seed/tr23/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('1764734d-3172-4edc-a73f-9588d81281d2','https://picsum.photos/seed/tr24/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('1764734d-3172-4edc-a73f-9588d81281d2','https://picsum.photos/seed/tr25/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('6a75a582-2566-4dc9-9412-99309d61a425','https://picsum.photos/seed/tr30/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('6a75a582-2566-4dc9-9412-99309d61a425','https://picsum.photos/seed/tr31/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('6a75a582-2566-4dc9-9412-99309d61a425','https://picsum.photos/seed/tr32/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('6a75a582-2566-4dc9-9412-99309d61a425','https://picsum.photos/seed/tr33/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('6a75a582-2566-4dc9-9412-99309d61a425','https://picsum.photos/seed/tr34/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('6a75a582-2566-4dc9-9412-99309d61a425','https://picsum.photos/seed/tr35/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b64d29a2-dab3-4805-90be-da1f34a61176','https://picsum.photos/seed/tr40/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b64d29a2-dab3-4805-90be-da1f34a61176','https://picsum.photos/seed/tr41/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b64d29a2-dab3-4805-90be-da1f34a61176','https://picsum.photos/seed/tr42/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b64d29a2-dab3-4805-90be-da1f34a61176','https://picsum.photos/seed/tr43/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b64d29a2-dab3-4805-90be-da1f34a61176','https://picsum.photos/seed/tr44/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b64d29a2-dab3-4805-90be-da1f34a61176','https://picsum.photos/seed/tr45/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('81fb5be3-45e4-49c8-9329-8fbd67eb7a0d','https://picsum.photos/seed/tr50/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('81fb5be3-45e4-49c8-9329-8fbd67eb7a0d','https://picsum.photos/seed/tr51/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('81fb5be3-45e4-49c8-9329-8fbd67eb7a0d','https://picsum.photos/seed/tr52/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('81fb5be3-45e4-49c8-9329-8fbd67eb7a0d','https://picsum.photos/seed/tr53/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('81fb5be3-45e4-49c8-9329-8fbd67eb7a0d','https://picsum.photos/seed/tr54/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('81fb5be3-45e4-49c8-9329-8fbd67eb7a0d','https://picsum.photos/seed/tr55/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('dfcaf762-e00d-4271-8b3d-f687b0b34bf5','https://picsum.photos/seed/tr60/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('dfcaf762-e00d-4271-8b3d-f687b0b34bf5','https://picsum.photos/seed/tr61/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('dfcaf762-e00d-4271-8b3d-f687b0b34bf5','https://picsum.photos/seed/tr62/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('dfcaf762-e00d-4271-8b3d-f687b0b34bf5','https://picsum.photos/seed/tr63/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('dfcaf762-e00d-4271-8b3d-f687b0b34bf5','https://picsum.photos/seed/tr64/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('dfcaf762-e00d-4271-8b3d-f687b0b34bf5','https://picsum.photos/seed/tr65/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9474dc15-0045-4d68-b710-9bf89e187359','https://picsum.photos/seed/tr70/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9474dc15-0045-4d68-b710-9bf89e187359','https://picsum.photos/seed/tr71/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9474dc15-0045-4d68-b710-9bf89e187359','https://picsum.photos/seed/tr72/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9474dc15-0045-4d68-b710-9bf89e187359','https://picsum.photos/seed/tr73/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9474dc15-0045-4d68-b710-9bf89e187359','https://picsum.photos/seed/tr74/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9474dc15-0045-4d68-b710-9bf89e187359','https://picsum.photos/seed/tr75/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('85a33469-2dea-4d9f-8d9c-0b469dba46d9','https://picsum.photos/seed/tr80/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('85a33469-2dea-4d9f-8d9c-0b469dba46d9','https://picsum.photos/seed/tr81/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('85a33469-2dea-4d9f-8d9c-0b469dba46d9','https://picsum.photos/seed/tr82/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('85a33469-2dea-4d9f-8d9c-0b469dba46d9','https://picsum.photos/seed/tr83/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('85a33469-2dea-4d9f-8d9c-0b469dba46d9','https://picsum.photos/seed/tr84/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('85a33469-2dea-4d9f-8d9c-0b469dba46d9','https://picsum.photos/seed/tr85/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('fd39f016-da91-474a-a22a-b19fb8abbc6e','https://picsum.photos/seed/tr90/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('fd39f016-da91-474a-a22a-b19fb8abbc6e','https://picsum.photos/seed/tr91/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('fd39f016-da91-474a-a22a-b19fb8abbc6e','https://picsum.photos/seed/tr92/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('fd39f016-da91-474a-a22a-b19fb8abbc6e','https://picsum.photos/seed/tr93/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('fd39f016-da91-474a-a22a-b19fb8abbc6e','https://picsum.photos/seed/tr94/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('fd39f016-da91-474a-a22a-b19fb8abbc6e','https://picsum.photos/seed/tr95/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('0bffdf72-8b1a-46d4-9474-89ebd5018299','https://picsum.photos/seed/tr100/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('0bffdf72-8b1a-46d4-9474-89ebd5018299','https://picsum.photos/seed/tr101/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('0bffdf72-8b1a-46d4-9474-89ebd5018299','https://picsum.photos/seed/tr102/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('0bffdf72-8b1a-46d4-9474-89ebd5018299','https://picsum.photos/seed/tr103/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('0bffdf72-8b1a-46d4-9474-89ebd5018299','https://picsum.photos/seed/tr104/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('0bffdf72-8b1a-46d4-9474-89ebd5018299','https://picsum.photos/seed/tr105/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b0419fdc-a6d2-45b6-a1cb-53d6ead36b04','https://picsum.photos/seed/tr110/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b0419fdc-a6d2-45b6-a1cb-53d6ead36b04','https://picsum.photos/seed/tr111/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b0419fdc-a6d2-45b6-a1cb-53d6ead36b04','https://picsum.photos/seed/tr112/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b0419fdc-a6d2-45b6-a1cb-53d6ead36b04','https://picsum.photos/seed/tr113/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b0419fdc-a6d2-45b6-a1cb-53d6ead36b04','https://picsum.photos/seed/tr114/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('b0419fdc-a6d2-45b6-a1cb-53d6ead36b04','https://picsum.photos/seed/tr115/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('626ed72a-5d62-48ba-9a4c-f2e4ccea67db','https://picsum.photos/seed/tr120/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('626ed72a-5d62-48ba-9a4c-f2e4ccea67db','https://picsum.photos/seed/tr121/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('626ed72a-5d62-48ba-9a4c-f2e4ccea67db','https://picsum.photos/seed/tr122/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('626ed72a-5d62-48ba-9a4c-f2e4ccea67db','https://picsum.photos/seed/tr123/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('626ed72a-5d62-48ba-9a4c-f2e4ccea67db','https://picsum.photos/seed/tr124/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('626ed72a-5d62-48ba-9a4c-f2e4ccea67db','https://picsum.photos/seed/tr125/900/650',5,'kondisi kunci');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9f0e8294-cf37-4ce8-96c1-1a51cbcba258','https://picsum.photos/seed/tr130/900/650',0,'mulut gang');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9f0e8294-cf37-4ce8-96c1-1a51cbcba258','https://picsum.photos/seed/tr131/900/650',1,'tampak depan');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9f0e8294-cf37-4ce8-96c1-1a51cbcba258','https://picsum.photos/seed/tr132/900/650',2,'jalur akses');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9f0e8294-cf37-4ce8-96c1-1a51cbcba258','https://picsum.photos/seed/tr133/900/650',3,'sudut A');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9f0e8294-cf37-4ce8-96c1-1a51cbcba258','https://picsum.photos/seed/tr134/900/650',4,'sudut B');
insert into ruang_foto (ruang_id,url,urutan,keterangan) values ('9f0e8294-cf37-4ce8-96c1-1a51cbcba258','https://picsum.photos/seed/tr135/900/650',5,'kondisi kunci');

-- pemesanan
insert into pemesanan (id,ruang_id,penyewa_id,mulai,selesai,harga_bulanan,total,status) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f','32fc3143-0e5f-4fd9-a3d4-27051fe3a2c0','465eee4b-c06a-4faf-b9cd-7d5ffd8dbcc2','2026-08-01','2026-11-01',200000,600000,'aktif');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f',null,'menunggu_konfirmasi','465eee4b-c06a-4faf-b9cd-7d5ffd8dbcc2','Pemesanan dibuat');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f','menunggu_konfirmasi','menunggu_pembayaran','28322a78-bb8d-4e5e-a890-bcae10f2a867');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f','menunggu_pembayaran','menunggu_serah_terima','28322a78-bb8d-4e5e-a890-bcae10f2a867');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f','menunggu_serah_terima','aktif','28322a78-bb8d-4e5e-a890-bcae10f2a867','Serah terima masuk selesai');
insert into serah_terima (pemesanan_id,jenis,foto_urls,catatan,ttd_host,ttd_penyewa) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f','masuk','{"https://picsum.photos/seed/st0a/800/600","https://picsum.photos/seed/st0b/800/600"}','Barang sesuai manifes, ruang bersih.',true,true);
insert into pemesanan (id,ruang_id,penyewa_id,mulai,selesai,harga_bulanan,total,status) values ('67646c02-9d76-4bca-98d1-06fa52c8febb','1764734d-3172-4edc-a73f-9588d81281d2','dc41e62e-83af-4847-8b9c-0f955a6c83b0','2026-07-15','2027-01-15',1000000,6000000,'aktif');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('67646c02-9d76-4bca-98d1-06fa52c8febb',null,'menunggu_konfirmasi','dc41e62e-83af-4847-8b9c-0f955a6c83b0','Pemesanan dibuat');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('67646c02-9d76-4bca-98d1-06fa52c8febb','menunggu_konfirmasi','menunggu_pembayaran','46dfd2e8-f9d8-4602-9c8f-32594cdbdc58');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('67646c02-9d76-4bca-98d1-06fa52c8febb','menunggu_pembayaran','menunggu_serah_terima','46dfd2e8-f9d8-4602-9c8f-32594cdbdc58');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('67646c02-9d76-4bca-98d1-06fa52c8febb','menunggu_serah_terima','aktif','46dfd2e8-f9d8-4602-9c8f-32594cdbdc58','Serah terima masuk selesai');
insert into serah_terima (pemesanan_id,jenis,foto_urls,catatan,ttd_host,ttd_penyewa) values ('67646c02-9d76-4bca-98d1-06fa52c8febb','masuk','{"https://picsum.photos/seed/st2a/800/600","https://picsum.photos/seed/st2b/800/600"}','Barang sesuai manifes, ruang bersih.',true,true);
insert into pemesanan (id,ruang_id,penyewa_id,mulai,selesai,harga_bulanan,total,status) values ('77f90d76-4e4e-4ab3-a78e-f6bd4beea226','81fb5be3-45e4-49c8-9329-8fbd67eb7a0d','2098ce50-5686-47e7-b298-f1cccc2caf72','2026-09-02','2026-12-02',150000,450000,'menunggu_serah_terima');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('77f90d76-4e4e-4ab3-a78e-f6bd4beea226',null,'menunggu_konfirmasi','2098ce50-5686-47e7-b298-f1cccc2caf72','Pemesanan dibuat');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('77f90d76-4e4e-4ab3-a78e-f6bd4beea226','menunggu_konfirmasi','menunggu_pembayaran','40730448-4fb5-4ec1-b3a9-ed91a1f92877');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('77f90d76-4e4e-4ab3-a78e-f6bd4beea226','menunggu_pembayaran','menunggu_serah_terima','40730448-4fb5-4ec1-b3a9-ed91a1f92877');
insert into pemesanan (id,ruang_id,penyewa_id,mulai,selesai,harga_bulanan,total,status) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b','b0419fdc-a6d2-45b6-a1cb-53d6ead36b04','519e1735-f91b-4592-be7e-b3e3cdebf207','2026-04-01','2026-07-01',250000,750000,'selesai');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b',null,'menunggu_konfirmasi','519e1735-f91b-4592-be7e-b3e3cdebf207','Pemesanan dibuat');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b','menunggu_konfirmasi','menunggu_pembayaran','79f97230-8893-4c19-9f7e-81c6d84b93a3');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b','menunggu_pembayaran','menunggu_serah_terima','79f97230-8893-4c19-9f7e-81c6d84b93a3');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b','menunggu_serah_terima','aktif','79f97230-8893-4c19-9f7e-81c6d84b93a3','Serah terima masuk selesai');
insert into serah_terima (pemesanan_id,jenis,foto_urls,catatan,ttd_host,ttd_penyewa) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b','masuk','{"https://picsum.photos/seed/st11a/800/600","https://picsum.photos/seed/st11b/800/600"}','Barang sesuai manifes, ruang bersih.',true,true);
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b','aktif','selesai','79f97230-8893-4c19-9f7e-81c6d84b93a3');
insert into serah_terima (pemesanan_id,jenis,foto_urls,catatan,ttd_host,ttd_penyewa) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b','keluar','{"https://picsum.photos/seed/st11c/800/600"}','Seluruh barang keluar, ruang kosong.',true,true);
insert into pemesanan (id,ruang_id,penyewa_id,mulai,selesai,harga_bulanan,total,status) values ('65e051e5-ad61-46e4-b286-673cf9c2b034','b64d29a2-dab3-4805-90be-da1f34a61176','dc41e62e-83af-4847-8b9c-0f955a6c83b0','2026-09-10','2026-12-10',700000,2100000,'menunggu_konfirmasi');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('65e051e5-ad61-46e4-b286-673cf9c2b034',null,'menunggu_konfirmasi','dc41e62e-83af-4847-8b9c-0f955a6c83b0','Pemesanan dibuat');
insert into pemesanan (id,ruang_id,penyewa_id,mulai,selesai,harga_bulanan,total,status) values ('00e6a30d-5123-45d9-aaba-066e116d4f86','85a33469-2dea-4d9f-8d9c-0b469dba46d9','dc41e62e-83af-4847-8b9c-0f955a6c83b0','2026-05-20','2026-11-20',300000,1800000,'tunggakan');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('00e6a30d-5123-45d9-aaba-066e116d4f86',null,'menunggu_konfirmasi','dc41e62e-83af-4847-8b9c-0f955a6c83b0','Pemesanan dibuat');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('00e6a30d-5123-45d9-aaba-066e116d4f86','menunggu_konfirmasi','menunggu_pembayaran','46dfd2e8-f9d8-4602-9c8f-32594cdbdc58');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh) values ('00e6a30d-5123-45d9-aaba-066e116d4f86','menunggu_pembayaran','menunggu_serah_terima','46dfd2e8-f9d8-4602-9c8f-32594cdbdc58');
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('00e6a30d-5123-45d9-aaba-066e116d4f86','menunggu_serah_terima','aktif','46dfd2e8-f9d8-4602-9c8f-32594cdbdc58','Serah terima masuk selesai');
insert into serah_terima (pemesanan_id,jenis,foto_urls,catatan,ttd_host,ttd_penyewa) values ('00e6a30d-5123-45d9-aaba-066e116d4f86','masuk','{"https://picsum.photos/seed/st8a/800/600","https://picsum.photos/seed/st8b/800/600"}','Barang sesuai manifes, ruang bersih.',true,true);
insert into pemesanan_transisi (pemesanan_id,dari,ke,oleh,catatan) values ('00e6a30d-5123-45d9-aaba-066e116d4f86','aktif','tunggakan',null,'Pembayaran periode ke-4 lewat 9 hari');

-- manifes
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f',1,'Kardus buku kuliah','kardus',6,300000,'https://picsum.photos/seed/mfKardus/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f',1,'Sepeda motor Vario 2019','sepeda_motor',1,13500000,'https://picsum.photos/seed/mfSepeda/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f',1,'Kasur busa 160x200','perabot',1,900000,'https://picsum.photos/seed/mfKasur/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f',1,'Koper besar','kardus',2,700000,'https://picsum.photos/seed/mfKoper/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f',1,'Karton stok hijab','stok_dagangan',14,2800000,'https://picsum.photos/seed/mfKarton/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('67646c02-9d76-4bca-98d1-06fa52c8febb',1,'Rak besi bongkar pasang','perabot',2,600000,'https://picsum.photos/seed/mfRakbe/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('67646c02-9d76-4bca-98d1-06fa52c8febb',1,'Kasur busa 160x200','perabot',1,900000,'https://picsum.photos/seed/mfKasur/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('67646c02-9d76-4bca-98d1-06fa52c8febb',1,'Meja belajar lipat','perabot',1,250000,'https://picsum.photos/seed/mfMejab/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('77f90d76-4e4e-4ab3-a78e-f6bd4beea226',1,'Lemari plastik 4 susun','perabot',2,450000,'https://picsum.photos/seed/mfLemari/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('77f90d76-4e4e-4ab3-a78e-f6bd4beea226',1,'Sepeda motor Vario 2019','sepeda_motor',1,13500000,'https://picsum.photos/seed/mfSepeda/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('77f90d76-4e4e-4ab3-a78e-f6bd4beea226',1,'Kipas angin berdiri','elektronik',2,400000,'https://picsum.photos/seed/mfKipas/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b',1,'Meja belajar lipat','perabot',1,250000,'https://picsum.photos/seed/mfMejab/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b',1,'Lemari plastik 4 susun','perabot',2,450000,'https://picsum.photos/seed/mfLemari/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b',1,'Sepeda motor Vario 2019','sepeda_motor',1,13500000,'https://picsum.photos/seed/mfSepeda/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('65e051e5-ad61-46e4-b286-673cf9c2b034',1,'Kasur busa 160x200','perabot',1,900000,'https://picsum.photos/seed/mfKasur/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('65e051e5-ad61-46e4-b286-673cf9c2b034',1,'Lemari plastik 4 susun','perabot',2,450000,'https://picsum.photos/seed/mfLemari/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('65e051e5-ad61-46e4-b286-673cf9c2b034',1,'Meja belajar lipat','perabot',1,250000,'https://picsum.photos/seed/mfMejab/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('00e6a30d-5123-45d9-aaba-066e116d4f86',1,'Galon dan dispenser','perabot',1,350000,'https://picsum.photos/seed/mfGalon/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('00e6a30d-5123-45d9-aaba-066e116d4f86',1,'Sepeda motor Vario 2019','sepeda_motor',1,13500000,'https://picsum.photos/seed/mfSepeda/500/400');
insert into manifes_item (pemesanan_id,versi,nama,kategori,jumlah,taksiran_nilai,foto_url) values ('00e6a30d-5123-45d9-aaba-066e116d4f86',1,'Kasur busa 160x200','perabot',1,900000,'https://picsum.photos/seed/mfKasur/500/400');

-- log akses
insert into akses_log (pemesanan_id,diminta_untuk,status,tiba_pada,catatan) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f',now()-interval '12 days','selesai',now()-interval '12 days','Ambil 2 kardus');
insert into akses_log (pemesanan_id,diminta_untuk,status,tiba_pada,catatan) values ('4bec7e34-2adc-4187-a372-f16eecc3ad1f',now()-interval '26 days','selesai',now()-interval '26 days','Ambil 2 kardus');
insert into akses_log (pemesanan_id,diminta_untuk,status,tiba_pada,catatan) values ('67646c02-9d76-4bca-98d1-06fa52c8febb',now()-interval '12 days','selesai',now()-interval '12 days','Cek kondisi barang');
insert into akses_log (pemesanan_id,diminta_untuk,status,tiba_pada,catatan) values ('67646c02-9d76-4bca-98d1-06fa52c8febb',now()-interval '26 days','selesai',now()-interval '26 days','Ambil 2 kardus');
insert into akses_log (pemesanan_id,diminta_untuk,status,tiba_pada,catatan) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b',now()-interval '12 days','selesai',now()-interval '12 days','Tambah 1 koli');
insert into akses_log (pemesanan_id,diminta_untuk,status,tiba_pada,catatan) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b',now()-interval '26 days','selesai',now()-interval '26 days','Tambah 1 koli');

-- ulasan
insert into ulasan (pemesanan_id,penulis_id,arah,skor,akurasi,komentar) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b','519e1735-f91b-4592-be7e-b3e3cdebf207','untuk_host',5,5,'Ruangnya persis seperti foto, Pak Slamet responsif banget.');
insert into ulasan (pemesanan_id,penulis_id,arah,skor,komentar) values ('6be1fa50-733d-453d-b13e-f0b6ac48183b','79f97230-8893-4c19-9f7e-81c6d84b93a3','untuk_penyewa',5,'Penyewa rapi, barang sesuai daftar, tepat waktu.');

-- permintaan ruang (waitlist)
insert into permintaan_ruang (penyewa_id,kecamatan,kota,volume_m3,harga_maks,mulai,frekuensi_akses) values ('465eee4b-c06a-4faf-b9cd-7d5ffd8dbcc2','Lowokwaru','Malang',8,600000,'2026-09-15','jarang');
insert into permintaan_ruang (penyewa_id,kecamatan,kota,volume_m3,harga_maks,mulai,frekuensi_akses) values ('519e1735-f91b-4592-be7e-b3e3cdebf207','Klojen','Malang',4,400000,'2026-09-15','bulanan');
insert into permintaan_ruang (penyewa_id,kecamatan,kota,volume_m3,harga_maks,mulai,frekuensi_akses) values ('dc41e62e-83af-4847-8b9c-0f955a6c83b0','Blimbing','Malang',20,1500000,'2026-09-15','harian');
insert into permintaan_ruang (penyewa_id,kecamatan,kota,volume_m3,harga_maks,mulai,frekuensi_akses) values ('2098ce50-5686-47e7-b298-f1cccc2caf72','Lowokwaru','Malang',12,900000,'2026-09-15','mingguan');
insert into permintaan_ruang (penyewa_id,kecamatan,kota,volume_m3,harga_maks,mulai,frekuensi_akses) values ('465eee4b-c06a-4faf-b9cd-7d5ffd8dbcc2','Sukun','Malang',6,450000,'2026-09-15','jarang');

commit;