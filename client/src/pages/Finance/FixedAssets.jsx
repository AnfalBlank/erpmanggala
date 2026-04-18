import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Calculator, Edit2, Trash2, Plus, X } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function FixedAssets() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', category: '', purchase_date: '', purchase_price: '', useful_life: '', current_value: '' });

  const load = () => { api.get(`/fixed-assets?search=${search}`).then(res => setData(res.data || [])).catch(console.error); };
  useEffect(load, [search]);

  const handleDepreciation = async () => {
    for (const asset of data) {
      if (asset.useful_life && asset.purchase_price) {
        const age = (new Date() - new Date(asset.purchase_date)) / (365.25 * 24 * 3600 * 1000);
        const depPerYear = asset.purchase_price / asset.useful_life;
        const newValue = Math.max(0, asset.purchase_price - depPerYear * age);
        await api.put(`/fixed-assets/${asset.id}`, { current_value: Math.round(newValue) });
      }
    }
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, purchase_price: Number(form.purchase_price), useful_life: Number(form.useful_life), current_value: Number(form.current_value || form.purchase_price) };
    if (editId) { await api.put(`/fixed-assets/${editId}`, payload); } else { await api.post('/fixed-assets', payload); }
    setShowForm(false); setEditId(null); setForm({}); load();
  };

  const handleEdit = (item) => {
    setForm({ code: item.code || '', name: item.name || '', category: item.category || '', purchase_date: item.purchase_date || '', purchase_price: item.purchase_price || '', useful_life: item.useful_life || '', current_value: item.current_value || '' });
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (confirm('Hapus aset ini?')) { await api.delete(`/fixed-assets/${id}`); load(); } };

  const filtered = data.filter(d => !search || (d.name || '').toLowerCase().includes(search.toLowerCase()) || (d.code || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Aset Tetap</h2>
        <div className="flex gap-2">
          <button onClick={handleDepreciation} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 flex items-center gap-2"><Calculator size={16} /> Hitung Penyusutan</button>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({}); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah</button>
        </div>
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
            <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Kode</th><th className="px-4 py-3 font-medium">Nama Aset</th><th className="px-4 py-3 font-medium">Tgl Beli</th><th className="px-4 py-3 font-medium">Harga Perolehan</th><th className="px-4 py-3 font-medium">Nilai Buku</th><th className="px-4 py-3 font-medium">Umur (th)</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.purchase_date}</td>
                  <td className="px-4 py-3">{fmt(item.purchase_price)}</td>
                  <td className="px-4 py-3 font-medium">{fmt(item.current_value)}</td>
                  <td className="px-4 py-3">{item.useful_life}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data aset</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} Aset</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Kode</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label><input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tgl Beli</label><input type="date" value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Harga Perolehan</label><CurrencyInput value={form.purchase_price} onChange={val => setForm({...form, purchase_price: val})} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Umur (tahun)</label><input type="number" value={form.useful_life} onChange={e => setForm({...form, useful_life: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nilai Buku</label><CurrencyInput value={form.current_value} onChange={val => setForm({...form, current_value: val})} /></div>
              </div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
