import Link from "next/link";
import type { Metadata } from "next";
import { DOMISILI, EMAIL_KONTAK, KETENTUAN_BERLAKU } from "@/lib/situs";

export const metadata: Metadata = {
  title: "Syarat pemakaian · Cari Ruang",
  description:
    "Aturan pemakaian Cari Ruang: aplikasi mempertemukan pemilik lahan dengan pedagang, sewanya disepakati langsung di antara keduanya.",
};

/**
 * Syarat pemakaian.
 *
 * **Ditulis dari cara aplikasinya benar-benar bekerja, bukan dari templat.**
 * Setiap pasal di sini bisa dicocokkan dengan satu keputusan di CLAUDE.md:
 * tidak ada pemesanan lewat aplikasi, tidak ada uang yang lewat, tidak ada
 * moderasi sebelum tayang, dan tidak ada ganti rugi. Templat syarat
 * marketplace yang biasa beredar menjanjikan ketiganya, dan janji yang tidak
 * ada isinya di halaman ini justru jadi bukti yang memberatkan kita sendiri.
 *
 * Nadanya sengaja sama dengan nada aplikasinya. Kalimat hukum yang tidak bisa
 * dibaca pedagang yang jadi sasaran aplikasi ini tidak melindungi siapa pun.
 */
export default function SyaratPemakaian() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Syarat pemakaian
      </h1>
      <p className="mt-3 text-sm text-muted">
        Berlaku sejak {KETENTUAN_BERLAKU}. Dengan memakai Cari Ruang, kamu setuju
        dengan yang tertulis di halaman ini.
      </p>

      <div className="mt-10 space-y-9 text-sm leading-relaxed text-ink">
        <Pasal nomor={1} judul="Cari Ruang itu papan iklan">
          <p>
            Aplikasi ini mempertemukan orang yang punya lahan nganggur dengan orang
            yang butuh tempat jualan. Itu saja.
          </p>
          <p>
            <strong>Cari Ruang bukan pihak dalam perjanjian sewa kalian.</strong>{" "}
            Kami tidak menerima pembayaran, tidak menahan uang jaminan, tidak
            menengahi kalau kalian berselisih, dan tidak memberi ganti rugi dalam
            bentuk apa pun. Sewanya kalian sepakati berdua, di luar aplikasi.
          </p>
          <p>
            Kami juga tidak mendatangi lahan sebelum listingnya tayang, dan tidak
            memeriksa apakah keterangannya benar. Lihat pasal 4.
          </p>
        </Pasal>

        <Pasal nomor={2} judul="Akun">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Umurmu minimal 18 tahun, atau kamu memakainya dengan izin walimu.</li>
            <li>
              Isi nama, email, dan nomor telepon yang benar dan bisa dihubungi.
              Nomormu ditampilkan ke pengguna lain yang sudah punya akun, di
              listing yang kamu pasang.
            </li>
            <li>
              Sandimu tanggung jawabmu. Apa pun yang dilakukan dari akunmu dianggap
              dilakukan olehmu.
            </li>
            <li>Satu orang satu akun. Jangan memakai identitas orang lain.</li>
          </ul>
        </Pasal>

        <Pasal nomor={3} judul="Memasang lahan">
          <p>
            Siapa pun boleh memasang lahan, gratis, tanpa menunggu persetujuan siapa
            pun. Yang kamu nyatakan saat memasangnya:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Kamu memang berhak menyewakan lahan itu, sebagai pemilik atau dengan
              izin pemiliknya.
            </li>
            <li>
              Fotonya foto lahan itu sendiri, diambil olehmu atau kamu berhak
              memakainya.
            </li>
            <li>
              Ukuran, harga, jam, listrik, air, dan jenis usaha yang kamu tulis
              sesuai keadaan sebenarnya.
            </li>
          </ul>
          <p>
            Keterangan yang meleset bukan soal kecil di sini. Orang datang ke
            lahanmu karena membacanya, dan yang rugi ongkosnya dia.
          </p>
        </Pasal>

        <Pasal nomor={4} judul="Kami tidak memeriksa, tapi kami bisa menurunkan">
          <p>
            Tidak ada moderasi sebelum listing tayang. Konsekuensinya jujur: bisa
            saja ada listing yang keterangannya salah, atau dipasang orang yang
            tidak berhak.
          </p>
          <p>
            Kalau kami menerima laporan atau menemukan sendiri listing yang
            melanggar halaman ini, kami bisa menurunkannya atau menutup akunnya,
            tanpa pemberitahuan lebih dulu kalau keadaannya mendesak.
          </p>
        </Pasal>

        <Pasal nomor={5} judul="Yang tidak boleh">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Memasang lahan yang tidak ada, atau yang bukan hakmu menyewakannya.</li>
            <li>
              Memakai nomor telepon dan kontak yang kamu dapat dari sini untuk
              menawarkan barang atau jasa lain.
            </li>
            <li>
              Memakai lahan untuk usaha yang melanggar hukum, atau yang tidak
              diizinkan pemiliknya.
            </li>
            <li>Mengunggah foto, video, atau tulisan milik orang lain tanpa izin.</li>
            <li>
              Mengambil data dari aplikasi ini secara otomatis, atau mencoba
              menembus pembatasan aksesnya.
            </li>
            <li>Mengancam, melecehkan, atau menipu pengguna lain lewat chat.</li>
          </ul>
        </Pasal>

        <Pasal nomor={6} judul="Uang dan pertemuan di lokasi">
          <p>
            Tidak ada satu rupiah pun yang lewat aplikasi ini. Semua pembayaran
            terjadi langsung antara kamu dan pihak satunya.
          </p>
          <p className="rounded-xl bg-brand-soft px-4 py-3 font-medium text-brand-dark">
            Datangi dulu lahannya dan temui orangnya sebelum menyerahkan uang apa
            pun. Kalau ada yang meminta transfer sebelum kamu melihat tempatnya,
            itu tanda yang paling sering muncul pada penipuan.
          </p>
          <p>
            Kalau kalian membuat perjanjian sewa, itu perjanjian antara kalian
            berdua. Cari Ruang tidak menyimpan salinannya dan tidak bisa
            menegakkannya.
          </p>
        </Pasal>

        <Pasal nomor={7} judul="Alamat dan nomor telepon">
          <p>
            Pemilik lahan memilih sendiri apakah alamat lengkapnya tampil di
            listing. Kalau tidak dibuka, yang tampil hanya kelurahan, kecamatan,
            jarak, dan titik peta yang digeser sekitar 200 meter dari titik asli.
          </p>
          <p>
            Nomor telepon pemilik hanya bisa dilihat pengguna yang sudah masuk. Itu
            tidak menghentikan orang yang memang berniat menyalahgunakannya, tapi
            ia membuat seluruh nomor tidak bisa dipanen sekaligus tanpa akun.
          </p>
        </Pasal>

        <Pasal nomor={8} judul="Isi yang kamu unggah">
          <p>
            Foto, video, dan tulisan yang kamu unggah tetap milikmu. Dengan
            mengunggahnya, kamu memberi kami izin menampilkan dan mengubah
            ukurannya sebatas untuk menjalankan aplikasi ini, misalnya membuat
            versi kecil untuk kartu hasil pencarian.
          </p>
          <p>
            Izin itu berakhir kalau kamu menghapus lahannya, kecuali untuk salinan
            yang masih ada di cadangan sistem untuk sementara.
          </p>
        </Pasal>

        <Pasal nomor={9} judul="Chat">
          <p>
            Pesan di aplikasi tidak bisa diubah atau dihapus, oleh kamu maupun oleh
            lawan bicaramu. Itu disengaja: kalau kalian berselisih soal apa yang
            dijanjikan, percakapannya masih ada apa adanya.
          </p>
          <p>
            Kami tidak membaca percakapanmu untuk keperluan lain, tapi kami bisa
            membukanya kalau ada laporan penyalahgunaan atau permintaan resmi dari
            pihak berwenang.
          </p>
        </Pasal>

        <Pasal nomor={10} judul="Aplikasinya masih baru">
          <p>
            Cari Ruang disediakan apa adanya. Kami tidak menjanjikan aplikasinya
            selalu bisa dibuka, selalu bebas galat, atau selalu menampilkan
            keterangan yang mutakhir.
          </p>
          <p>
            Kami bisa mengubah, menambah, atau menghentikan bagian mana pun dari
            aplikasi ini. Kalau perubahannya besar, kami beri tahu lewat aplikasi
            atau email.
          </p>
        </Pasal>

        <Pasal nomor={11} judul="Batas tanggung jawab">
          <p>
            Sejauh diizinkan hukum, Cari Ruang tidak bertanggung jawab atas
            kerugian yang timbul dari sewa yang kalian sepakati, dari keterangan
            listing yang ternyata tidak sesuai, dari perbuatan pengguna lain, atau
            dari uang yang berpindah di luar aplikasi.
          </p>
          <p>
            Ini bukan cara menghindar dari tanggung jawab yang seharusnya ada. Ini
            keterangan apa adanya tentang apa yang bisa dan tidak bisa kami lakukan:
            kami tidak memegang uangnya, tidak hadir saat kalian bertemu, dan tidak
            punya bukti apa pun tentang apa yang terjadi di lokasi.
          </p>
        </Pasal>

        <Pasal nomor={12} judul="Hukum yang berlaku">
          <p>
            Halaman ini tunduk pada hukum Republik Indonesia. Kalau ada perselisihan
            antara kamu dan Cari Ruang, kita selesaikan dengan musyawarah lebih
            dulu.
          </p>
        </Pasal>

        <Pasal nomor={13} judul="Menghubungi kami">
          <p>
            Cari Ruang dijalankan dari {DOMISILI}.{" "}
            {EMAIL_KONTAK ? (
              <>
                Kirim email ke{" "}
                <a href={`mailto:${EMAIL_KONTAK}`} className="font-medium text-brand">
                  {EMAIL_KONTAK}
                </a>
                .
              </>
            ) : (
              <>
                Untuk sekarang jalur yang paling pasti sampai adalah{" "}
                <Link href="/pesan" className="font-medium text-brand">
                  percakapan di dalam aplikasi
                </Link>
                , atau membalas email yang kamu terima saat mendaftar.
              </>
            )}
          </p>
        </Pasal>
      </div>

      <div className="mt-12 border-t border-line pt-6 text-sm">
        <Link href="/privasi" className="font-medium text-brand hover:text-brand-dark">
          Baca juga: Kebijakan privasi
        </Link>
      </div>
    </div>
  );
}

function Pasal({
  nomor,
  judul,
  children,
}: {
  nomor: number;
  judul: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold tracking-tight">
        <span className="angka mr-2 text-muted">{nomor}.</span>
        {judul}
      </h2>
      <div className="mt-2.5 space-y-3">{children}</div>
    </section>
  );
}
