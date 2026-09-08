#!/usr/bin/env python3
"""
Membuat kartu sorotan halaman depan.

Kenapa SVG dan bukan raster: keempat kartu ini seluruhnya bidang warna dan
teks, jadi SVG-nya 3-5 KB sementara JPEG dengan ketajaman setara akan 200 KB
ke atas. Kartu ini muncul di SETIAP kunjungan halaman depan — ia gambar yang
paling sering diunduh di seluruh aplikasi, jadi juga yang paling layak dihemat.

Kenapa dihasilkan skrip: yang membuat temanya seragam bukan kemiripan yang
diusahakan per berkas, melainkan satu kerangka yang dipakai keempatnya.
Ukuran kanvas, margin, skala huruf, dan kaki berlambang datang dari fungsi
yang sama, jadi tidak mungkin ada kartu yang meleset sendiri.

Versi kedua (8 Sep 2026). Yang pertama ditolak karena terlalu datar untuk
halaman utama: kotak putih di atas latar abu, huruf sedang, tanpa kedalaman.
Yang diubah, mengikuti cara marketplace besar menyusun kartu promosinya:

  * 880x660 (4:3), bukan 800x500 — lebih tinggi berarti lebih hadir.
  * Latar BERWARNA PENUH, bukan abu netral. Tiap kartu punya jatah warnanya
    sendiri dari satu palet, jadi digeser terasa berpindah, bukan berulang.
  * Satu angka besar sebagai jangkar mata di tiap kartu.
  * Bentuk yang bertumpuk dengan bayangan, bukan sejajar rapi.
  * Teks sesedikit mungkin. Judul, satu baris pendukung, selesai.

Jalankan ulang kalau warna atau kalimatnya berubah:  python3 skrip/buat-promo.py
"""
from pathlib import Path

# Sama dengan globals.css. Kalau di sana berubah, ubah di sini.
BRAND, BRAND_TUA, BRAND_MUDA = "#a93b20", "#8a2e17", "#fdeee8"
INK, PAPER, PUTIH = "#1a1512", "#faf8f6", "#ffffff"
KRIM, EMAS = "#f6ead9", "#d99a2b"
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

L, T = 64, 96          # margin kiri, garis dasar judul pertama
LEBAR, TINGGI = 880, 660
KELUAR = Path(__file__).resolve().parent.parent / "public" / "promo"


def aman(t: str) -> str:
    """
    Loloskan teks untuk XML.

    Bukan kehati-hatian berlebihan: versi pertama menulis "Kelurahan &" apa
    adanya, dan seluruh kartu 4 GAGAL dirender — peramban menjawab
    `xmlParseEntityRef: no name` dan menampilkan kotak galat, bukan gambar.
    SVG itu XML, bukan HTML; ia tidak memaafkan `&` yang berdiri sendiri.
    Ketahuan cuma karena kartunya dibuka satu-satu.
    """
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def lambang(x: float, y: float, u: float, warna: str, teks_warna: str) -> str:
    """Kanopi + garis lahan, sama dengan Lambang.tsx. Diskalakan dari 64px."""
    k = u / 64
    return f'''<g transform="translate({x} {y}) scale({k})">
    <rect width="64" height="64" rx="14.1" fill="{warna}"/>
    <path fill="{teks_warna}" d="M19.8 16 H44.2 L51 30.3
      A6.33 4.85 0 0 1 38.33 30.3 A6.33 4.85 0 0 1 25.67 30.3
      A6.33 4.85 0 0 1 13 30.3 Z"/>
    <rect x="10.9" y="43" width="42.2" height="3.8" fill="{teks_warna}"/>
  </g>'''


