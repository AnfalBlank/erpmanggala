# ERP Manggala - Clone Taskora ERP

## Overview
Clone ERP Taskora (app.taskora.id) and rebrand as "ERP Manggala" for PT Manggala Utama Indonesia.
Deploy on VPS: ubuntu@129.226.157.65

## Tech Stack (match Taskora)
- Frontend: React 19 + Vite + Tailwind CSS
- Backend: Node.js + Express + SQLite (or PostgreSQL)
- Hosting: Nginx + PM2

## Modules Required (29 pages from sidebar)

### HRD & Absensi
1. Dashboard - Widgets: Total Pendapatan, Pengeluaran, Profit, Profit Operasional, Arus Kas chart (6 bulan), Status Proyek (Planning/Running/Done), Jatuh Tempo
2. Absen Wajah (/attendance)
3. Cuti Saya (/hr/leave-request)
4. Master Shift (/hr/shifts)
5. Monitoring Absensi (/hr/attendance-manage)
6. Approval Cuti (/hr/leave-approval)

### Bisnis
7. Projects (/projects) - CRUD, status Planning/Running/Done, client, tanggal mulai
8. Customers (/customers) - CRUD
9. Purchasing (/purchasing) - CRUD

### Inventaris
10. Laporan Stok (/inventory/stock-report)
11. Penerimaan Barang (/inventory/receipts)
12. Pengeluaran Barang (/inventory/issue)
13. Master Barang (/inventory/items) - CRUD
14. Master Gudang (/inventory/warehouses) - CRUD

### Keuangan
15. Buku Bank (/banking)
16. Invoice/Tagihan (/invoices) - Draft/Sent/Paid/Cancelled status, no invoice, client, tanggal, jatuh tempo, total
17. Hutang/Piutang (/ledgers)
18. Operasional (/operational)
19. Payroll/Gaji (/payroll)
20. Aset Tetap (/fixed-assets)
21. Laporan (/reports)
22. Persetujuan Biaya (/approval)
23. Master Bank (/bank-accounts)

### Master Data
24. Karyawan (/employees) - Nama, Jabatan, Kontak, Gaji Pokok, Status Aktif
25. Vendor (/vendors) - CRUD
26. Akun/COA (/coa)
27. Pajak (/taxes)

### Admin
28. Manajemen User (/users) - Role-based access
29. Settings (/settings)

## UI Design
- Fixed sidebar (left, ~200px) + top header + main content
- Sidebar groups: MENU, HRD & ABSENSI, BISNIS, INVENTARIS, footer: Settings + Logout
- Blue primary (#2196F3), green for income, red for expenses
- Feather-style icons
- Cards with rounded corners (8px)
- Tables with search + add button + pagination
- Status badges: blue (Planning/Sent), green (Running/Aktif/Paid), gray (Done/Cancelled/Draft)
- Logo: "MANGGALA" in blue/green
- Avatar: circular with initials

## Branding
- Name: "ERP Manggala"
- Company: PT Manggala Utama Indonesia
- Replace all "Taskora" references with "Manggala"

## Deployment
- SSH: sshpass -p 'T2E-iSh-A6q-kn5' ssh -o StrictHostKeyChecking=no ubuntu@129.226.157.65
- Deploy to: /home/ubuntu/erp-manggala
- Domain: erp.manggala.biz.id (or use IP for now)
- PM2 for process management
- Nginx reverse proxy on port 80

## Priority Order
Build in this order:
1. Project setup (Vite + React + Router + Tailwind)
2. Layout (Sidebar + Header)
3. Auth (Login with role-based access: Super Admin, Admin, Finance, Staff)
4. Dashboard (with mock data first)
5. Master Data modules (Employees, Customers, Vendors, Items, Warehouses)
6. Business modules (Projects, Invoices, Purchasing)
7. Inventory modules
8. Finance modules
9. HRD modules
10. Reports & Settings
