import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, AlertTriangle, Clock, Camera, CalendarDays, ClipboardList, FileText, CheckCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const COLORS = ['#3B82F6', '#10B981', '#6B7280', '#F59E0B', '#EF4444', '#8B5CF6'];

function StaffDashboard({ data }) {
  const [attendance, setAttendance] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const loadToday = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await api.get(`/attendance?date=${today}`);
    setAttendance((res.data || [])[0] || null);
  };

  useEffect(() => { loadToday(); }, []);

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 8);
  const today = now.toISOString().slice(0, 10);
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const handleCheckInOut = async (type) => {
    setCheckingIn(true);
    try {
      if (type === 'checkin') {
        await api.post('/attendance', { date: today, check_in: timeStr, status: 'Hadir' });
      } else {
        if (attendance) {
          await api.put(`/attendance/${attendance.id}`, { check_in: attendance.check_in, check_out: timeStr, status: attendance.status });
        }
      }
      await loadToday();
    } catch (e) {
      alert('Gagal: ' + (e.message || 'Error'));
    } finally {
      setCheckingIn(false);
    }
  };

  const isCheckedIn = attendance?.check_in;
  const isCheckedOut = attendance?.check_out;

  // Attendance chart data (last 7 days)
  const attChartData = (data.recentAttendance || []).map(a => ({
    date: a.date?.slice(5) || '',
    status: a.status === 'Hadir' ? 1 : 0,
  })).reverse();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Dashboard Saya</h2>
      <p className="text-sm text-gray-500 mb-6">{dayNames[now.getDay()]}, {now.getDate()} {monthNames[now.getMonth()]} {now.getFullYear()}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Status Hari Ini</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Clock size={20} className="text-blue-500" /></div>
          </div>
          <div className="text-lg font-bold mb-1">
            {isCheckedOut ? '✅ Selesai' : isCheckedIn ? '🟢 Sudah Masuk' : '⏳ Belum Absen'}
          </div>
          {isCheckedIn && (
            <div className="text-xs text-gray-500">
              Masuk: {attendance.check_in} {isCheckedOut ? `• Keluar: ${attendance.check_out}` : ''}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Shift Kerja</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><ClipboardList size={20} className="text-green-500" /></div>
          </div>
          <div className="text-lg font-bold">{(data.shifts || []).length > 0 ? data.shifts[0].name : 'Tidak ada shift'}</div>
          {(data.shifts || []).length > 0 && <div className="text-xs text-gray-500">{data.shifts[0].start_time} — {data.shifts[0].end_time}</div>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Sisa Cuti</span>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><CalendarDays size={20} className="text-purple-500" /></div>
          </div>
          <div className="text-lg font-bold">{data.leaveBalance} hari</div>
          <div className="text-xs text-gray-500">Terpakai: {data.usedLeaves} hari tahun ini</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Gaji Terakhir</span>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><DollarSign size={20} className="text-orange-500" /></div>
          </div>
          <div className="text-lg font-bold">{data.lastPayroll ? fmt(data.lastPayroll.net_salary) : '-'}</div>
          <div className="text-xs text-gray-500">{data.lastPayroll ? `Periode: ${data.lastPayroll.period}` : 'Belum ada data'}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Absen Cepat</h3>
        <div className="flex items-center gap-4">
          {!isCheckedIn ? (
            <button onClick={() => handleCheckInOut('checkin')} disabled={checkingIn}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
              <Camera size={18} /> {checkingIn ? 'Memproses...' : 'Absen Masuk'}
            </button>
          ) : !isCheckedOut ? (
            <button onClick={() => handleCheckInOut('checkout')} disabled={checkingIn}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
              <Camera size={18} /> {checkingIn ? 'Memproses...' : 'Absen Keluar'}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-green-600 px-6 py-3 bg-green-50 rounded-xl">
              <CheckCircle size={18} /> Absensi hari ini selesai
            </div>
          )}
          <div className="text-sm text-gray-500">Waktu: <span className="font-mono font-medium">{timeStr}</span></div>
        </div>
      </div>

      {/* Attendance chart - last 7 days */}
      {attChartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Kehadiran 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} ticks={[0, 1]} tickFormatter={v => v ? 'Hadir' : '-'} />
              <Tooltip formatter={v => v ? 'Hadir' : 'Tidak'} />
              <Bar dataKey="status" name="Kehadiran" fill="#3B82F6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Riwayat Kehadiran</h3>
        <div className="space-y-2">
          {(data.recentAttendance || []).map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">{a.date}</div>
              <div className="text-sm text-gray-500">{a.check_in || '-'} → {a.check_out || '-'}</div>
              <StatusBadge status={a.status} />
            </div>
          ))}
          {(!data.recentAttendance || data.recentAttendance.length === 0) && <p className="text-sm text-gray-400">Belum ada data</p>}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ data }) {
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

  // Last 6 months for revenue vs expense
  const last6 = chartData.slice(-6);

  // Cash flow line chart data
  const lineData = last6.map(m => ({ ...m, net: m.income - m.expense }));

  // Project status pie
  const pieData = (data.projectStatuses || []).map(p => ({ name: p.status, value: p.count }));

  // Top clients by revenue (from invoices)
  const clientRevenue = {};
  (data.dueInvoices || []).concat(data.overdueInvoices || []).forEach(inv => {
    const name = inv.client_name || 'Unknown';
    clientRevenue[name] = (clientRevenue[name] || 0) + inv.total;
  });
  const topClients = Object.entries(clientRevenue).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5);

  // Inventory stock levels
  const stockData = (data.lowStock || []).slice(0, 10).map(i => ({ name: i.name?.slice(0, 15), stock: i.stock, min: i.min_stock }));

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

      {/* Revenue vs Expense + Cash Flow Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Revenue vs Expense</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={last6}>
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
          <h3 className="font-semibold text-gray-700 mb-4">Cash Flow</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="income" name="Masuk" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="expense" name="Keluar" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Status + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Status Proyek</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Top Client by Revenue</h3>
          {topClients.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topClients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="total" name="Revenue" fill="#3B82F6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm">Belum ada data invoice</p>}
        </div>
      </div>

      {/* Inventory Stock Levels */}
      {stockData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Stok Menipis</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="stock" name="Stok" fill="#F59E0B" radius={[4,4,0,0]} />
              <Bar dataKey="min" name="Min Stock" fill="#EF4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';

  useEffect(() => {
    api.get('/reports/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Memuat dashboard...</div>;
  if (!data) return <div className="text-center py-20 text-red-500">Gagal memuat data</div>;

  if (isStaff) return <StaffDashboard data={data} />;
  return <AdminDashboard data={data} />;
}
