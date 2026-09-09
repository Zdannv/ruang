#!/usr/bin/env python3
"""
Ilustrasi kecil untuk tiap langkah di bagian "Cara pakainya".

Kenapa SVG dan bukan ilustrasi raster seperti kartu sorotan: ukuran tampilnya.
Kartu langkah lebarnya sekitar 210px di laptop dan 165px di telepon — di
ukuran itu ilustrasi berdetail justru tidak terbaca, dan yang bekerja adalah
satu bentuk tegas per kartu. Kelimanya jadi 1-2 KB, dan kelima-limanya muncul
di halaman depan sekaligus.

Kenapa dihasilkan skrip: yang membuat kelimanya terbaca sebagai satu keluarga
bukan kemiripan yang diusahakan per berkas, melainkan satu kerangka —
kanvas, radius, warna, dan ketebalan garis datang dari fungsi yang sama.

Langkah TERAKHIR digambar abu-abu sengaja. Ia langkah "Bayar — belum aktif",
dan kartunya di halaman depan memang dirender pudar; ilustrasi berwarna di
kartu pudar akan terbaca sebagai kesalahan render.

Jalankan ulang kalau warnanya berubah:  python3 skrip/buat-langkah.py
"""
from pathlib import Path

# Sama dengan globals.css.
BRAND, BRAND_TUA, BRAND_MUDA = "#a93b20", "#8a2e17", "#fdeee8"
INK, PAPER, PUTIH, GARIS = "#1a1512", "#faf8f6", "#ffffff", "#ece5df"
KRIM, EMAS, PUDAR, PUDAR_MUDA = "#f6ead9", "#d99a2b", "#8a807a", "#e8e2dc"

W, H = 400, 300
KELUAR = Path(__file__).resolve().parent.parent / "public" / "langkah"


def aman(t: str) -> str:
    """SVG itu XML: `&` yang berdiri sendiri menggagalkan seluruh berkas."""
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def kartu(nama: str, judul: str, isi: str, latar: str = KRIM) -> None:
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="{aman(judul)}">
  <!-- Dihasilkan `skrip/buat-langkah.py`. Jangan disunting langsung. -->
  <rect width="{W}" height="{H}" rx="20" fill="{latar}"/>
  {isi}
</svg>
'''
    (KELUAR / f"{nama}.svg").write_text(svg)


KELUAR.mkdir(parents=True, exist_ok=True)

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

# ── 5. Bayar — belum aktif. Sengaja abu-abu; lihat catatan di kepala. ──────
kartu("5-bayar", "Bayar, belum aktif", f'''
  <rect x="74" y="98" width="252" height="150" rx="18" fill="{PUDAR_MUDA}"/>
  <rect x="74" y="130" width="252" height="26" fill="{PUDAR}" fill-opacity="0.35"/>
  <g fill="{PUDAR}" fill-opacity="0.5">
    <rect x="100" y="186" width="86" height="16" rx="8"/>
    <rect x="100" y="212" width="56" height="16" rx="8"/>
  </g>
  <circle cx="286" cy="208" r="22" fill="{PUDAR}" fill-opacity="0.4"/>
  <g transform="translate(200 74)">
    <circle r="34" fill="{PAPER}" stroke="{PUDAR}" stroke-width="5"/>
    <path d="M0 -16 V4" stroke="{PUDAR}" stroke-width="6" stroke-linecap="round"/>
    <circle cy="16" r="4" fill="{PUDAR}"/>
  </g>''', latar=PAPER)

import xml.etree.ElementTree as ET
for f in sorted(KELUAR.glob("*.svg")):
    ET.parse(f)  # gagal keras kalau XML-nya tidak sah
    print(f"{f.name:<16} {f.stat().st_size / 1024:.1f} KB  ✓ XML sah")
