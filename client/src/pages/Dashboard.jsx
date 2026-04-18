import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, AlertTriangle, Clock } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Memuat dashboard...</div>;
  if (!data) return <div className="text-center py-20 text-red-500">Gagal memuat data</div>;

  const cards = [
    { label: 'Pendapatan', value: fmt(data.income), icon: TrendingUp, color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
    { label: 'Pengeluaran', value: fmt(data.expense), icon: TrendingDown, color: 'bg-red-50 text-red-600', iconBg: 'bg-red-100' },
    { label: 'Profit', value: fmt(data.profit), icon: DollarSign, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
    { label: 'Profit Operasional', value: fmt(data.income - data.opExpense), icon: Briefcase, color: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-100' },
  ];

  const cashFlowData = {};
  (data.cashFlow || []).forEach(c => {
    if (!cashFlowData[c.month]) cashFlowData[c.month] = { month: c.month, income: 0, expense: 0 };
    cashFlowData[c.month][c.type] = c.total;
  });
  const chartData = Object.values(cashFlowData);

  const COLORS = ['#3B82F6', '#10B981', '#6B7280'];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => (
          <div key={i} className={`${c.color} rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-80">{c.label}</span>
              <div className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center`}><c.icon size={20} /></div>
            </div>
            <div className="text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Arus Kas</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend />
              <Bar dataKey="income" name="Pendapatan" fill="#10B981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Status Proyek</h3>
          {(data.projectStatuses || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.projectStatuses.map(p => ({ name: p.status, value: p.count }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {data.projectStatuses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm">Belum ada proyek</p>}
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total Karyawan Aktif</span><span className="font-semibold">{data.totalEmployees}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Proyek Berjalan</span><span className="font-semibold">{data.activeProjects}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Clock size={18} /> Jatuh Tempo</h3>
          <div className="space-y-3">
            {(data.dueInvoices || []).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-700">{inv.number}</div>
                  <div className="text-xs text-gray-500">{inv.client_name} · {inv.due_date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{fmt(inv.total)}</div>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
            {(!data.dueInvoices || data.dueInvoices.length === 0) && <p className="text-sm text-gray-400">Tidak ada invoice jatuh tempo</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Stok Menipis</h3>
          <div className="space-y-3">
            {(data.lowStock || []).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-700">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-orange-600">{item.stock} {item.unit}</div>
                  <div className="text-xs text-gray-500">Min: {item.min_stock}</div>
                </div>
              </div>
            ))}
            {(!data.lowStock || data.lowStock.length === 0) && <p className="text-sm text-gray-400">Semua stok aman</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
