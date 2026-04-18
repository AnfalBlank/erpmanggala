import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COMPANY = 'PT Manggala Utama Indonesia';

export function exportInvoicePDF(invoice, clientName) {
  const doc = new jsPDF();
  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY, 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE', 14, 28);

  // Invoice info
  doc.setFontSize(10);
  doc.text(`No: ${invoice.number}`, 140, 20);
  doc.text(`Tanggal: ${invoice.date || '-'}`, 140, 26);
  doc.text(`Jatuh Tempo: ${invoice.due_date || '-'}`, 140, 32);
  doc.text(`Status: ${invoice.status}`, 140, 38);

  // Client
  doc.text(`Kepada: ${clientName}`, 14, 40);

  // Line
  doc.setLineWidth(0.5);
  doc.line(14, 44, 196, 44);

  // Items table
  let items = [];
  try { items = JSON.parse(invoice.items_json || '[]'); } catch(e) {}
  if (items.length > 0) {
    doc.autoTable({
      startY: 48,
      head: [['No', 'Deskripsi', 'Qty', 'Harga', 'Total']],
      body: items.map((item, i) => [i + 1, item.desc || item.name || '-', item.qty || 1, fmt(item.price || 0), fmt((item.qty || 1) * (item.price || 0))]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  // Totals
  const finalY = doc.lastAutoTable?.finalY || 60;
  doc.setFontSize(10);
  doc.text(`Subtotal: ${fmt(invoice.subtotal || 0)}`, 140, finalY + 10);
  doc.text(`Pajak: ${fmt(invoice.tax || 0)}`, 140, finalY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total: ${fmt(invoice.total || 0)}`, 140, finalY + 24);

  // Signature area
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Hormat kami,', 14, finalY + 50);
  doc.text('________________________', 14, finalY + 70);
  doc.text('Admin', 14, finalY + 76);

  doc.save(`Invoice-${invoice.number}.pdf`);
}

export function exportReportPDF(title, data, columns, rows) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY, 14, 20);
  doc.setFontSize(12);
  doc.text(title, 14, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 36);

  if (rows && rows.length > 0) {
    doc.autoTable({
      startY: 42,
      head: [columns],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  doc.save(`${title.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.pdf`);
}

export function exportPayrollPDF(payroll) {
  const doc = new jsPDF();
  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY, 14, 20);
  doc.setFontSize(12);
  doc.text('SLIP GAJI', 14, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${payroll.period}`, 14, 38);
  doc.text(`Karyawan: ${payroll.employee_name}`, 14, 44);

  doc.autoTable({
    startY: 52,
    head: [['Komponen', 'Jumlah']],
    body: [
      ['Gaji Pokok', fmt(payroll.basic_salary)],
      ['Tunjangan Transport', fmt(payroll.transport_allowance || 0)],
      ['Tunjangan Makan', fmt(payroll.meal_allowance || 0)],
      ['Upah Lembur', fmt(payroll.overtime_pay || 0)],
      [{ content: 'Total Pendapatan', styles: { fontStyle: 'bold' } }, { content: fmt(payroll.basic_salary + (payroll.allowances || 0) + (payroll.overtime_pay || 0)), styles: { fontStyle: 'bold' } }],
      ['', ''],
      ['BPJS Kesehatan', fmt(payroll.bpjs_kesehatan || 0)],
      ['BPJS TK', fmt(payroll.bpjs_tk || 0)],
      ['PPh 21', fmt(payroll.pph21 || 0)],
      ['Denda Keterlambatan', fmt(payroll.late_penalty || 0)],
      [{ content: 'Total Potongan', styles: { fontStyle: 'bold' } }, { content: fmt(payroll.deductions || 0), styles: { fontStyle: 'bold' } }],
      ['', ''],
      [{ content: 'GAJI BERSIH', styles: { fontStyle: 'bold', fontSize: 12 } }, { content: fmt(payroll.net_salary), styles: { fontStyle: 'bold', fontSize: 12 } }],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`Slip-Gaji-${payroll.employee_name}-${payroll.period}.pdf`);
}

export function exportCSV(data, columns, filename) {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row => columns.map(c => {
    const val = c.render ? '' : (row[c.key] ?? '');
    return `"${String(val).replace(/"/g, '""')}"`;
  }).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}
