import { execSync } from 'child_process';

// Email sender - uses nodemailer if available, otherwise logs to console
let transporter = null;

async function getTransporter(smtpConfig) {
  try {
    const nodemailer = await import('nodemailer');
    return nodemailer.default.createTransport({
      host: smtpConfig.smtp_host,
      port: Number(smtpConfig.smtp_port) || 587,
      secure: Number(smtpConfig.smtp_port) === 465,
      auth: { user: smtpConfig.smtp_user, pass: smtpConfig.smtp_pass }
    });
  } catch (e) {
    console.log('[Email] nodemailer not available, using mock');
    return null;
  }
}

export async function sendEmail(smtpConfig, { to, subject, html, attachments }) {
  const transport = await getTransporter(smtpConfig);
  if (!transport) {
    console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
    return { messageId: 'mock-' + Date.now(), mock: true };
  }
  const result = await transport.sendMail({
    from: smtpConfig.from_email || smtpConfig.smtp_user,
    to, subject, html, attachments
  });
  return result;
}

export function sendWhatsApp({ to, message }) {
  try {
    const cmd = `/usr/local/bin/wacli send text --to ${to} --message ${JSON.stringify(message)}`;
    const result = execSync(cmd, { timeout: 30000, encoding: 'utf8' });
    return { success: true, output: result };
  } catch (e) {
    console.error('[WhatsApp] Error:', e.message);
    return { success: false, error: e.message };
  }
}

export function sendWhatsAppFile({ to, filePath, caption }) {
  try {
    const cmd = `/usr/local/bin/wacli send file --to ${to} --file ${filePath}${caption ? ` --caption ${JSON.stringify(caption)}` : ''}`;
    const result = execSync(cmd, { timeout: 30000, encoding: 'utf8' });
    return { success: true, output: result };
  } catch (e) {
    console.error('[WhatsApp] Error:', e.message);
    return { success: false, error: e.message };
  }
}

// Email templates
export function invoiceEmailTemplate(invoice, clientName) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Invoice dari PT Manggala Utama Indonesia</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb;">
        <p>Yth. <strong>${clientName}</strong>,</p>
        <p>Berikut invoice <strong>${invoice.number}</strong> dengan detail:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Nomor Invoice</td><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>${invoice.number}</strong></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Tanggal</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${invoice.date}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Jatuh Tempo</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${invoice.due_date}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Total</td><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Rp ${(invoice.total || 0).toLocaleString('id-ID')}</td></tr>
        </table>
        <p>Mohon untuk melakukan pembayaran sebelum tanggal jatuh tempo.</p>
        <p>Terima kasih.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p style="color: #6b7280; font-size: 12px;">PT Manggala Utama Indonesia</p>
      </div>
    </div>
  `;
}

export function payslipEmailTemplate(payroll, employeeName) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Slip Gaji - ${payroll.period}</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb;">
        <p>Yth. <strong>${employeeName}</strong>,</p>
        <p>Berikut rincian gaji Anda untuk periode <strong>${payroll.period}</strong>:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Gaji Pokok</td><td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Rp ${(payroll.basic_salary || 0).toLocaleString('id-ID')}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Tunjangan</td><td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Rp ${(payroll.allowances || 0).toLocaleString('id-ID')}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Potongan</td><td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Rp ${(payroll.deductions || 0).toLocaleString('id-ID')}</td></tr>
          <tr style="font-weight: bold; background: #f0fdf4;"><td style="padding: 8px; border: 1px solid #e5e7eb;">Gaji Bersih</td><td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Rp ${(payroll.net_salary || 0).toLocaleString('id-ID')}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 12px;">PT Manggala Utama Indonesia</p>
      </div>
    </div>
  `;
}
