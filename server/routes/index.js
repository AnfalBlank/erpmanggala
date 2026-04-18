import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import db from '../db/init.js';

const router = Router();
router.use(authMiddleware);

// Helper: apply middleware only if roles provided, else passthrough
const maybeRole = (...roles) => roles.length ? roleMiddleware(...roles) : (req, res, next) => next();

// Helper: get employee_id for current user (match users.email to employees.email)
function getEmployeeIdForUser(req) {
  const row = db.prepare('SELECT id FROM employees WHERE email = ?').get(req.user.email);
  return row ? row.id : null;
}

// Generic CRUD with optional read/write role guards
const crud = (table, opts = {}) => {
  const { readRoles, writeRoles } = opts;

  router.get(`/${table}`, maybeRole(...(readRoles || [])), (req, res) => {
    const { search, page = 1, limit = 50, status } = req.query;
    let sql = `SELECT * FROM ${table} WHERE 1=1`;
    const params = [];
    if (search) { sql += ` AND name LIKE ?`; params.push(`%${search}%`); }
    if (status) { sql += ` AND status = ?`; params.push(status); }
    sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const rows = db.prepare(sql).all(...params);
    let countSql = `SELECT COUNT(*) as total FROM ${table} WHERE 1=1`;
    const countParams = [];
    if (search) { countSql += ` AND name LIKE ?`; countParams.push(`%${search}%`); }
    if (status) { countSql += ` AND status = ?`; countParams.push(status); }
    const { total } = db.prepare(countSql).get(...countParams);
    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  });

  router.get(`/${table}/:id`, maybeRole(...(readRoles || [])), (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.post(`/${table}`, maybeRole(...(writeRoles || [])), (req, res) => {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map(() => '?').join(',');
    const result = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`).run(...values);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid);
    res.json(row);
  });

  router.put(`/${table}/:id`, maybeRole(...(writeRoles || [])), (req, res) => {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const setClause = keys.map(k => `${k} = ?`).join(',');
    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    res.json(row);
  });

  router.delete(`/${table}/:id`, maybeRole(...(writeRoles || [])), (req, res) => {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  });
};

// ── Main tables ──
// Super Admin + Admin: write; all authenticated: read
crud('projects', { writeRoles: ['Super Admin', 'Admin'] });
crud('customers', { writeRoles: ['Super Admin', 'Admin'] });
crud('vendors', { writeRoles: ['Super Admin', 'Admin'] });
crud('employees', { writeRoles: ['Super Admin', 'Admin'] });
// Finance also gets full access to invoices & purchases
crud('invoices', { writeRoles: ['Super Admin', 'Admin', 'Finance'] });
crud('purchases', { writeRoles: ['Super Admin', 'Admin', 'Finance'] });

// ── Inventory ──
router.get('/inventory/items', (req, res) => {
  const { search, page = 1, limit = 50, category } = req.query;
  let sql = `SELECT i.*, w.name as warehouse_name FROM inventory_items i LEFT JOIN warehouses w ON i.warehouse_id = w.id WHERE 1=1`;
  const params = [];
  if (search) { sql += ` AND (i.name LIKE ? OR i.sku LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (category) { sql += ` AND i.category = ?`; params.push(category); }
  sql += ` ORDER BY i.id DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  res.json({ data: db.prepare(sql).all(...params), total: db.prepare(`SELECT COUNT(*) as t FROM inventory_items i WHERE 1=1${search ? ` AND (i.name LIKE '%${search}%' OR i.sku LIKE '%${search}%')` : ''}${category ? ` AND i.category = '${category}'` : ''}`).get().t, page: Number(page), limit: Number(limit) });
});
router.get('/inventory/items/:id', (req, res) => res.json(db.prepare('SELECT * FROM inventory_items WHERE id=?').get(req.params.id)));
router.post('/inventory/items', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => { const r = db.prepare('INSERT INTO inventory_items (name,sku,category,unit,stock,min_stock,price,warehouse_id) VALUES (?,?,?,?,?,?,?,?)').run(req.body.name,req.body.sku,req.body.category,req.body.unit,req.body.stock||0,req.body.min_stock||0,req.body.price,req.body.warehouse_id); res.json(db.prepare('SELECT * FROM inventory_items WHERE id=?').get(r.lastInsertRowid)); });
router.put('/inventory/items/:id', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => { db.prepare('UPDATE inventory_items SET name=?,sku=?,category=?,unit=?,stock=?,min_stock=?,price=?,warehouse_id=? WHERE id=?').run(req.body.name,req.body.sku,req.body.category,req.body.unit,req.body.stock,req.body.min_stock,req.body.price,req.body.warehouse_id,req.params.id); res.json(db.prepare('SELECT * FROM inventory_items WHERE id=?').get(req.params.id)); });
router.delete('/inventory/items/:id', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => { db.prepare('DELETE FROM inventory_items WHERE id=?').run(req.params.id); res.json({success:true}); });

// Warehouses: read for all, write for Super Admin + Admin
crud('warehouses', { writeRoles: ['Super Admin', 'Admin'] });

// Inventory receipts/issues: Super Admin + Admin + Staff
['inventory_receipts', 'inventory_issues'].forEach(t => {
  router.get(`/${t}`, (req, res) => {
    const data = db.prepare(`SELECT r.*, i.name as item_name FROM ${t} r LEFT JOIN inventory_items i ON r.item_id = i.id ORDER BY r.id DESC`).all();
    res.json({ data });
  });
  router.post(`/${t}`, roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
    const r = db.prepare(`INSERT INTO ${t} (item_id,qty,date,reference,notes) VALUES (?,?,?,?,?)`).run(req.body.item_id,req.body.qty,req.body.date,req.body.reference,req.body.notes);
    const op = t === 'inventory_receipts' ? '+' : '-';
    db.prepare(`UPDATE inventory_items SET stock = stock ${op} ? WHERE id = ?`).run(req.body.qty, req.body.item_id);
    res.json(db.prepare(`SELECT * FROM ${t} WHERE id=?`).get(r.lastInsertRowid));
  });
  router.delete(`/${t}/:id`, roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => { db.prepare(`DELETE FROM ${t} WHERE id=?`).run(req.params.id); res.json({success:true}); });
});

// ── Banking ──
crud('bank_accounts', { readRoles: ['Super Admin', 'Admin', 'Finance'], writeRoles: ['Super Admin', 'Admin', 'Finance'] });

router.get('/banking/transactions', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  const { type, page = 1, limit = 50, account_id } = req.query;
  let sql = `SELECT t.*, b.name as account_name FROM transactions t LEFT JOIN bank_accounts b ON t.account_id = b.id WHERE 1=1`;
  const params = [];
  if (type) { sql += ` AND t.type = ?`; params.push(type); }
  if (account_id) { sql += ` AND t.account_id = ?`; params.push(account_id); }
  sql += ` ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const data = db.prepare(sql).all(...params);
  res.json({ data, total: data.length, page: Number(page) });
});
router.post('/banking/transactions', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  const r = db.prepare('INSERT INTO transactions (type,account_id,amount,date,description,reference,category) VALUES (?,?,?,?,?,?,?)').run(req.body.type,req.body.account_id,req.body.amount,req.body.date,req.body.description,req.body.reference,req.body.category);
  const op = req.body.type === 'income' ? '+' : '-';
  db.prepare(`UPDATE bank_accounts SET balance = balance ${op} ? WHERE id = ?`).run(req.body.amount, req.body.account_id);
  res.json(db.prepare('SELECT * FROM transactions WHERE id=?').get(r.lastInsertRowid));
});
router.delete('/banking/transactions/:id', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => { db.prepare('DELETE FROM transactions WHERE id=?').run(req.params.id); res.json({success:true}); });

// ── Finance ──
crud('coa_accounts', { readRoles: ['Super Admin', 'Admin', 'Finance'], writeRoles: ['Super Admin', 'Admin', 'Finance'] });
crud('taxes', { readRoles: ['Super Admin', 'Admin', 'Finance'], writeRoles: ['Super Admin', 'Admin', 'Finance'] });
crud('fixed_assets', { readRoles: ['Super Admin', 'Admin', 'Finance'], writeRoles: ['Super Admin', 'Admin', 'Finance'] });

// ── Payroll ──
router.get('/payroll', roleMiddleware('Super Admin', 'Admin', 'Finance', 'Staff'), (req, res) => {
  const { period } = req.query;
  let sql = `SELECT p.*, e.name as employee_name FROM payroll p LEFT JOIN employees e ON p.employee_id = e.id WHERE 1=1`;
  const params = [];
  // Staff: only see own payroll
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (empId) { sql += ` AND p.employee_id = ?`; params.push(empId); }
    else { return res.json({ data: [] }); }
  }
  if (period) { sql += ` AND p.period = ?`; params.push(period); }
  sql += ` ORDER BY p.id DESC`;
  res.json({ data: db.prepare(sql).all(...params) });
});
router.post('/payroll', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const r = db.prepare('INSERT INTO payroll (employee_id,period,basic_salary,allowances,deductions,net_salary,status) VALUES (?,?,?,?,?,?,?)').run(req.body.employee_id,req.body.period,req.body.basic_salary,req.body.allowances,req.body.deductions,req.body.net_salary,req.body.status||'Draft');
  res.json(db.prepare('SELECT p.*,e.name as employee_name FROM payroll p LEFT JOIN employees e ON p.employee_id=e.id WHERE p.id=?').get(r.lastInsertRowid));
});
router.put('/payroll/:id', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  db.prepare('UPDATE payroll SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json(db.prepare('SELECT * FROM payroll WHERE id=?').get(req.params.id));
});

// ── HRD ──
router.get('/leaves', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  let sql = `SELECT l.*, e.name as employee_name FROM leave_requests l LEFT JOIN employees e ON l.employee_id = e.id WHERE 1=1`;
  const params = [];
  // Staff: only see own leaves
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (empId) { sql += ` AND l.employee_id = ?`; params.push(empId); }
    else { return res.json({ data: [] }); }
  }
  sql += ` ORDER BY l.id DESC`;
  res.json({ data: db.prepare(sql).all(...params) });
});
router.post('/leaves', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  // Staff: force employee_id to their own
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (!empId) return res.status(403).json({ error: 'Data karyawan tidak ditemukan untuk akun Anda' });
    req.body.employee_id = empId;
  }
  const r = db.prepare('INSERT INTO leave_requests (employee_id,type,start_date,end_date,reason,status) VALUES (?,?,?,?,?,?)').run(req.body.employee_id,req.body.type,req.body.start_date,req.body.end_date,req.body.reason,'Pending');
  res.json(db.prepare('SELECT l.*,e.name as employee_name FROM leave_requests l LEFT JOIN employees e ON l.employee_id=e.id WHERE l.id=?').get(r.lastInsertRowid));
});
router.put('/leaves/:id', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  db.prepare('UPDATE leave_requests SET status=?, approved_by=? WHERE id=?').run(req.body.status, req.body.approved_by||null, req.params.id);
  res.json(db.prepare('SELECT * FROM leave_requests WHERE id=?').get(req.params.id));
});

