import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Calculator, Edit2, Trash2, Plus } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass } from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function FixedAssets() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', category: '', purchase_date: '', purchase_price: '', useful_life: '', current_value: '' });

  const load = () => { api.get(`/fixed_assets?search=${search}`).then(res => setData(res.data || [])).catch(console.error); };
  useEffect(load, [search]);

  const handleDepreciation = async () => {
    if (!confirm('Hitung penyusutan untuk semua aset? Jurnal akan dibuat otomatis.')) return;
    try {
      const res = await api.post('/fixed_assets/depreciate');
      alert(`${res.depreciated} aset berhasil dihitung penyusutannya`);
      load();
    } catch (e) { alert('Gagal: ' + (e.message || 'Error')); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, purchase_price: Number(form.purchase_price), useful_life: Number(form.useful_life), current_value: Number(form.current_value || form.purchase_price) };
      if (editId) { await api.put(`/fixed_assets/${editId}`, payload); } else { await api.post('/fixed_assets', payload); }
      setShowForm(false); setEditId(null); setForm({}); load();
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setForm({ code: item.code || '', name: item.name || '', category: item.category || '', purchase_date: item.purchase_date || '', purchase_price: item.purchase_price || '', useful_life: item.useful_life || '', current_value: item.current_value || '' });
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (confirm('Hapus aset ini?')) { await api.delete(`/fixed_assets/${id}`); load(); } };

  const filtered = data.filter(d => !search || (d.name || '').toLowerCase().includes(search.toLowerCase()) || (d.code || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Aset Tetap</h2>
        <div className="flex gap-2">
          <button onClick={handleDepreciation} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 flex items-center gap-2"><Calculator size={16} /> Hitung Penyusutan</button>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({}); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Tambah</button>
        </div>
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
            <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Kode</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Nama Aset</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Tgl Beli</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Harga Perolehan</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Nilai Buku</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Umur (th)</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.purchase_date}</td>
                  <td className="px-4 py-3">{fmt(item.purchase_price)}</td>
                  <td className="px-4 py-3 font-medium">{fmt(item.current_value)}</td>
                  <td className="px-4 py-3">{item.useful_life}</td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data aset</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} Aset`}
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-fixed-asset').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-fixed-asset" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Kode" required>
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className={inputClass} required />
            </FormField>
            <FormField label="Nama" required>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} required />
            </FormField>
          </div>
          <FormField label="Kategori">
            <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputClass} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Tgl Beli">
              <input type="date" value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} className={inputClass} />
            </FormField>
            <FormField label="Harga Perolehan" required>
              <CurrencyInput value={form.purchase_price} onChange={val => setForm({...form, purchase_price: val})} required />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Umur (tahun)">
              <input type="number" value={form.useful_life} onChange={e => setForm({...form, useful_life: e.target.value})} className={inputClass} />
            </FormField>
            <FormField label="Nilai Buku">
              <CurrencyInput value={form.current_value} onChange={val => setForm({...form, current_value: val})} />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
