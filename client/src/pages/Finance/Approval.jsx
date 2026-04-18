import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CheckCircle, XCircle, Clock, FileText, Search } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Approval() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');

  const load = () => {
    api.get('/expense-requests?status=Pending').then(res => setPending(res.data || [])).catch(() => setPending([]));
    api.get('/expense-requests?status=Approved,Rejected').then(res => setHistory(res.data || [])).catch(() => setHistory([]));
  };
  useEffect(load, []);

  const handleAction = async (id, status) => {
    await api.put(`/expense-requests/${id}`, { status });
    load();
  };

  const current = tab === 'pending' ? pending : history;
  const filtered = current.filter(r => {
    const q = search.toLowerCase();
    return !q || (r.project_name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || (r.requested_by || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Approval Pengajuan Biaya</h2>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === 'pending' ? 'bg-orange-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
          <Clock size={16} /> Menunggu Persetujuan {pending.length > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{pending.length}</span>}
        </button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === 'history' ? 'bg-blue-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
          <FileText size={16} /> Riwayat
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Proyek</th>
                <th className="px-4 py-3 font-medium">Deskripsi</th>
                <th className="px-4 py-3 font-medium">Item RAB</th>
                <th className="px-4 py-3 font-medium">Diajukan Oleh</th>
                <th className="px-4 py-3 font-medium">Jumlah</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.date || r.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium">{r.project_name || '-'}</td>
                  <td className="px-4 py-3">{r.description || '-'}</td>
                  <td className="px-4 py-3">{r.rab_item || '-'}</td>
                  <td className="px-4 py-3">{r.requested_by || '-'}</td>
                  <td className="px-4 py-3 font-medium">{fmt(r.amount || 0)}</td>
                  <td className="px-4 py-3">
                    {tab === 'pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(r.id, 'Approved')} className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 flex items-center gap-1"><CheckCircle size={14} /> Approve</button>
                        <button onClick={() => handleAction(r.id, 'Rejected')} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 flex items-center gap-1"><XCircle size={14} /> Reject</button>
                      </div>
                    ) : (
                      <StatusBadge status={r.status} />
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && tab === 'pending' && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <Clock size={40} className="mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada pengajuan biaya yang menunggu persetujuan</p>
                </td></tr>
              )}
              {filtered.length === 0 && tab === 'history' && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Belum ada riwayat persetujuan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
