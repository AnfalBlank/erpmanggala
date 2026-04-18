import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, Users, FileText, ShoppingCart, UserCircle, Truck,
  Package, BarChart3, Building2, ArrowDownToLine, ArrowUpFromLine,
  Landmark, BookOpen, DollarSign, Settings, Lock, FileCheck, Banknote,
  ClipboardList, CalendarDays, Clock, UserCheck, CheckSquare, Wrench,
  ChevronDown, ChevronRight, LogOut, X
} from 'lucide-react';

const menuGroups = [
  { label: 'BISNIS', items: [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderKanban, label: 'Proyek' },
    { path: '/customers', icon: Users, label: 'Customer' },
    { path: '/invoices', icon: FileText, label: 'Invoice' },
    { path: '/purchasing', icon: ShoppingCart, label: 'Purchasing' },
  ]},
  { label: 'INVENTARIS', items: [
    { path: '/inventory/items', icon: Package, label: 'Item Barang' },
    { path: '/inventory/warehouses', icon: Building2, label: 'Gudang' },
    { path: '/inventory/receipts', icon: ArrowDownToLine, label: 'Penerimaan' },
    { path: '/inventory/issue', icon: ArrowUpFromLine, label: 'Pengeluaran' },
    { path: '/inventory/stock-report', icon: BarChart3, label: 'Laporan Stok' },
  ]},
  { label: 'HRD', items: [
    { path: '/employees', icon: UserCircle, label: 'Karyawan' },
    { path: '/hrd/attendance', icon: Clock, label: 'Absensi' },
    { path: '/hrd/attendance-manage', icon: UserCheck, label: 'Kelola Absensi' },
    { path: '/hrd/leave-request', icon: CalendarDays, label: 'Cuti' },
    { path: '/hrd/leave-approval', icon: CheckSquare, label: 'Approval Cuti' },
    { path: '/hrd/shifts', icon: ClipboardList, label: 'Shift' },
  ]},
  { label: 'KEUANGAN', items: [
    { path: '/finance/banking', icon: Landmark, label: 'Transaksi' },
    { path: '/finance/bank-accounts', icon: Banknote, label: 'Rekening Bank' },
    { path: '/finance/payroll', icon: DollarSign, label: 'Payroll' },
    { path: '/finance/operational', icon: FileCheck, label: 'Operasional' },
    { path: '/finance/coa', icon: BookOpen, label: 'COA' },
    { path: '/finance/fixed-assets', icon: Wrench, label: 'Aset Tetap' },
    { path: '/finance/taxes', icon: Lock, label: 'Pajak' },
    { path: '/finance/reports', icon: BarChart3, label: 'Laporan' },
    { path: '/finance/approval', icon: FileCheck, label: 'Approval' },
  ]},
  { label: 'MASTER', items: [
    { path: '/vendors', icon: Truck, label: 'Vendor' },
  ]},
  { label: 'ADMIN', items: [
    { path: '/users', icon: UserCircle, label: 'User' },
    { path: '/settings', icon: Settings, label: 'Pengaturan' },
  ]},
];

export default function Sidebar({ onClose }) {
  const [collapsed, setCollapsed] = useState({});
  const { user, logout } = useAuth();
  const location = useLocation();

  const toggle = (label) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));

  const handleNavClick = () => {
    // Close sidebar on mobile after clicking a link
    if (window.innerWidth < 1024) onClose?.();
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-lg font-bold tracking-wide text-gray-800">MANGGALA</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {menuGroups.map(group => (
          <div key={group.label} className="mb-3">
            <button onClick={() => toggle(group.label)} className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600">
              {group.label}
              {collapsed[group.label] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
            {!collapsed[group.label] && group.items.map(item => (
              <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={handleNavClick} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">{user?.name?.[0] || 'U'}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-700 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  );
}
