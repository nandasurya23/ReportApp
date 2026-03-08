# Laundry Report Web App (Frontend, Next.js) + Login & Auto TTD

**Project Name:** Laundry Report Web App
**Platform:** Web App (Desktop & Tablet Friendly)
**Frontend Framework:** Next.js + React + Tailwind CSS
**Target User:** Pemilik Laundry / Staf Laundry
**Tanggal:** 4 Maret 2026

---

## 1. Tujuan

Membuat frontend web app yang memungkinkan:

* Input transaksi laundry harian dengan harga
* Kalkulasi total per hari & total bulanan otomatis
* Generate laporan PDF / print-ready
* Login user sebelum akses app
* Otomatis menampilkan nama user + tanggal sekarang di kolom TTD

---

## 2. Fitur Utama

### 2.1 Login Page

* Form login sederhana:

  * Username (text)
  * Password (text/password)
* Setelah login berhasil:

  * Simpan nama user di session / state frontend
  * Redirect ke halaman utama Laundry Report App

### 2.2 Input Data Client & Laundry

* Form input:

  * Nama Client (text)
  * Tanggal transaksi (calendar picker)
  * Jumlah Laundry / KG (number)
  * Harga per Laundry / KG (number)
* Tombol **Tambah** → data masuk ke tabel harian
* Total Harian dihitung otomatis (Jumlah × Harga)

### 2.3 Tabel Transaksi Harian

* Kolom:

  1. No
  2. Tanggal
  3. Nama Client
  4. Jumlah Laundry
  5. Harga per Laundry
  6. Total Harian
* Total per hari otomatis dihitung saat data ditambah / diedit / dihapus

### 2.4 Total Bulanan

* Jumlah seluruh Total Harian dari tanggal 1 sampai akhir bulan
* Update otomatis saat transaksi diubah
* Filter bulan & tahun untuk laporan tertentu

### 2.5 PDF / Print Layout

* Tabel menampilkan semua transaksi, total bulanan
* Kolom TTD otomatis menampilkan:

  * Nama user (dari login)
  * Tanggal sekarang (day/month/year)
* Tombol **Save PDF** → generate PDF siap cetak
* Tombol **Print** → versi print-friendly

---

## 3. Alur Pengguna

1. User buka web app → tampil **Login Page**
2. User isi username & password → klik **Login**
3. Sistem menyimpan nama user → redirect ke halaman **Laundry Report App**
4. User isi transaksi laundry → klik **Tambah** → masuk ke tabel
5. Total harian & total bulanan otomatis muncul
6. Pilih **Filter Bulan & Tahun** untuk melihat laporan tertentu
7. Klik **Print / Save PDF** → TTD otomatis muncul dengan nama user + tanggal sekarang

---

## 4. UI / UX Features

* Login page sederhana & clean
* Calendar picker untuk input tanggal transaksi
* Tabel interaktif & responsif
* Notifikasi toast untuk aksi sukses / gagal
* Auto-fill TTD di PDF/print
* Responsive layout untuk desktop & tablet

---

## 5. PDF / Print Layout (Contoh)

```
------------------------------------------------------------
| No | Tanggal  | Nama Client | Laundry | Harga | Total  |
------------------------------------------------------------
| 1  | 01/03/26 | John Doe    |   3     |  15k  |  45k   |
| 2  | 01/03/26 | Jane Smith  |   2     |  20k  |  40k   |
...
------------------------------------------------------------
| Total Bulan:                             150k           |
------------------------------------------------------------
| TTD Pemilik Laundry: NamaUser  04/03/26                 |
------------------------------------------------------------
```

> Catatan: `NamaUser` otomatis dari login, `04/03/26` = tanggal sekarang (`now`)

---

## 6. Komponen Next.js yang Disarankan (Frontend)

| Komponen          | Fungsi                                           |
| ----------------- | ------------------------------------------------ |
| `LoginPage`       | Halaman login user                               |
| `LaundryForm`     | Form input transaksi client                      |
| `LaundryTable`    | Tabel transaksi harian + total harian            |
| `MonthFilter`     | Dropdown pilih bulan & tahun                     |
| `TotalSummary`    | Menampilkan total bulanan                        |
| `PDFExportButton` | Generate PDF via jsPDF / @react-pdf/renderer     |
| `PrintButton`     | Tombol print dengan CSS print-friendly           |
| `TTDAuto`         | Menampilkan nama user + tanggal now di PDF/print |

---

## 7. Library / Tools Frontend

* Tailwind CSS → styling cepat & responsif
* react-datepicker → input tanggal
* jsPDF / @react-pdf/renderer → generate PDF
* React Table / TanStack Table → tabel interaktif (opsional)
* React Toastify → notifikasi toast
* next-auth (opsional) → autentikasi login

---

## 8. Fitur Tambahan (Opsional)

* Filter per client
* Export Excel / CSV
* Grafik jumlah laundry per bulan (Chart.js / Recharts)
* Dark / Light mode
