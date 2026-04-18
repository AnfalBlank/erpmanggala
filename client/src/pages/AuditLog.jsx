import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Search, FileText } from 'lucide-react';

const actionColors = { INSERT: 'bg-green-100 text-green-700', UPDATE: 'bg-blue-100 text-blue-700', DELETE: 'bg-red-100 text-red-700' };

export default function AuditLog() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tableName, setTableName] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams({ search, table_name: tableName, action, page, limit: 50 });
    api.get(`/audit-logs?${params}`).then(res => { setData(res.data || []); setTotal(res.total || 0); }).catch(console.error);
  };
  useEffect(load, [search, tableName, action, page]);

  const tables = ['users','employees','customers','vendors','projects','invoices','purchases','inventory_items','warehouses','payroll','leave_requests','attendance','shifts','transactions','bank_accounts'];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Audit Log</h2>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari user atau tabel..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" />
          </div>
          <select value={tableName} onChange={e => { setTableName(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Semua Tabel</option>
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Semua Aksi</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Waktu</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
              <th className="px-4 py-3 font-medium">Tabel</th>
              <th className="px-4 py-3 font-medium">Record ID</th>
              <th className="px-4 py-3 font-medium">Detail</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 text-xs">{log.created_at}</td>
                  <td className="px-4 py-3 font-medium">{log.user_name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-100'}`}>{log.action}</span></td>
                  <td className="px-4 py-3">{log.table_name}</td>
                  <td className="px-4 py-3">{log.record_id}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-xs text-gray-500" title={log.new_data || log.old_data}>{log.new_data || log.old_data || '-'}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data audit log</td></tr>}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-gray-100">
          {data.map(log => (
            <div key={log.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{log.user_name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-100'}`}>{log.action}</span>
              </div>
              <div className="text-xs text-gray-500">{log.table_name} #{log.record_id}</div>
              <div className="text-xs text-gray-400 mt-1">{log.created_at}</div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          Total: {total} records
        </div>
      </div>
    </div>
  );
}
