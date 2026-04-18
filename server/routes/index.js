import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import db from '../db/init.js';

const router = Router();
router.use(authMiddleware);

// ── Audit Log Helper ──
function auditLog(req, action, tableName, recordId, oldData, newData) {
  try {
    db.prepare('INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, old_data, new_data) VALUES (?,?,?,?,?,?,?)')
      .run(req.user?.id || null, req.user?.name || 'System', action, tableName, recordId,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null);
  } catch (e) { console.error('Audit log error:', e.message); }
}

// ── Notification Helper ──
function notify(userId, type, title, message) {
  try {
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?,?,?,?)')
      .run(userId, type, title, message);
  } catch (e) { console.error('Notify error:', e.message); }
}

function notifyRole(role, type, title, message) {
  try {
    const stmt = db.prepare('SELECT id FROM users WHERE role = ? AND status = ?');
    const users = stmt.all(role, 'Aktif');
    for (const u of users) notify(u.id, type, title, message);
  } catch (e) { console.error('NotifyRole error:', e.message); }
}

// ── Journal Entry Helper (Feature C) ──
function createJournal(date, description, debitAccount, creditAccount, amount, refType, refId) {
  try {
    db.prepare('INSERT INTO journal_entries (date, description, debit_account, credit_account, amount, reference_type, reference_id) VALUES (?,?,?,?,?,?,?)')
      .run(date, description, debitAccount, creditAccount, amount, refType, refId);
  } catch (e) { console.error('Journal error:', e.message); }
}

// Helper: apply middleware only if roles provided
const maybeRole = (...roles) => roles.length ? roleMiddleware(...roles) : (req, res, next) => next();

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
crud('projects', { writeRoles: ['Super Admin', 'Admin'] });
crud('customers', { writeRoles: ['Super Admin', 'Admin'] });
crud('vendors', { writeRoles: ['Super Admin', 'Admin'] });
crud('employees', { writeRoles: ['Super Admin', 'Admin'] });
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
router.post('/inventory/items', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  const r = db.prepare('INSERT INTO inventory_items (name,sku,category,unit,stock,min_stock,price,warehouse_id,avg_cost) VALUES (?,?,?,?,?,?,?,?,?)').run(req.body.name,req.body.sku,req.body.category,req.body.unit,req.body.stock||0,req.body.min_stock||0,req.body.price,req.body.warehouse_id,req.body.avg_cost||req.body.price||0);
  res.json(db.prepare('SELECT * FROM inventory_items WHERE id=?').get(r.lastInsertRowid));
});
router.put('/inventory/items/:id', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  db.prepare('UPDATE inventory_items SET name=?,sku=?,category=?,unit=?,stock=?,min_stock=?,price=?,warehouse_id=?,avg_cost=? WHERE id=?').run(req.body.name,req.body.sku,req.body.category,req.body.unit,req.body.stock,req.body.min_stock,req.body.price,req.body.warehouse_id,req.body.avg_cost||req.body.price,req.params.id);
  res.json(db.prepare('SELECT * FROM inventory_items WHERE id=?').get(req.params.id));
});
router.delete('/inventory/items/:id', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => { db.prepare('DELETE FROM inventory_items WHERE id=?').run(req.params.id); res.json({success:true}); });

crud('warehouses', { writeRoles: ['Super Admin', 'Admin'] });

// Inventory receipts - with avg cost calculation (Feature F)
router.get('/inventory_receipts', (req, res) => {
  const data = db.prepare(`SELECT r.*, i.name as item_name, i.avg_cost FROM inventory_receipts r LEFT JOIN inventory_items i ON r.item_id = i.id ORDER BY r.id DESC`).all();
  res.json({ data });
});
router.post('/inventory_receipts', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  const { item_id, qty, date, reference, notes, unit_price } = req.body;
  const q = Number(qty);
  const up = Number(unit_price) || 0;
  const tv = q * up;

  const r = db.prepare('INSERT INTO inventory_receipts (item_id,qty,date,reference,notes,unit_price,total_value) VALUES (?,?,?,?,?,?,?)').run(item_id, q, date, reference, notes, up, tv);

  // Update stock
  db.prepare('UPDATE inventory_items SET stock = stock + ? WHERE id = ?').run(q, item_id);

  // Update avg_cost (Feature F)
  if (up > 0) {
    const item = db.prepare('SELECT stock, avg_cost FROM inventory_items WHERE id = ?').get(item_id);
    if (item) {
      const oldStock = item.stock - q;
      const newAvgCost = (oldStock * item.avg_cost + q * up) / (oldStock + q);
      db.prepare('UPDATE inventory_items SET avg_cost = ? WHERE id = ?').run(Math.round(newAvgCost), item_id);
    }
  }

  // Journal: Debit Persediaan, Credit Hutang (Feature C)
  if (up > 0) {
    createJournal(date || new Date().toISOString().slice(0,10), `Penerimaan barang ref: ${reference || '-'}`, 'Persediaan', 'Hutang Usaha', tv, 'inventory_receipt', r.lastInsertRowid);
  }

  res.json(db.prepare('SELECT * FROM inventory_receipts WHERE id=?').get(r.lastInsertRowid));
});
router.delete('/inventory_receipts/:id', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => { db.prepare('DELETE FROM inventory_receipts WHERE id=?').run(req.params.id); res.json({success:true}); });

