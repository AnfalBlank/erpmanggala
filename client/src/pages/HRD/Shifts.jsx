import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, X, Search, Clock } from 'lucide-react';

export default function Shifts() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', start_time: '', end_time: '', late_penalty: '' });
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';

  const load = () => { api.get(`/shifts?search=${search}`).then(res => setData(res.data || [])).catch(console.error); };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, late_penalty: Number(form.late_penalty) || 0 };
    if (editId) { await api.put(`/shifts/${editId}`, payload); } else { await api.post('/shifts', payload); }
    setShowForm(false); setEditId(null); setForm({}); load();
  };

  const handleEdit = (item) => {
    setForm({ name: item.name || '', start_time: item.start_time || '', end_time: item.end_time || '', late_penalty: item.late_penalty || '' });
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (confirm('Hapus shift ini?')) { await api.delete(`/shifts/${id}`); load(); } };

  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Shift Kerja</h2>
        {!isStaff && <button onClick={() => { setShowForm(true); setEditId(null); setForm({}); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah Shift</button>}
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
            <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Nama Shift</th><th className="px-4 py-3 font-medium">Jam Masuk</th><th className="px-4 py-3 font-medium">Jam Pulang</th><th className="px-4 py-3 font-medium">Denda Telat</th>{!isStaff && <th className="px-4 py-3 font-medium">Aksi</th>}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1"><Clock size={14} className="text-green-500" /> {s.start_time}</span></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1"><Clock size={14} className="text-red-500" /> {s.end_time}</span></td>
                  <td className="px-4 py-3 text-red-600">{fmt(s.late_penalty || 0)}</td>
                  {!isStaff && <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                  </td>}
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Tidak ada data shift</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} Shift</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Shift</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label><input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Pulang</label><input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Denda Telat (Rp)</label><input type="number" value={form.late_penalty} onChange={e => setForm({...form, late_penalty: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
