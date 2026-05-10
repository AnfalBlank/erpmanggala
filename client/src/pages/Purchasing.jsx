import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import CurrencyInput from '../components/CurrencyInput';
import StatusBadge from '../components/StatusBadge';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass } from '../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Purchasing() {
  const [data, setData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ number: '', vendor_id: '', project_id: '', date: '', total: '', status: 'Draft', items_json: '[]' });

  const load = () => {
    api.get(`/purchases?search=${search}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/vendors').then(res => setVendors(res.data || [])).catch(console.error);
    api.get('/projects').then(res => setProjects(res.data || [])).catch(console.error);
  };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, total: Number(form.total) || 0, vendor_id: Number(form.vendor_id) || null, project_id: Number(form.project_id) || null };
      if (editId) { await api.put(`/purchases/${editId}`, payload); } else { await api.post('/purchases', payload); }
      setShowForm(false); setEditId(null); load();
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => { setForm({ number: item.number, vendor_id: item.vendor_id, project_id: item.project_id || '', date: item.date, total: item.total, status: item.status, items_json: item.items_json }); setEditId(item.id); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Hapus?')) { await api.delete(`/purchases/${id}`); load(); } };
  const venName = (id) => vendors.find(v => v.id === id)?.name || '-';

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Purchasing</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ number: `PO-${new Date().getFullYear()}-${String(data.length+1).padStart(3,'0')}`, vendor_id: '', project_id: '', date: new Date().toISOString().slice(0,10), total: '', status: 'Draft', items_json: '[]' }); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Tambah PO</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-4 border-b"><div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" /></div></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Nomor</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Vendor</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Tanggal</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Total</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Status</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.number}</td>
                <td className="px-4 py-3 text-gray-600">{venName(p.vendor_id)}</td>
                <td className="px-4 py-3 text-gray-600">{p.date}</td>
                <td className="px-4 py-3 text-gray-600">{fmt(p.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Edit2 size={16} /></button><button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} PO`}
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-purchasing').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-purchasing" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nomor" required>
            <input value={form.number} onChange={e => setForm({...form, number: e.target.value})} className={inputClass} required />
          </FormField>
          <FormField label="Vendor">
            <select value={form.vendor_id} onChange={e => setForm({...form, vendor_id: e.target.value})} className={selectClass}><option value="">Pilih</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          </FormField>
          <FormField label="Proyek">
            <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className={selectClass}><option value="">Tanpa Proyek</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </FormField>
          <FormField label="Tanggal">
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputClass} />
          </FormField>
          <FormField label="Total">
            <CurrencyInput value={form.total} onChange={val => setForm({...form, total: val})} />
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={selectClass}><option>Draft</option><option>Ordered</option><option>Partial</option><option>Received</option></select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