def kartu(nama, judul, sub, gambar, latar, warna_judul, warna_sub,
          lambang_kotak, lambang_isi):
    baris = judul if isinstance(judul, list) else [judul]
    tspan = "".join(
        f'<tspan x="{L}" dy="{0 if i == 0 else 62}">{aman(b)}</tspan>'
        for i, b in enumerate(baris)
    )
    y_sub = T + 62 * (len(baris) - 1) + 46

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LEBAR} {TINGGI}" role="img" aria-label="{aman(sub)}">
  <!-- Kartu sorotan Cari Ruang. Dihasilkan `skrip/buat-promo.py` — jangan
       disunting langsung; ubah skripnya lalu jalankan ulang, supaya keempat
       kartu tidak pernah berbeda ukuran atau margin. -->
  <defs>
    <filter id="bayang" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#1a1512" flood-opacity="0.18"/>
    </filter>
  </defs>

  <rect width="{LEBAR}" height="{TINGGI}" rx="32" fill="{latar}"/>

  <g font-family="{FONT}">
    <text x="{L}" y="{T}" font-size="52" font-weight="800" fill="{warna_judul}" letter-spacing="-1.4">{tspan}</text>
    <text x="{L}" y="{y_sub}" font-size="22" fill="{warna_sub}">{aman(sub)}</text>
  </g>

  {gambar}

  <g font-family="{FONT}">
    {lambang(L, TINGGI - 88, 34, lambang_kotak, lambang_isi)}
    <text x="{L + 46}" y="{TINGGI - 64}" font-size="21" font-weight="700" fill="{warna_judul}">Cari Ruang</text>
    <text x="{L + 178}" y="{TINGGI - 64}" font-size="18" fill="{warna_sub}">· lahan nganggur jadi cuan</text>
  </g>
