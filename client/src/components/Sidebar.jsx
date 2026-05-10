import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/i18n.jsx';
import {
  LayoutDashboard, FolderKanban, Users, FileText, ShoppingCart, UserCircle, Truck,
  Package, BarChart3, Building2, ArrowDownToLine, ArrowUpFromLine,
  Landmark, BookOpen, DollarSign, Settings, Lock, FileCheck, Banknote,
  ClipboardList, CalendarDays, Clock, UserCheck, CheckSquare, Wrench,
  ChevronDown, LogOut, X, BookMarked, FileSpreadsheet, ListChecks,
  MessageCircle, Briefcase, Boxes, UsersRound, Wallet, Database, ShieldCheck, User,
  ChevronRight,
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
    { label: t('nav.business').toUpperCase(), icon: Briefcase, items: [
      { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
      { path: '/chat', icon: MessageCircle, label: 'Chat' },
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
    { label: t('nav.inventory').toUpperCase(), icon: Boxes, items: [
      { path: '/inventory/items', icon: Package, label: t('inventory.items'), roles: ['Super Admin', 'Admin'] },
      { path: '/inventory/warehouses', icon: Building2, label: t('inventory.warehouses'), roles: ['Super Admin', 'Admin'] },
      { path: '/inventory/receipts', icon: ArrowDownToLine, label: t('inventory.receipts'), roles: ['Super Admin', 'Admin'] },
      { path: '/inventory/issue', icon: ArrowUpFromLine, label: t('inventory.issue'), roles: ['Super Admin', 'Admin'] },
      { path: '/inventory/stock-report', icon: BarChart3, label: t('inventory.stockReport'), roles: ['Super Admin', 'Admin'] },
    ]},
    { label: t('nav.hrd').toUpperCase(), icon: UsersRound, items: [
      { path: '/employees', icon: UserCircle, label: t('dashboard.employees'), roles: ['Super Admin', 'Admin'] },
      { path: '/hrd/attendance', icon: Clock, label: t('hrd.attendance'), roles: ['Super Admin', 'Admin', 'Staff'] },
      { path: '/hrd/attendance-manage', icon: UserCheck, label: 'Kelola Absensi', roles: ['Super Admin', 'Admin'] },
      { path: '/hrd/leave-request', icon: CalendarDays, label: t('hrd.leave'), roles: ['Super Admin', 'Admin', 'Staff'] },
      { path: '/hrd/leave-approval', icon: CheckSquare, label: t('hrd.leaveApproval'), roles: ['Super Admin', 'Admin'] },
      { path: '/hrd/shifts', icon: ClipboardList, label: t('hrd.shifts'), roles: ['Super Admin', 'Admin', 'Staff'] },
    ]},
    { label: t('nav.finance').toUpperCase(), icon: Wallet, items: [
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
    { label: 'MASTER', icon: Database, items: [
      { path: '/vendors', icon: Truck, label: t('business.vendors'), roles: ['Super Admin', 'Admin'] },
    ]},
    { label: t('nav.admin').toUpperCase(), icon: ShieldCheck, items: [
      { path: '/users', icon: UserCircle, label: 'User', roles: ['Super Admin'] },
      { path: '/audit-log', icon: FileText, label: 'Audit Log', roles: ['Super Admin'] },
      { path: '/settings', icon: Settings, label: t('nav.settings'), roles: ['Super Admin'] },
    ]},
  ];

  const staffMenuGroups = [
    { label: 'PERSONAL', icon: User, items: [
      { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
      { path: '/chat', icon: MessageCircle, label: 'Chat' },
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
          <button onClick={() => toggleMenu(item.path)}
            className={`sidebar-item w-full ${isChildActive ? 'active' : ''}`}>
            <item.icon size={16} className="shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown size={13} className={`opacity-40 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="ml-3 pl-3 border-l border-gray-100 mt-0.5 space-y-0.5">
              {item.children.map(child => (
                <NavLink key={child.path} to={child.path} onClick={handleNavClick}
                  className={({ isActive: active }) =>
                    `sidebar-item text-[12.5px] ${active ? 'active' : ''}`
                  }>
                  <child.icon size={14} className="shrink-0 opacity-70" />
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return (
      <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={handleNavClick}
        className={() => `sidebar-item ${isActive(item.path) ? 'active' : ''}`}>
        <item.icon size={16} className="shrink-0" />
        <span className="flex-1">{item.label}</span>
        {isActive(item.path) && <ChevronRight size={13} className="opacity-30" />}
      </NavLink>
    );
  };

  const roleColors = {
    'Super Admin': 'bg-red-500',
    'Admin': 'bg-indigo-500',
    'Finance': 'bg-emerald-500',
    'Staff': 'bg-violet-500',
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-sm tracking-tight">M</span>
          </div>
          <div>
            <div className="text-[15px] font-bold text-gray-900 leading-tight tracking-tight">Manggala</div>
            <div className="text-[10px] text-gray-400 font-medium">ERP System</div>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden btn btn-ghost btn-icon">
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {filteredGroups.map(group => (
          <div key={group.label} className="mb-1">
            <button onClick={() => toggle(group.label)}
              className="flex items-center justify-between w-full px-3 py-1.5 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em] hover:text-gray-500 transition-colors">
              <span className="flex items-center gap-1.5">
                <group.icon size={10} className="opacity-60" />
                {group.label}
              </span>
              <ChevronDown size={9} className={`opacity-30 transition-transform duration-200 ${collapsed[group.label] ? '-rotate-90' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-200 space-y-0.5 ${collapsed[group.label] ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              {group.items.map(item => renderItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-3 shrink-0">
        <button onClick={() => { onClose?.(); navigate('/profile'); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all group mb-1">
          <div className={`w-8 h-8 ${roleColors[user?.role] || 'bg-gray-400'} rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[13px] font-semibold text-gray-800 truncate">{user?.name}</div>
            <div className="text-[11px] text-gray-400">{user?.role}</div>
          </div>
        </button>
        <button onClick={logout}
          className="sidebar-item w-full text-red-400 hover:text-red-600 hover:bg-red-50">
          <LogOut size={15} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
