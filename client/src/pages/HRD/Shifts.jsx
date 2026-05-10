import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Search, Clock } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass } from '../../components/Modal';

export default function Shifts() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', start_time: '', end_time: '', late_penalty: '' });
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';

  const load = () => { api.get(`/shifts?search=${search}`).then(res => setData(res.data || [])).catch(console.error); };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, late_penalty: Number(form.late_penalty) || 0 };
      if (editId) { await api.put(`/shifts/${editId}`, payload); } else { await api.post('/shifts', payload); }
      setShowForm(false); setEditId(null); setForm({}); load();
    } finally { setSaving(false); }
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
        <h2 className="text-xl font-semibold text-gray-900">Shift Kerja</h2>
        {!isStaff && <button onClick={() => { setShowForm(true); setEditId(null); setForm({}); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Tambah Shift</button>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Nama Shift</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Jam Masuk</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Jam Pulang</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Denda Telat</th>{!isStaff && <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th>}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1"><Clock size={14} className="text-green-500" /> {s.start_time}</span></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1"><Clock size={14} className="text-red-500" /> {s.end_time}</span></td>
                  <td className="px-4 py-3 text-red-600">{fmt(s.late_penalty || 0)}</td>
                  {!isStaff && <td className="px-4 py-3"><div className="flex gap-1">
                    <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                  </div></td>}
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Tidak ada data shift</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} Shift`}
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-shift').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-shift" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nama Shift" required>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} required />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Jam Masuk" required>
              <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className={inputClass} required />
            </FormField>
            <FormField label="Jam Pulang" required>
              <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className={inputClass} required />
            </FormField>
          </div>
          <FormField label="Denda Telat (Rp)">
            <CurrencyInput value={form.late_penalty} onChange={val => setForm({...form, late_penalty: val})} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
