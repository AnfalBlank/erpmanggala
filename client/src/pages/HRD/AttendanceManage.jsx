import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Edit2, X } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

export default function AttendanceManage() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ employee_id: '', check_in: '', check_out: '', status: 'Hadir' });

  const load = () => {
    api.get(`/attendance?date=${date}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/employees').then(res => setEmployees(res.data || [])).catch(console.error);
  };
  useEffect(load, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await api.put(`/attendance/${editId}`, form);
    } else {
      await api.post('/attendance', { ...form, date });
    }
    setShowForm(false); setEditId(null); load();
  };

  const handleEdit = (a) => {
    setForm({ employee_id: a.employee_id, check_in: a.check_in || '', check_out: a.check_out || '', status: a.status });
    setEditId(a.id); setShowForm(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Kelola Absensi</h2>
        <div className="flex gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ employee_id: '', check_in: '', check_out: '', status: 'Hadir' }); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">+ Tambah</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Karyawan</th><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Masuk</th><th className="px-4 py-3 font-medium">Keluar</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.employee_name}</td><td className="px-4 py-3">{a.date}</td><td className="px-4 py-3">{a.check_in||'-'}</td><td className="px-4 py-3">{a.check_out||'-'}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3"><button onClick={() => handleEdit(a)} className="text-blue-500"><Edit2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} Absensi</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Karyawan</label><select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required><option value="">Pilih</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label><input type="time" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Keluar</label><input type="time" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option>Hadir</option><option>Izin</option><option>Sakit</option><option>Alpha</option></select></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
