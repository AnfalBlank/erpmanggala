import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass } from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Items() {
  const [data, setData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: '', unit: 'pcs', stock: 0, min_stock: 0, price: 0, warehouse_id: '' });

  const load = () => {
    api.get(`/inventory/items?search=${search}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/warehouses').then(res => setWarehouses(res.data || [])).catch(console.error);
  };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, stock: Number(form.stock), min_stock: Number(form.min_stock), price: Number(form.price), warehouse_id: Number(form.warehouse_id) || null };
      if (editId) { await api.put(`/inventory/items/${editId}`, payload); } else { await api.post('/inventory/items', payload); }
      setShowForm(false); setEditId(null); setForm({ name: '', sku: '', category: '', unit: 'pcs', stock: 0, min_stock: 0, price: 0, warehouse_id: '' }); load();
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => { setForm({ name: item.name, sku: item.sku||'', category: item.category||'', unit: item.unit, stock: item.stock, min_stock: item.min_stock, price: item.price, warehouse_id: item.warehouse_id||'' }); setEditId(item.id); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Hapus?')) { await api.delete(`/inventory/items/${id}`); load(); } };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Item Barang</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', sku: '', category: '', unit: 'pcs', stock: 0, min_stock: 0, price: 0, warehouse_id: '' }); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Tambah Item</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-4 border-b"><div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari item..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" /></div></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Nama</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">SKU</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Kategori</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Stok</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Min</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Harga</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Gudang</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
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
                <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => handleEdit(i)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Edit2 size={16} /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} Item`}
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-item').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-item" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nama" required>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} required />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="SKU">
              <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className={inputClass} />
            </FormField>
            <FormField label="Kategori">
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Stok">
              <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className={inputClass} />
            </FormField>
            <FormField label="Min Stok">
              <input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} className={inputClass} />
            </FormField>
            <FormField label="Satuan">
              <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Harga">
              <CurrencyInput value={form.price} onChange={val => setForm({...form, price: val})} />
            </FormField>
            <FormField label="Gudang">
              <select value={form.warehouse_id} onChange={e => setForm({...form, warehouse_id: e.target.value})} className={selectClass}><option value="">Pilih</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
