#!/usr/bin/env python3
"""
Ilustrasi halaman depan: "Cara pakainya", "Yang kamu dapat", "Mau jualan apa?".

Kenapa SVG dan bukan ilustrasi raster seperti kartu sorotan: ukuran tampilnya.
Kartu langkah lebarnya sekitar 210px di laptop dan 165px di telepon, kartu
alasan sekitar 250px, dan petak segmen cuma 96px. Di ukuran itu ilustrasi
berdetail justru tidak terbaca, dan yang bekerja adalah satu bentuk tegas per
kartu. Semuanya 1-2 KB, dan ketiga belasnya muncul di satu halaman sekaligus —
jadi berkas berat di sini dikalikan tiga belas.

Kenapa SATU skrip untuk ketiga kelompok, bukan tiga: yang membuat mereka
terbaca sebagai satu keluarga bukan kemiripan yang diusahakan per berkas,
melainkan satu kerangka — kanvas, radius, warna, dan ketebalan garis datang
dari fungsi yang sama. Tiga skrip berarti tiga salinan paletnya, dan salinan
ketiga akan tertinggal saat warnanya diganti.

Petak segmen sengaja BUJUR SANGKAR dan lebih sederhana daripada dua kelompok
lain: ia tampil 96px, jadi yang muat cuma satu benda utama plus satu aksen.
Bentuk yang bagus di 400px sering jadi bubur di 96px.

Jalankan ulang kalau warnanya berubah:  python3 skrip/buat-ilustrasi.py
"""
from pathlib import Path

# Sama dengan globals.css.
BRAND, BRAND_TUA, BRAND_MUDA = "#a93b20", "#8a2e17", "#fdeee8"
INK, PAPER, PUTIH, GARIS = "#1a1512", "#faf8f6", "#ffffff", "#ece5df"
KRIM, EMAS, PUDAR, PUDAR_MUDA = "#f6ead9", "#d99a2b", "#8a807a", "#e8e2dc"

W, H = 400, 300
AKAR = Path(__file__).resolve().parent.parent / "public"
KELUAR = AKAR / "langkah"


def aman(t: str) -> str:
    """SVG itu XML: `&` yang berdiri sendiri menggagalkan seluruh berkas."""
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def gambar(folder: str, nama: str, judul: str, isi: str,
           latar: str = KRIM, w: int = W, h: int = H) -> None:
    tujuan = AKAR / folder
    tujuan.mkdir(parents=True, exist_ok=True)
    # Seluruh isinya dipotong ke bingkai membulat yang sama.
    #
    # Tanpa ini, bentuk yang menyentuh tepi — jalan di "1-ukuran", tanah di
    # "2-utilitas" — menutup sudut membulatnya dan kartunya berujung siku.
    # Di bagian "Yang kamu dapat", yang latarnya putih, akibatnya lebih buruk
    # lagi: bagian bawah kartu melebur ke halaman dan terbaca sebagai gambar
    # yang gagal dimuat. Ketahuan setelah dilihat di layar, bukan dari
    # membaca kodenya.
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{aman(judul)}">
  <!-- Dihasilkan `skrip/buat-ilustrasi.py`. Jangan disunting langsung. -->
  <defs><clipPath id="bingkai"><rect width="{w}" height="{h}" rx="20"/></clipPath></defs>
  <g clip-path="url(#bingkai)">
    <rect width="{w}" height="{h}" fill="{latar}"/>
    {isi}
  </g>
