import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell, Search, X, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/i18n.jsx';
import { ToastProvider } from '../context/ToastContext';

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

  // Dark mode
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', dark);
  }, [dark]);

  // Online/offline events
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Sync queued offline attendance
  useEffect(() => {
    if (!isOnline) return;
    const queue = JSON.parse(localStorage.getItem('offlineAttendanceQueue') || '[]');
    if (queue.length === 0) return;
    (async () => {
      for (const item of queue) {
        try { await api.post('/attendance', item); } catch (e) {}
      }
      localStorage.removeItem('offlineAttendanceQueue');
    })();
  }, [isOnline]);

  // Load notifications
  const loadNotifs = () => {
    api.get('/notifications').then(res => {
      setNotifications(res.data || []);
      setUnread(res.unread || 0);
    }).catch(() => {});
  };
  useEffect(loadNotifs, []);
  useEffect(() => {
    const iv = setInterval(loadNotifs, 60000);
    return () => clearInterval(iv);
  }, []);

  // Global search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      api.get(`/search?q=${encodeURIComponent(searchQuery)}`).then(setSearchResults).catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 100); }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotif(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAsRead = async (id) => { await api.put(`/notifications/${id}/read`); loadNotifs(); };
  const markAllRead = async () => { await api.put('/notifications/read-all'); loadNotifs(); };
  const handleSearchClick = (result) => { navigate(result.path); setShowSearch(false); setSearchQuery(''); };
  const notifTypeIcon = { invoice_overdue: '🔴', invoice_due_soon: '🟡', low_stock: '📦', leave_pending: '📋', payroll_reminder: '💰' };

  return (
    <ToastProvider>
    <div className="min-h-screen bg-gray-50">
      {!isOnline && <div className="offline-banner"><WifiOff size={14} className="inline mr-1" /> Offline Mode — Data akan disinkronkan saat koneksi kembali</div>}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="lg:ml-60">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu size={20} /></button>
          <h1 className="text-base lg:text-lg font-semibold text-gray-800 truncate hidden sm:block">ERP Manggala</h1>

          <div className="ml-4 flex-1 max-w-md relative">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input ref={searchRef} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)} placeholder={`${t('common.search')} (Ctrl+K)`} className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              {searchQuery && <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-80 overflow-y-auto z-50">
                {(() => {
                  const grouped = {};
                  searchResults.forEach(r => { (grouped[r.type] = grouped[r.type] || []).push(r); });
                  return Object.entries(grouped).map(([type, items]) => (
                    <div key={type}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50">{type}</div>
                      {items.map((r, i) => (
                        <button key={i} onClick={() => handleSearchClick(r)} className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between">
                          <div><div className="text-sm font-medium text-gray-700">{r.label}</div><div className="text-xs text-gray-400">{r.sub}</div></div>
                          <span className="text-xs text-gray-400">{r.path}</span>
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Language toggle */}
            <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium" title="Toggle Language">
              🌐 {lang === 'id' ? 'EN' : 'ID'}
            </button>
            {/* Dark mode toggle */}
            <button onClick={() => setDark(!dark)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Toggle Dark Mode">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Online indicator */}
            {isOnline ? <Wifi size={16} className="text-green-500 hidden sm:block" /> : <WifiOff size={16} className="text-red-500 hidden sm:block" />}
            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Bell size={20} />
                {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-sm">Notifikasi</span>
                    {unread > 0 && <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-700">Tandai semua dibaca</button>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">Tidak ada notifikasi</div>
                    ) : notifications.map(n => (
                      <button key={n.id} onClick={() => !n.read && markAsRead(n.id)} className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                        <div className="flex items-start gap-2">
                          <span className="text-sm">{notifTypeIcon[n.type] || '🔔'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-700 truncate">{n.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-2">{n.message}</div>
                            <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('id-ID')}</div>
                          </div>
                          {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs lg:text-sm text-gray-500 hidden sm:block">PT Manggala Utama Indonesia</div>
          </div>
        </header>
        <main className="p-3 lg:p-6 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
