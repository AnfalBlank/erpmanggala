import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import ResponsiveTable from '../../components/ResponsiveTable';
import Modal, { BtnSecondary } from '../../components/Modal';

const fmtDate = (d) => d ? new Date(d).toLocaleString('id-ID') : '-';

export default function LeaveApproval() {
  const [data, setData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detail, setDetail] = useState(null);
  const load = () => { api.get('/leaves').then(res => setData(res.data || [])).catch(console.error); };
  useEffect(load, []);

  const handleAction = async (id, status) => { await api.put(`/leaves/${id}`, { status }); load(); };

  const handleBulkAction = async (status) => {
    await api.post('/bulk/leaves', { ids: selectedIds, status });
    setSelectedIds([]);
    load();
  };

  const columns = [
    {
      key: 'employee_name',
      label: 'Karyawan',
      render: (l) => (
        <div>
          <div className="font-medium">{l.employee_name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Diajukan: {l.requested_by_name || '-'} · {fmtDate(l.created_at)}
          </div>
          {l.approved_by_name && (
            <div className="text-[11px] text-gray-400">
              {l.status === 'Approved' ? 'Disetujui' : 'Ditolak'}: {l.approved_by_name} · {fmtDate(l.approved_at)}
            </div>
          )}
        </div>
      ),
    },
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
            <div className="flex gap-2 no-print">
              <button onClick={() => setDetail(l)} className="text-blue-500 hover:text-blue-700"><Eye size={18} /></button>
              {l.status === 'Pending' && (
                <>
                  <button onClick={() => handleAction(l.id, 'Approved')} className="text-green-600"><CheckCircle size={18} /></button>
                  <button onClick={() => handleAction(l.id, 'Rejected')} className="text-red-600"><XCircle size={18} /></button>
                </>
              )}
            </div>
          )}
        />
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Cuti"
        footer={<BtnSecondary onClick={() => setDetail(null)}>Tutup</BtnSecondary>}>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400">Karyawan</div>
                <div className="font-medium">{detail.employee_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Tipe</div>
                <div className="font-medium">{detail.type}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Mulai</div>
                <div className="font-medium">{detail.start_date}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Selesai</div>
                <div className="font-medium">{detail.end_date}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-400">Alasan</div>
                <div className="font-medium">{detail.reason || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Status</div>
                <div><StatusBadge status={detail.status} /></div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking</div>
              <div className="text-[11px] text-gray-400">
                Diajukan oleh: {detail.requested_by_name || '-'} · {fmtDate(detail.created_at)}
              </div>
              {detail.approved_by_name && (
                <div className="text-[11px] text-gray-400">
                  {detail.status === 'Approved' ? 'Disetujui' : 'Ditolak'} oleh: {detail.approved_by_name} · {fmtDate(detail.approved_at)}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