// Shifts: Super Admin + Admin + Staff
crud('shifts', { readRoles: ['Super Admin', 'Admin', 'Staff'], writeRoles: ['Super Admin', 'Admin'] });

router.get('/attendance', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  const { date, employee_id } = req.query;
  let sql = `SELECT a.*, e.name as employee_name FROM attendance a LEFT JOIN employees e ON a.employee_id = e.id WHERE 1=1`;
  const params = [];
  // Staff: only see own attendance
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (empId) { sql += ` AND a.employee_id = ?`; params.push(empId); }
    else { return res.json({ data: [] }); }
  }
  if (date) { sql += ` AND a.date = ?`; params.push(date); }
  if (employee_id && req.user.role !== 'Staff') { sql += ` AND a.employee_id = ?`; params.push(employee_id); }
  sql += ` ORDER BY a.date DESC, a.id DESC`;
  res.json({ data: db.prepare(sql).all(...params) });
});
router.post('/attendance', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  // Staff: force employee_id to their own
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (!empId) return res.status(403).json({ error: 'Data karyawan tidak ditemukan untuk akun Anda' });
    req.body.employee_id = empId;
  }
  const r = db.prepare('INSERT INTO attendance (employee_id,date,check_in,check_out,status) VALUES (?,?,?,?,?)').run(req.body.employee_id,req.body.date,req.body.check_in,req.body.check_out,req.body.status||'Hadir');
  res.json(db.prepare('SELECT a.*,e.name as employee_name FROM attendance a LEFT JOIN employees e ON a.employee_id=e.id WHERE a.id=?').get(r.lastInsertRowid));
});
router.put('/attendance/:id', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  // Staff: only allow updating own records
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id);
    if (!record || record.employee_id !== empId) return res.status(403).json({ error: 'Anda hanya bisa mengubah absensi sendiri' });
  }
  db.prepare('UPDATE attendance SET check_in=?,check_out=?,status=? WHERE id=?').run(req.body.check_in,req.body.check_out,req.body.status,req.params.id);
  res.json(db.prepare('SELECT * FROM attendance WHERE id=?').get(req.params.id));
});

