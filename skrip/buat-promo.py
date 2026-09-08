#!/usr/bin/env python3
"""
Membuat kartu promosi untuk sorotan halaman depan.

Kenapa SVG dan bukan gambar raster: keempat kartu ini seluruhnya bidang warna
dan teks, jadi SVG-nya 3 KB sementara JPEG dengan ketajaman setara akan 150 KB
ke atas. Di paket gratis, yang habis duluan bukan penyimpanan melainkan
bandwidth — dan kartu ini muncul di SETIAP kunjungan halaman depan, jadi ia
justru gambar yang paling sering diunduh di seluruh aplikasi.

Kenapa dihasilkan skrip dan tidak ditulis tangan satu-satu: yang membuat
temanya seragam bukan kemiripan yang diusahakan per berkas, melainkan satu
kerangka yang dipakai keempatnya. Margin, ukuran huruf, radius sudut, dan
kaki berlambang datang dari fungsi yang sama, jadi tidak mungkin ada kartu
yang meleset sendiri.

Jalankan ulang kalau warna atau kalimatnya berubah:  python3 skrip/buat-promo.py
"""
from pathlib import Path

INK, BRAND, SOFT, PAPER, MUTED = "#0f172a", "#1f5fff", "#dbe6ff", "#eef2f9", "#64748b"
GOOD, WARN, PUTIH, GARIS = "#15803d", "#b45309", "#ffffff", "#dde3ec"
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

KELUAR = Path(__file__).resolve().parent.parent / "public" / "promo"


def kartu(nama: str, judul, sub: str, gambar: str) -> None:
    """800x500: judul, sub, gambar, lalu kaki berlambang. Sama di keempatnya."""
    baris = judul if isinstance(judul, list) else [judul]
    tspan = "".join(
        f'<tspan x="56" dy="{0 if i == 0 else 58}">{b}</tspan>'
        for i, b in enumerate(baris)
    )
    # Sub mengikuti tinggi judulnya. Versi pertama memakai satu nilai tetap,
    # dan kartu berjudul satu baris jadi punya lubang 60px di tengahnya.
    y_sub = 88 + 58 * (len(baris) - 1) + 46

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="{sub}">
  <!-- Kartu promosi Ruang. Dihasilkan `skrip/buat-promo.py` — jangan disunting
       langsung; ubah skripnya lalu jalankan ulang, supaya keempat kartu tidak
       pernah berbeda margin atau ukuran huruf. -->
  <rect width="800" height="500" rx="28" fill="{PAPER}"/>
  <rect x="1" y="1" width="798" height="498" rx="27" fill="none" stroke="{GARIS}" stroke-width="2"/>

  <g font-family="{FONT}">
    <text x="56" y="88" font-size="46" font-weight="800" fill="{INK}" letter-spacing="-1">{tspan}</text>
    <text x="56" y="{y_sub}" font-size="21" fill="{MUTED}">{sub}</text>
  </g>

  {gambar}

  <g font-family="{FONT}">
    <rect x="56" y="424" width="30" height="30" rx="7" fill="{BRAND}"/>
    <path fill="{PUTIH}" d="M65.3 431.5 H76.7 L79.9 438.2
      A2.97 2.27 0 0 1 73.9 438.2 A2.97 2.27 0 0 1 68 438.2 A2.97 2.27 0 0 1 62.1 438.2 Z"/>
    <rect x="61.1" y="443.4" width="19.8" height="1.8" fill="{PUTIH}"/>
    <text x="96" y="445" font-size="20" font-weight="700" fill="{INK}">Ruang</text>
    <text x="163" y="445" font-size="17" fill="{MUTED}">· lahan nganggur jadi cuan</text>
  </g>
