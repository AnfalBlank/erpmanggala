import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CheckCircle, BarChart3, FileDown, Printer } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import ResponsiveTable from '../../components/ResponsiveTable';
import { exportPayrollPDF } from '../../lib/exportUtils';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Payroll() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const load = () => {
    api.get(`/payroll?period=${period}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/employees').then(res => setEmployees(res.data || [])).catch(console.error);
  };
  useEffect(load, [period]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const active = employees.filter(e => e.status === 'Aktif');
      for (const emp of active) {
        const basic = emp.salary || 0;
        const allowances = Math.round(basic * 0.15);
        const deductions = Math.round(basic * 0.05);
        const exists = data.find(d => d.employee_id === emp.id);
        if (!exists) {
          await api.post('/payroll', { employee_id: emp.id, period, basic_salary: basic, allowances, deductions, net_salary: basic + allowances - deductions, status: 'Draft' });
        }
      }
      load();
    } finally { setGenerating(false); }
  };

  const handlePay = async (id) => { await api.put(`/payroll/${id}`, { status: 'Paid' }); load(); };

  const handleBulkPay = async () => {
    await api.post('/bulk/payroll', { ids: selectedIds, status: 'Paid' });
    setSelectedIds([]);
    load();
  };

  const totalGaji = data.reduce((s, p) => s + (p.basic_salary || 0), 0);
  const totalTunjangan = data.reduce((s, p) => s + (p.allowances || 0), 0);
  const totalPotongan = data.reduce((s, p) => s + (p.deductions || 0), 0);
  const totalNet = data.reduce((s, p) => s + (p.net_salary || 0), 0);

  const columns = [
    { key: 'employee_name', label: 'Karyawan' },
    { key: 'basic_salary', label: 'Gaji Pokok', render: r => fmt(r.basic_salary) },
    { key: 'allowances', label: 'Tunjangan', render: r => <span className="text-green-600">{fmt(r.allowances)}</span> },
    { key: 'deductions', label: 'Potongan', render: r => <span className="text-red-600">{fmt(r.deductions)}</span> },
    { key: 'net_salary', label: 'Netto', render: r => <span className="font-bold">{fmt(r.net_salary)}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Payroll</h2>
        <div className="flex items-center gap-3 no-print">
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          <button onClick={handleGenerate} disabled={generating} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50">
            <BarChart3 size={16} /> {generating ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Wallet className="text-blue-500" size={20} /></div>
          <div><div className="text-xs text-gray-500">Total Gaji</div><div className="text-lg font-bold">{fmt(totalGaji)}</div></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="text-green-500" size={20} /></div>
          <div><div className="text-xs text-gray-500">Total Tunjangan</div><div className="text-lg font-bold text-green-600">{fmt(totalTunjangan)}</div></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><TrendingDown className="text-red-500" size={20} /></div>
          <div><div className="text-xs text-gray-500">Total Potongan</div><div className="text-lg font-bold text-red-600">{fmt(totalPotongan)}</div></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><DollarSign className="text-purple-500" size={20} /></div>
          <div><div className="text-xs text-gray-500">Total Netto</div><div className="text-lg font-bold text-purple-600">{fmt(totalNet)}</div></div>
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
              <button onClick={() => window.print()} className="text-gray-500 hover:text-gray-700" title="Print"><Printer size={16} /></button>
              {p.status !== 'Paid' && (
                <button onClick={() => handlePay(p.id)} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm">
                  <CheckCircle size={16} /> Bayar
                </button>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}
