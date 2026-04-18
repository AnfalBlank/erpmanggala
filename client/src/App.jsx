import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="customers" element={<Customers />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="purchasing" element={<Purchasing />} />
        <Route path="employees" element={<Employees />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="inventory/items" element={<Items />} />
        <Route path="inventory/warehouses" element={<Warehouses />} />
        <Route path="inventory/receipts" element={<Receipts />} />
        <Route path="inventory/issue" element={<Issue />} />
        <Route path="inventory/stock-report" element={<StockReport />} />
        <Route path="finance/banking" element={<Banking />} />
        <Route path="finance/bank-accounts" element={<BankAccounts />} />
        <Route path="finance/ledgers" element={<Ledgers />} />
        <Route path="finance/payroll" element={<Payroll />} />
        <Route path="finance/operational" element={<Operational />} />
        <Route path="finance/fixed-assets" element={<FixedAssets />} />
        <Route path="finance/coa" element={<COA />} />
        <Route path="finance/taxes" element={<Taxes />} />
        <Route path="finance/reports" element={<Reports />} />
        <Route path="finance/approval" element={<Approval />} />
        <Route path="hrd/attendance" element={<Attendance />} />
        <Route path="hrd/attendance-manage" element={<AttendanceManage />} />
        <Route path="hrd/leave-request" element={<LeaveRequest />} />
        <Route path="hrd/leave-approval" element={<LeaveApproval />} />
        <Route path="hrd/shifts" element={<Shifts />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