// Inventory issues - with avg cost (Feature F) and project linking (Feature H)
router.get('/inventory_issues', (req, res) => {
  const data = db.prepare(`SELECT r.*, i.name as item_name, i.avg_cost FROM inventory_issues r LEFT JOIN inventory_items i ON r.item_id = i.id ORDER BY r.id DESC`).all();
  res.json({ data });
});
router.post('/inventory_issues', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  const { item_id, qty, date, reference, notes, project_id } = req.body;
  const q = Number(qty);

  // Get current avg_cost for costing
  const item = db.prepare('SELECT avg_cost FROM inventory_items WHERE id = ?').get(item_id);
  const uc = item ? item.avg_cost : 0;
  const tc = q * uc;

  const r = db.prepare('INSERT INTO inventory_issues (item_id,qty,date,reference,notes,unit_cost,total_cost,project_id) VALUES (?,?,?,?,?,?,?,?)').run(item_id, q, date, reference, notes, uc, tc, project_id || null);

  // Update stock
  db.prepare('UPDATE inventory_items SET stock = stock - ? WHERE id = ?').run(q, item_id);

  // Journal: Debit HPP/Beban Proyek, Credit Persediaan (Feature C)
  if (tc > 0) {
    const debitAcc = project_id ? 'Beban Proyek' : 'HPP';
    createJournal(date || new Date().toISOString().slice(0,10), `Pengeluaran barang ref: ${reference || '-'}`, debitAcc, 'Persediaan', tc, 'inventory_issue', r.lastInsertRowid);
  }

  // Update project budget actual if linked (Feature D/H)
  if (project_id) {
    updateProjectActuals(project_id);
  }

  res.json(db.prepare('SELECT * FROM inventory_issues WHERE id=?').get(r.lastInsertRowid));
});
router.delete('/inventory_issues/:id', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => { db.prepare('DELETE FROM inventory_issues WHERE id=?').run(req.params.id); res.json({success:true}); });

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
  const { type, account_id, amount, date, description, reference, category, project_id } = req.body;
  const r = db.prepare('INSERT INTO transactions (type,account_id,amount,date,description,reference,category,project_id) VALUES (?,?,?,?,?,?,?,?)').run(type, account_id, amount, date, description, reference, category, project_id || null);
  const op = type === 'income' ? '+' : '-';
  db.prepare(`UPDATE bank_accounts SET balance = balance ${op} ? WHERE id = ?`).run(amount, account_id);

  // Journal entry (Feature C)
  if (type === 'income') {
    createJournal(date, description || 'Pemasukan', 'Kas & Bank', 'Pendapatan Proyek', amount, 'transaction', r.lastInsertRowid);
  } else {
    const debitAcc = category === 'Payroll' ? 'Gaji & Upah' : category === 'Material' ? 'Bahan Material' : category === 'Rental' ? 'Sewa' : 'Operasional';
    createJournal(date, description || 'Pengeluaran', debitAcc, 'Kas & Bank', amount, 'transaction', r.lastInsertRowid);
  }

  // Update project actuals if linked (Feature H)
  if (project_id && type === 'expense') {
    updateProjectActuals(project_id);
  }

  res.json(db.prepare('SELECT * FROM transactions WHERE id=?').get(r.lastInsertRowid));
});

// Transfer internal
router.post('/banking/transfer', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  const { from_account_id, to_account_id, amount, date, description } = req.body;
  // Debit from
  db.prepare('INSERT INTO transactions (type,account_id,amount,date,description,reference,category) VALUES (?,?,?,?,?,?,?)').run('expense', from_account_id, amount, date, description || 'Transfer Internal', 'TRANSFER', 'Transfer');
  db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?').run(amount, from_account_id);
  // Credit to
  db.prepare('INSERT INTO transactions (type,account_id,amount,date,description,reference,category) VALUES (?,?,?,?,?,?,?)').run('income', to_account_id, amount, date, description || 'Transfer Internal', 'TRANSFER', 'Transfer');
  db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?').run(amount, to_account_id);
  res.json({ success: true });
});

router.delete('/banking/transactions/:id', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => { db.prepare('DELETE FROM transactions WHERE id=?').run(req.params.id); res.json({success:true}); });

// Buku Bank - running balance (Feature G)
router.get('/banking/buku-bank/:accountId', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  const { accountId } = req.params;
  const { from, to } = req.query;
  let sql = `SELECT t.*, b.name as account_name FROM transactions t LEFT JOIN bank_accounts b ON t.account_id = b.id WHERE t.account_id = ?`;
  const params = [accountId];
  if (from) { sql += ` AND t.date >= ?`; params.push(from); }
  if (to) { sql += ` AND t.date <= ?`; params.push(to); }
  sql += ` ORDER BY t.date ASC, t.id ASC`;
  const txns = db.prepare(sql).all(...params);

  const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(accountId);
  const initialBalance = account ? (account.initial_balance || account.balance) : 0;

  let running = initialBalance;
  const withBalance = txns.map(t => {
    running += t.type === 'income' ? t.amount : -t.amount;
    return { ...t, running_balance: running };
  });

  res.json({ account, transactions: withBalance, opening_balance: initialBalance, closing_balance: running });
});

// Reconcile transaction (Feature G)
router.put('/banking/transactions/:id/reconcile', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  db.prepare('UPDATE transactions SET reconciled = ? WHERE id = ?').run(req.body.reconciled ? 1 : 0, req.params.id);
  res.json({ success: true });
});

// ── Finance ──
crud('coa_accounts', { readRoles: ['Super Admin', 'Admin', 'Finance'], writeRoles: ['Super Admin', 'Admin', 'Finance'] });
crud('taxes', { readRoles: ['Super Admin', 'Admin', 'Finance'], writeRoles: ['Super Admin', 'Admin', 'Finance'] });
crud('fixed_assets', { readRoles: ['Super Admin', 'Admin', 'Finance'], writeRoles: ['Super Admin', 'Admin', 'Finance'] });

// ── Journal Entries (Feature C) ──
router.get('/journals', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  const { from, to, account, reference_type, page = 1, limit = 50 } = req.query;
  let sql = 'SELECT * FROM journal_entries WHERE 1=1';
  const params = [];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to) { sql += ' AND date <= ?'; params.push(to); }
  if (account) { sql += ' AND (debit_account LIKE ? OR credit_account LIKE ?)'; params.push(`%${account}%`, `%${account}%`); }
  if (reference_type) { sql += ' AND reference_type = ?'; params.push(reference_type); }
  sql += ' ORDER BY date DESC, id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const data = db.prepare(sql).all(...params);
  res.json({ data, total: data.length, page: Number(page) });
});

// ── Payroll Enhanced (Feature B) ──
router.get('/payroll', roleMiddleware('Super Admin', 'Admin', 'Finance', 'Staff'), (req, res) => {
  const { period } = req.query;
  let sql = `SELECT p.*, e.name as employee_name, e.basic_salary as emp_basic_salary FROM payroll p LEFT JOIN employees e ON p.employee_id = e.id WHERE 1=1`;
  const params = [];
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (empId) { sql += ` AND p.employee_id = ?`; params.push(empId); }
    else { return res.json({ data: [] }); }
  }
  if (period) { sql += ` AND p.period = ?`; params.push(period); }
  sql += ` ORDER BY p.id DESC`;
  res.json({ data: db.prepare(sql).all(...params) });
});

