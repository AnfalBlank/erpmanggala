import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CheckCircle, BarChart3, FileDown, Printer, X, Edit2 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import ResponsiveTable from '../../components/ResponsiveTable';
import { exportPayrollPDF } from '../../lib/exportUtils';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Payroll() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [bankAccountId, setBankAccountId] = useState('');

  const load = () => {
    api.get(`/payroll?period=${period}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/employees').then(res => setEmployees(res.data || [])).catch(console.error);
    api.get('/bank_accounts').then(res => setAccounts(res.data || [])).catch(console.error);
  };
  useEffect(load, [period]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/payroll/generate', { period, bank_account_id: Number(bankAccountId) || null });
      load();
    } catch (e) { alert(e.message); }
    finally { setGenerating(false); }
  };

  const handlePay = async (p) => {
    const accId = p.bank_account_id || bankAccountId;
    if (!accId) { alert('Pilih rekening bank terlebih dahulu'); return; }
    await api.put(`/payroll/${p.id}`, { status: 'Paid', bank_account_id: Number(accId) });
    load();
  };

  const handleApprove = async (id) => {
    await api.put(`/payroll/${id}`, { status: 'Approved' });
    load();
  };

  const handleBulkPay = async () => {
    for (const id of selectedIds) {
      const p = data.find(d => d.id === id);
      if (p && p.status !== 'Paid') {
        await api.put(`/payroll/${id}`, { status: 'Paid', bank_account_id: Number(bankAccountId) || null });
      }
    }
    setSelectedIds([]);
    load();
  };

  const handleEdit = (p) => {
    setEditForm({
      basic_salary: p.basic_salary,
      transport_allowance: p.transport_allowance || 0,
      meal_allowance: p.meal_allowance || 0,
      overtime_hours: p.overtime_hours || 0,
      overtime_pay: p.overtime_pay || 0,
      bpjs_kesehatan: p.bpjs_kesehatan || 0,
      bpjs_tk: p.bpjs_tk || 0,
      pph21: p.pph21 || 0,
      late_penalty: p.late_penalty || 0,
      allowances: p.allowances || 0,
      deductions: p.deductions || 0,
      net_salary: p.net_salary || 0,
    });
    setEditId(p.id);
  };

  const handleEditSave = async () => {
    await api.put(`/payroll/${editId}`, editForm);
    setEditId(null);
    load();
  };

  const totalGaji = data.reduce((s, p) => s + (p.basic_salary || 0), 0);
  const totalTunjangan = data.reduce((s, p) => s + (p.allowances || 0), 0);
  const totalPotongan = data.reduce((s, p) => s + (p.deductions || 0), 0);
  const totalNet = data.reduce((s, p) => s + (p.net_salary || 0), 0);
  const totalBPJSKes = data.reduce((s, p) => s + (p.bpjs_kesehatan || 0), 0);
  const totalBPJSTK = data.reduce((s, p) => s + (p.bpjs_tk || 0), 0);
  const totalPPH = data.reduce((s, p) => s + (p.pph21 || 0), 0);
  const totalDenda = data.reduce((s, p) => s + (p.late_penalty || 0), 0);

  const columns = [
    { key: 'employee_name', label: 'Karyawan' },
    { key: 'basic_salary', label: 'Gaji Pokok', render: r => fmt(r.basic_salary) },
    { key: 'allowances', label: 'Tunjangan', render: r => <span className="text-green-600">{fmt(r.allowances)}</span> },
    { key: 'overtime_pay', label: 'Lembur', render: r => <span className="text-blue-600">{fmt(r.overtime_pay || 0)}</span> },
    { key: 'bpjs_kesehetan', label: 'BPJS Kes', render: r => <span className="text-orange-600">{fmt(r.bpjs_kesehatan || 0)}</span> },
    { key: 'bpjs_tk', label: 'BPJS TK', render: r => <span className="text-orange-600">{fmt(r.bpjs_tk || 0)}</span> },
    { key: 'pph21', label: 'PPh 21', render: r => <span className="text-red-600">{fmt(r.pph21 || 0)}</span> },
    { key: 'late_penalty', label: 'Denda', render: r => <span className="text-red-600">{fmt(r.late_penalty || 0)}</span> },
    { key: 'deductions', label: 'Total Potongan', render: r => <span className="text-red-700">{fmt(r.deductions)}</span> },
    { key: 'net_salary', label: 'Gaji Bersih', render: r => <span className="font-bold">{fmt(r.net_salary)}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Payroll</h2>
        <div className="flex items-center gap-3 no-print flex-wrap">
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Pilih Rekening Bayar</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50">
            <BarChart3 size={16} /> {generating ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Total Gaji Pokok</div>
          <div className="text-base font-bold">{fmt(totalGaji)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Total Tunjangan</div>
          <div className="text-base font-bold text-green-600">{fmt(totalTunjangan)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-gray-500">BPJS Kes</div>
          <div className="text-base font-bold text-orange-600">{fmt(totalBPJSKes)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-gray-500">BPJS TK</div>
          <div className="text-base font-bold text-orange-600">{fmt(totalBPJSTK)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Total PPh 21</div>
          <div className="text-base font-bold text-red-600">{fmt(totalPPH)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-gray-500">Total Gaji Bersih</div>
          <div className="text-base font-bold text-purple-600">{fmt(totalNet)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <ResponsiveTable
          columns={columns}
          data={data}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={setSelectedIds}
          bulkActions={
            <button onClick={handleBulkPay} className="px-3 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1"><CheckCircle size={12} /> Bayar Semua</button>
          }
          renderActions={(p) => (
            <div className="flex gap-2 no-print">
              <button onClick={() => exportPayrollPDF(p)} className="text-green-500 hover:text-green-700" title="Export PDF"><FileDown size={16} /></button>
              {p.status === 'Draft' && (
                <>
                  <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700" title="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => handleApprove(p.id)} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Approve</button>
                </>
              )}
              {p.status === 'Approved' && (
                <button onClick={() => handlePay(p)} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm">
                  <CheckCircle size={16} /> Bayar
                </button>
              )}
            </div>
          )}
        />
      </div>

      {editId && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Edit Payroll</h3><button onClick={() => setEditId(null)}><X size={20} /></button></div>
            <div className="space-y-3">
              {[
                { key: 'basic_salary', label: 'Gaji Pokok' },
                { key: 'transport_allowance', label: 'Tunjangan Transport' },
                { key: 'meal_allowance', label: 'Tunjangan Makan' },
                { key: 'overtime_hours', label: 'Jam Lembur' },
                { key: 'overtime_pay', label: 'Upah Lembur' },
                { key: 'bpjs_kesehatan', label: 'BPJS Kesehatan' },
                { key: 'bpjs_tk', label: 'BPJS TK' },
                { key: 'pph21', label: 'PPh 21' },
                { key: 'late_penalty', label: 'Denda Keterlambatan' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type="number" value={editForm[f.key] || 0} onChange={e => setEditForm({...editForm, [f.key]: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              ))}
              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setEditId(null)} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
                <button onClick={handleEditSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