</svg>
'''
    (KELUAR / f"{nama}.svg").write_text(svg)


KELUAR.mkdir(parents=True, exist_ok=True)

# ── 1. Slogan utama, latar terakota ────────────────────────────────────────
kartu(
    "01-jadi-cuan",
    ["Halaman depan nganggur?", "Jadikan cuan."],
    "Disewakan bulanan ke pedagang di sekitarmu.",
    f'''<g>
    <g filter="url(#bayang)">
      <rect x="{L}" y="272" width="330" height="196" rx="22" fill="{PUTIH}" opacity="0.22"/>
      <rect x="{L+16}" y="288" width="330" height="196" rx="22" fill="{PUTIH}"/>
    </g>
    <rect x="{L+52}" y="418" width="258" height="10" rx="5" fill="#e3d9d2"/>
    <text x="{L+181}" y="360" text-anchor="middle" font-family="{FONT}" font-size="20" fill="#8a807a">2 × 3 meter, nganggur</text>

    <g filter="url(#bayang)">
      <rect x="466" y="288" width="350" height="196" rx="22" fill="{INK}"/>
    </g>
    <path fill="{EMAS}" d="M596 328 H686 L699 354
      A11.7 9 0 0 1 674 354 A11.7 9 0 0 1 649 354 A11.7 9 0 0 1 624 354 A11.7 9 0 0 1 599 354 Z"/>
    <rect x="524" y="384" width="234" height="9" rx="4.5" fill="{EMAS}"/>
    <text x="641" y="446" text-anchor="middle" font-family="{FONT}" font-size="34"
          font-weight="800" fill="{PUTIH}">Rp 600rb<tspan font-size="20" font-weight="600" fill="#bdb3ac">/bln</tspan></text>
  </g>''',
    BRAND, PUTIH, "#f0cdc2", PUTIH, BRAND,
)

# ── 2. Sewa vs beli, latar gelap ───────────────────────────────────────────
kartu(
    "02-tanpa-beli-tanah",
    ["Sewa, bukan beli."],
    "Berhenti kapan saja. Nggak ada kontrak setahun.",
    f'''<g font-family="{FONT}">
    <text x="{L}" y="252" font-size="21" fill="#8a807a">punya lahan sendiri</text>
    <text x="{L}" y="302" font-size="40" font-weight="800" fill="#6b625c">ratusan juta</text>
    <line x1="{L-4}" y1="288" x2="{L+196}" y2="288" stroke="#6b625c" stroke-width="4"/>

    <g filter="url(#bayang)">
      <rect x="{L}" y="352" width="520" height="156" rx="22" fill="{BRAND}"/>
    </g>
    <text x="{L+36}" y="400" font-size="21" fill="#f0cdc2">sewa 2 × 3 meter di depan rumah orang</text>
    <text x="{L+36}" y="464" font-size="46" font-weight="800" fill="{PUTIH}">ratusan ribu<tspan font-size="22" font-weight="600" fill="#f0cdc2">/bln</tspan></text>
  </g>''',
    INK, PUTIH, "#8a807a", BRAND, PUTIH,
)

# ── 3. Rubrik, latar krim ──────────────────────────────────────────────────
def baris(y, teks, jenis):
    warna = {"ya": "#067647", "warn": "#b54708"}[jenis]
    latar = {"ya": "#dcf5e6", "warn": "#fbe6cd"}[jenis]
    tanda = "M-6 0 l5 5 l9 -10" if jenis == "ya" else "M0 -7 v8 M0 5 v1.5"
    return f'''<g>
      <rect x="{L}" y="{y}" width="752" height="60" rx="16" fill="{PUTIH}"/>
      <circle cx="{L+34}" cy="{y+30}" r="16" fill="{latar}"/>
      <path transform="translate({L+34} {y+30})" d="{tanda}" stroke="{warna}" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="{L+68}" y="{y+38}" font-family="{FONT}" font-size="22" fill="{INK}">{aman(teks)}</text>
    </g>'''

kartu(
    "03-apa-adanya",
    ["Tahu kondisinya", "sebelum berangkat."],
    "16 hal wajib diisi pemilik — termasuk yang jelek.",
    "<g>" + baris(288, "Muka jalan 3 m · muat gerobak", "ya")
          + baris(360, "Jendela akses Senin–Sabtu, 06.00–21.00", "ya")
          + baris(432, "Pernah banjir dalam 5 tahun terakhir", "warn") + "</g>",
    KRIM, INK, "#6b625c", BRAND, PUTIH,
)

# ── 4. Alamat bertahap, latar terakota tua ─────────────────────────────────
def tahap(x, no, kepala, isi, aktif):
    latar = PUTIH if aktif else "#a35a45"
    tulis = INK if aktif else "#f0cdc2"
    bulat = BRAND if aktif else "#c98a76"
    return f'''<g{' filter="url(#bayang)"' if aktif else ''}>
      <rect x="{x}" y="290" width="240" height="190" rx="22" fill="{latar}"/>
      <circle cx="{x+34}" cy="330" r="17" fill="{bulat}"/>
      <text x="{x+34}" y="338" text-anchor="middle" font-family="{FONT}" font-size="19"
            font-weight="800" fill="{PUTIH}">{no}</text>
      <text x="{x+62}" y="338" font-family="{FONT}" font-size="19" font-weight="700" fill="{tulis}">{aman(kepala)}</text>
      <text x="{x+28}" y="392" font-family="{FONT}" font-size="20" fill="{tulis}">{
        "".join(f'<tspan x="{x+28}" dy="{0 if i==0 else 28}">{aman(b)}</tspan>' for i,b in enumerate(isi))
      }</text>
    </g>'''

kartu(
    "04-alamat-bertahap",
    ["Alamatmu nggak", "langsung disebar."],
    "Yang umum lihat cuma kelurahan dan jaraknya.",
    "<g>" + tahap(L, "1", "Semua orang", ["Kelurahan &", "jarak persis"], True)
          + tahap(L + 256, "2", "Setelah deal", ["Alamat lengkap"], False)
          + tahap(L + 512, "3", "Setelah bayar", ["Nomor kontak"], False) + "</g>",
    BRAND_TUA, PUTIH, "#e8bcae", PUTIH, BRAND_TUA,
)

for f in sorted(KELUAR.glob("*.svg")):
    print(f"{f.name:<28} {f.stat().st_size / 1024:.1f} KB")
