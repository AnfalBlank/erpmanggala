import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { Bell, Search, X, Moon, Sun, Wifi, WifiOff, ChevronRight, MessageCircle, FileText, Package, CalendarDays } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/i18n.jsx';

const pathLabels = {
  '': 'Dashboard', projects: 'Proyek', customers: 'Customer', invoices: 'Invoice',
  purchasing: 'Purchasing', pr: 'Purchase Request', po: 'Purchase Order',
  inventory: 'Inventaris', items: 'Barang', warehouses: 'Gudang', receipts: 'Penerimaan',
  issue: 'Pengeluaran', 'stock-report': 'Laporan Stok', chat: 'Chat',
  employees: 'Karyawan', hrd: 'HRD', attendance: 'Absensi', 'attendance-manage': 'Kelola Absensi',
  'leave-request': 'Cuti', 'leave-approval': 'Approval Cuti', shifts: 'Shift',
  finance: 'Keuangan', banking: 'Kas & Bank', 'bank-accounts': 'Rekening', journals: 'Jurnal',
  payroll: 'Payroll', operational: 'Operasional', coa: 'COA', 'fixed-assets': 'Aset Tetap',
  taxes: 'Pajak', reports: 'Laporan', approval: 'Approval',
  vendors: 'Vendor', users: 'User', 'audit-log': 'Audit Log', settings: 'Pengaturan',
  profile: 'Profil', 'slip-gaji': 'Slip Gaji',
};

function Breadcrumb() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <nav className="hidden sm:flex items-center gap-1 text-xs text-gray-400 mb-5">
      <span className="hover:text-gray-600 cursor-default transition-colors">Dashboard</span>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={11} className="opacity-30" />
          <span className={i === parts.length - 1 ? 'text-gray-600 font-medium' : 'hover:text-gray-600 cursor-default transition-colors'}>
            {pathLabels[p] || p}
          </span>
        </span>
      ))}
    </nav>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang, setLang } = useTranslation();

  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('darkMode', dark); }, [dark]);
  useEffect(() => {
    const on = () => setIsOnline(true); const off = () => setIsOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  useEffect(() => {
    if (!isOnline) return;
    const queue = JSON.parse(localStorage.getItem('offlineAttendanceQueue') || '[]');
    if (queue.length === 0) return;
    (async () => { for (const item of queue) { try { await api.post('/attendance', item); } catch {} } localStorage.removeItem('offlineAttendanceQueue'); })();
  }, [isOnline]);

  const loadNotifs = () => { api.get('/notifications').then(res => { setNotifications(res.data || []); setUnread(res.unread || 0); }).catch(() => {}); };
  useEffect(loadNotifs, []);
  useEffect(() => { const iv = setInterval(loadNotifs, 30000); return () => clearInterval(iv); }, []);

  const [chatUnread, setChatUnread] = useState(0);
  useEffect(() => {
    const load = () => { api.get('/chat/unread').then(res => setChatUnread(res.unread || 0)).catch(() => {}); };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => { api.get(`/search?q=${encodeURIComponent(searchQuery)}`).then(setSearchResults).catch(() => setSearchResults([])); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 100); }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotif(false); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAsRead = async (id) => { await api.put(`/notifications/${id}/read`); loadNotifs(); };
  const markAllRead = async () => { await api.put('/notifications/read-all'); loadNotifs(); };
  const handleSearchClick = (result) => { navigate(result.path); setShowSearch(false); setSearchQuery(''); };

  const notifIcons = {
    invoice_overdue: { color: 'text-red-500', bg: 'bg-red-50' },
    invoice_due_soon: { color: 'text-amber-500', bg: 'bg-amber-50' },
    low_stock: { color: 'text-orange-500', bg: 'bg-orange-50' },
    leave_pending: { color: 'text-blue-500', bg: 'bg-blue-50' },
    chat_message: { color: 'text-indigo-500', bg: 'bg-indigo-50' },
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      {!isOnline && <div className="offline-banner"><WifiOff size={13} className="inline mr-1.5" />Offline — Data akan disinkronkan saat koneksi kembali</div>}

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <BottomNav onOpenSidebar={() => setSidebarOpen(true)} chatUnread={chatUnread} />

      <div className="lg:ml-64">
        {/* Header */}
        <header className="h-14 glass border-b border-gray-100 flex items-center px-4 lg:px-6 sticky top-0 z-20">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              placeholder={`${t('common.search')}  ⌘K`}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-gray-300"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X size={13} />
              </button>
            )}
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-xl max-h-72 overflow-y-auto z-50 animate-slide-down">
                {(() => {
                  const grouped = {};
                  searchResults.forEach(r => { (grouped[r.type] = grouped[r.type] || []).push(r); });
                  return Object.entries(grouped).map(([type, items]) => (
                    <div key={type}>
                      <div className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/50">{type}</div>
                      {items.map((r, i) => (
                        <button key={i} onClick={() => handleSearchClick(r)} className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/50 flex items-center justify-between transition-colors">
                          <div>
                            <div className="text-sm font-medium text-gray-800">{r.label}</div>
                            <div className="text-xs text-gray-400">{r.sub}</div>
                          </div>
                          <span className="text-[10px] text-gray-300 font-mono bg-gray-50 px-2 py-0.5 rounded">{r.path}</span>
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="hidden sm:flex btn btn-ghost btn-sm text-gray-400 text-xs font-medium">
              {lang === 'id' ? 'EN' : 'ID'}
            </button>
            <button onClick={() => setDark(!dark)} className="btn btn-ghost btn-icon text-gray-400">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="hidden sm:flex items-center px-1">
              {isOnline
                ? <Wifi size={13} className="text-emerald-400" />
                : <WifiOff size={13} className="text-red-400" />}
            </div>

            {/* Chat */}
            <button onClick={() => navigate('/chat')} className="hidden lg:flex btn btn-ghost btn-icon text-gray-400 relative">
              <MessageCircle size={16} />
              {chatUnread > 0 && <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">{chatUnread > 9 ? '9+' : chatUnread}</span>}
            </button>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="btn btn-ghost btn-icon text-gray-400 relative">
                <Bell size={16} />
                {unread > 0 && <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 animate-slide-down overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <span className="text-sm font-semibold text-gray-800">Notifikasi</span>
                    {unread > 0 && <button onClick={markAllRead} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">Tandai dibaca</button>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-10">
                        <Bell size={24} className="mx-auto mb-2 text-gray-200" />
                        <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
                      </div>
                    ) : notifications.map(n => (
                      <button key={n.id} onClick={() => { if (!n.read) markAsRead(n.id); if (n.type === 'chat_message') navigate('/chat'); }}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                            <Bell size={14} className="text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{n.title}</div>
                            <div className="text-xs text-gray-400 line-clamp-2 mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-gray-300 mt-1">{new Date(n.created_at).toLocaleString('id-ID')}</div>
                          </div>
                          {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <button onClick={() => navigate('/profile')} className="hidden sm:flex items-center gap-2.5 ml-2 pl-3 border-l border-gray-100">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-500/30">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[90px]">{user?.name}</div>
                <div className="text-[10px] text-gray-400">{user?.role}</div>
              </div>
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-full overflow-x-hidden">
          <Breadcrumb />
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