// ── Users: Super Admin only ──
router.get('/users', roleMiddleware('Super Admin'), (req, res) => {
  const data = db.prepare('SELECT id,name,email,role,status,created_at FROM users ORDER BY id').all();
  res.json({ data });
});
router.post('/users', roleMiddleware('Super Admin'), (req, res) => {
  const hash = bcrypt.hashSync(req.body.password || 'admin123', 10);
  const r = db.prepare('INSERT INTO users (name,email,password_hash,role,status) VALUES (?,?,?,?,?)').run(req.body.name,req.body.email,hash,req.body.role||'Staff',req.body.status||'Aktif');
  res.json({ id: r.lastInsertRowid, name: req.body.name, email: req.body.email, role: req.body.role });
});
router.put('/users/:id', roleMiddleware('Super Admin'), (req, res) => {
  if (req.body.password) {
    const hash = bcrypt.hashSync(req.body.password, 10);
    db.prepare('UPDATE users SET name=?,email=?,role=?,status=?,password_hash=? WHERE id=?').run(req.body.name,req.body.email,req.body.role,req.body.status,hash,req.params.id);
  } else {
    db.prepare('UPDATE users SET name=?,email=?,role=?,status=? WHERE id=?').run(req.body.name,req.body.email,req.body.role,req.body.status,req.params.id);
  }
  res.json({ success: true });
});
router.delete('/users/:id', roleMiddleware('Super Admin'), (req, res) => { db.prepare('DELETE FROM users WHERE id=?').run(req.params.id); res.json({success:true}); });

