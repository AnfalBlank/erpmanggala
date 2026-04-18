import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import ResponsiveTable from '../../components/ResponsiveTable';

export default function LeaveApproval() {
  const [data, setData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const load = () => { api.get('/leaves').then(res => setData(res.data || [])).catch(console.error); };
  useEffect(load, []);

  const handleAction = async (id, status) => { await api.put(`/leaves/${id}`, { status }); load(); };

  const handleBulkAction = async (status) => {
    await api.post('/bulk/leaves', { ids: selectedIds, status });
    setSelectedIds([]);
    load();
  };

  const columns = [
    { key: 'employee_name', label: 'Karyawan' },
    { key: 'type', label: 'Tipe' },
    { key: 'start_date', label: 'Mulai' },
    { key: 'end_date', label: 'Selesai' },
    { key: 'reason', label: 'Alasan' },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Approval Cuti</h2>
      <div className="bg-white rounded-xl border border-gray-200">
        <ResponsiveTable
          columns={columns}
          data={data}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={setSelectedIds}
          bulkActions={
            <>
              <button onClick={() => handleBulkAction('Approved')} className="px-3 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1"><CheckCircle size={12} /> Approve Semua</button>
              <button onClick={() => handleBulkAction('Rejected')} className="px-3 py-1 bg-red-600 text-white rounded text-xs flex items-center gap-1"><XCircle size={12} /> Reject Semua</button>
            </>
          }
          renderActions={(l) => (
            l.status === 'Pending' ? (
              <div className="flex gap-2 no-print">
                <button onClick={() => handleAction(l.id, 'Approved')} className="text-green-600"><CheckCircle size={18} /></button>
                <button onClick={() => handleAction(l.id, 'Rejected')} className="text-red-600"><XCircle size={18} /></button>
              </div>
            ) : null
          )}
        />
      </div>
    </div>
  );
}
