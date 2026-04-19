import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Search, Edit2, Trash2, X, CheckCircle, ArrowRight } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import StatusBadge from '../../components/StatusBadge';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function PurchaseRequestList() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', project_id: '', notes: '', lines: [{ item_id: '', description: '', qty: '', unit: 'pcs', estimated_price: '' }] });

  const load = () => {
    api.get('/purchase-requests').then(res => setData(res.data || [])).catch(console.error);
    api.get('/projects').then(res => setProjects(res.data || [])).catch(console.error);
    api.get('/inventory/items').then(res => setItems(res.data || [])).catch(console.error);
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/purchase-requests', {
      code: form.code,
      project_id: form.project_id ? Number(form.project_id) : null,
      notes: form.notes,
      items: form.lines.map(l => ({ ...l, qty: Number(l.qty), estimated_price: Number(l.estimated_price) || 0, item_id: l.item_id ? Number(l.item_id) : null })),
    });
    setShowForm(false);
    setForm({ code: '', project_id: '', notes: '', lines: [{ item_id: '', description: '', qty: '', unit: 'pcs', estimated_price: '' }] });
    load();
  };

  const handleApprove = async (id) => { await api.put(`/purchase-requests/${id}/approve`); load(); };
  const handleReject = async (id) => { await api.put(`/purchase-requests/${id}/reject`); load(); };
  const handleDelete = async (id) => { if (confirm('Hapus PR ini?')) { await api.delete(`/purchase-requests/${id}`); load(); } };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { item_id: '', description: '', qty: '', unit: 'pcs', estimated_price: '' }] });
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  const updateLine = (idx, key, val) => { const lines = [...form.lines]; lines[idx][key] = val; setForm({ ...form, lines }); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Purchase Request</h2>
        <button onClick={() => { setShowForm(true); setForm({ ...form, code: `PR-${String(data.length + 1).padStart(4, '0')}` }); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Buat PR</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Kode</th><th className="px-4 py-3 font-medium">Proyek</th><th className="px-4 py-3 font-medium">Item</th><th className="px-4 py-3 font-medium">Estimasi</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(pr => (
              <tr key={pr.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{pr.code}</td>
                <td className="px-4 py-3">{pr.project_name || '-'}</td>
                <td className="px-4 py-3">{(pr.items || []).length} item</td>
                <td className="px-4 py-3">{fmt((pr.items || []).reduce((s, i) => s + (i.estimated_price || 0) * (i.qty || 0), 0))}</td>
                <td className="px-4 py-3"><StatusBadge status={pr.status} /></td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  {pr.status === 'Draft' && <button onClick={() => handleApprove(pr.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>}
                  {pr.status === 'Draft' && <button onClick={() => handleReject(pr.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Reject</button>}
                  {pr.status === 'Approved' && <span className="text-blue-600 text-xs font-medium flex items-center gap-1"><ArrowRight size={12} /> Convert ke PO</span>}
                  <button onClick={() => handleDelete(pr.id)} className="text-red-500"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada Purchase Request</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Buat Purchase Request</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Kode PR</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Proyek</label><select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Tanpa Proyek</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-gray-700">Item</label><button type="button" onClick={addLine} className="text-blue-500 text-sm flex items-center gap-1"><Plus size={14} /> Tambah</button></div>
                {form.lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 flex-wrap">
                    <select value={line.item_id} onChange={e => updateLine(idx, 'item_id', e.target.value)} className="flex-1 min-w-[120px] px-3 py-2 border rounded-lg text-sm">
                      <option value="">Pilih Item</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <input placeholder="Qty" type="number" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} className="w-20 px-3 py-2 border rounded-lg text-sm" required />
                    <CurrencyInput value={line.estimated_price} onChange={val => updateLine(idx, 'estimated_price', val)} className="w-28" />
                    {form.lines.length > 1 && <button type="button" onClick={() => removeLine(idx)} className="text-red-500"><X size={16} /></button>}
                  </div>
                ))}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
