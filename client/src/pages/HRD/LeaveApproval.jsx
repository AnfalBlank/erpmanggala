import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

export default function LeaveApproval() {
  const [data, setData] = useState([]);
  const load = () => { api.get('/leaves').then(res => setData(res.data || [])).catch(console.error); };
  useEffect(load, []);

  const handleAction = async (id, status) => { await api.put(`/leaves/${id}`, { status }); load(); };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Approval Cuti</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Karyawan</th><th className="px-4 py-3 font-medium">Tipe</th><th className="px-4 py-3 font-medium">Mulai</th><th className="px-4 py-3 font-medium">Selesai</th><th className="px-4 py-3 font-medium">Alasan</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{l.employee_name}</td><td className="px-4 py-3">{l.type}</td><td className="px-4 py-3">{l.start_date}</td><td className="px-4 py-3">{l.end_date}</td><td className="px-4 py-3">{l.reason}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3">{l.status === 'Pending' && <div className="flex gap-2"><button onClick={() => handleAction(l.id, 'Approved')} className="text-green-600"><CheckCircle size={18} /></button><button onClick={() => handleAction(l.id, 'Rejected')} className="text-red-600"><XCircle size={18} /></button></div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
