import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, Briefcase, AlertTriangle, Clock,
  Camera, CalendarDays, ClipboardList, CheckCircle, Users, Package,
  ArrowRight, ArrowUpRight, ArrowDownRight, RefreshCw, Activity
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => {
  if (!n) return '0';
  if (n >= 1e9) return `${(n/1e9).toFixed(1)}M`;
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}Jt`;
  if (n >= 1e3) return `${(n/1e3).toFixed(0)}Rb`;
  return String(n);
};

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-medium text-gray-800">{fmtShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function KPICard({ label, value, sub, icon: Icon, trend, trendValue, color = 'indigo', onClick }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
    red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-500' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className={`kpi-card ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon size={18} className={c.icon} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{value}</div>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function StaffDashboard({ data }) {
  const [attendance, setAttendance] = useState(null);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => { const iv = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(iv); }, []);
  const loadToday = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await api.get(`/attendance?date=${today}`);
    setAttendance((res.data || [])[0] || null);
  };
  useEffect(() => { loadToday(); }, []);

  const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const isCheckedIn = attendance?.check_in;
  const isCheckedOut = attendance?.check_out;
  const attChartData = (data.recentAttendance || []).map(a => ({ date: a.date?.slice(5) || '', hadir: a.status === 'Hadir' ? 1 : 0 })).reverse();

  return (
    <div className="space-y-6">
      {/* Hero clock card */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #6366f1 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm mb-1">{dayNames[time.getDay()]}, {time.getDate()} {monthNames[time.getMonth()]} {time.getFullYear()}</p>
          <div className="text-5xl font-bold font-mono tracking-tight mb-4">{time.toTimeString().slice(0, 8)}</div>
          <div className="flex flex-wrap gap-3">
            {!isCheckedIn ? (
              <button onClick={() => navigate('/hrd/attendance')}
                className="flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-lg">
                <Camera size={16} /> Absen Masuk
              </button>
            ) : !isCheckedOut ? (
              <>
                <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl text-sm">
                  <CheckCircle size={14} className="text-emerald-300" />
                  <span>Masuk: <strong>{attendance.check_in}</strong></span>
                </div>
                <button onClick={() => navigate('/hrd/attendance')}
                  className="flex items-center gap-2 bg-white text-orange-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-colors shadow-lg">
                  <Camera size={16} /> Absen Keluar
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl text-sm">
                <CheckCircle size={14} className="text-emerald-300" />
                <span>Selesai · {attendance.check_in} — {attendance.check_out}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Status Hari Ini" value={isCheckedOut ? 'Selesai' : isCheckedIn ? 'Masuk' : 'Belum'} icon={Clock}
          color={isCheckedOut ? 'emerald' : isCheckedIn ? 'indigo' : 'amber'} />
        <KPICard label="Shift Kerja" value={(data.shifts||[]).length > 0 ? data.shifts[0].name : '-'}
          sub={(data.shifts||[]).length > 0 ? `${data.shifts[0].start_time} — ${data.shifts[0].end_time}` : ''}
          icon={ClipboardList} color="indigo" />
        <KPICard label="Sisa Cuti" value={`${data.leaveBalance || 0} hari`} sub={`Terpakai: ${data.usedLeaves || 0} hari`}
          icon={CalendarDays} color="violet" onClick={() => navigate('/hrd/leave-request')} />
        <KPICard label="Gaji Terakhir" value={data.lastPayroll ? fmtShort(data.lastPayroll.net_salary) : '-'}
          sub={data.lastPayroll?.period || ''} icon={Wallet} color="emerald" onClick={() => navigate('/slip-gaji')} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {attChartData.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Kehadiran 7 Hari Terakhir</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={attChartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} ticks={[0,1]} tickFormatter={v => v ? 'Hadir' : '-'} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hadir" name="Kehadiran" fill="#6366f1" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Riwayat Kehadiran</h3>
          <div className="space-y-2 max-h-[180px] overflow-y-auto">
            {(data.recentAttendance || []).map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{a.date}</span>
                <span className="text-xs text-gray-400 font-mono">{a.check_in || '-'} → {a.check_out || '-'}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
            {(!data.recentAttendance || data.recentAttendance.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ data, onRefresh, refreshing }) {
  const navigate = useNavigate();
  const profit = data.profit || 0;
  const margin = data.income > 0 ? ((profit / data.income) * 100).toFixed(1) : '0';

  const cashFlowData = {};
  (data.cashFlow || []).forEach(c => {
    if (!cashFlowData[c.month]) cashFlowData[c.month] = { month: c.month, income: 0, expense: 0 };
    cashFlowData[c.month][c.type] = c.total;
  });
  const last6 = Object.values(cashFlowData).slice(-6).map(m => ({ ...m, net: m.income - m.expense }));
  const pieData = (data.projectStatuses || []).map(p => ({ name: p.status, value: p.count }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">PT Manggala Utama Indonesia</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-gray-500 font-medium shadow-sm">
            {data.totalEmployees || 0} Karyawan
          </span>
          <span className="text-xs px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-gray-500 font-medium shadow-sm">
            {data.activeProjects || 0} Proyek Aktif
          </span>
          <button onClick={onRefresh} disabled={refreshing}
            className="btn btn-secondary btn-sm">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Pendapatan" value={fmtShort(data.income)} icon={TrendingUp} color="emerald"
          trend="up" trendValue="+12%" onClick={() => navigate('/finance/reports')} />
        <KPICard label="Pengeluaran" value={fmtShort(data.expense)} icon={TrendingDown} color="red"
          trend="down" trendValue="-5%" onClick={() => navigate('/finance/banking')} />
        <KPICard label="Profit Bersih" value={fmtShort(profit)} sub={`Margin ${margin}%`} icon={Wallet} color="indigo"
          trend={profit >= 0 ? 'up' : 'down'} trendValue={`${margin}%`} onClick={() => navigate('/finance/reports')} />
        <KPICard label="Profit Operasional" value={fmtShort(data.income - (data.opExpense || 0))} icon={Briefcase} color="violet"
          onClick={() => navigate('/finance/operational')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash flow */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Arus Kas</h3>
              <p className="text-xs text-gray-400 mt-0.5">6 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Masuk</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Keluar</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />Net</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={last6}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={fmtShort} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="Masuk" stroke="#10b981" strokeWidth={2} fill="url(#gIncome)" />
              <Area type="monotone" dataKey="expense" name="Keluar" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
              <Line type="monotone" dataKey="net" name="Net" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Status Proyek</h3>
              <p className="text-xs text-gray-400 mt-0.5">{pieData.reduce((s, p) => s + p.value, 0)} total</p>
            </div>
            <button onClick={() => navigate('/projects')} className="btn btn-ghost btn-sm text-indigo-500">
              <ArrowRight size={13} />
            </button>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={4} strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {p.name}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300">
              <Briefcase size={32} className="mb-2" />
              <p className="text-sm">Belum ada proyek</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due invoices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock size={15} className="text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Invoice Jatuh Tempo</h3>
                <p className="text-xs text-gray-400">{(data.dueInvoices || []).length} invoice</p>
              </div>
            </div>
            <button onClick={() => navigate('/invoices')} className="btn btn-ghost btn-sm text-indigo-500">
              Semua <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {(data.dueInvoices || []).slice(0, 4).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate('/invoices')}>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{inv.number}</div>
                  <div className="text-xs text-gray-400">{inv.client_name} · {inv.due_date}</div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-sm font-bold text-gray-900">{fmtShort(inv.total)}</div>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
            {(!data.dueInvoices || data.dueInvoices.length === 0) && (
              <div className="flex flex-col items-center py-8 text-gray-300">
                <CheckCircle size={28} className="mb-2 text-emerald-300" />
                <p className="text-sm text-gray-400">Tidak ada invoice jatuh tempo</p>
              </div>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertTriangle size={15} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Stok Menipis</h3>
                <p className="text-xs text-gray-400">{(data.lowStock || []).length} item</p>
              </div>
            </div>
            <button onClick={() => navigate('/inventory/stock-report')} className="btn btn-ghost btn-sm text-indigo-500">
              Semua <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {(data.lowStock || []).slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer" onClick={() => navigate('/inventory/items')}>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                  <div className="text-xs text-gray-400">{item.sku}</div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-sm font-bold text-amber-600">{item.stock} {item.unit}</div>
                  <div className="text-[10px] text-gray-400">Min: {item.min_stock}</div>
                </div>
              </div>
            ))}
            {(!data.lowStock || data.lowStock.length === 0) && (
              <div className="flex flex-col items-center py-8 text-gray-300">
                <Package size={28} className="mb-2 text-emerald-300" />
                <p className="text-sm text-gray-400">Semua stok aman</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Buat Invoice', icon: TrendingUp, path: '/invoices', color: 'bg-indigo-50 text-indigo-600' },
            { label: 'Tambah Proyek', icon: Briefcase, path: '/projects', color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Terima Barang', icon: Package, path: '/inventory/receipts', color: 'bg-amber-50 text-amber-600' },
            { label: 'Generate Payroll', icon: Wallet, path: '/finance/payroll', color: 'bg-violet-50 text-violet-600' },
          ].map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
              <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <a.icon size={18} />
              </div>
              <span className="text-xs font-medium text-gray-600 text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/reports/dashboard');
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div className="skeleton h-9 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Gagal Memuat Data</h3>
      <p className="text-gray-400 text-sm mb-5">Terjadi kesalahan saat memuat dashboard</p>
      <button onClick={() => loadData()} className="btn btn-primary">
        <RefreshCw size={14} /> Coba Lagi
      </button>
    </div>
  );

  return user?.role === 'Staff'
    ? <StaffDashboard data={data} />
    : <AdminDashboard data={data} onRefresh={() => loadData(true)} refreshing={refreshing} />;
}
