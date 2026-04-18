import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2, X, Eye } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Purchasing() {
  const [data, setData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ number: '', vendor_id: '', date: '', total: '', status: 'Draft', items_json: '[]' });

  const load = () => {
    api.get(`/purchases?search=${search}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/vendors').then(res => setVendors(res.data || [])).catch(console.error);
  };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, total: Number(form.total) || 0, vendor_id: Number(form.vendor_id) || null };
    if (editId) { await api.put(`/purchases/${editId}`, payload); } else { await api.post('/purchases', payload); }
    setShowForm(false); setEditId(null); load();
  };

  const handleEdit = (item) => { setForm({ number: item.number, vendor_id: item.vendor_id, date: item.date, total: item.total, status: item.status, items_json: item.items_json }); setEditId(item.id); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Hapus?')) { await api.delete(`/purchases/${id}`); load(); } };
  const venName = (id) => vendors.find(v => v.id === id)?.name || '-';

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Purchasing</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ number: `PO-${new Date().getFullYear()}-${String(data.length+1).padStart(3,'0')}`, vendor_id: '', date: new Date().toISOString().slice(0,10), total: '', status: 'Draft', items_json: '[]' }); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah PO</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b"><div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" /></div></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Nomor</th><th className="px-4 py-3 font-medium">Vendor</th><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.number}</td>
                <td className="px-4 py-3 text-gray-600">{venName(p.vendor_id)}</td>
                <td className="px-4 py-3 text-gray-600">{p.date}</td>
                <td className="px-4 py-3 text-gray-600">{fmt(p.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(p)} className="text-blue-500"><Edit2 size={16} /></button><button onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} PO</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor</label><input value={form.number} onChange={e => setForm({...form, number: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label><select value={form.vendor_id} onChange={e => setForm({...form, vendor_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Pilih</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Total</label><input type="number" value={form.total} onChange={e => setForm({...form, total: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option>Draft</option><option>Ordered</option><option>Partial</option><option>Received</option></select></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