</svg>
'''
    (tujuan / f"{nama}.svg").write_text(svg)


def kartu(nama: str, judul: str, isi: str, latar: str = KRIM) -> None:
    """Kartu langkah — 400x300."""
    gambar("langkah", nama, judul, isi, latar)


def alasan(nama: str, judul: str, isi: str, latar: str = KRIM) -> None:
    """Kartu "Yang kamu dapat" — kanvas sama dengan langkah."""
    gambar("alasan", nama, judul, isi, latar)


def segmen(nama: str, judul: str, isi: str, latar: str = KRIM) -> None:
    """Petak "Mau jualan apa?" — bujur sangkar 240x240."""
    gambar("segmen", nama, judul, isi, latar, w=240, h=240)

# ── 1. Cari dari titikmu ───────────────────────────────────────────────────
# Jalan bersilang, lingkaran radius, dan tiga pin. Yang paling banyak
# menjelaskan di sini adalah LINGKARANNYA — itu yang berarti "radius".
kartu("1-cari", "Cari dari titikmu", f'''
  <g stroke="{PUTIH}" stroke-width="16" stroke-linecap="round">
    <path d="M-10 118 H410"/><path d="M-10 210 H410"/>
    <path d="M104 -10 V310"/><path d="M280 -10 V310"/>
  </g>
  <circle cx="200" cy="150" r="104" fill="{BRAND}" fill-opacity="0.10"
          stroke="{BRAND}" stroke-width="3" stroke-dasharray="9 7"/>
  <g fill="{BRAND}">
    <path d="M200 96 a26 26 0 0 1 26 26 c0 20-26 48-26 48s-26-28-26-48a26 26 0 0 1 26-26z"/>
    <circle cx="200" cy="122" r="9" fill="{PUTIH}"/>
  </g>
  <g fill="{EMAS}">
    <circle cx="122" cy="196" r="13"/><circle cx="274" cy="104" r="13"/>
  </g>''')

# ── 2. Tanya dulu, gratis ──────────────────────────────────────────────────
kartu("2-tanya", "Tanya dulu, gratis", f'''
  <g>
    <path d="M52 66 h206 a20 20 0 0 1 20 20 v66 a20 20 0 0 1 -20 20 h-150 l-32 26 v-26 h-24
             a20 20 0 0 1 -20 -20 v-66 a20 20 0 0 1 20 -20z" fill="{PUTIH}"/>
    <g fill="{PUDAR_MUDA}">
      <rect x="78" y="96" width="150" height="13" rx="6.5"/>
      <rect x="78" y="122" width="104" height="13" rx="6.5"/>
    </g>
  </g>
  <g>
    <path d="M348 152 h-158 a20 20 0 0 0 -20 20 v58 a20 20 0 0 0 20 20 h124 l34 26 v-26
             a20 20 0 0 0 20 -20 v-58 a20 20 0 0 0 -20 -20z" fill="{BRAND}"/>
    <g fill="{PUTIH}" fill-opacity="0.85">
      <rect x="192" y="180" width="132" height="13" rx="6.5"/>
      <rect x="192" y="206" width="86" height="13" rx="6.5"/>
    </g>
  </g>''')

# ── 3. Ajukan sewa ─────────────────────────────────────────────────────────
kartu("3-ajukan", "Ajukan sewa", f'''
  <rect x="72" y="48" width="256" height="204" rx="20" fill="{PUTIH}"/>
  <rect x="72" y="48" width="256" height="52" rx="20" fill="{BRAND}"/>
  <rect x="72" y="80" width="256" height="20" fill="{BRAND}"/>
  <g fill="{PUTIH}" fill-opacity="0.9">
    <rect x="112" y="34" width="16" height="34" rx="8"/>
    <rect x="272" y="34" width="16" height="34" rx="8"/>
  </g>
  <g fill="{PUDAR_MUDA}">
    <rect x="100" y="124" width="60" height="34" rx="9"/>
    <rect x="170" y="124" width="60" height="34" rx="9"/>
  </g>
  <rect x="240" y="124" width="60" height="34" rx="9" fill="{BRAND}"/>
  <g fill="{PUDAR_MUDA}">
    <rect x="100" y="176" width="200" height="14" rx="7"/>
    <rect x="100" y="204" width="140" height="14" rx="7"/>
  </g>''')

# ── 4. Pemilik terima atau tolak ───────────────────────────────────────────
kartu("4-jawab", "Pemilik terima atau tolak", f'''
  <circle cx="200" cy="150" r="86" fill="{BRAND}"/>
  <path d="M160 152 l30 30 l56 -62" fill="none" stroke="{PUTIH}" stroke-width="20"
        stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="{PUTIH}">
    <circle cx="70" cy="80" r="26"/><circle cx="330" cy="222" r="26"/>
  </g>
  <g stroke="{PUDAR}" stroke-width="7" stroke-linecap="round">
    <path d="M60 80 h20"/><path d="M320 212 l20 20 M340 212 l-20 20"/>
  </g>''')

# ── 5. Bayar, terus jualan ─────────────────────────────────────────────────
# Dulu digambar abu-abu karena langkahnya berjudul "Bayar — belum aktif" dan
# kartunya dirender pudar. Sejak 10 Sep 2026 langkah itu tampil seperti empat
# yang lain, jadi ilustrasinya ikut berwarna — kartu terang dengan ilustrasi
# abu-abu terbaca sebagai gambar yang gagal dimuat.
kartu("5-bayar", "Bayar, terus jualan", f'''
  <rect x="74" y="112" width="252" height="152" rx="18" fill="{BRAND}"/>
  <rect x="74" y="146" width="252" height="28" fill="{BRAND_TUA}"/>
  <g fill="{PUTIH}" fill-opacity="0.9">
    <rect x="100" y="200" width="86" height="16" rx="8"/>
    <rect x="100" y="226" width="56" height="16" rx="8"/>
  </g>
  <circle cx="286" cy="222" r="22" fill="{PUTIH}" fill-opacity="0.35"/>
  <g transform="translate(200 74)">
    <circle r="40" fill="{PUTIH}"/>
    <path d="M-17 2 l12 13 l23 -27" fill="none" stroke="{BRAND}" stroke-width="11"
          stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g fill="{EMAS}">
    <circle cx="322" cy="70" r="13"/><circle cx="76" cy="88" r="9"/>
  </g>''')


# ══════════════════════════════════════════════════════════════════════════
#  "Yang kamu dapat" — empat hal yang datanya benar-benar ada di listing.
#  Tiap gambar menunjuk SATU kolom, bukan menggambarkan perasaan: kalau
#  ilustrasinya menjanjikan sesuatu yang tidak ada rubriknya, ia berbohong
#  sama seperti kalimat yang menjanjikannya.
# ══════════════════════════════════════════════════════════════════════════

# ── Lebar muka jalan: garis ukur di sisi yang menghadap jalan ──────────────
# Aspalnya PUDAR_MUDA, bukan putih. Bagian "Yang kamu dapat" berlatar putih,
# dan pita putih yang menyentuh tepi bawah membuat kartunya terlihat terpotong
# — seolah gambarnya gagal dimuat separuh. Ketahuan di layar.
alasan("1-ukuran", "Lebar muka jalan terukur", f'''
  <rect x="0" y="222" width="{W}" height="78" fill="{PUDAR_MUDA}"/>
  <g stroke="{EMAS}" stroke-width="6" stroke-linecap="round" stroke-dasharray="26 22">
    <path d="M8 262 H392"/>
  </g>
  <rect x="92" y="74" width="216" height="112" rx="12"
        fill="{BRAND}" fill-opacity="0.12" stroke="{BRAND}" stroke-width="4"
        stroke-dasharray="12 9"/>
  <g stroke="{BRAND}" stroke-width="7" stroke-linecap="round">
    <path d="M92 186 V214"/><path d="M308 186 V214"/>
    <path d="M104 200 H296"/>
    <path d="M104 200 l16 -11 M104 200 l16 11"/>
    <path d="M296 200 l-16 -11 M296 200 l-16 11"/>
  </g>
  <g fill="{BRAND}">
    <path d="M200 96 a22 22 0 0 1 22 22 c0 17-22 40-22 40s-22-23-22-40a22 22 0 0 1 22-22z"/>
    <circle cx="200" cy="118" r="8" fill="{PUTIH}"/>
  </g>''')

# ── Listrik, air, atap ─────────────────────────────────────────────────────
# Kanopinya tiga busur, bentuk yang sama dengan lambang aplikasi — di sini ia
# berarti "atap", di lambang ia berarti "warung". Dua-duanya benar.
alasan("2-utilitas", "Listrik, air, dan atap tertulis", f'''
  <rect x="0" y="240" width="{W}" height="60" fill="{PUDAR_MUDA}"/>
  <g fill="{PUDAR_MUDA}">
    <rect x="70" y="118" width="14" height="126" rx="7"/>
    <rect x="316" y="118" width="14" height="126" rx="7"/>
  </g>
  <path d="M54 118 h292 v-16 a1 1 0 0 0 0 0 z" fill="none"/>
  <path d="M54 102 h292 v22 a24 24 0 0 1 -48 0 a24 24 0 0 1 -48 0
           a24 24 0 0 1 -48 0 a24 24 0 0 1 -48 0 a24 24 0 0 1 -48 0
           a24 24 0 0 1 -52 0 z" fill="{BRAND}"/>
  <g>
    <circle cx="152" cy="196" r="38" fill="{PUTIH}"/>
    <path d="M158 172 l-22 30 h16 l-6 24 l24 -32 h-17 z" fill="{EMAS}"/>
  </g>
  <g>
    <circle cx="248" cy="196" r="38" fill="{PUTIH}"/>
    <path d="M248 168 c14 18 22 27 22 38 a22 22 0 0 1 -44 0 c0-11 8-20 22-38z"
          fill="{BRAND}"/>
  </g>''')

# ── Jenis usaha yang diizinkan: dua boleh, satu tidak ──────────────────────
alasan("3-usaha", "Jenis usaha yang diizinkan", f'''
  <rect x="56" y="48" width="288" height="204" rx="18" fill="{PUTIH}"/>
  <g>
    <circle cx="106" cy="100" r="20" fill="{BRAND}"/>
    <path d="M97 100 l7 8 l13 -15" fill="none" stroke="{PUTIH}" stroke-width="6"
          stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="142" y="92" width="152" height="16" rx="8" fill="{PUDAR_MUDA}"/>
  </g>
  <g>
    <circle cx="106" cy="150" r="20" fill="{BRAND}"/>
    <path d="M97 150 l7 8 l13 -15" fill="none" stroke="{PUTIH}" stroke-width="6"
          stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="142" y="142" width="116" height="16" rx="8" fill="{PUDAR_MUDA}"/>
  </g>
  <g>
    <circle cx="106" cy="200" r="20" fill="{PUDAR_MUDA}"/>
    <path d="M99 193 l14 14 M113 193 l-14 14" fill="none" stroke="{PUDAR}"
          stroke-width="6" stroke-linecap="round"/>
    <rect x="142" y="192" width="134" height="16" rx="8" fill="{PUDAR_MUDA}"
          fill-opacity="0.55"/>
  </g>''')

# ── Alamat bertahap: satu baris terbuka, sisanya terkunci ──────────────────
alasan("4-alamat", "Alamat kebuka bertahap", f'''
  <rect x="62" y="62" width="276" height="176" rx="18" fill="{PUTIH}"/>
  <rect x="94" y="98" width="148" height="18" rx="9" fill="{BRAND}"/>
  <g fill="{PUDAR_MUDA}">
    <rect x="94" y="140" width="212" height="18" rx="9"/>
    <rect x="94" y="182" width="140" height="18" rx="9"/>
  </g>
  <g transform="translate(286 176)">
    <path d="M-15 -8 v-11 a15 15 0 0 1 30 0 v11" fill="none" stroke="{EMAS}"
          stroke-width="8" stroke-linecap="round"/>
    <rect x="-24" y="-8" width="48" height="38" rx="9" fill="{EMAS}"/>
    <circle cy="8" r="5" fill="{KRIM}"/>
  </g>''')


# ══════════════════════════════════════════════════════════════════════════
#  "Mau jualan apa?" — 240x240, tampil 96px. Satu benda utama per petak.
# ══════════════════════════════════════════════════════════════════════════

# ── Makanan & minuman: gerobak tenda ───────────────────────────────────────
segmen("makanan", "Makanan dan minuman", f'''
  <path d="M36 92 h168 v18 a18 18 0 0 1 -36 0 a18 18 0 0 1 -36 0
           a18 18 0 0 1 -36 0 a18 18 0 0 1 -36 0 a18 18 0 0 1 -24 0 z"
        fill="{BRAND}"/>
  <rect x="34" y="74" width="172" height="20" rx="8" fill="{BRAND_TUA}"/>
  <rect x="52" y="140" width="136" height="52" rx="10" fill="{PUTIH}"/>
  <rect x="52" y="140" width="136" height="14" rx="7" fill="{PUDAR_MUDA}"/>
  <g fill="{INK}" fill-opacity="0.75">
    <circle cx="78" cy="200" r="14"/><circle cx="162" cy="200" r="14"/>
  </g>
  <path d="M138 100 v34" stroke="{PUDAR_MUDA}" stroke-width="7" stroke-linecap="round"/>
  <g transform="translate(96 120)">
    <path d="M-16 -8 h32 l-5 30 h-22 z" fill="{EMAS}"/>
  </g>''')

# ── Jualan online: kardus bertumpuk ────────────────────────────────────────
segmen("online", "Stok jualan online", f'''
  <rect x="46" y="122" width="88" height="76" rx="10" fill="{EMAS}"/>
  <rect x="82" y="122" width="16" height="76" fill="{BRAND_TUA}" fill-opacity="0.3"/>
  <rect x="118" y="146" width="80" height="52" rx="10" fill="{PUDAR_MUDA}"/>
  <rect x="150" y="146" width="16" height="52" fill="{PUDAR}" fill-opacity="0.35"/>
  <rect x="76" y="46" width="92" height="64" rx="10" fill="{BRAND}"/>
  <rect x="114" y="46" width="16" height="64" fill="{BRAND_TUA}"/>
  <path d="M76 74 h92" stroke="{PUTIH}" stroke-width="6" stroke-opacity="0.55"/>''')

# ── Jasa harian: ember dan cipratan air ────────────────────────────────────
segmen("jasa", "Jasa harian", f'''
  <path d="M64 108 h112 l-14 96 a12 12 0 0 1 -12 10 h-60 a12 12 0 0 1 -12 -10 z"
        fill="{PUTIH}"/>
  <rect x="54" y="94" width="132" height="22" rx="11" fill="{BRAND}"/>
  <path d="M78 116 h84 l-6 42 h-72 z" fill="{BRAND}" fill-opacity="0.16"/>
  <g fill="{EMAS}">
    <path d="M196 52 c9 12 14 18 14 25a14 14 0 0 1 -28 0c0-7 5-13 14-25z"/>
    <path d="M156 34 c6 8 10 12 10 17a10 10 0 0 1 -20 0c0-5 4-9 10-17z"/>
  </g>''')

# ── Pindahan & renovasi: pikap bermuatan ───────────────────────────────────
segmen("pindahan", "Pindahan dan renovasi", f'''
  <rect x="28" y="104" width="106" height="72" rx="10" fill="{PUTIH}"/>
  <path d="M134 128 h40 l32 34 v14 h-72 z" fill="{BRAND}"/>
  <rect x="146" y="136" width="30" height="22" rx="5" fill="{PUTIH}" fill-opacity="0.8"/>
  <rect x="44" y="72" width="46" height="34" rx="6" fill="{EMAS}"/>
  <path d="M67 72 v34" stroke="{BRAND_TUA}" stroke-width="5" stroke-opacity="0.4"/>
  <rect x="16" y="176" width="208" height="12" rx="6" fill="{PUDAR_MUDA}"/>
  <g fill="{INK}" fill-opacity="0.8">
    <circle cx="72" cy="188" r="20"/><circle cx="178" cy="188" r="20"/>
  </g>
  <g fill="{PAPER}">
    <circle cx="72" cy="188" r="7"/><circle cx="178" cy="188" r="7"/>
  </g>''')

import xml.etree.ElementTree as ET
total = 0.0
for folder in ("langkah", "alasan", "segmen"):
    for f in sorted((AKAR / folder).glob("*.svg")):
        ET.parse(f)  # gagal keras kalau XML-nya tidak sah
        kb = f.stat().st_size / 1024
        total += kb
        print(f"{folder}/{f.name:<16} {kb:.1f} KB  ✓ XML sah")
print(f"{'total':<25} {total:.1f} KB")
