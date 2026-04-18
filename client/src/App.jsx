import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { RoleGuard } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Purchasing from './pages/Purchasing';
import Employees from './pages/Employees';
import Vendors from './pages/Vendors';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Items from './pages/Inventory/Items';
import Warehouses from './pages/Inventory/Warehouses';
import Receipts from './pages/Inventory/Receipts';
import Issue from './pages/Inventory/Issue';
import StockReport from './pages/Inventory/StockReport';
import Banking from './pages/Finance/Banking';
import BankAccounts from './pages/Finance/BankAccounts';
import Ledgers from './pages/Finance/Ledgers';
import Payroll from './pages/Finance/Payroll';
import Operational from './pages/Finance/Operational';
import FixedAssets from './pages/Finance/FixedAssets';
import COA from './pages/Finance/COA';
import Taxes from './pages/Finance/Taxes';
import Reports from './pages/Finance/Reports';
import Approval from './pages/Finance/Approval';
import Attendance from './pages/HRD/Attendance';
import AttendanceManage from './pages/HRD/AttendanceManage';
import LeaveRequest from './pages/HRD/LeaveRequest';
import LeaveApproval from './pages/HRD/LeaveApproval';
import Shifts from './pages/HRD/Shifts';
import SlipGaji from './pages/HRD/SlipGaji';

// Role constants
const SA = ['Super Admin'];
const SA_A = ['Super Admin', 'Admin'];
const SA_A_F = ['Super Admin', 'Admin', 'Finance'];
const SA_A_S = ['Super Admin', 'Admin', 'Staff'];
const ALL_STAFF = ['Super Admin', 'Admin', 'Finance', 'Staff'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />

        {/* Business - Staff cannot access */}
        <Route path="projects" element={<RoleGuard roles={SA_A}><Projects /></RoleGuard>} />
        <Route path="customers" element={<RoleGuard roles={SA_A}><Customers /></RoleGuard>} />
        <Route path="invoices" element={<RoleGuard roles={SA_A_F}><Invoices /></RoleGuard>} />
        <Route path="purchasing" element={<RoleGuard roles={SA_A_F}><Purchasing /></RoleGuard>} />

        {/* Inventory - Staff cannot access */}
        <Route path="inventory/items" element={<RoleGuard roles={SA_A}><Items /></RoleGuard>} />
        <Route path="inventory/warehouses" element={<RoleGuard roles={SA_A}><Warehouses /></RoleGuard>} />
        <Route path="inventory/receipts" element={<RoleGuard roles={SA_A}><Receipts /></RoleGuard>} />
        <Route path="inventory/issue" element={<RoleGuard roles={SA_A}><Issue /></RoleGuard>} />
        <Route path="inventory/stock-report" element={<RoleGuard roles={SA_A}><StockReport /></RoleGuard>} />

        {/* HRD */}
        <Route path="employees" element={<RoleGuard roles={SA_A}><Employees /></RoleGuard>} />
        <Route path="hrd/attendance" element={<RoleGuard roles={SA_A_S}><Attendance /></RoleGuard>} />
        <Route path="hrd/attendance-manage" element={<RoleGuard roles={SA_A}><AttendanceManage /></RoleGuard>} />
        <Route path="hrd/leave-request" element={<RoleGuard roles={SA_A_S}><LeaveRequest /></RoleGuard>} />
        <Route path="hrd/leave-approval" element={<RoleGuard roles={SA_A}><LeaveApproval /></RoleGuard>} />
        <Route path="hrd/shifts" element={<RoleGuard roles={SA_A_S}><Shifts /></RoleGuard>} />
        <Route path="slip-gaji" element={<RoleGuard roles={['Staff']}><SlipGaji /></RoleGuard>} />

        {/* Finance */}
        <Route path="finance/banking" element={<RoleGuard roles={SA_A_F}><Banking /></RoleGuard>} />
        <Route path="finance/bank-accounts" element={<RoleGuard roles={SA_A_F}><BankAccounts /></RoleGuard>} />
        <Route path="finance/ledgers" element={<RoleGuard roles={SA_A_F}><Ledgers /></RoleGuard>} />
        <Route path="finance/payroll" element={<RoleGuard roles={SA_A_F}><Payroll /></RoleGuard>} />
        <Route path="finance/operational" element={<RoleGuard roles={SA_A_F}><Operational /></RoleGuard>} />
        <Route path="finance/fixed-assets" element={<RoleGuard roles={SA_A_F}><FixedAssets /></RoleGuard>} />
        <Route path="finance/coa" element={<RoleGuard roles={SA_A_F}><COA /></RoleGuard>} />
        <Route path="finance/taxes" element={<RoleGuard roles={SA_A_F}><Taxes /></RoleGuard>} />
        <Route path="finance/reports" element={<RoleGuard roles={SA_A_F}><Reports /></RoleGuard>} />
        <Route path="finance/approval" element={<RoleGuard roles={SA_A_F}><Approval /></RoleGuard>} />

        {/* Master */}
        <Route path="vendors" element={<RoleGuard roles={SA_A}><Vendors /></RoleGuard>} />

        {/* Admin - Super Admin only */}
        <Route path="users" element={<RoleGuard roles={SA}><Users /></RoleGuard>} />
        <Route path="settings" element={<RoleGuard roles={SA}><Settings /></RoleGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