// Generate payroll for all employees (Feature B)
router.post('/payroll/generate', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const { period, bank_account_id } = req.body;
  if (!period) return res.status(400).json({ error: 'Period required' });

  // Delete existing drafts for this period
  db.prepare("DELETE FROM payroll WHERE period = ? AND status = 'Draft'").run(period);

  const employees = db.prepare("SELECT * FROM employees WHERE status = 'Aktif'").all();
  const periodStart = `${period}-01`;
  const periodEnd = `${period}-31`;
  const generated = [];

  for (const emp of employees) {
    const basicSalary = emp.basic_salary || emp.salary || 0;

    // Get late penalties from attendance for this period (Feature A/B)
    const lateData = db.prepare(
      "SELECT COALESCE(SUM(penalty_amount),0) as total_penalty, COALESCE(SUM(late_minutes),0) as total_minutes FROM attendance WHERE employee_id = ? AND date >= ? AND date <= ?"
    ).get(emp.id, periodStart, periodEnd);
    const latePenalty = lateData.total_penalty || 0;

    // Calculate BPJS
    const bpjsKes = emp.bpjs_kesehatan ? Math.round(basicSalary * 0.01) : 0;
    const bpjsTK = emp.bpjs_tk ? Math.round(basicSalary * 0.02) : 0;

    // PPh 21 calculation (Feature B)
    const annualIncome = basicSalary * 12;
    const ptkpMap = { 'TK/0': 54000000, 'K/0': 58500000, 'K/1': 63000000, 'K/2': 67500000, 'K/3': 72000000 };
    const ptkp = ptkpMap[emp.ptkp_status || 'TK/0'] || 54000000;
    const taxableIncome = Math.max(0, annualIncome - ptkp);
    let pph21 = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 60000000) pph21 = taxableIncome * 0.05;
      else if (taxableIncome <= 250000000) pph21 = 3000000 + (taxableIncome - 60000000) * 0.15;
      else if (taxableIncome <= 500000000) pph21 = 34500000 + (taxableIncome - 250000000) * 0.25;
      else if (taxableIncome <= 5000000000) pph21 = 97000000 + (taxableIncome - 500000000) * 0.30;
      else pph21 = pph21 = 1447000000 + (taxableIncome - 5000000000) * 0.35;
      pph21 = Math.round(pph21 / 12); // Monthly
    }

    const allowances = Math.round(basicSalary * 0.1); // Default transport
    const mealAllowance = Math.round(basicSalary * 0.05);
    const totalAllowances = allowances + mealAllowance;
    const deductions = bpjsKes + bpjsTK + pph21 + latePenalty;
    const netSalary = basicSalary + totalAllowances - deductions;

    const r = db.prepare(
      'INSERT INTO payroll (employee_id,period,basic_salary,allowances,deductions,net_salary,status,overtime_hours,overtime_pay,bpjs_kesehatan,bpjs_tk,pph21,late_penalty,transport_allowance,meal_allowance,bank_account_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(emp.id, period, basicSalary, totalAllowances, deductions, netSalary, 'Draft', 0, 0, bpjsKes, bpjsTK, pph21, latePenalty, allowances, mealAllowance, bank_account_id || null);

    generated.push(r.lastInsertRowid);
  }

  res.json({ success: true, generated: generated.length });
});

router.post('/payroll', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const r = db.prepare('INSERT INTO payroll (employee_id,period,basic_salary,allowances,deductions,net_salary,status,overtime_hours,overtime_pay,bpjs_kesehatan,bpjs_tk,pph21,late_penalty,transport_allowance,meal_allowance) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(req.body.employee_id,req.body.period,req.body.basic_salary,req.body.allowances,req.body.deductions,req.body.net_salary,req.body.status||'Draft',req.body.overtime_hours||0,req.body.overtime_pay||0,req.body.bpjs_kesehatan||0,req.body.bpjs_tk||0,req.body.pph21||0,req.body.late_penalty||0,req.body.transport_allowance||0,req.body.meal_allowance||0);
  res.json(db.prepare('SELECT p.*,e.name as employee_name FROM payroll p LEFT JOIN employees e ON p.employee_id=e.id WHERE p.id=?').get(r.lastInsertRowid));
});

