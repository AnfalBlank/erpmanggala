import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/i18n.jsx';
import {
  LayoutDashboard, FolderKanban, Users, FileText, ShoppingCart, UserCircle, Truck,
  Package, BarChart3, Building2, ArrowDownToLine, ArrowUpFromLine,
  Landmark, BookOpen, DollarSign, Settings, Lock, FileCheck, Banknote,
  ClipboardList, CalendarDays, Clock, UserCheck, CheckSquare, Wrench,
  ChevronDown, ChevronRight, LogOut, X, BookMarked, FileSpreadsheet, ListChecks,
  BookOpen as ApiDocs
} from 'lucide-react';

export default function Sidebar({ onClose }) {
  const [collapsed, setCollapsed] = useState({});
  const [expandedMenus, setExpandedMenus] = useState({});
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const userRole = user?.role;
  const isStaff = userRole === 'Staff';

  const menuGroups = [
    { label: t('nav.business').toUpperCase(), items: [
      { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
      { path: '/projects', icon: FolderKanban, label: t('business.projects'), roles: ['Super Admin', 'Admin'] },
      { path: '/customers', icon: Users, label: t('business.customers'), roles: ['Super Admin', 'Admin'] },
      { path: '/invoices', icon: FileText, label: t('finance.invoices'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/purchasing', icon: ShoppingCart, label: t('business.purchases'), roles: ['Super Admin', 'Admin', 'Finance'],
        children: [
          { path: '/purchasing/pr', icon: ListChecks, label: t('purchasing.pr'), roles: ['Super Admin', 'Admin'] },
          { path: '/purchasing/po', icon: FileSpreadsheet, label: t('purchasing.po'), roles: ['Super Admin', 'Admin'] },
        ]
      },
    ]},
    { label: t('nav.inventory').toUpperCase(), items: [
      { path: '/inventory/items', icon: Package, label: t('inventory.items'), roles: ['Super Admin', 'Admin'] },
      { path: '/inventory/warehouses', icon: Building2, label: t('inventory.warehouses'), roles: ['Super Admin', 'Admin'] },
      { path: '/inventory/receipts', icon: ArrowDownToLine, label: t('inventory.receipts'), roles: ['Super Admin', 'Admin'] },
      { path: '/inventory/issue', icon: ArrowUpFromLine, label: t('inventory.issue'), roles: ['Super Admin', 'Admin'] },
      { path: '/inventory/stock-report', icon: BarChart3, label: t('inventory.stockReport'), roles: ['Super Admin', 'Admin'] },
    ]},
    { label: t('nav.hrd').toUpperCase(), items: [
      { path: '/employees', icon: UserCircle, label: t('dashboard.employees'), roles: ['Super Admin', 'Admin'] },
      { path: '/hrd/attendance', icon: Clock, label: t('hrd.attendance'), roles: ['Super Admin', 'Admin', 'Staff'] },
      { path: '/hrd/attendance-manage', icon: UserCheck, label: 'Kelola Absensi', roles: ['Super Admin', 'Admin'] },
      { path: '/hrd/leave-request', icon: CalendarDays, label: t('hrd.leave'), roles: ['Super Admin', 'Admin', 'Staff'] },
      { path: '/hrd/leave-approval', icon: CheckSquare, label: t('hrd.leaveApproval'), roles: ['Super Admin', 'Admin'] },
      { path: '/hrd/shifts', icon: ClipboardList, label: t('hrd.shifts'), roles: ['Super Admin', 'Admin', 'Staff'] },
    ]},
    { label: t('nav.finance').toUpperCase(), items: [
      { path: '/finance/banking', icon: Landmark, label: t('finance.banking'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/finance/bank-accounts', icon: Banknote, label: t('finance.bankAccounts'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/finance/journals', icon: BookMarked, label: t('finance.journals'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/finance/payroll', icon: DollarSign, label: t('finance.payroll'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/finance/operational', icon: FileCheck, label: t('finance.operational'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/finance/coa', icon: BookOpen, label: t('finance.coa'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/finance/fixed-assets', icon: Wrench, label: t('finance.fixedAssets'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/finance/taxes', icon: Lock, label: t('finance.taxes'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/finance/reports', icon: BarChart3, label: t('finance.reports'), roles: ['Super Admin', 'Admin', 'Finance'] },
      { path: '/finance/approval', icon: FileCheck, label: t('finance.approval'), roles: ['Super Admin', 'Admin', 'Finance'] },
    ]},
    { label: 'MASTER', items: [
      { path: '/vendors', icon: Truck, label: t('business.vendors'), roles: ['Super Admin', 'Admin'] },
    ]},
    { label: t('nav.admin').toUpperCase(), items: [
      { path: '/users', icon: UserCircle, label: 'User', roles: ['Super Admin'] },
      { path: '/audit-log', icon: FileText, label: 'Audit Log', roles: ['Super Admin'] },
      { path: '/settings', icon: Settings, label: t('nav.settings'), roles: ['Super Admin'] },
    ]},
  ];

  const staffMenuGroups = [
    { label: 'PERSONAL', items: [
      { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
      { path: '/hrd/attendance', icon: Clock, label: t('hrd.attendance') },
      { path: '/hrd/shifts', icon: ClipboardList, label: t('hrd.shifts') },
      { path: '/hrd/leave-request', icon: CalendarDays, label: t('hrd.leave') },
      { path: '/slip-gaji', icon: DollarSign, label: t('hrd.slipGaji') },
      { path: '/profile', icon: UserCircle, label: t('nav.profile') },
    ]},
  ];

  const toggle = (label) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  const toggleMenu = (path) => setExpandedMenus(prev => ({ ...prev, [path]: !prev[path] }));
  const handleNavClick = () => { if (window.innerWidth < 1024) onClose?.(); };

  const filteredGroups = isStaff ? staffMenuGroups : menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.roles && !item.roles.includes(userRole)) return false;
        if (item.children) item.children = item.children.filter(c => !c.roles || c.roles.includes(userRole));
        return true;
      }),
    }))
    .filter(group => group.items.length > 0);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderItem = (item) => {
    if (item.children && item.children.length > 0) {
      const isExpanded = expandedMenus[item.path];
      const isChildActive = item.children.some(c => isActive(c.path));
      return (
        <div key={item.path}>
          <button onClick={() => toggleMenu(item.path)} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 w-full ${isChildActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            <item.icon size={18} />
            <span className="flex-1 text-left">{item.label}</span>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {isExpanded && item.children.map(child => (
            <NavLink key={child.path} to={child.path} onClick={handleNavClick} className={({ isActive: active }) => `flex items-center gap-2.5 px-3 py-2 pl-9 rounded-lg text-sm transition-colors mb-0.5 ${active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
              <child.icon size={16} />
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      );
    }
    return (
      <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={handleNavClick} className={() => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${isActive(item.path) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
        <item.icon size={18} />
        <span>{item.label}</span>
      </NavLink>
    );
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
        <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {filteredGroups.map(group => (
          <div key={group.label} className="mb-3">
            <button onClick={() => toggle(group.label)} className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600">
              {group.label}
              {collapsed[group.label] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
            {!collapsed[group.label] && group.items.map(item => renderItem(item))}
          </div>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <button onClick={() => { onClose?.(); navigate('/profile'); }} className="flex items-center gap-2 w-full px-2 mb-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">{user?.name?.[0] || 'U'}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-700 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.role}</div>
          </div>
        </button>
        <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={16} /> {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
