import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import './db/seed.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/index.js';
import { getOpenAPISpec, getSwaggerHTML } from './swagger.js';
import db from './db/init.js';

const app = express();
app.use(cors());
app.use(express.json());

// Swagger
app.get('/api-docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getSwaggerHTML());
});
app.get('/api-docs.json', (req, res) => {
  res.json(getOpenAPISpec());
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// ── Email & WhatsApp routes (added to api with auth) ──
import { authMiddleware, roleMiddleware } from './middleware/auth.js';
import { sendEmail, sendWhatsApp, sendWhatsAppFile, invoiceEmailTemplate, payslipEmailTemplate } from './lib/email.js';

const notifRouter = express.Router();
notifRouter.use(authMiddleware);

// Email: Send
notifRouter.post('/email/send', roleMiddleware('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    const settings = {};
    const rows = db.prepare('SELECT * FROM settings').all();
    rows.forEach(s => settings[s.key] = s.value);

    const result = await sendEmail(settings, { to, subject, html: `<p>${message}</p>` });
    res.json({ success: true, message: 'Email sent', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Email: Test
notifRouter.post('/email/test', roleMiddleware('Super Admin'), async (req, res) => {
  try {
    const settings = {};
    const rows = db.prepare('SELECT * FROM settings').all();
    rows.forEach(s => settings[s.key] = s.value);

    const to = req.body.to || settings.smtp_user;
    const result = await sendEmail(settings, {
      to,
      subject: 'Test Email - ERP Manggala',
      html: '<p>This is a test email from ERP Manggala.</p>'
    });
    res.json({ success: true, message: result.mock ? 'Email logged (mock mode)' : 'Email sent successfully', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Email: Send Invoice
notifRouter.post('/email/send-invoice', roleMiddleware('Super Admin', 'Admin', 'Finance'), async (req, res) => {
  try {
    const { invoice_id, to } = req.body;
    const invoice = db.prepare('SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN customers c ON i.client_id = c.id WHERE i.id = ?').get(invoice_id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const settings = {};
    db.prepare('SELECT * FROM settings').all().forEach(s => settings[s.key] = s.value);

    const html = invoiceEmailTemplate(invoice, invoice.client_name);
    const result = await sendEmail(settings, {
      to: to || invoice.client_email || '',
      subject: `Invoice ${invoice.number} - PT Manggala Utama Indonesia`,
      html
    });
    res.json({ success: true, message: 'Invoice email sent', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Email: Send Payslip
notifRouter.post('/email/send-payslip', roleMiddleware('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { payroll_id } = req.body;
    const payroll = db.prepare('SELECT p.*, e.name as employee_name, e.email as employee_email FROM payroll p LEFT JOIN employees e ON p.employee_id = e.id WHERE p.id = ?').get(payroll_id);
    if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

    const settings = {};
    db.prepare('SELECT * FROM settings').all().forEach(s => settings[s.key] = s.value);

    const html = payslipEmailTemplate(payroll, payroll.employee_name);
    const result = await sendEmail(settings, {
      to: payroll.employee_email || '',
      subject: `Slip Gaji ${payroll.period} - PT Manggala Utama Indonesia`,
      html
    });
    res.json({ success: true, message: 'Payslip email sent', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// WhatsApp: Send text
notifRouter.post('/whatsapp/send', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'to and message required' });
    const result = sendWhatsApp({ to, message });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// WhatsApp: Send Invoice
notifRouter.post('/whatsapp/send-invoice', roleMiddleware('Super Admin', 'Admin', 'Finance'), (req, res) => {
  try {
    const { invoice_id, phone, message } = req.body;
    const invoice = db.prepare('SELECT i.*, c.name as client_name, c.phone as client_phone FROM invoices i LEFT JOIN customers c ON i.client_id = c.id WHERE i.id = ?').get(invoice_id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const to = phone || invoice.client_phone || '';
    if (!to) return res.status(400).json({ error: 'No phone number' });

    const msg = message || `Yth ${invoice.client_name}, berikut invoice ${invoice.number} dari PT Manggala Utama Indonesia sebesar Rp ${(invoice.total || 0).toLocaleString('id-ID')}. Terima kasih.`;
    const result = sendWhatsApp({ to, message: msg });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/api', notifRouter);

const PORT = 3002;
app.listen(PORT, () => console.log(`🚀 ERP Manggala server running on port ${PORT}`));