router.put('/payroll/:id', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const old = db.prepare('SELECT * FROM payroll WHERE id=?').get(req.params.id);

  if (req.body.status === 'Paid' && old.status !== 'Paid') {
    // Mark as paid - create bank transaction + journal (Feature B/G)
    const bankAccountId = req.body.bank_account_id || old.bank_account_id;
    if (bankAccountId) {
      db.prepare('INSERT INTO transactions (type,account_id,amount,date,description,reference,category) VALUES (?,?,?,?,?,?,?)')
        .run('expense', bankAccountId, old.net_salary, new Date().toISOString().slice(0,10), `Payroll ${old.period}`, `PAY-${old.id}`, 'Payroll');
      db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?').run(old.net_salary, bankAccountId);
    }
    // Journal
    createJournal(new Date().toISOString().slice(0,10), `Pembayaran gaji period ${old.period}`, 'Gaji & Upah', 'Kas & Bank', old.net_salary, 'payroll', old.id);
  }

  // Allow editing payroll fields
  const fields = ['status','basic_salary','allowances','deductions','net_salary','overtime_hours','overtime_pay','bpjs_kesehetanggal','bpjs_tk','pph21','late_penalty','transport_allowance','meal_allowance','bank_account_id'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (req.body.net_salary !== undefined) updates.net_salary = req.body.net_salary;

  if (Object.keys(updates).length > 0) {
    const setClause = Object.keys(updates).map(k => `${k} = ?`).join(',');
    db.prepare(`UPDATE payroll SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  } else {
    db.prepare('UPDATE payroll SET status=? WHERE id=?').run(req.body.status, req.params.id);
  }

  res.json(db.prepare('SELECT * FROM payroll WHERE id=?').get(req.params.id));
});

// ── HRD ──
router.get('/leaves', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  let sql = `SELECT l.*, e.name as employee_name FROM leave_requests l LEFT JOIN employees e ON l.employee_id = e.id WHERE 1=1`;
  const params = [];
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (empId) { sql += ` AND l.employee_id = ?`; params.push(empId); }
    else { return res.json({ data: [] }); }
  }
  sql += ` ORDER BY l.id DESC`;
  res.json({ data: db.prepare(sql).all(...params) });
});
router.post('/leaves', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (!empId) return res.status(403).json({ error: 'Data karyawan tidak ditemukan' });
    req.body.employee_id = empId;
  }
  const r = db.prepare('INSERT INTO leave_requests (employee_id,type,start_date,end_date,reason,status) VALUES (?,?,?,?,?,?)').run(req.body.employee_id,req.body.type,req.body.start_date,req.body.end_date,req.body.reason,'Pending');
  res.json(db.prepare('SELECT l.*,e.name as employee_name FROM leave_requests l LEFT JOIN employees e ON l.employee_id=e.id WHERE l.id=?').get(r.lastInsertRowid));
});
router.put('/leaves/:id', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  db.prepare('UPDATE leave_requests SET status=?, approved_by=? WHERE id=?').run(req.body.status, req.body.approved_by||null, req.params.id);
  res.json(db.prepare('SELECT * FROM leave_requests WHERE id=?').get(req.params.id));
});

crud('shifts', { readRoles: ['Super Admin', 'Admin', 'Staff'], writeRoles: ['Super Admin', 'Admin'] });

// Attendance with late penalty (Feature A)
router.get('/attendance', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  const { date, employee_id } = req.query;
  let sql = `SELECT a.*, e.name as employee_name FROM attendance a LEFT JOIN employees e ON a.employee_id = e.id WHERE 1=1`;
  const params = [];
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
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (!empId) return res.status(403).json({ error: 'Data karyawan tidak ditemukan' });
    req.body.employee_id = empId;
  }

  let lateMinutes = 0;
  let penaltyAmount = 0;

  // Feature A: Check late penalty
  if (req.body.check_in) {
    // Get employee's shift
    const shiftRow = db.prepare('SELECT s.* FROM shifts s WHERE s.employee_id = ? ORDER BY s.id DESC LIMIT 1').get(req.body.employee_id);
    if (shiftRow && shiftRow.start_time) {
      const [shiftH, shiftM] = shiftRow.start_time.split(':').map(Number);
      const [checkH, checkM] = req.body.check_in.split(':').map(Number);
      const shiftMinutes = shiftH * 60 + shiftM;
      const checkMinutes = checkH * 60 + checkM;
      if (checkMinutes > shiftMinutes) {
        lateMinutes = checkMinutes - shiftMinutes;
        penaltyAmount = shiftRow.late_penalty || 0;
      }
    }
  }

  const r = db.prepare('INSERT INTO attendance (employee_id,date,check_in,check_out,status,late_minutes,penalty_amount) VALUES (?,?,?,?,?,?,?)')
    .run(req.body.employee_id, req.body.date, req.body.check_in, req.body.check_out, req.body.status || 'Hadir', lateMinutes, penaltyAmount);
  res.json(db.prepare('SELECT a.*,e.name as employee_name FROM attendance a LEFT JOIN employees e ON a.employee_id=e.id WHERE a.id=?').get(r.lastInsertRowid));
});

router.put('/attendance/:id', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id);
    if (!record || record.employee_id !== empId) return res.status(403).json({ error: 'Anda hanya bisa mengubah absensi sendiri' });
  }

  // Recalculate late penalty on update
  let lateMinutes = 0;
  let penaltyAmount = 0;
  if (req.body.check_in) {
    const shiftRow = db.prepare('SELECT s.* FROM shifts s WHERE s.employee_id = (SELECT employee_id FROM attendance WHERE id = ?) ORDER BY s.id DESC LIMIT 1').get(req.params.id);
    if (shiftRow && shiftRow.start_time) {
      const [shiftH, shiftM] = shiftRow.start_time.split(':').map(Number);
      const [checkH, checkM] = req.body.check_in.split(':').map(Number);
      const shiftMinutes = shiftH * 60 + shiftM;
      const checkMinutes = checkH * 60 + checkM;
      if (checkMinutes > shiftMinutes) {
        lateMinutes = checkMinutes - shiftMinutes;
        penaltyAmount = shiftRow.late_penalty || 0;
      }
    }
  }

  db.prepare('UPDATE attendance SET check_in=?,check_out=?,status=?,late_minutes=?,penalty_amount=? WHERE id=?')
    .run(req.body.check_in, req.body.check_out, req.body.status, lateMinutes, penaltyAmount, req.params.id);
  res.json(db.prepare('SELECT * FROM attendance WHERE id=?').get(req.params.id));
});

// ── Project Budgets (Feature D) ──
router.get('/projects/:id/budgets', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const data = db.prepare('SELECT * FROM project_budgets WHERE project_id = ? ORDER BY id').all(req.params.id);
  res.json({ data });
});

router.post('/projects/:id/budgets', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const r = db.prepare('INSERT INTO project_budgets (project_id,category,description,budget_amount,actual_amount) VALUES (?,?,?,?,?)')
    .run(req.params.id, req.body.category, req.body.description, req.body.budget_amount || 0, 0);
  res.json(db.prepare('SELECT * FROM project_budgets WHERE id=?').get(r.lastInsertRowid));
});

router.put('/projects/:id/budgets/:budgetId', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  db.prepare('UPDATE project_budgets SET category=?,description=?,budget_amount=? WHERE id=?')
    .run(req.body.category, req.body.description, req.body.budget_amount, req.params.budgetId);
  res.json(db.prepare('SELECT * FROM project_budgets WHERE id=?').get(req.params.budgetId));
});

router.delete('/projects/:id/budgets/:budgetId', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  db.prepare('DELETE FROM project_budgets WHERE id=?').run(req.params.budgetId);
  res.json({ success: true });
});

router.get('/projects/:id/budget-summary', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const budgets = db.prepare('SELECT * FROM project_budgets WHERE project_id = ?').all(req.params.id);
  const totalBudget = budgets.reduce((s, b) => s + (b.budget_amount || 0), 0);
  const totalActual = budgets.reduce((s, b) => s + (b.actual_amount || 0), 0);

  // Calculate actual from linked transactions + inventory issues
  const txActual = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE project_id = ? AND type = 'expense'").get(req.params.id).total;
  const issueActual = db.prepare("SELECT COALESCE(SUM(total_cost),0) as total FROM inventory_issues WHERE project_id = ?").get(req.params.id).total;
  const invoiceRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE project_id = ? AND status IN ('Paid','Sent')").get(req.params.id).total;

  const totalCost = txActual + issueActual;
  const profit = invoiceRevenue - totalCost;

  res.json({ budgets, totalBudget, totalActual: totalCost, totalCost, revenue: invoiceRevenue, profit, txActual, issueActual });
});

// Helper: update project actuals
function updateProjectActuals(projectId) {
  try {
    const txActual = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE project_id = ? AND type = 'expense'").get(projectId).total;
    const issueActual = db.prepare("SELECT COALESCE(SUM(total_cost),0) as total FROM inventory_issues WHERE project_id = ?").get(projectId).total;
    const total = txActual + issueActual;
    // Update first budget category as "Overhead" or create one
    const budget = db.prepare('SELECT id FROM project_budgets WHERE project_id = ? ORDER BY id LIMIT 1').get(projectId);
    if (budget) {
      db.prepare('UPDATE project_budgets SET actual_amount = ? WHERE id = ?').run(total, budget.id);
    }
  } catch (e) { console.error('updateProjectActuals error:', e.message); }
}

// ── Purchase Requests (Feature E) ──
router.get('/purchase-requests', roleMiddleware('Super Admin', 'Admin', 'Finance', 'Staff'), (req, res) => {
  let sql = `SELECT pr.*, p.name as project_name FROM purchase_requests pr LEFT JOIN projects p ON pr.project_id = p.id ORDER BY pr.id DESC`;
  const data = db.prepare(sql).all();
  // Get items for each PR
  for (const pr of data) {
    pr.items = db.prepare('SELECT pri.*, i.name as item_name FROM purchase_request_items pri LEFT JOIN inventory_items i ON pri.item_id = i.id WHERE pri.pr_id = ?').all(pr.id);
  }
  res.json({ data });
});

router.get('/purchase-requests/:id', roleMiddleware('Super Admin', 'Admin', 'Finance', 'Staff'), (req, res) => {
  const pr = db.prepare('SELECT pr.*, p.name as project_name FROM purchase_requests pr LEFT JOIN projects p ON pr.project_id = p.id WHERE pr.id = ?').get(req.params.id);
  if (!pr) return res.status(404).json({ error: 'Not found' });
  pr.items = db.prepare('SELECT pri.*, i.name as item_name FROM purchase_request_items pri LEFT JOIN inventory_items i ON pri.item_id = i.id WHERE pri.pr_id = ?').all(pr.id);
  res.json(pr);
});

router.post('/purchase-requests', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  const { code, project_id, notes, items } = req.body;
  const empId = getEmployeeIdForUser(req);
  const r = db.prepare('INSERT INTO purchase_requests (code,project_id,requested_by,status,notes) VALUES (?,?,?,?,?)')
    .run(code, project_id || null, req.user.id, 'Draft', notes || '');

  if (items && items.length) {
    const stmt = db.prepare('INSERT INTO purchase_request_items (pr_id,item_id,description,qty,unit,estimated_price) VALUES (?,?,?,?,?,?)');
    for (const item of items) {
      stmt.run(r.lastInsertRowid, item.item_id || null, item.description || '', item.qty || 0, item.unit || 'pcs', item.estimated_price || 0);
    }
  }

  res.json(db.prepare('SELECT * FROM purchase_requests WHERE id=?').get(r.lastInsertRowid));
});

router.put('/purchase-requests/:id', roleMiddleware('Super Admin', 'Admin', 'Staff'), (req, res) => {
  const { project_id, notes, items } = req.body;
  db.prepare('UPDATE purchase_requests SET project_id=?, notes=? WHERE id=?').run(project_id || null, notes || '', req.params.id);

  // Update items
  if (items) {
    db.prepare('DELETE FROM purchase_request_items WHERE pr_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT INTO purchase_request_items (pr_id,item_id,description,qty,unit,estimated_price) VALUES (?,?,?,?,?,?)');
    for (const item of items) {
      stmt.run(req.params.id, item.item_id || null, item.description || '', item.qty || 0, item.unit || 'pcs', item.estimated_price || 0);
    }
  }

  res.json(db.prepare('SELECT * FROM purchase_requests WHERE id=?').get(req.params.id));
});

router.put('/purchase-requests/:id/approve', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  db.prepare("UPDATE purchase_requests SET status = 'Approved' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

router.put('/purchase-requests/:id/reject', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  db.prepare("UPDATE purchase_requests SET status = 'Rejected' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

router.post('/purchase-requests/:id/convert-to-po', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const pr = db.prepare('SELECT * FROM purchase_requests WHERE id = ?').get(req.params.id);
  if (!pr) return res.status(404).json({ error: 'PR not found' });
  if (pr.status !== 'Approved') return res.status(400).json({ error: 'PR must be Approved first' });

  const { vendor_id, items } = req.body;
  const poCode = `PO-${new Date().getFullYear()}-${String(db.prepare('SELECT COUNT(*) as c FROM purchase_orders').get().c + 1).padStart(4, '0')}`;

  let total = 0;
  const poItems = items || [];
  for (const item of poItems) total += (item.amount || (item.qty * item.unit_price) || 0);

  const r = db.prepare('INSERT INTO purchase_orders (code,pr_id,vendor_id,project_id,status,total,notes) VALUES (?,?,?,?,?,?,?)')
    .run(poCode, pr.id, vendor_id, pr.project_id, 'Draft', total, '');

  for (const item of poItems) {
    db.prepare('INSERT INTO purchase_order_items (po_id,item_id,description,qty,unit,unit_price,amount) VALUES (?,?,?,?,?,?,?)')
      .run(r.lastInsertRowid, item.item_id || null, item.description || '', item.qty || 0, item.unit || 'pcs', item.unit_price || 0, item.amount || (item.qty * item.unit_price) || 0);
  }

  db.prepare("UPDATE purchase_requests SET status = 'Converted' WHERE id = ?").run(pr.id);

  res.json({ success: true, po_id: r.lastInsertRowid, code: poCode });
});

router.delete('/purchase-requests/:id', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  db.prepare('DELETE FROM purchase_request_items WHERE pr_id = ?').run(req.params.id);
  db.prepare('DELETE FROM purchase_requests WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Purchase Orders (Feature E) ──
router.get('/purchase-orders', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  const data = db.prepare(`SELECT po.*, v.name as vendor_name, p.name as project_name, pr.code as pr_code FROM purchase_orders po LEFT JOIN vendors v ON po.vendor_id = v.id LEFT JOIN projects p ON po.project_id = p.id LEFT JOIN purchase_requests pr ON po.pr_id = pr.id ORDER BY po.id DESC`).all();
  for (const po of data) {
    po.items = db.prepare('SELECT poi.*, i.name as item_name FROM purchase_order_items poi LEFT JOIN inventory_items i ON poi.item_id = i.id WHERE poi.po_id = ?').all(po.id);
  }
  res.json({ data });
});

router.get('/purchase-orders/:id', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  const po = db.prepare(`SELECT po.*, v.name as vendor_name, p.name as project_name FROM purchase_orders po LEFT JOIN vendors v ON po.vendor_id = v.id LEFT JOIN projects p ON po.project_id = p.id WHERE po.id = ?`).get(req.params.id);
  if (!po) return res.status(404).json({ error: 'Not found' });
  po.items = db.prepare('SELECT poi.*, i.name as item_name FROM purchase_order_items poi LEFT JOIN inventory_items i ON poi.item_id = i.id WHERE poi.po_id = ?').all(po.id);
  res.json(po);
});

router.post('/purchase-orders', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const { code, pr_id, vendor_id, project_id, notes, items } = req.body;
  let total = 0;
  for (const item of (items || [])) total += (item.amount || 0);
  const r = db.prepare('INSERT INTO purchase_orders (code,pr_id,vendor_id,project_id,status,total,notes) VALUES (?,?,?,?,?,?,?)')
    .run(code, pr_id || null, vendor_id, project_id || null, 'Draft', total, notes || '');
  if (items) {
    for (const item of items) {
      db.prepare('INSERT INTO purchase_order_items (po_id,item_id,description,qty,unit,unit_price,amount) VALUES (?,?,?,?,?,?,?)')
        .run(r.lastInsertRowid, item.item_id || null, item.description || '', item.qty || 0, item.unit || 'pcs', item.unit_price || 0, item.amount || 0);
    }
  }
  res.json(db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(r.lastInsertRowid));
});

router.put('/purchase-orders/:id', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const { vendor_id, notes, status, items } = req.body;
  let total = 0;
  if (items) {
    for (const item of items) total += (item.amount || 0);
  }
  db.prepare('UPDATE purchase_orders SET vendor_id=?, notes=?, status=?, total=? WHERE id=?').run(vendor_id, notes || '', status || 'Draft', total, req.params.id);
  if (items) {
    db.prepare('DELETE FROM purchase_order_items WHERE po_id = ?').run(req.params.id);
    for (const item of items) {
      db.prepare('INSERT INTO purchase_order_items (po_id,item_id,description,qty,unit,unit_price,amount) VALUES (?,?,?,?,?,?,?)')
        .run(req.params.id, item.item_id || null, item.description || '', item.qty || 0, item.unit || 'pcs', item.unit_price || 0, item.amount || 0);
    }
  }
  res.json(db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(req.params.id));
});

// Receive PO → creates inventory receipts + journal entry (Feature E)
router.put('/purchase-orders/:id/receive', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
  if (!po) return res.status(404).json({ error: 'PO not found' });

  const items = db.prepare('SELECT * FROM purchase_order_items WHERE po_id = ?').all(req.params.id);
  const date = req.body.date || new Date().toISOString().slice(0,10);

  for (const item of items) {
    if (!item.item_id) continue;
    const qty = item.qty;
    const up = item.unit_price;

    // Create inventory receipt
    db.prepare('INSERT INTO inventory_receipts (item_id,qty,date,reference,notes,unit_price,total_value) VALUES (?,?,?,?,?,?,?)')
      .run(item.item_id, qty, date, po.code, `Received from PO ${po.code}`, up, qty * up);

    // Update stock
    db.prepare('UPDATE inventory_items SET stock = stock + ? WHERE id = ?').run(qty, item.item_id);

    // Update avg_cost (Feature F)
    if (up > 0) {
      const invItem = db.prepare('SELECT stock, avg_cost FROM inventory_items WHERE id = ?').get(item.item_id);
      if (invItem) {
        const oldStock = invItem.stock - qty;
        const newAvgCost = oldStock > 0 ? (oldStock * invItem.avg_cost + qty * up) / (oldStock + qty) : up;
        db.prepare('UPDATE inventory_items SET avg_cost = ? WHERE id = ?').run(Math.round(newAvgCost), item.item_id);
      }
    }
  }

  // Journal: Debit Persediaan, Credit Hutang (Feature C)
  createJournal(date, `Penerimaan PO ${po.code}`, 'Persediaan', 'Hutang Usaha', po.total, 'purchase_order', po.id);

  // Update PO status
  db.prepare("UPDATE purchase_orders SET status = 'Received' WHERE id = ?").run(req.params.id);

  // Update project actuals
  if (po.project_id) updateProjectActuals(po.project_id);

  res.json({ success: true });
});

router.delete('/purchase-orders/:id', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  db.prepare('DELETE FROM purchase_order_items WHERE po_id = ?').run(req.params.id);
  db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
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

// ── Dashboard ──
router.get('/reports/dashboard', (req, res) => {
  if (req.user.role === 'Staff') {
    const empId = getEmployeeIdForUser(req);
    if (!empId) return res.json({ isStaff: true, attendanceSummary: {}, todayShift: null, leaveBalance: 0, lastPayroll: null });

    const today = new Date().toISOString().slice(0, 10);
    const todayAtt = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(empId, today);
    const monthStart = today.slice(0, 7) + '-01';
    const monthAtt = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE employee_id = ? AND date >= ? AND status = "Hadir"').get(empId, monthStart).c;
    const shifts = db.prepare('SELECT * FROM shifts ORDER BY id').all();
    const yearStart = today.slice(0, 4) + '-01-01';
    const usedLeaves = db.prepare("SELECT COALESCE(SUM(julianday(end_date)-julianday(start_date)+1),0) as days FROM leave_requests WHERE employee_id = ? AND status = 'Approved' AND start_date >= ?").get(empId, yearStart).days;
    const lastPay = db.prepare('SELECT p.*, e.name as employee_name FROM payroll p LEFT JOIN employees e ON p.employee_id = e.id WHERE p.employee_id = ? ORDER BY p.id DESC LIMIT 1').get(empId);
    const recentAtt = db.prepare('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 7').all(empId);

    return res.json({ isStaff: true, employeeId: empId, todayAttendance: todayAtt || null, monthAttendance: monthAtt, shifts, leaveBalance: Math.max(0, 12 - usedLeaves), usedLeaves, lastPayroll: lastPay || null, recentAttendance: recentAtt });
  }

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

  // Report data from journal entries (Feature C)
  const journalIncome = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM journal_entries WHERE credit_account IN ('Pendapatan Proyek','Pendapatan Jasa','Pendapatan Lain-lain')").get().total;
  const journalExpense = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM journal_entries WHERE debit_account IN ('Bahan Material','Gaji & Upah','Operasional','Sewa','Transportasi','Beban Proyek','HPP')").get().total;

  // Cash balance from bank accounts
  const cashBalance = db.prepare("SELECT COALESCE(SUM(balance),0) as total FROM bank_accounts").get().total;
  // Receivables
  const receivables = db.prepare("SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE status IN ('Draft','Sent')").get().total;
  // Fixed assets
  const fixedAssets = db.prepare("SELECT COALESCE(SUM(current_value),0) as total FROM fixed_assets").get().total;
  const totalAssets = cashBalance + receivables + fixedAssets;
  // Payables from purchases
  const payables = db.prepare("SELECT COALESCE(SUM(total),0) as total FROM purchases WHERE status NOT IN ('Received','Cancelled')").get().total;

  res.json({ income, expense, profit, opExpense, projectStatuses, dueInvoices, overdueInvoices, cashFlow, lowStock, totalEmployees, activeProjects, cashBalance, receivables, fixedAssets, totalAssets, payables, totalLiabilities: payables, equity: totalAssets - payables });
});

// ── Reports from journal entries (Feature C) ──
router.get('/reports/journal-summary', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  const { from, to } = req.query;
  let dateFilter = '1=1';
  const params = [];
  if (from) { dateFilter += ' AND date >= ?'; params.push(from); }
  if (to) { dateFilter += ' AND date <= ?'; params.push(to); }

  // Laba/Rugi from journals
  const incomeAccounts = db.prepare(`SELECT credit_account as account, COALESCE(SUM(amount),0) as total FROM journal_entries WHERE ${dateFilter} AND credit_account IN ('Pendapatan Proyek','Pendapatan Jasa','Pendapatan Lain-lain') GROUP BY credit_account`).all(...params);
  const expenseAccounts = db.prepare(`SELECT debit_account as account, COALESCE(SUM(amount),0) as total FROM journal_entries WHERE ${dateFilter} AND debit_account IN ('Bahan Material','Gaji & Upah','Operasional','Sewa','Transportasi','Beban Proyek','HPP','Beban Penyusutan') GROUP BY debit_account`).all(...params);

  // Balance sheet from journals
  const assetAccounts = db.prepare(`SELECT debit_account as account, COALESCE(SUM(amount),0) as total FROM journal_entries WHERE ${dateFilter} AND debit_account IN ('Kas & Bank','Piutang Usaha','Persediaan','Aset Tetap') GROUP BY debit_account`).all(...params);
  const liabilityAccounts = db.prepare(`SELECT credit_account as account, COALESCE(SUM(amount),0) as total FROM journal_entries WHERE ${dateFilter} AND credit_account IN ('Hutang Usaha','Hutang Pajak','Hutang Gaji') GROUP BY credit_account`).all(...params);

  const totalIncome = incomeAccounts.reduce((s, a) => s + a.total, 0);
  const totalExpense = expenseAccounts.reduce((s, a) => s + a.total, 0);

  res.json({ incomeAccounts, expenseAccounts, assetAccounts, liabilityAccounts, totalIncome, totalExpense, netProfit: totalIncome - totalExpense });
});

// ── Notifications ──
router.get('/notifications', (req, res) => {
  const data = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id).c;
  res.json({ data, unread });
});
router.put('/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});
router.put('/notifications/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

router.post('/notifications/generate', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  let count = 0;
  const overdue = db.prepare("SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN customers c ON i.client_id = c.id WHERE i.status IN ('Draft','Sent') AND i.due_date < date('now')").all();
  const admins = db.prepare("SELECT id FROM users WHERE role IN ('Super Admin','Admin','Finance') AND status = 'Aktif'").all();
  for (const inv of overdue) {
    for (const u of admins) {
      const exists = db.prepare("SELECT id FROM notifications WHERE user_id = ? AND type = 'invoice_overdue' AND message LIKE ?").get(u.id, `%${inv.number}%`);
      if (!exists) { notify(u.id, 'invoice_overdue', 'Invoice Overdue', `Invoice ${inv.number} (${inv.client_name}) sudah overdue!`); count++; }
    }
  }
  const due7 = db.prepare("SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN customers c ON i.client_id = c.id WHERE i.status IN ('Draft','Sent') AND i.due_date BETWEEN date('now') AND date('now','+7 days')").all();
  for (const inv of due7) {
    for (const u of admins) {
      const exists = db.prepare("SELECT id FROM notifications WHERE user_id = ? AND type = 'invoice_due_soon' AND message LIKE ?").get(u.id, `%${inv.number}%`);
      if (!exists) { notify(u.id, 'invoice_due_soon', 'Invoice Jatuh Tempo', `Invoice ${inv.number} jatuh tempo dalam 7 hari.`); count++; }
    }
  }
  const lowStock = db.prepare("SELECT * FROM inventory_items WHERE stock <= min_stock").all();
  for (const item of lowStock) {
    for (const u of admins) {
      const exists = db.prepare("SELECT id FROM notifications WHERE user_id = ? AND type = 'low_stock' AND message LIKE ?").get(u.id, `%${item.name}%`);
      if (!exists) { notify(u.id, 'low_stock', 'Stok Menipis', `${item.name} stok ${item.stock} (min: ${item.min_stock})`); count++; }
    }
  }
  const pendingLeaves = db.prepare("SELECT l.*, e.name as employee_name FROM leave_requests l LEFT JOIN employees e ON l.employee_id = e.id WHERE l.status = 'Pending'").all();
  const leaveAdmins = db.prepare("SELECT id FROM users WHERE role IN ('Super Admin','Admin') AND status = 'Aktif'").all();
  for (const l of pendingLeaves) {
    for (const u of leaveAdmins) {
      const exists = db.prepare("SELECT id FROM notifications WHERE user_id = ? AND type = 'leave_pending' AND message LIKE ?").get(u.id, `%${l.id}%`);
      if (!exists) { notify(u.id, 'leave_pending', 'Cuti Menunggu Approval', `${l.employee_name} mengajukan ${l.type} (${l.start_date} s/d ${l.end_date})`); count++; }
    }
  }
  res.json({ generated: count });
});

// ── Audit Logs ──
router.get('/audit-logs', roleMiddleware('Super Admin'), (req, res) => {
  const { search, table_name, action, page = 1, limit = 50 } = req.query;
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND (user_name LIKE ? OR table_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (table_name) { sql += ' AND table_name = ?'; params.push(table_name); }
  if (action) { sql += ' AND action = ?'; params.push(action); }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const data = db.prepare(sql).all(...params);
  let countSql = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
  const cp = [];
  if (search) { countSql += ' AND (user_name LIKE ? OR table_name LIKE ?)'; cp.push(`%${search}%`, `%${search}%`); }
  if (table_name) { countSql += ' AND table_name = ?'; cp.push(table_name); }
  if (action) { countSql += ' AND action = ?'; cp.push(action); }
  const { total } = db.prepare(countSql).get(...cp);
  res.json({ data, total, page: Number(page), limit: Number(limit) });
});

// ── Global Search ──
router.get('/search', (req, res) => {
  const q = req.query.q || '';
  if (!q || q.length < 2) return res.json([]);
  const like = `%${q}%`;
  const results = [];
  try { const r = db.prepare('SELECT id, name, email FROM customers WHERE name LIKE ? OR email LIKE ? LIMIT 5').all(like, like); r.forEach(x => results.push({ type: 'Customer', id: x.id, label: x.name, sub: x.email, path: '/customers' })); } catch(e) {}
  try { const r = db.prepare('SELECT id, name, status FROM projects WHERE name LIKE ? LIMIT 5').all(like); r.forEach(x => results.push({ type: 'Proyek', id: x.id, label: x.name, sub: x.status, path: '/projects' })); } catch(e) {}
  try { const r = db.prepare('SELECT id, number, status, total FROM invoices WHERE number LIKE ? LIMIT 5').all(like); r.forEach(x => results.push({ type: 'Invoice', id: x.id, label: x.number, sub: `Rp ${x.total?.toLocaleString()}`, path: '/invoices' })); } catch(e) {}
  try { const r = db.prepare('SELECT id, name, position FROM employees WHERE name LIKE ? OR email LIKE ? LIMIT 5').all(like, like); r.forEach(x => results.push({ type: 'Karyawan', id: x.id, label: x.name, sub: x.position, path: '/employees' })); } catch(e) {}
  try { const r = db.prepare('SELECT id, name, sku FROM inventory_items WHERE name LIKE ? OR sku LIKE ? LIMIT 5').all(like, like); r.forEach(x => results.push({ type: 'Item', id: x.id, label: x.name, sub: x.sku, path: '/inventory/items' })); } catch(e) {}
  try { const r = db.prepare('SELECT id, name, email FROM vendors WHERE name LIKE ? LIMIT 5').all(like); r.forEach(x => results.push({ type: 'Vendor', id: x.id, label: x.name, sub: x.email, path: '/vendors' })); } catch(e) {}
  res.json(results);
});

// ── Bulk Actions ──
router.post('/bulk/leaves', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const { ids, status } = req.body;
  if (!ids?.length || !status) return res.status(400).json({ error: 'ids and status required' });
  const stmt = db.prepare('UPDATE leave_requests SET status = ? WHERE id = ?');
  for (const id of ids) stmt.run(status, id);
  res.json({ success: true, updated: ids.length });
});
router.post('/bulk/payroll', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const { ids, status } = req.body;
  if (!ids?.length || !status) return res.status(400).json({ error: 'ids and status required' });
  const stmt = db.prepare('UPDATE payroll SET status = ? WHERE id = ?');
  for (const id of ids) stmt.run(status, id);
  res.json({ success: true, updated: ids.length });
});
router.post('/bulk/invoices', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  const { ids, action: bulkAction } = req.body;
  if (!ids?.length) return res.status(400).json({ error: 'ids required' });
  if (bulkAction === 'send_reminder') {
    res.json({ success: true, message: `${ids.length} reminder(s) processed` });
  } else {
    res.status(400).json({ error: 'Unknown action' });
  }
});
router.post('/bulk/inventory-items', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  const { ids, action: bulkAction, category } = req.body;
  if (!ids?.length) return res.status(400).json({ error: 'ids required' });
  if (bulkAction === 'delete') {
    for (const id of ids) db.prepare('DELETE FROM inventory_items WHERE id = ?').run(id);
    res.json({ success: true, deleted: ids.length });
  } else if (bulkAction === 'update_category') {
    for (const id of ids) db.prepare('UPDATE inventory_items SET category = ? WHERE id = ?').run(category, id);
    res.json({ success: true, updated: ids.length });
  } else {
    res.status(400).json({ error: 'Unknown action' });
  }
});

export default router;
