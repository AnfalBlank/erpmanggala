import bcrypt from 'bcryptjs';
import db from './init.js';

const hash = (p) => bcrypt.hashSync(p, 10);

const users = [
  { name: 'Super Admin', email: 'superadmin@manggala.id', password_hash: hash('admin123'), role: 'Super Admin', status: 'Aktif' },
  { name: 'Admin', email: 'admin@manggala.id', password_hash: hash('admin123'), role: 'Admin', status: 'Aktif' },
  { name: 'Finance', email: 'finance@manggala.id', password_hash: hash('admin123'), role: 'Finance', status: 'Aktif' },
  { name: 'Staff', email: 'staff@manggala.id', password_hash: hash('admin123'), role: 'Staff', status: 'Aktif' },
];

const insertUser = db.prepare(`INSERT OR IGNORE INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`);
for (const u of users) insertUser.run(u.name, u.email, u.password_hash, u.role, u.status);

const employees = [
  { name: 'Budi Santoso', position: 'Project Manager', email: 'budi@manggala.id', phone: '081234567890', salary: 12000000, status: 'Aktif' },
  { name: 'Siti Aminah', position: 'Accountant', email: 'siti@manggala.id', phone: '081234567891', salary: 9000000, status: 'Aktif' },
  { name: 'Agus Pratama', position: 'Engineer', email: 'agus@manggala.id', phone: '081234567892', salary: 10000000, status: 'Aktif' },
  { name: 'Dewi Lestari', position: 'HRD', email: 'dewi@manggala.id', phone: '081234567893', salary: 9500000, status: 'Aktif' },
  { name: 'Rudi Hermawan', position: 'Technician', email: 'rudi@manggala.id', phone: '081234567894', salary: 7000000, status: 'Aktif' },
  { name: 'Rina Wulandari', position: 'Admin', email: 'rina@manggala.id', phone: '081234567895', salary: 6000000, status: 'Aktif' },
];
const insertEmp = db.prepare(`INSERT INTO employees (name, position, email, phone, salary, status, basic_salary, bpjs_kesehatan, bpjs_tk, ptkp_status, npwp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const empIds = [];
const ptkpStatuses = ['TK/0','K/0','K/1','K/2','K/3'];
for (let i = 0; i < employees.length; i++) {
  const e = employees[i];
  empIds.push(insertEmp.run(e.name, e.position, e.email, e.phone, e.salary, e.status, e.salary, i % 2, (i + 1) % 2, ptkpStatuses[i % 5], `NPWP-${String(i+1).padStart(8,'0')}`).lastInsertRowid);
}

const customers = [
  { name: 'PT Maju Jaya', contact_person: 'Andi Wijaya', email: 'andi@majujaya.com', phone: '0211234567', address: 'Jakarta Selatan', npwp: '01.234.567.8-012.000' },
  { name: 'CV Berkah Mandiri', contact_person: 'Bambang S.', email: 'bambang@berkahmandiri.com', phone: '0217654321', address: 'Jakarta Barat', npwp: '02.345.678.9-013.000' },
  { name: 'PT Sinar Abadi', contact_person: 'Charlie T.', email: 'charlie@sinarabadi.com', phone: '0219876543', address: 'Tangerang', npwp: '03.456.789.0-014.000' },
  { name: 'PT Karya Utama', contact_person: 'Diana P.', email: 'diana@karyautama.com', phone: '0215551234', address: 'Bekasi', npwp: '04.567.890.1-015.000' },
];
const insertCust = db.prepare(`INSERT INTO customers (name, contact_person, email, phone, address, npwp) VALUES (?, ?, ?, ?, ?, ?)`);
const custIds = [];
for (const c of customers) custIds.push(insertCust.run(c.name, c.contact_person, c.email, c.phone, c.address, c.npwp).lastInsertRowid);

const vendors = [
  { name: 'PT Material Prima', contact_person: 'Eko S.', email: 'eko@materialprima.com', phone: '0211112233', address: 'Jakarta Utara' },
  { name: 'CV Teknik Unggul', contact_person: 'Fajar R.', email: 'fajar@teknikunggul.com', phone: '0214445566', address: 'Cikarang' },
  { name: 'PT Supply Chain Indo', contact_person: 'Gunawan H.', email: 'gunawan@supplychain.com', phone: '0217778899', address: 'Karawang' },
];
const insertVen = db.prepare(`INSERT INTO vendors (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)`);
const venIds = [];
for (const v of vendors) venIds.push(insertVen.run(v.name, v.contact_person, v.email, v.phone, v.address).lastInsertRowid);

const projects = [
  { name: 'Instalasi MEP Gedung A', client_id: custIds[0], status: 'Running', start_date: '2026-01-15', end_date: '2026-06-30', value: 500000000, description: 'Instalasi MEP lengkap Gedung A' },
  { name: 'Maintenance AC Gedung B', client_id: custIds[1], status: 'Running', start_date: '2026-02-01', end_date: '2026-12-31', value: 120000000, description: 'Maintenance AC tahunan' },
  { name: 'Pemasangan Fire Alarm', client_id: custIds[0], status: 'Planning', start_date: '2026-05-01', end_date: '2026-08-31', value: 250000000, description: 'Sistem fire alarm gedung 15 lantai' },
  { name: 'Renovasi Elektrikal', client_id: custIds[2], status: 'Done', start_date: '2025-10-01', end_date: '2026-03-31', value: 180000000, description: 'Renovasi elektrikal pabrik' },
  { name: 'HVAC System Factory', client_id: custIds[3], status: 'Planning', start_date: '2026-06-01', end_date: '2026-12-31', value: 350000000, description: 'HVAC system pabrik baru' },
];
const insertProj = db.prepare(`INSERT INTO projects (name, client_id, status, start_date, end_date, value, description) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const projIds = [];
for (const p of projects) projIds.push(insertProj.run(p.name, p.client_id, p.status, p.start_date, p.end_date, p.value, p.description).lastInsertRowid);

const invoices = [
  { number: 'INV-2026-001', client_id: custIds[0], project_id: projIds[0], date: '2026-03-01', due_date: '2026-03-31', subtotal: 125000000, tax: 12500000, total: 137500000, status: 'Paid', items_json: JSON.stringify([{desc:'Termin 1 MEP Gedung A',qty:1,price:125000000}]) },
  { number: 'INV-2026-002', client_id: custIds[1], project_id: projIds[1], date: '2026-03-15', due_date: '2026-04-15', subtotal: 10000000, tax: 1000000, total: 11000000, status: 'Sent', items_json: JSON.stringify([{desc:'Maintenance Q1',qty:1,price:10000000}]) },
  { number: 'INV-2026-003', client_id: custIds[0], project_id: projIds[0], date: '2026-04-01', due_date: '2026-04-30', subtotal: 125000000, tax: 12500000, total: 137500000, status: 'Sent', items_json: JSON.stringify([{desc:'Termin 2 MEP Gedung A',qty:1,price:125000000}]) },
  { number: 'INV-2026-004', client_id: custIds[2], project_id: projIds[3], date: '2026-02-01', due_date: '2026-02-28', subtotal: 180000000, tax: 18000000, total: 198000000, status: 'Paid', items_json: JSON.stringify([{desc:'Renovasi Elektrikal Final',qty:1,price:180000000}]) },
  { number: 'INV-2026-005', client_id: custIds[3], project_id: projIds[4], date: '2026-06-01', due_date: '2026-07-01', subtotal: 87500000, tax: 8750000, total: 96250000, status: 'Draft', items_json: JSON.stringify([{desc:'DP HVAC System',qty:1,price:87500000}]) },
];
const insertInv = db.prepare(`INSERT INTO invoices (number, client_id, project_id, date, due_date, subtotal, tax, total, status, items_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
for (const i of invoices) insertInv.run(i.number, i.client_id, i.project_id, i.date, i.due_date, i.subtotal, i.tax, i.total, i.status, i.items_json);

const purchases = [
  { number: 'PO-2026-001', vendor_id: venIds[0], date: '2026-01-20', items_json: JSON.stringify([{desc:'Kabel NYM 3x2.5',qty:1000,price:15000},{desc:'MCB 16A',qty:50,price:85000}]), total: 19250000, status: 'Received' },
  { number: 'PO-2026-002', vendor_id: venIds[1], date: '2026-02-05', items_json: JSON.stringify([{desc:'AC Split 2PK',qty:20,price:5500000}]), total: 110000000, status: 'Partial' },
  { number: 'PO-2026-003', vendor_id: venIds[2], date: '2026-03-10', items_json: JSON.stringify([{desc:'Pipe PVC 4"',qty:200,price:45000},{desc:'Fitting assorted',qty:100,price:25000}]), total: 11500000, status: 'Ordered' },
];
const insertPur = db.prepare(`INSERT INTO purchases (number, vendor_id, date, items_json, total, status) VALUES (?, ?, ?, ?, ?, ?)`);
for (const p of purchases) insertPur.run(p.number, p.vendor_id, p.date, p.items_json, p.total, p.status);

const warehouses = [
  { name: 'Gudang Utama', location: 'Jakarta Timur' },
  { name: 'Gudang Proyek A', location: 'Jakarta Selatan' },
];
const insertWh = db.prepare(`INSERT INTO warehouses (name, location) VALUES (?, ?)`);
const whIds = [];
for (const w of warehouses) whIds.push(insertWh.run(w.name, w.location).lastInsertRowid);

const invItems = [
  { name: 'Kabel NYM 3x2.5', sku: 'ELK-001', category: 'Elektrikal', unit: 'meter', stock: 5000, min_stock: 1000, price: 15000, warehouse_id: whIds[0] },
  { name: 'MCB 16A', sku: 'ELK-002', category: 'Elektrikal', unit: 'pcs', stock: 100, min_stock: 20, price: 85000, warehouse_id: whIds[0] },
  { name: 'AC Split 2PK', sku: 'MEP-001', category: 'MEP', unit: 'unit', stock: 15, min_stock: 5, price: 5500000, warehouse_id: whIds[1] },
  { name: 'Pipe PVC 4 inch', sku: 'PLB-001', category: 'Plumbing', unit: 'pcs', stock: 500, min_stock: 100, price: 45000, warehouse_id: whIds[0] },
  { name: 'Fire Alarm Detector', sku: 'FIRE-001', category: 'Fire System', unit: 'pcs', stock: 3, min_stock: 10, price: 350000, warehouse_id: whIds[1] },
  { name: 'Cable Tray', sku: 'ELK-003', category: 'Elektrikal', unit: 'meter', stock: 200, min_stock: 50, price: 120000, warehouse_id: whIds[0] },
];
const insertItem = db.prepare(`INSERT INTO inventory_items (name, sku, category, unit, stock, min_stock, price, warehouse_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const itemIds = [];
for (const i of invItems) itemIds.push(insertItem.run(i.name, i.sku, i.category, i.unit, i.stock, i.min_stock, i.price, i.warehouse_id).lastInsertRowid);

const receipts = [
  { item_id: itemIds[0], qty: 5000, date: '2026-01-25', reference: 'PO-2026-001', notes: 'Penerimaan kabel' },
  { item_id: itemIds[1], qty: 50, date: '2026-01-25', reference: 'PO-2026-001', notes: 'Penerimaan MCB' },
  { item_id: itemIds[3], qty: 200, date: '2026-03-15', reference: 'PO-2026-003', notes: 'Penerimaan pipa' },
];
const insertRec = db.prepare(`INSERT INTO inventory_receipts (item_id, qty, date, reference, notes) VALUES (?, ?, ?, ?, ?)`);
for (const r of receipts) insertRec.run(r.item_id, r.qty, r.date, r.reference, r.notes);

const issues = [
  { item_id: itemIds[0], qty: 2000, date: '2026-02-01', reference: 'PROJ-001', notes: 'Untuk Gedung A' },
  { item_id: itemIds[1], qty: 30, date: '2026-02-01', reference: 'PROJ-001', notes: 'Untuk Gedung A' },
];
const insertIss = db.prepare(`INSERT INTO inventory_issues (item_id, qty, date, reference, notes) VALUES (?, ?, ?, ?, ?)`);
for (const i of issues) insertIss.run(i.item_id, i.qty, i.date, i.reference, i.notes);

const bankAccounts = [
  { name: 'BCA Operasional', bank: 'BCA', account_number: '1234567890', balance: 250000000 },
  { name: 'Mandiri Proyek', bank: 'Mandiri', account_number: '0987654321', balance: 180000000 },
  { name: 'BNI Payroll', bank: 'BNI', account_number: '1122334455', balance: 75000000 },
];
const insertBA = db.prepare(`INSERT INTO bank_accounts (name, bank, account_number, balance) VALUES (?, ?, ?, ?)`);
const baIds = [];
for (const b of bankAccounts) baIds.push(insertBA.run(b.name, b.bank, b.account_number, b.balance).lastInsertRowid);

const transactions = [
  { type: 'income', account_id: baIds[0], amount: 137500000, date: '2026-03-05', description: 'Pembayaran INV-2026-001', reference: 'INV-2026-001', category: 'Project Revenue' },
  { type: 'income', account_id: baIds[1], amount: 198000000, date: '2026-02-15', description: 'Pembayaran INV-2026-004', reference: 'INV-2026-004', category: 'Project Revenue' },
  { type: 'expense', account_id: baIds[0], amount: 19250000, date: '2026-01-20', description: 'Pembelian PO-2026-001', reference: 'PO-2026-001', category: 'Material' },
  { type: 'expense', account_id: baIds[1], amount: 110000000, date: '2026-02-05', description: 'Pembelian PO-2026-002', reference: 'PO-2026-002', category: 'Material' },
  { type: 'expense', account_id: baIds[2], amount: 53500000, date: '2026-03-25', description: 'Gaji Maret 2026', reference: 'PAY-2026-03', category: 'Payroll' },
  { type: 'income', account_id: baIds[0], amount: 50000000, date: '2026-04-01', description: 'DP Proyek HVAC', reference: 'DP-HVAC', category: 'Project Revenue' },
  { type: 'expense', account_id: baIds[0], amount: 15000000, date: '2026-04-05', description: 'Operasional bulanan', reference: 'OPS-2026-04', category: 'Operational' },
  { type: 'expense', account_id: baIds[0], amount: 5000000, date: '2026-04-10', description: 'Biaya transportasi', reference: 'TRP-2026-04', category: 'Transport' },
  { type: 'income', account_id: baIds[1], amount: 11000000, date: '2026-03-20', description: 'Maintenance Q1', reference: 'INV-2026-002', category: 'Service Revenue' },
  { type: 'expense', account_id: baIds[0], amount: 8000000, date: '2026-03-15', description: 'Sewa alat berat', reference: 'RNT-2026-03', category: 'Rental' },
];
const insertTrx = db.prepare(`INSERT INTO transactions (type, account_id, amount, date, description, reference, category) VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const t of transactions) insertTrx.run(t.type, t.account_id, t.amount, t.date, t.description, t.reference, t.category);

const coaAccounts = [
  { code: '1-1000', name: 'Kas & Bank', type: 'Asset', parent_id: null },
  { code: '1-1100', name: 'BCA Operasional', type: 'Asset', parent_id: null },
  { code: '1-1200', name: 'Mandiri Proyek', type: 'Asset', parent_id: null },
  { code: '1-1300', name: 'Piutang Usaha', type: 'Asset', parent_id: null },
  { code: '1-1400', name: 'Persediaan', type: 'Asset', parent_id: null },
  { code: '1-1500', name: 'Aset Tetap', type: 'Asset', parent_id: null },
  { code: '2-1000', name: 'Hutang Usaha', type: 'Liability', parent_id: null },
  { code: '2-1100', name: 'Hutang Pajak', type: 'Liability', parent_id: null },
  { code: '3-1000', name: 'Modal', type: 'Equity', parent_id: null },
  { code: '3-1100', name: 'Labaruga Ditahan', type: 'Equity', parent_id: null },
  { code: '4-1000', name: 'Pendapatan Proyek', type: 'Income', parent_id: null },
  { code: '4-1100', name: 'Pendapatan Jasa', type: 'Income', parent_id: null },
  { code: '4-1200', name: 'Pendapatan Lain-lain', type: 'Income', parent_id: null },
  { code: '5-1000', name: 'Bahan Material', type: 'Expense', parent_id: null },
  { code: '5-1100', name: 'Gaji & Upah', type: 'Expense', parent_id: null },
  { code: '5-1200', name: 'Operasional', type: 'Expense', parent_id: null },
  { code: '5-1300', name: 'Sewa', type: 'Expense', parent_id: null },
  { code: '5-1400', name: 'Transportasi', type: 'Expense', parent_id: null },
];
const insertCOA = db.prepare(`INSERT INTO coa_accounts (code, name, type, parent_id) VALUES (?, ?, ?, ?)`);
for (const c of coaAccounts) insertCOA.run(c.code, c.name, c.type, c.parent_id);

const shifts = [
  { name: 'Shift Pagi', start_time: '07:00', end_time: '15:00' },
  { name: 'Shift Siang', start_time: '15:00', end_time: '23:00' },
  { name: 'Shift Malam', start_time: '23:00', end_time: '07:00' },
];
const insertShift = db.prepare(`INSERT INTO shifts (name, start_time, end_time) VALUES (?, ?, ?)`);
for (const s of shifts) insertShift.run(s.name, s.start_time, s.end_time);

const attendanceData = [];
const statuses = ['Hadir', 'Hadir', 'Hadir', 'Hadir', 'Izin', 'Hadir', 'Hadir'];
for (let empIdx = 0; empIdx < empIds.length; empIdx++) {
  for (let d = 1; d <= 17; d++) {
    const date = `2026-04-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    const st = statuses[Math.floor(Math.random() * statuses.length)];
    attendanceData.push({
      employee_id: empIds[empIdx], date, check_in: st === 'Hadir' ? `0${7 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
      check_out: st === 'Hadir' ? `1${5 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
      status: st
    });
  }
}
const insertAtt = db.prepare(`INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)`);
for (const a of attendanceData) insertAtt.run(a.employee_id, a.date, a.check_in, a.check_out, a.status);

const leaveRequests = [
  { employee_id: empIds[0], type: 'Cuti Tahunan', start_date: '2026-04-20', end_date: '2026-04-22', reason: 'Acara keluarga', status: 'Approved', approved_by: 1 },
  { employee_id: empIds[2], type: 'Sakit', start_date: '2026-04-15', end_date: '2026-04-16', reason: 'Demam', status: 'Approved', approved_by: 1 },
  { employee_id: empIds[4], type: 'Cuti Tahunan', start_date: '2026-05-01', end_date: '2026-05-03', reason: 'Liburan', status: 'Pending', approved_by: null },
];
const insertLeave = db.prepare(`INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const l of leaveRequests) insertLeave.run(l.employee_id, l.type, l.start_date, l.end_date, l.reason, l.status, l.approved_by);

const payrollData = empIds.map((eid, idx) => {
  const basic = employees[idx].salary;
  const allowances = Math.round(basic * 0.15);
  const deductions = Math.round(basic * 0.05);
  return { employee_id: eid, period: '2026-03', basic_salary: basic, allowances, deductions, net_salary: basic + allowances - deductions, status: 'Paid' };
});
payrollData.push({ employee_id: empIds[0], period: '2026-04', basic_salary: 12000000, allowances: 1800000, deductions: 600000, net_salary: 13200000, status: 'Draft' });
const insertPayroll = db.prepare(`INSERT INTO payroll (employee_id, period, basic_salary, allowances, deductions, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const p of payrollData) insertPayroll.run(p.employee_id, p.period, p.basic_salary, p.allowances, p.deductions, p.net_salary, p.status);

const fixedAssets = [
  { name: 'Mobil Operasional', category: 'Kendaraan', purchase_date: '2024-01-15', purchase_price: 250000000, useful_life: 8, current_value: 187500000 },
  { name: 'Genset 500KVA', category: 'Peralatan', purchase_date: '2023-06-01', purchase_price: 150000000, useful_life: 10, current_value: 120000000 },
  { name: 'Komputer Kantor (10 unit)', category: 'IT', purchase_date: '2025-01-10', purchase_price: 80000000, useful_life: 4, current_value: 60000000 },
  { name: 'Alat Las TIG/MMA', category: 'Peralatan', purchase_date: '2024-08-20', purchase_price: 25000000, useful_life: 5, current_value: 20000000 },
];
const insertFA = db.prepare(`INSERT INTO fixed_assets (name, category, purchase_date, purchase_price, useful_life, current_value) VALUES (?, ?, ?, ?, ?, ?)`);
for (const f of fixedAssets) insertFA.run(f.name, f.category, f.purchase_date, f.purchase_price, f.useful_life, f.current_value);

const taxes = [
  { name: 'PPN', rate: 11, type: 'Output' },
  { name: 'PPH 23', rate: 2, type: 'Withholding' },
  { name: 'PPH 21', rate: 5, type: 'Income Tax' },
  { name: 'PPN Masukan', rate: 11, type: 'Input' },
];
const insertTax = db.prepare(`INSERT INTO taxes (name, rate, type) VALUES (?, ?, ?)`);
for (const t of taxes) insertTax.run(t.name, t.rate, t.type);

db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('company_name', 'PT Manggala Utama Indonesia');
db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('company_address', 'Jakarta, Indonesia');

console.log('✅ Seed data inserted successfully');