// ── Settings: Super Admin only ──
router.get('/settings', roleMiddleware('Super Admin'), (req, res) => {
  const data = db.prepare('SELECT * FROM settings').all();
  res.json(data.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {}));
});
router.put('/settings', roleMiddleware('Super Admin'), (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
  res.json({ success: true });
});

// ── Dashboard: all authenticated ──
router.get('/reports/dashboard', (req, res) => {
  // Staff: return personal dashboard data
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (!empId) return res.json({ isStaff: true, attendanceSummary: {}, todayShift: null, leaveBalance: 0, lastPayroll: null });

    const today = new Date().toISOString().slice(0, 10);
    // Today's attendance
    const todayAtt = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(empId, today);
    // Attendance this month
    const monthStart = today.slice(0, 7) + '-01';
    const monthAtt = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE employee_id = ? AND date >= ? AND status = "Hadir"').get(empId, monthStart).c;
    // Shifts
    const shifts = db.prepare('SELECT * FROM shifts ORDER BY id').all();
    // Leave balance (simple: 12 - used this year)
    const yearStart = today.slice(0, 4) + '-01-01';
    const usedLeaves = db.prepare("SELECT COALESCE(SUM(julianday(end_date)-julianday(start_date)+1),0) as days FROM leave_requests WHERE employee_id = ? AND status = 'Approved' AND start_date >= ?").get(empId, yearStart).days;
    // Last payroll
    const lastPay = db.prepare('SELECT p.*, e.name as employee_name FROM payroll p LEFT JOIN employees e ON p.employee_id = e.id WHERE p.employee_id = ? ORDER BY p.id DESC LIMIT 1').get(empId);
    // Last 7 days attendance
    const recentAtt = db.prepare('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 7').all(empId);

    return res.json({
      isStaff: true,
      employeeId: empId,
      todayAttendance: todayAtt || null,
      monthAttendance: monthAtt,
      shifts,
      leaveBalance: Math.max(0, 12 - usedLeaves),
      usedLeaves,
      lastPayroll: lastPay || null,
      recentAttendance: recentAtt
    });
  }

  // Admin/Finance full dashboard
  const income = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='income'").get().total;
  const expense = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='expense'").get().total;
  const profit = income - expense;
  const opExpense = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='expense' AND category NOT IN ('Material','Payroll')").get().total;
  const projectStatuses = db.prepare("SELECT status, COUNT(*) as count FROM projects GROUP BY status").all();
  const dueInvoices = db.prepare("SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN customers c ON i.client_id = c.id WHERE i.status IN ('Draft','Sent') AND i.due_date >= date('now') ORDER BY i.due_date ASC LIMIT 10").all();
  const overdueInvoices = db.prepare("SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN customers c ON i.client_id = c.id WHERE i.status IN ('Draft','Sent') AND i.due_date < date('now')").all();
  const cashFlow = db.prepare("SELECT substr(date,1,7) as month, type, SUM(amount) as total FROM transactions GROUP BY substr(date,1,7), type ORDER BY month").all();
  const lowStock = db.prepare("SELECT * FROM inventory_items WHERE stock <= min_stock").all();
  const totalEmployees = db.prepare("SELECT COUNT(*) as c FROM employees WHERE status='Aktif'").get().c;
  const activeProjects = db.prepare("SELECT COUNT(*) as c FROM projects WHERE status='Running'").get().c;

  res.json({ income, expense, profit, opExpense, profitOps: profit + opExpense - opExpense, projectStatuses, dueInvoices, overdueInvoices, cashFlow, lowStock, totalEmployees, activeProjects });
});

export default router;
