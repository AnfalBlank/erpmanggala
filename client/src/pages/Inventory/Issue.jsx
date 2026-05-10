import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, X } from 'lucide-react';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass, textareaClass } from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Issue() {
  const [data, setData] = useState([]);
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ project_id: '', warehouse_id: '', date: new Date().toISOString().slice(0, 10), notes: '', lines: [{ item_id: '', qty: '' }] });

  const load = () => {
    api.get('/inventory_issues').then(res => setData(res.data || [])).catch(console.error);
    api.get('/inventory/items').then(res => setItems(res.data || [])).catch(console.error);
    api.get('/projects').then(res => setProjects(res.data || [])).catch(console.error);
    api.get('/warehouses').then(res => setWarehouses(res.data || [])).catch(console.error);
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const line of form.lines) {
        if (!line.item_id || !line.qty) continue;
        await api.post('/inventory_issues', {
          item_id: Number(line.item_id),
          qty: Number(line.qty),
          date: form.date,
          reference: form.warehouse_id ? `Gudang: ${warehouses.find(w => w.id == form.warehouse_id)?.name || ''}` : '',
          notes: form.notes,
          project_id: form.project_id ? Number(form.project_id) : null,
        });
      }
      setShowForm(false); setForm({ project_id: '', warehouse_id: '', date: new Date().toISOString().slice(0, 10), notes: '', lines: [{ item_id: '', qty: '' }] }); load();
    } finally { setSaving(false); }
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { item_id: '', qty: '' }] });
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  const updateLine = (idx, key, val) => { const lines = [...form.lines]; lines[idx][key] = val; setForm({ ...form, lines }); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Pengeluaran Barang</h2>
        <button onClick={() => setShowForm(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Buat Pengeluaran</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Tanggal</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Item</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Qty</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Harga Satuan</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Total Biaya</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Catatan</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3 font-medium">{r.item_name || '-'}</td>
                <td className="px-4 py-3">{r.qty}</td>
                <td className="px-4 py-3">{fmt(r.unit_cost || r.avg_cost || 0)}</td>
                <td className="px-4 py-3 font-medium">{fmt(r.total_cost || 0)}</td>
                <td className="px-4 py-3 text-gray-600">{r.notes || r.reference || '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={async () => { if (confirm('Hapus pengeluaran ini?')) { await api.delete(`/inventory_issues/${r.id}`); load(); } }} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                <span className="text-sm">Tidak ada data pengeluaran</span>
              </div>
            </td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Buat Pengeluaran"
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-issue').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-issue" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Proyek">
              <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className={selectClass}><option value="">Pilih</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            </FormField>
            <FormField label="Gudang">
              <select value={form.warehouse_id} onChange={e => setForm({...form, warehouse_id: e.target.value})} className={selectClass}><option value="">Pilih</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
            </FormField>
          </div>
          <FormField label="Tanggal">
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputClass} />
          </FormField>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-gray-700">Item</label><button type="button" onClick={addLine} className="text-blue-500 text-sm flex items-center gap-1"><Plus size={14} /> Tambah</button></div>
            {form.lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <select value={line.item_id} onChange={e => updateLine(idx, 'item_id', e.target.value)} className={`flex-1 ${selectClass}`} required>
                  <option value="">Pilih Item</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stok: {i.stock})</option>)}
                </select>
                <input type="number" placeholder="Qty" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} className={`w-24 ${inputClass}`} required />
                {form.lines.length > 1 && <button type="button" onClick={() => removeLine(idx)} className="text-red-500"><X size={16} /></button>}
              </div>
            ))}
          </div>
          <FormField label="Catatan">
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className={textareaClass} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
