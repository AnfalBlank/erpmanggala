import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, X } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

export default function LeaveRequest() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', type: 'Cuti Tahunan', start_date: '', end_date: '', reason: '' });

  const load = () => { api.get('/leaves').then(res => setData(res.data || [])).catch(console.error); api.get('/employees').then(res => setEmployees(res.data || [])).catch(console.error); };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/leaves', { ...form, employee_id: Number(form.employee_id) });
    setShowForm(false); setForm({ employee_id: '', type: 'Cuti Tahunan', start_date: '', end_date: '', reason: '' }); load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Permohonan Cuti</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Ajukan Cuti</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Karyawan</th><th className="px-4 py-3 font-medium">Tipe</th><th className="px-4 py-3 font-medium">Mulai</th><th className="px-4 py-3 font-medium">Selesai</th><th className="px-4 py-3 font-medium">Alasan</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{l.employee_name}</td><td className="px-4 py-3">{l.type}</td><td className="px-4 py-3">{l.start_date}</td><td className="px-4 py-3">{l.end_date}</td><td className="px-4 py-3">{l.reason}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Ajukan Cuti</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Karyawan</label><select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required><option value="">Pilih</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option>Cuti Tahunan</option><option>Sakit</option><option>Cuti Khusus</option></select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Alasan</label><textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Kirim</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
