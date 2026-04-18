import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Items() {
  const [data, setData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', unit: 'pcs', stock: 0, min_stock: 0, price: 0, warehouse_id: '' });

  const load = () => {
    api.get(`/inventory/items?search=${search}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/warehouses').then(res => setWarehouses(res.data || [])).catch(console.error);
  };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, stock: Number(form.stock), min_stock: Number(form.min_stock), price: Number(form.price), warehouse_id: Number(form.warehouse_id) || null };
    if (editId) { await api.put(`/inventory/items/${editId}`, payload); } else { await api.post('/inventory/items', payload); }
    setShowForm(false); setEditId(null); setForm({ name: '', sku: '', category: '', unit: 'pcs', stock: 0, min_stock: 0, price: 0, warehouse_id: '' }); load();
  };

  const handleEdit = (item) => { setForm({ name: item.name, sku: item.sku||'', category: item.category||'', unit: item.unit, stock: item.stock, min_stock: item.min_stock, price: item.price, warehouse_id: item.warehouse_id||'' }); setEditId(item.id); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Hapus?')) { await api.delete(`/inventory/items/${id}`); load(); } };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Item Barang</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', sku: '', category: '', unit: 'pcs', stock: 0, min_stock: 0, price: 0, warehouse_id: '' }); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah Item</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b"><div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari item..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" /></div></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Nama</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Kategori</th><th className="px-4 py-3 font-medium">Stok</th><th className="px-4 py-3 font-medium">Min</th><th className="px-4 py-3 font-medium">Harga</th><th className="px-4 py-3 font-medium">Gudang</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(i => (
              <tr key={i.id} className={`hover:bg-gray-50 ${i.stock <= i.min_stock ? 'bg-orange-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{i.name}</td>
                <td className="px-4 py-3 text-gray-600">{i.sku}</td>
                <td className="px-4 py-3 text-gray-600">{i.category}</td>
                <td className="px-4 py-3 text-gray-600">{i.stock} {i.unit}</td>
                <td className="px-4 py-3 text-gray-600">{i.min_stock}</td>
                <td className="px-4 py-3 text-gray-600">{fmt(i.price)}</td>
                <td className="px-4 py-3 text-gray-600">{i.warehouse_name || '-'}</td>
                <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(i)} className="text-blue-500"><Edit2 size={16} /></button><button onClick={() => handleDelete(i.id)} className="text-red-500"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} Item</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU</label><input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label><input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stok</label><input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Stok</label><input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label><input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Harga</label><CurrencyInput value={form.price} onChange={val => setForm({...form, price: val})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gudang</label><select value={form.warehouse_id} onChange={e => setForm({...form, warehouse_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Pilih</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
              </div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
