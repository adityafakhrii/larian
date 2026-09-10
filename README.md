# LARIAN — Nusantara Series · 01

> **Game 3D Endless Runner Orisinal Bertema Kota Nusantara.**  
> *Langkah Lokal. Semangat Tanpa Batas.*

---

## 🏃 Tentang Game

**LARIAN** adalah game web 3D endless runner yang memadukan gameplay dinamis (mirip Subway Surfers / Temple Run) dengan estetika dan atmosfer lokal Indonesia. Pemain mengontrol **Raka**, seorang pelari yang menjelajahi 5 distrik kota nusantara dengan rintangan jalanan yang unik.

### 5 Distrik / Area Petualangan:
1. **Kampung Kota** — Gang pemukiman padat, warung makan lokal, gerobak bakso/sate, jemuran warga, dan tiang kabel listrik.
2. **Stasiun Senja** — Peron stasiun kereta api dan jalur rel kereta Nusantara.
3. **Pasar Rame** — Keramaian pasar dengan lapak pedagang buah, sayur segar, dan warung tenda.
4. **Pusat Kota** — Gedung bertingkat modern, lampu lalu lintas, halte, bus kota, dan kendaraan bermotor.
5. **Lembah Nusantara** — Pemandangan alam terbuka hijau, terasering sawah, dan pendopo lembah.

---

## 🎮 Cara Bermain & Kontrol

### Desktop (Keyboard)
| Aksi | Tombol Keyboard |
|---|---|
| **Pindah Jalur Kiri** | `A` atau `←` (Panah Kiri) |
| **Pindah Jalur Kanan** | `D` atau `→` (Panah Kanan) |
| **Lompat (Jump)** | `W`, `↑` (Panah Atas), atau `Space` |
| **Meluncur / Merunduk (Slide)** | `S` atau `↓` (Panah Bawah) |
| **Fast Fall** | Tekan `S` saat berada di udara |
| **Jeda (Pause)** | `Esc` atau `P` |

### Mobile / Perangkat Sentuh
- **Swipe Kiri / Kanan**: Pindah jalur.
- **Swipe Atas**: Lompat.
- **Swipe Bawah**: Meluncur / Fast-fall.
- **On-Screen HUD Buttons**: Tersedia tombol kontrol sentuh di layar.

### Item & Power-ups
- ✦ **Koin**: Menambah pundi skor (+25 poin/koin).
- 🧲 **Magnet**: Menarik seluruh koin terdekat selama 12 detik.
- 🛡️ **Shield**: Menahan satu kali benturan rintangan fatal.
- 🪙 **Koin 2×**: Menggandakan perolehan koin selama 12 detik.

---

## 🛠️ Arsitektur & Teknologi

- **3D Engine**: [Three.js](https://threejs.org/) — Menggunakan geometri prosedural yang di-*bake* (tanpa beban unduhan file model eksternal 3D) dan *Instanced Meshes* untuk performa tinggi 60+ FPS.
- **Audio Synthesizer**: Web Audio API murni — Musik perkusi elektronik Nusantara dan efek suara dinamis disintesis secara langsung secara *real-time* tanpa file `.mp3` besar.
- **Framework & UI**: React 19, Next.js App Router, Tailwind CSS v4, Shadcn UI (Base UI).
- **Runtime**: [Vinext](https://github.com/cloudflare/vinext) (Vite-based Next.js kompatibel dengan React Server Components) & Cloudflare Workers.
- **Offline / Portable Bundle**: Skrip bundling khusus untuk menghasilkan satu file HTML tunggal mandiri (~0.97 MB) yang bisa dijalankan 100% offline.

---

## 🚀 Menjalankan Project Secara Lokal

### Prasyarat
- Node.js `>= 22.13.0`
- npm

### 1. Clone Repository
```bash
git clone https://github.com/adityafakhrii/larian.git
cd larian
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Jalankan Mode Pengembangan (Dev Server)
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 4. Menjalankan Pengujian (Unit Tests)
```bash
npm test
```
Menguji pergerakan, deteksi benturan, persistensi rekor, dan simulasi lari 100 km.

### 5. Build untuk Produksi
```bash
# Build untuk deployment Cloudflare Workers / Web:
npm run build

# Build versi standalone single-file offline HTML:
npm run build:portable
```
Hasil build portable akan tersedia di `out/index.html`.

---

## 📄 Lisensi

Dibuat dengan semangat Nusantara. Proyek ini dilisensikan di bawah ketentuan lisensi open-source terlampir.
