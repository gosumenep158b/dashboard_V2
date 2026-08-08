# Dashboard GO Sumenep — TA 2026-2027

Aplikasi web **rekap & statistik data siswa** yang siap di-deploy ke
[Vercel](https://vercel.com). Data ditarik langsung dari Google Spreadsheet
`master data GO TA 26-27` lewat **Google Apps Script API** (bukan
`google.script.run`, karena itu hanya bisa dipakai di dalam halaman HTML
Apps Script sendiri).

## Arsitektur

```
Google Sheets (master data GO) ──► Apps Script (ApiREST.gs, JSON API)
                                          │  GET ?action=...
                                          ▼
                          Aplikasi Next.js di Vercel
                          (route handler /api/dashboard & /api/statistik
                           sebagai proxy + cache 60 detik)
                                          ▼
                          Halaman Dashboard (rekap & statistik)
```

## Cara setup

### 1. Siapkan API di Google Apps Script

1. Buka spreadsheet → menu **Ekstensi → Apps Script**.
2. Di editor, buat file baru: **File → New → Script**, beri nama `ApiREST`,
   lalu tempel seluruh isi [`apps-script/ApiREST.gs`](apps-script/ApiREST.gs).
   File ini **tidak** berisi `doGet` (supaya tidak dobel).
3. Di `Code.gs`, **ganti fungsi `doGet()` yang lama** dengan kode dari
   [`apps-script/doGet-replacement.js`](apps-script/doGet-replacement.js).
   Pastikan di seluruh proyek hanya ada **SATU** `function doGet` (kalau dobel,
   script tidak bisa disimpan).
4. > Klik tombol **Run/play** pada `doGet` akan selalu muncul
   > *"Mencoba menjalankan doGet, namun tidak dapat disimpan"* — itu **normal**,
   > `doGet` tidak bisa dijalankan dari editor. Test lewat URL Web App:
   > buka `<URL>/exec?action=ping` — harus muncul `{"ok":true,...}`.
6. Klik **Deploy → New deployment** → pilih jenis **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone** (atau *Anyone with Google account* jika
     butuh lebih aman — aplikasi Vercel tetap bisa memanggil karena berjalan
     di server, tanpa login browser).
7. Salin **URL Web App** (berakhiran `/exec`).

> Catatan: setiap kali mengubah skrip, klik **Deploy → Manage deployments →
> Edit → New version** lalu simpan, supaya URL `/exec` memakai kode terbaru.

### 2. Jalankan di lokal

```bash
npm install
```

Buat file `.env.local` di root proyek:

```
APPS_SCRIPT_URL=https://script.google.com/macros/s/<ID_ANDA>/exec
```

Jalankan dev server:

```bash
npm run dev
```

Buka http://localhost:3000 — dashboard akan tampil jika URL API benar.

### 3. Deploy ke Vercel

Cara termudah: **import repository dari GitHub**.

1. Push folder proyek ini ke repository GitHub.
2. Buka [vercel.com](https://vercel.com) → **Add New → Project** → pilih repo.
3. Framework otomatis terdeteksi sebagai **Next.js** (jangan ubah preset).
4. Tambahkan **Environment Variable**:
   - **Key**: `APPS_SCRIPT_URL`
   - **Value**: URL Web App Apps Script Anda
5. Klik **Deploy**. Selesai.

Alternatif pakai CLI:

```bash
npm i -g vercel
vercel      # login & ikuti wizard, set env APPS_SCRIPT_URL saat diminta
vercel --prod
```

## Endpoint API (Apps Script)

| Endpoint                          | Fungsi di Code.gs              |
| --------------------------------- | ------------------------------ |
| `?action=ping`                    | Cek koneksi + versi build      |
| `?action=getDashboardData`        | KPI, kelas GO, ulang tahun     |
| `?action=getStatistikTingkat`     | Siswa per tingkat (+filter sekolah via `&asalSekolah=`) |
| `?action=getStatistikPendaftarBulanan` | Rekap pendaftar per bulan |
| `?action=getDaftarAsalSekolah`    | Daftar asal sekolah untuk filter |
| `?action=getDataFasilitasBupel`   | Rekap pengambilan & stok buku  |
| `?action=getPermintaanTST`        | Permintaan TST                 |

Contoh respons:

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "pesan kesalahan" }
```

## Struktur proyek

```
apps-script/
  ApiREST.gs                 # wrapper JSON API untuk Apps Script
src/
  app/
    layout.js                # root layout (metadata)
    page.js                  # halaman utama
    globals.css              # styling
    api/
      dashboard/route.js     # proxy getDashboardData + bulanan + sekolah
      statistik/route.js     # proxy getStatistikTingkat (filter sekolah)
  components/
    Dashboard.jsx            # UI dashboard rekap & statistik
  lib/
    appsScript.js            # pemanggil Apps Script (pakai APPS_SCRIPT_URL)
```

## Troubleshooting

- **"APPS_SCRIPT_URL belum diisi"** → pastikan env var sudah ada (`.env.local`
  untuk lokal, Settings → Environment Variables untuk Vercel), lalu redeploy /
  restart dev server.
- **"Apps Script merespons status 404/…"** → URL salah, atau Web App belum
  di-deploy ulang setelah menambahkan `ApiREST.gs`.
- **"Action tidak dikenal"** → pastikan `doGet()` di `Code.gs` sudah diganti
  dengan versi dari `ApiREST.gs` dan Web App di-deploy versi baru.
- **Data tampak basi** → proxy menyimpan cache 60 detik; tekan tombol
  **Segarkan Data** atau tunggu 1 menit.
