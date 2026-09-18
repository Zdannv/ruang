import Link from "next/link";
import type { Metadata } from "next";
import { DOMISILI, EMAIL_KONTAK, KETENTUAN_BERLAKU } from "@/lib/situs";

export const metadata: Metadata = {
  title: "Kebijakan privasi · Ada Tempat",
  description:
    "Data apa yang disimpan Ada Tempat, kenapa, ke mana perginya, dan bagaimana cara menghapusnya.",
};

/**
 * Kebijakan privasi.
 *
 * **Tiap baris di sini harus bisa ditunjuk ke kode yang benar-benar ada.**
 * Kebijakan privasi yang disalin dari templat menyebut cookie analitik, mitra
 * periklanan, dan pelacakan lintas situs yang tidak satu pun ada di aplikasi
 * ini, dan itu membuat seluruh halamannya tidak bisa dipercaya justru pada
 * bagian yang penting.
 *
 * Kalau nanti ada yang menambahkan analitik, pelacak, atau layanan pihak
 * ketiga baru, halaman ini ikut diubah di commit yang sama. Kalau tidak, ia
 * berubah dari keterangan jadi kebohongan tanpa ada yang menyadarinya.
 */
export default function KebijakanPrivasi() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Kebijakan privasi
      </h1>
      <p className="mt-3 text-sm text-muted">
        Berlaku sejak {KETENTUAN_BERLAKU}. Ditulis dari cara aplikasinya benar-benar
        bekerja, bukan dari contoh yang beredar.
      </p>

      <div className="mt-8 rounded-2xl bg-card p-5 ring-1 ring-line">
        <p className="text-sm font-semibold">Ringkasnya</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>
            Tidak ada Google Analytics, tidak ada pelacak iklan, tidak ada pihak
            ketiga yang mengikuti kamu dari situs lain ke sini.
          </li>
          <li>Satu-satunya cookie yang kami pasang adalah cookie sesi masuk.</li>
          <li>Kami tidak menyimpan foto KTP dan tidak menyimpan data kartu apa pun.</li>
          <li>
            Data GPS yang menempel di foto HP dibuang di perambanmu, sebelum
            fotonya terkirim.
          </li>
        </ul>
      </div>

      <div className="mt-10 space-y-9 text-sm leading-relaxed text-ink">
        <Bagian judul="Data yang kami simpan">
          <Tabel
            baris={[
              [
                "Akun",
                "Nama, email, nomor telepon, dan wilayah (kelurahan sampai kota). Opsional: nama usaha dan NPWP.",
              ],
              [
                "Lahan yang kamu pasang",
                "Judul, alamat, patokan, titik peta, ukuran, harga, rubrik kondisi, foto, dan video.",
              ],
              [
                "Percakapan",
                "Isi pesan antara kamu dan lawan bicaramu. Tidak bisa diubah atau dihapus, karena ia bukti kalau kalian berselisih.",
              ],
              [
                "Permintaan lahan",
                "Kriteria yang kamu titipkan di halaman permintaan, beserta kecamatannya.",
              ],
              [
                "Statistik listing",
                "Jumlah per hari per lahan: berapa kali dibuka, berapa kali nomornya dilihat, berapa chat dimulai. Tanpa penanda siapa pun.",
              ],
              [
                "Pemberitahuan",
                "Kalau kamu menyalakan notifikasi, alamat langganan push dari perambanmu.",
              ],
            ]}
          />
          <p>
            Sandimu tidak kami simpan. Ia dikelola Supabase Auth dalam bentuk yang
            tidak bisa dibaca kembali, termasuk oleh kami.
          </p>
        </Bagian>

        <Bagian judul="Lokasi">
          <p>
            Lokasi perangkatmu hanya diambil <strong>kalau kamu menekan tombol
            &ldquo;Lokasiku&rdquo;</strong>. Kami tidak pernah memintanya sendiri saat
            halaman terbuka.
          </p>
          <p>
            Titik yang terakhir kamu pakai disimpan di perambanmu sendiri, bukan di
            server kami, supaya pencarian berikutnya tidak mulai dari tempat yang
            salah. Ke server, titik itu cuma dikirim sebagai angka pencarian, dan
            tidak disimpan.
          </p>
          <p>
            Nama wilayah yang kamu isi saat mendaftar dikirim sekali ke Nominatim
            (OpenStreetMap) untuk diubah jadi koordinat, lalu hasilnya disimpan di
            profilmu.{" "}
            <strong>
              Koordinat asli lahan tidak pernah dikirim ke layanan mana pun di luar
              sini.
            </strong>
          </p>
        </Bagian>

        <Bagian judul="Yang bisa dilihat orang lain">
          <p>
            Listing yang kamu pasang bersifat publik dan bisa dibuka siapa saja,
            termasuk yang belum punya akun, dan bisa muncul di mesin pencari.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Alamat lengkap dan titik peta asli</strong> tampil hanya kalau
              kamu membukanya sendiri dari formulir lahan. Kalau tidak, yang tampil
              kelurahan, kecamatan, jarak, dan pin yang digeser sekitar 200 meter.
            </li>
            <li>
              <strong>Nomor teleponmu</strong> tampil di listingmu, tapi hanya ke
              pengguna yang sudah masuk.
            </li>
            <li>
              <strong>Namamu</strong> tampil sebagai pemilik lahan atau sebagai lawan
              chat.
            </li>
          </ul>
          <p>
            Email dan NPWP tidak pernah tampil ke pengguna lain, dalam keadaan apa
            pun.
          </p>
        </Bagian>

        <Bagian judul="Foto dan video">
          <p>
            Foto dari HP hampir selalu membawa data GPS di dalam berkasnya. Data itu{" "}
            <strong>dibuang di perambanmu sebelum berkasnya terkirim</strong>, jadi
            yang sampai ke penyimpanan kami sudah bersih. Ini penting: tanpa itu,
            seluruh aturan penyamaran alamat tidak ada gunanya.
          </p>
          <p>
            Foto dan video listing disimpan di penyimpanan yang bisa diakses lewat
            tautannya. Jangan mengunggah gambar yang memuat wajah orang, pelat
            nomor, atau dokumen.
          </p>
        </Bagian>

        <Bagian judul="Ke mana data ini pergi">
          <Tabel
            baris={[
              [
                "Supabase",
                "Database, penyimpanan berkas, dan autentikasi. Server di Singapura.",
              ],
              ["Vercel", "Menjalankan aplikasinya. Fungsi servernya di Singapura."],
              [
                "OpenStreetMap",
                "Peta di halaman lahan dimuat dari server mereka, jadi mereka menerima titik peta publik lahan itu dan alamat IP pengunjung.",
              ],
              [
                "Nominatim",
                "Mengubah nama wilayah profilmu jadi koordinat, sekali saja.",
              ],
              [
                "wilayah.id",
                "Daftar provinsi sampai kelurahan untuk isian wilayah. Tidak menerima data pribadi.",
              ],
              [
                "Layanan push peramban",
                "Google atau Mozilla, tergantung perambanmu, kalau notifikasi kamu nyalakan.",
              ],
            ]}
          />
          <p>
            Kami tidak menjual data ke siapa pun, dan tidak mengirimkannya ke
            pengiklan.
          </p>
        </Bagian>

        <Bagian judul="Cookie">
          <p>
            Cuma satu jenis: cookie sesi yang membuat kamu tetap masuk. Tidak ada
            cookie analitik dan tidak ada cookie iklan, jadi tidak ada pula banner
            persetujuan cookie di aplikasi ini.
          </p>
          <p>
            Selain itu aplikasi menyimpan beberapa hal kecil di perambanmu sendiri,
            misalnya titik pencarian terakhir. Itu tidak pernah terkirim ke kami dan
            hilang kalau kamu membersihkan data situs.
          </p>
        </Bagian>

        <Bagian judul="Berapa lama disimpan">
          <p>
            Data akun dan listing disimpan selama akunmu ada. Listing yang kamu hapus
            hilang dari aplikasi seketika; salinannya bisa masih ada di cadangan
            sistem sampai beberapa minggu.
          </p>
          <p>
            Isi percakapan tetap tersimpan meskipun lahannya sudah dihapus, karena ia
            juga milik lawan bicaramu.
          </p>
        </Bagian>

        <Bagian judul="Hakmu">
          <p>
            Kamu berhak melihat, membetulkan, dan menghapus data pribadimu, serta
            menarik persetujuan yang pernah kamu berikan.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Membetulkan:</strong> nama, nomor, dan wilayah bisa kamu ubah
              sendiri kapan saja di{" "}
              <Link href="/profil" className="font-medium text-brand">
                halaman profil
              </Link>
              .
            </li>
            <li>
              <strong>Menghapus lahan:</strong> dari dasbor pemilik.
            </li>
            <li>
              <strong>Menghapus akun:</strong> belum ada tombolnya di aplikasi.
              Hubungi kami dan kami hapus manual. Kami sedang mengerjakan tombolnya.
            </li>
          </ul>
        </Bagian>

        <Bagian judul="Keamanan">
          <p>
            Siapa yang boleh membaca apa ditegakkan di database, bukan cuma
            disembunyikan di tampilan. Yang belum masuk tidak bisa membaca satu pun
            tabel secara langsung, dan alamat lengkap serta nomor telepon tidak ikut
            di data publik.
          </p>
          <p>
            Tidak ada sistem yang aman seluruhnya. Kalau terjadi kebocoran yang
            berisiko merugikanmu, kami beri tahu.
          </p>
        </Bagian>

        <Bagian judul="Anak">
          <p>
            Aplikasi ini untuk yang berumur 18 tahun ke atas. Kami tidak sengaja
            mengumpulkan data anak. Kalau ada yang masuk, beri tahu kami dan akan
            kami hapus.
          </p>
        </Bagian>

        <Bagian judul="Perubahan halaman ini">
          <p>
            Kalau isinya berubah, tanggal di atas ikut berubah. Perubahan yang berarti
            kami beri tahu lewat aplikasi atau email.
          </p>
        </Bagian>

        <Bagian judul="Menghubungi kami">
          <p>
            Ada Tempat dijalankan dari {DOMISILI}.{" "}
            {EMAIL_KONTAK ? (
              <>
                Untuk pertanyaan soal data pribadimu, kirim email ke{" "}
                <a href={`mailto:${EMAIL_KONTAK}`} className="font-medium text-brand">
                  {EMAIL_KONTAK}
                </a>
                .
              </>
            ) : (
              <>
                Untuk pertanyaan soal data pribadimu, jalur yang paling pasti sampai
                sekarang adalah{" "}
                <Link href="/pesan" className="font-medium text-brand">
                  percakapan di dalam aplikasi
                </Link>
                , atau membalas email yang kamu terima saat mendaftar.
              </>
            )}
          </p>
        </Bagian>
      </div>

      <div className="mt-12 border-t border-line pt-6 text-sm">
        <Link href="/syarat" className="font-medium text-brand hover:text-brand-dark">
          Baca juga: Syarat pemakaian
        </Link>
      </div>
    </div>
  );
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold tracking-tight">{judul}</h2>
      <div className="mt-2.5 space-y-3">{children}</div>
    </section>
  );
}

/**
 * Dua kolom, dan di telepon ia menumpuk jadi satu.
 *
 * Tabel HTML sungguhan akan menggulir mendatar di 375px, dan tabel yang harus
 * digeser untuk dibaca di halaman yang tugasnya menjelaskan justru
 * menyembunyikan isinya.
 */
function Tabel({ baris }: { baris: [string, string][] }) {
  return (
    <dl className="divide-y divide-line rounded-xl ring-1 ring-line">
      {baris.map(([kiri, kanan]) => (
        <div key={kiri} className="px-4 py-3 sm:flex sm:gap-4">
          <dt className="shrink-0 font-semibold sm:w-44">{kiri}</dt>
          <dd className="mt-1 text-muted sm:mt-0">{kanan}</dd>
        </div>
      ))}
    </dl>
  );
}
