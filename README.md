# ERP Manggala

**Enterprise Resource Planning System** untuk PT Manggala Utama Indonesia.

![ERP Manggala](https://img.shields.io/badge/Status-Live-green) ![React](https://img.shields.io/badge/Frontend-React_19-blue) ![Express](https://img.shields.io/badge/Backend-Express.js-black) ![SQLite](https://img.shields.io/badge/Database-SQLite-orange)

---

## 🌐 Akses

| Environment | URL |
|---|---|
| Production | http://129.226.157.65:8080 |
| API Backend | http://129.226.157.65:8080/api |

## 🔑 Akun Login Default

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@manggala.id | admin123 |
| Admin | admin@manggala.id | admin123 |
| Finance | finance@manggala.id | admin123 |
| Staff | staff@manggala.id | admin123 |

---

## 📋 Fitur Lengkap

### 📊 Dashboard
- Ringkasan keuangan: Pendapatan, Pengeluaran, Profit, Profit Operasional
- Grafik Arus Kas 6 bulan terakhir (Bar Chart)
- Status Proyek (Planning / Running / Done)
- Peringatan Jatuh Tempo Invoice
- Peringatan Stok Menipis

### 🏢 Bisnis
| Modul | Path | Fitur |
|---|---|---|
| **Proyek** | `/projects` | CRUD, status Planning/Running/Done, nilai proyek, klien |
| **Customer** | `/customers` | CRUD, kontak, NPWP, alamat |
| **Invoice** | `/invoices` | Buat invoice, status Draft/Sent/Paid/Cancelled, item-line |
| **Purchasing** | `/purchasing` | Purchase Order, vendor, item pembelian |

### 📦 Inventaris
| Modul | Path | Fitur |
|---|---|---|
| **Item Barang** | `/inventory/items` | CRUD, SKU, kategori, stok minimum, harga |
| **Gudang** | `/inventory/warehouses` | CRUD master gudang |
| **Penerimaan** | `/inventory/receipts` | Stock-in, PO number, vendor, multi-item |
| **Pengeluaran** | `/inventory/issue` | Stock-out, proyek, gudang, catatan |
| **Laporan Stok** | `/inventory/stock-report` | Summary per gudang, filter, nilai total |

### 👥 HRD & Absensi
| Modul | Path | Fitur |
|---|---|---|
| **Absen Face ID** | `/hrd/attendance` | Camera selfie, GPS lokasi, check-in/out |
| **Kelola Absensi** | `/hrd/attendance-manage` | Filter tanggal & karyawan |
| **Cuti** | `/hrd/leave-request` | Pengajuan cuti/izin, status |
| **Approval Cuti** | `/hrd/leave-approval` | Approve/reject, riwayat |
| **Shift** | `/hrd/shifts` | Master shift, jam masuk/pulang, denda telat |
| **Karyawan** | `/employees` | CRUD, jabatan, gaji pokok, status |

### 💰 Keuangan
| Modul | Path | Fitur |
|---|---|---|
| **Buku Bank** | `/finance/banking` | Rekening, transfer internal, transaksi |
| **Rekening Bank** | `/finance/bank-accounts` | CRUD, COA mapping, status |
| **Hutang/Piutang** | `/finance/ledgers` | Tab Piutang & Hutang, jatuh tempo, status |
| **Payroll** | `/finance/payroll` | Generate gaji otomatis, summary cards |
| **Operasional** | `/finance/operational` | Tab Biaya & Pendapatan Operasional |
| **COA** | `/finance/coa` | Chart of Accounts, saldo normal, tree |
| **Aset Tetap** | `/finance/fixed-assets` | Penyusutan otomatis, nilai buku |
| **Pajak** | `/finance/taxes` | CRUD tarif pajak |
| **Laporan** | `/finance/reports` | Laba/Rugi, Neraca, Arus Kas |
| **Approval** | `/finance/approval` | Persetujuan biaya, approve/reject |

### 🛠️ Master & Admin
| Modul | Path | Fitur |
|---|---|---|
| **Vendor** | `/vendors` | CRUD supplier |
| **Manajemen User** | `/users` | CRUD user, role-based access |
| **Pengaturan** | `/settings` | Konfigurasi sistem |

---

## 🏗️ Tech Stack

### Frontend
- **React 19** + Vite
- **Tailwind CSS v4**
- **React Router DOM v7**
- **Recharts** (grafik)
- **Lucide React** (ikon)
- Responsive: Mobile, Tablet, Desktop

### Backend
- **Express.js** (Node.js)
- **Better-SQLite3** (database)
- **JWT** (authentication)
- **bcryptjs** (password hashing)

### Infrastructure
- **Nginx** (reverse proxy)
- **PM2** (process manager)
- **Ubuntu VPS**

---

## 🚀 Instalasi & Deploy

### Prasyarat
- Node.js 20+
- npm
- Nginx
- PM2 (`npm install -g pm2`)

### Clone & Install
```bash
git clone https://github.com/AnfalBlank/erpmanggala.git
cd erpmanggala

# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

### Setup Database
```bash
cd server
node db/init.js    # Buat tabel
node db/seed.js    # Insert data demo
```

### Build Frontend
```bash
cd client
npm run build      # Output: client/dist/
```

### Jalankan Backend
```bash
cd server
node index.js      # Port 3002
```

### Konfigurasi Nginx
```nginx
server {
    listen 80;
    server_name erp.manggala.biz.id;

    client_max_body_size 50M;

    location / {
        root /path/to/erpmanggala/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deploy dengan PM2
```bash
pm2 start server/index.js --name erp-manggala
pm2 save
```

---

## 📱 Responsive Design

ERP Manggala dioptimasi untuk semua ukuran layar:

| Device | Layout |
|---|---|
| **Mobile** (<640px) | Sidebar hidden (hamburger menu), cards 1 kolom, tabel scroll |
| **Tablet** (640-1024px) | Sidebar hidden, cards 2 kolom |
| **Desktop** (>1024px) | Sidebar tetap, cards 4 kolom, full layout |

---

## 📂 Struktur Folder

```
erpmanggala/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # Layout, Sidebar, StatusBadge
│   │   ├── context/           # AuthContext
│   │   ├── lib/               # API helper
│   │   ├── pages/             # 30 halaman
│   │   │   ├── Finance/       # 11 halaman keuangan
│   │   │   ├── HRD/           # 5 halaman HRD
│   │   │   └── Inventory/     # 5 halaman inventaris
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── server/                    # Backend (Express)
│   ├── db/
│   │   ├── init.js            # Schema
│   │   └── seed.js            # Demo data
│   ├── middleware/
│   │   └── auth.js            # JWT auth
│   ├── routes/
│   │   ├── auth.js
│   │   └── index.js           # All API routes
│   └── index.js
├── screenshots/               # Referensi Taskora
└── README.md
```

---

## 🔐 Role-Based Access

| Fitur | Super Admin | Admin | Finance | Staff |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| CRUD Proyek | ✅ | ✅ | ❌ | ❌ |
| Invoice | ✅ | ✅ | ✅ | ❌ |
| Payroll | ✅ | ✅ | ✅ | ❌ |
| Laporan | ✅ | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |
| Absensi | ✅ | ✅ | ❌ | ✅ |

---

## 📄 Lisensi

© 2026 PT Manggala Utama Indonesia. All rights reserved.
