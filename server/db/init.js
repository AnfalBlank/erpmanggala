import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'erp.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Staff',
    status TEXT NOT NULL DEFAULT 'Aktif',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT,
    email TEXT,
    phone TEXT,
    salary REAL DEFAULT 0,
    status TEXT DEFAULT 'Aktif',
    face_registered INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    npwp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    client_id INTEGER REFERENCES customers(id),
    status TEXT DEFAULT 'Planning',
    start_date TEXT,
    end_date TEXT,
    value REAL DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL,
    client_id INTEGER REFERENCES customers(id),
    project_id INTEGER REFERENCES projects(id),
    date TEXT,
    due_date TEXT,
    subtotal REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    items_json TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL,
    vendor_id INTEGER REFERENCES vendors(id),
    date TEXT,
    items_json TEXT DEFAULT '[]',
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    unit TEXT DEFAULT 'pcs',
    stock REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    price REAL DEFAULT 0,
    warehouse_id INTEGER REFERENCES warehouses(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER REFERENCES inventory_items(id),
    qty REAL NOT NULL,
    date TEXT,
    reference TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER REFERENCES inventory_items(id),
    qty REAL NOT NULL,
    date TEXT,
    reference TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bank TEXT,
    account_number TEXT,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    account_id INTEGER REFERENCES bank_accounts(id),
    amount REAL NOT NULL,
    date TEXT,
    description TEXT,
    reference TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coa_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    parent_id INTEGER REFERENCES coa_accounts(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER REFERENCES employees(id),
    type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    approved_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER REFERENCES employees(id),
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT DEFAULT 'Hadir',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER REFERENCES employees(id),
    period TEXT NOT NULL,
    basic_salary REAL DEFAULT 0,
    allowances REAL DEFAULT 0,
    deductions REAL DEFAULT 0,
    net_salary REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fixed_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    purchase_date TEXT,
    purchase_price REAL DEFAULT 0,
    useful_life INTEGER DEFAULT 5,
    current_value REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS taxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rate REAL NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_data TEXT,
    new_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── New tables for features ──
db.exec(`
  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT,
    debit_account TEXT,
    credit_account TEXT,
    amount REAL DEFAULT 0,
    reference_type TEXT,
    reference_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id),
    category TEXT NOT NULL,
    description TEXT,
    budget_amount REAL DEFAULT 0,
    actual_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchase_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    requested_by INTEGER,
    status TEXT DEFAULT 'Draft',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchase_request_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pr_id INTEGER REFERENCES purchase_requests(id),
    item_id INTEGER REFERENCES inventory_items(id),
    description TEXT,
    qty REAL DEFAULT 0,
    unit TEXT,
    estimated_price REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    pr_id INTEGER REFERENCES purchase_requests(id),
    vendor_id INTEGER REFERENCES vendors(id),
    project_id INTEGER REFERENCES projects(id),
    status TEXT DEFAULT 'Draft',
    total REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER REFERENCES purchase_orders(id),
    item_id INTEGER REFERENCES inventory_items(id),
    description TEXT,
    qty REAL DEFAULT 0,
    unit TEXT,
    unit_price REAL DEFAULT 0,
    amount REAL DEFAULT 0
  );
`);

// ── Safe ALTER TABLE migrations ──
const alters = [
  // Feature A: attendance late penalty
  "ALTER TABLE attendance ADD COLUMN late_minutes INTEGER DEFAULT 0",
  "ALTER TABLE attendance ADD COLUMN penalty_amount REAL DEFAULT 0",
  "ALTER TABLE attendance ADD COLUMN shift_id INTEGER",

  // Feature B: employee payroll fields
  "ALTER TABLE employees ADD COLUMN basic_salary REAL DEFAULT 0",
  "ALTER TABLE employees ADD COLUMN bpjs_kesehatan INTEGER DEFAULT 0",
  "ALTER TABLE employees ADD COLUMN bpjs_tk INTEGER DEFAULT 0",
  "ALTER TABLE employees ADD COLUMN ptkp_status TEXT DEFAULT 'TK/0'",
  "ALTER TABLE employees ADD COLUMN bank_account TEXT",
  "ALTER TABLE employees ADD COLUMN npwp TEXT",

  // Feature B: payroll enhanced columns
  "ALTER TABLE payroll ADD COLUMN overtime_hours REAL DEFAULT 0",
  "ALTER TABLE payroll ADD COLUMN overtime_pay REAL DEFAULT 0",
  "ALTER TABLE payroll ADD COLUMN bpjs_kesehatan REAL DEFAULT 0",
  "ALTER TABLE payroll ADD COLUMN bpjs_tk REAL DEFAULT 0",
  "ALTER TABLE payroll ADD COLUMN pph21 REAL DEFAULT 0",
  "ALTER TABLE payroll ADD COLUMN late_penalty REAL DEFAULT 0",
  "ALTER TABLE payroll ADD COLUMN transport_allowance REAL DEFAULT 0",
  "ALTER TABLE payroll ADD COLUMN meal_allowance REAL DEFAULT 0",
  "ALTER TABLE payroll ADD COLUMN bank_account_id INTEGER",

  // Feature D: shifts late_penalty
  "ALTER TABLE shifts ADD COLUMN late_penalty REAL DEFAULT 0",
  "ALTER TABLE shifts ADD COLUMN employee_id INTEGER",

  // Feature F: inventory avg_cost
  "ALTER TABLE inventory_items ADD COLUMN avg_cost REAL DEFAULT 0",
  "ALTER TABLE inventory_receipts ADD COLUMN unit_price REAL DEFAULT 0",
  "ALTER TABLE inventory_receipts ADD COLUMN total_value REAL DEFAULT 0",
  "ALTER TABLE inventory_issues ADD COLUMN unit_cost REAL DEFAULT 0",
  "ALTER TABLE inventory_issues ADD COLUMN total_cost REAL DEFAULT 0",
  "ALTER TABLE inventory_issues ADD COLUMN project_id INTEGER",

  // Feature G/H: transactions & bank_accounts enhancements
  "ALTER TABLE transactions ADD COLUMN project_id INTEGER",
  "ALTER TABLE transactions ADD COLUMN reconciled INTEGER DEFAULT 0",
  "ALTER TABLE bank_accounts ADD COLUMN initial_balance REAL DEFAULT 0",
  "ALTER TABLE purchases ADD COLUMN project_id INTEGER",

  // Feature H: purchase_orders project_id already added in CREATE
  // bank_accounts: add coa_id
  "ALTER TABLE bank_accounts ADD COLUMN coa_id INTEGER",
  "ALTER TABLE bank_accounts ADD COLUMN status TEXT DEFAULT 'Aktif'",
];

for (const sql of alters) {
  try { db.exec(sql); } catch (e) { /* column already exists, skip */ }
}

export default db;
