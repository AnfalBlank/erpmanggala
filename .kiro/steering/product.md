# ERP Manggala — Product Overview

ERP Manggala is an Enterprise Resource Planning system built for PT Manggala Utama Indonesia. It is a clone/rebrand of Taskora ERP (app.taskora.id).

## Core Modules

- **Dashboard** — Financial summary, cash flow chart, project status, overdue invoice alerts, low stock warnings
- **Business** — Projects, Customers, Invoices, Purchasing (PR/PO workflow)
- **Inventory** — Items, Warehouses, Stock Receipts, Stock Issues, Stock Report (with average cost tracking)
- **HRD & Attendance** — Face-based attendance with GPS, leave requests/approvals, shift management, late penalty calculation
- **Finance** — Banking (Buku Bank with running balance), Ledgers (AR/AP), Payroll (auto-generate with BPJS/PPh21), Operational expenses, COA, Fixed Assets (auto-depreciation), Taxes, Journals, Financial Reports, Expense Approval
- **Master Data** — Employees, Vendors, COA, Taxes
- **Admin** — User management, Audit Log, Settings

## Roles

Four roles with cascading permissions: Super Admin > Admin > Finance > Staff. Role-based access is enforced on both client routes and API endpoints.

## Branding

- Product name: "ERP Manggala"
- Company: PT Manggala Utama Indonesia
- All UI labels and references use "Manggala" branding
- Primary language is Indonesian (Bahasa Indonesia) with English translation support

## Key Business Logic

- Inventory uses weighted average cost method
- All financial mutations auto-create double-entry journal entries
- Payroll auto-calculates BPJS Kesehatan, BPJS TK, PPh 21, and late penalties from attendance
- Fixed asset depreciation is straight-line based on useful life
- Attendance tracks late minutes against assigned shift and applies configurable penalties