</svg>
'''
    (KELUAR / f"{nama}.svg").write_text(svg)


def kanopi(cx: float, y: float, lebar: float, warna: str) -> str:
    """Kanopi yang sama dengan lambangnya, diskalakan. Tiga busur lingkaran."""
    h = lebar / 2
    ha = h * 0.64
    rx, ry = h / 3, h * 0.24
    d = [f"M{cx - ha} {y} H{cx + ha} L{cx + h} {y + lebar * 0.36}"]
    for i in range(3):
        x = cx + h - (2 * h / 3) * (i + 1)
        d.append(f"A{rx} {ry} 0 0 1 {x} {y + lebar * 0.36}")
    d.append("Z")
    return f'<path fill="{warna}" d="{" ".join(d)}"/>'


def baris_rubrik(y: int, teks: str, jenis: str) -> str:
    warna = {"ya": GOOD, "warn": WARN}[jenis]
    latar = {"ya": "#dcfce7", "warn": "#fef3c7"}[jenis]
    tanda = "M-5 0 l4 4 l7 -8" if jenis == "ya" else "M0 -6 v7 M0 4 v1"
    return f'''<g>
      <rect x="56" y="{y}" width="688" height="46" rx="12" fill="{PUTIH}" stroke="{GARIS}" stroke-width="2"/>
      <circle cx="88" cy="{y + 23}" r="13" fill="{latar}"/>
      <path transform="translate(88 {y + 23})" d="{tanda}" stroke="{warna}" stroke-width="2.6"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="116" y="{y + 30}" font-family="{FONT}" font-size="20" fill="{INK}">{teks}</text>
    </g>'''


def tingkat(x: int, no: str, kepala: str, isi: list[str], aktif: bool) -> str:
    garis = BRAND if aktif else GARIS
    bulat = BRAND if aktif else "#c9d3e2"
    teks = "".join(
        f'<tspan x="{x + 24}" dy="{0 if i == 0 else 26}">{b}</tspan>'
        for i, b in enumerate(isi)
    )
    return f'''<g>
      <rect x="{x}" y="238" width="212" height="160" rx="16" fill="{PUTIH}" stroke="{garis}" stroke-width="2"/>
      <circle cx="{x + 30}" cy="272" r="15" fill="{bulat}"/>
      <text x="{x + 30}" y="279" text-anchor="middle" font-family="{FONT}" font-size="17"
            font-weight="800" fill="{PUTIH}">{no}</text>
      <text x="{x + 56}" y="279" font-family="{FONT}" font-size="17" font-weight="700" fill="{INK}">{kepala}</text>
      <text x="{x + 24}" y="324" font-family="{FONT}" font-size="18" fill="{MUTED}">{teks}</text>
    </g>'''


KELUAR.mkdir(parents=True, exist_ok=True)

kartu(
    "01-jadi-cuan",
    ["Lahan nganggur", "jadi cuan"],
    "Halaman depan yang cuma jadi tempat parkir motor tamu, disewakan bulanan.",
    f'''<g>
    <rect x="56" y="252" width="300" height="150" rx="16" fill="{PUTIH}" stroke="{GARIS}" stroke-width="2"/>
    <rect x="88" y="338" width="236" height="8" rx="4" fill="#c9d3e2"/>
    <text x="206" y="308" text-anchor="middle" font-family="{FONT}" font-size="19" fill="{MUTED}">halaman nganggur</text>

    <path d="M386 327 h34 m0 0 -11 -11 m11 11 -11 11" stroke="{BRAND}" stroke-width="4"
          stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <rect x="444" y="252" width="300" height="150" rx="16" fill="{PUTIH}" stroke="{BRAND}" stroke-width="2"/>
    {kanopi(594, 278, 116, BRAND)}
    <rect x="476" y="338" width="236" height="8" rx="4" fill="{BRAND}"/>
    <g font-family="{FONT}">
      <rect x="530" y="358" width="128" height="32" rx="16" fill="{SOFT}"/>
      <text x="594" y="380" text-anchor="middle" font-size="18" font-weight="700" fill="#1a3fa8">Rp 600rb/bln</text>
    </g>
  </g>''',
)

kartu(
    "02-tanpa-beli-tanah",
    "Nggak perlu beli tanah",
    "Mau jualan di pinggir jalan? Sewa lahannya saja, sebulan-sebulan.",
    f'''<g>
    <rect x="56" y="222" width="688" height="180" rx="16" fill="{PUTIH}" stroke="{GARIS}" stroke-width="2"/>
    <text x="88" y="264" font-family="{FONT}" font-size="18" fill="{MUTED}">sebidang tanah</text>
    <g font-family="{FONT}">
      <text x="88" y="322" font-size="34" font-weight="800" fill="#94a3b8">ratusan juta</text>
      <line x1="86" y1="311" x2="282" y2="311" stroke="#94a3b8" stroke-width="3"/>
      <text x="88" y="364" font-size="17" fill="{MUTED}">beli, sekali dan mahal</text>
    </g>
    <line x1="400" y1="248" x2="400" y2="376" stroke="{GARIS}" stroke-width="2"/>
    <text x="432" y="264" font-family="{FONT}" font-size="18" fill="{MUTED}">2 × 3 meter di depan rumah orang</text>
    <g font-family="{FONT}">
      <text x="432" y="322" font-size="34" font-weight="800" fill="{BRAND}">ratusan ribu</text>
      <text x="432" y="364" font-size="17" fill="{MUTED}">sewa per bulan, berhenti kapan saja</text>
    </g>
  </g>''',
)

kartu(
    "03-apa-adanya",
    "Ditulis apa adanya",
    "Enam belas hal wajib diisi pemilik sebelum listing tayang — termasuk yang jelek.",
    "<g>"
    + baris_rubrik(232, "Muat gerobak · lantai rata · kunci di penyewa", "ya")
    # "Boleh dipakai tiap hari" sengaja TIDAK dipakai: itu justru yang
    # bentrok dengan `kuota_akses_bulanan` yang masih berlaku. Jendela
    # akses sendiri memang ada datanya sejak `08_jendela.sql`.
    + baris_rubrik(288, "Jendela akses Senin\u2013Sabtu, 06.00\u201321.00", "ya")
    + baris_rubrik(344, "Pernah banjir dalam 5 tahun terakhir", "warn")
    + "</g>",
)

kartu(
    "04-alamat-bertahap",
    "Alamat kebuka bertahap",
    "Yang kelihatan umum cuma kelurahan dan jarak. Titik di peta digeser 200 meter.",
    "<g>"
    + tingkat(56, "1", "Semua orang", ["Kelurahan, kecamatan,", "jarak persis"], True)
    + tingkat(294, "2", "Setelah deal", ["Alamat lengkap", "dan patokannya"], False)
    + tingkat(532, "3", "Setelah bayar", ["Nomor kontak", "langsung"], False)
    + "</g>",
)

for f in sorted(KELUAR.glob("*.svg")):
    print(f"{f.name:<28} {f.stat().st_size / 1024:.1f} KB")
