import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CheckCircle, BarChart3, PieChart, ArrowUpCircle, ArrowDownCircle, FileText } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Payroll() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating] = useState(false);

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

  const handlePay = async (id) => {
    await api.put(`/payroll/${id}`, { status: 'Paid' });
    load();
  };

  const totalGaji = data.reduce((s, p) => s + (p.basic_salary || 0), 0);
  const totalTunjangan = data.reduce((s, p) => s + (p.allowances || 0), 0);
  const totalPotongan = data.reduce((s, p) => s + (p.deductions || 0), 0);
  const totalNet = data.reduce((s, p) => s + (p.net_salary || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Payroll</h2>
        <div className="flex items-center gap-3">
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Karyawan</th>
              <th className="px-4 py-3 font-medium">Gaji Pokok</th>
              <th className="px-4 py-3 font-medium">Tunjangan</th>
              <th className="px-4 py-3 font-medium">Potongan</th>
              <th className="px-4 py-3 font-medium">Netto</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.employee_name}</td>
                <td className="px-4 py-3">{fmt(p.basic_salary)}</td>
                <td className="px-4 py-3 text-green-600">{fmt(p.allowances)}</td>
                <td className="px-4 py-3 text-red-600">{fmt(p.deductions)}</td>
                <td className="px-4 py-3 font-bold">{fmt(p.net_salary)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  {p.status !== 'Paid' && (
                    <button onClick={() => handlePay(p.id)} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm">
                      <CheckCircle size={16} /> Bayar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">
                Belum ada payroll untuk periode {period}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
