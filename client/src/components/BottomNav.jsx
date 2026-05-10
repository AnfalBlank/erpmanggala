import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, MessageCircle, Clock, FileText, MoreHorizontal } from 'lucide-react';

export default function BottomNav({ onOpenSidebar, chatUnread }) {
  const { user } = useAuth();
  const location = useLocation();
  const isStaff = user?.role === 'Staff';

  const items = isStaff ? [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/hrd/attendance', icon: Clock, label: 'Absen' },
    { path: '/chat', icon: MessageCircle, label: 'Chat', badge: chatUnread },
    { path: '/hrd/leave-request', icon: FileText, label: 'Cuti' },
    { action: 'menu', icon: MoreHorizontal, label: 'Menu' },
  ] : [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/invoices', icon: FileText, label: 'Invoice' },
    { path: '/chat', icon: MessageCircle, label: 'Chat', badge: chatUnread },
    { path: '/hrd/attendance', icon: Clock, label: 'Absen' },
    { action: 'menu', icon: MoreHorizontal, label: 'Menu' },
  ];

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="mx-4 mb-4">
        <div className="glass border border-gray-200/60 rounded-2xl shadow-xl shadow-black/10 flex items-center justify-around px-1 py-1">
          {items.map((item, i) => {
            if (item.action === 'menu') {
              return (
                <button key={i} onClick={onOpenSidebar}
                  className="flex flex-col items-center gap-0.5 py-2.5 px-4 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                  <item.icon size={20} strokeWidth={1.8} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            const active = isActive(item.path);
            return (
              <NavLink key={i} to={item.path}
                className={`flex flex-col items-center gap-0.5 py-2.5 px-4 rounded-xl transition-all relative ${
                  active
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}>
                <div className="relative">
                  <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-emerald-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold shadow-sm">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
