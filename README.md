# Klinik Polinela — Sistem Manajemen Klinik

Sistem manajemen antrian, inventaris obat, jadwal dokter, dan pemesanan obat untuk Klinik Polinela.  
Dibangun dengan **Node.js native** (ESM) dan **SQLite** — tanpa dependency eksternal.

---

## Prasyarat

- **Node.js ≥ 22.5.0** (menggunakan built-in `node:sqlite`)

  ```bash
  node -v
  ```

---

## Struktur Proyek

```text
projekklinik/
├── backend/
│   └── server.js          # HTTP server + REST API (node:http + node:sqlite)
├── frontend/
│   ├── index.html          # SPA entry point
│   ├── script.js           # Logika UI (vanilla JS, fallback localStorage)
│   ├── style.css
│   ├── pages/              # Modul HTML parsial (antrian, obat, profil, dll.)
│   └── assets/             # Logo & gambar
├── database/
│   ├── schema.sql          # DDL + seed data (source of truth)
│   └── clinic.db           # Runtime DB (git-ignored)
├── test.js                 # Smoke test (API endpoint + integrasi)
└── package.json
```

---

## Cara Menjalankan

```bash
# 1. Jalankan server (default port 3500)
npm start

# 2. Buka browser
#    http://localhost:3500
```

Port bisa di-override via environment variable: `PORT=8080 npm start` atau argumen command: `node backend/server.js 8080`

### Mode Tanpa Backend (Live Server)

Frontend juga bisa dijalankan langsung via VS Code Live Server. Data disimpan di `localStorage` key `klinik-polinela-v1`.

---

## Akun Default

| Peran          | Email                                     | Password      |
| :------------- | :---------------------------------------- | :------------ |
| **Admin**      | `adminklinik@polinela.ac.id`              | `klinik123`   |
| **Mahasiswa**  | `mahasiswa@student.polinela.ac.id`        | `123456`      |
| **Dosen**      | `dosen@polinela.ac.id`                    | `123456`      |
| **Dosen**      | `fathurrahman@polinela.ac.id`             | `Polinela123` |

Akun mahasiswa aktif (NIM sebagai email `<NIM>@student.polinela.ac.id`, password `Polinela123`):

`26783118` · `26783121` · `26783110` · `26783130` · `26783113` · `25783035` · `25783036` · `25783058` · `25783065` · `25783066` · `25783110` · `24783010` · `24783031` · `24783018` · `24783020`

> Tidak ada fitur registrasi mandiri — semua akun pasien sudah disediakan di atas.

---

## Fitur Utama

- **Autentikasi** — Login & registrasi (admin + pasien)
- **Profil Pengguna** — Edit nama, bio, umur, foto, status
- **Manajemen Obat** — CRUD inventaris obat (nama, kategori, stok, dosis, efek samping)
- **Antrian Pasien** — Pendaftaran antrian, status (Menunggu → Diperiksa → Selesai), keluhan
- **Jadwal Dokter** — CRUD jadwal praktik per hari & poli
- **Pemesanan Obat** — Pesan obat, otomatis kurangi stok, pembatalan mengembalikan stok

---

## API Endpoints

| Method | Endpoint                        | Deskripsi                        |
| :----- | :------------------------------ | :------------------------------- |
| POST   | `/api/auth/login`               | Login                            |
| POST   | `/api/auth/register`            | Registrasi pasien baru           |
| PUT    | `/api/users/:id`                | Update profil pengguna           |
| GET    | `/api/medicines`                | Daftar semua obat                |
| POST   | `/api/medicines`                | Tambah obat baru                 |
| PUT    | `/api/medicines/:id`            | Edit obat                        |
| DELETE | `/api/medicines/:id`            | Hapus obat                       |
| GET    | `/api/doctor-schedules`         | Daftar jadwal dokter             |
| POST   | `/api/doctor-schedules`         | Tambah jadwal                    |
| PUT    | `/api/doctor-schedules/:id`     | Edit jadwal                      |
| DELETE | `/api/doctor-schedules/:id`     | Hapus jadwal                     |
| GET    | `/api/queues`                   | Daftar antrian                   |
| POST   | `/api/queues`                   | Daftarkan antrian baru           |
| PATCH  | `/api/queues/:id`               | Update status antrian            |
| DELETE | `/api/queues/:id`               | Hapus antrian                    |
| GET    | `/api/orders`                   | Daftar pemesanan obat            |
| POST   | `/api/orders`                   | Buat pemesanan baru              |
| PATCH  | `/api/orders/:id`               | Update status pemesanan          |

---

## Database

- **Schema**: `database/schema.sql` (source of truth)
- **Engine**: SQLite dengan WAL mode
- **Tabel**: `users`, `medicines`, `queues`, `doctor_schedules`, `orders`
- Migrasi kolom baru dilakukan otomatis via `ALTER TABLE ... ADD COLUMN` saat server start
- File `*.db` di-gitignore — jangan commit file database biner

---

## Pengujian

```bash
npm test
```

Menjalankan `test.js` pada port `3001`. Menguji:

- CRUD obat
- Login admin
- Registrasi + login pasien
- Static file serving

> ⚠️ Test menyisipkan record baru ke database lokal setiap dijalankan.

---

## Deploy ke GitHub Pages (Frontend Saja)

Frontend bisa dihosting gratis di GitHub Pages. Data disimpan di `localStorage` browser (tidak ada backend/database di production).

1. Push kode ke branch `main`.
2. Di repo GitHub → **Settings** → **Pages** → Build and deployment → Source: **GitHub Actions**.
3. Commit akan trigger workflow `.github/workflows/gh-pages.yml` dan deploy folder `frontend/`.
4. Situs tersedia di `https://<user>.github.io/<repo>/`.

> ⚠️ Hanya frontend yang di-deploy. Backend Node.js + SQLite tetap berjalan lokal (`npm start`).

## Tech Stack

| Layer    | Teknologi                              |
| :------- | :------------------------------------- |
| Runtime  | Node.js (ESM, zero dependencies)       |
| Server   | `node:http` native                     |
| Database | `node:sqlite` (SQLite 3)               |
| Frontend | Vanilla HTML / CSS / JavaScript        |
| Kompresi | `node:zlib` (gzip response)            |
