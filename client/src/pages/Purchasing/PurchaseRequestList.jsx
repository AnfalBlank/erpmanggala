import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Search, Trash2, X, ArrowRight, Eye } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import StatusBadge from '../../components/StatusBadge';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass, textareaClass } from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleString('id-ID') : '-';

export default function PurchaseRequestList() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ code: '', project_id: '', notes: '', lines: [{ item_id: '', description: '', qty: '', unit: 'pcs', estimated_price: '' }] });

  const load = () => {
    api.get('/purchase-requests').then(res => setData(res.data || [])).catch(console.error);
    api.get('/projects').then(res => setProjects(res.data || [])).catch(console.error);
    api.get('/inventory/items').then(res => setItems(res.data || [])).catch(console.error);
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/purchase-requests', {
        code: form.code,
        project_id: form.project_id ? Number(form.project_id) : null,
        notes: form.notes,
        items: form.lines.map(l => ({ ...l, qty: Number(l.qty), estimated_price: Number(l.estimated_price) || 0, item_id: l.item_id ? Number(l.item_id) : null })),
      });
      setShowForm(false);
      setForm({ code: '', project_id: '', notes: '', lines: [{ item_id: '', description: '', qty: '', unit: 'pcs', estimated_price: '' }] });
      load();
    } finally { setSaving(false); }
  };

  const handleApprove = async (id) => { await api.put(`/purchase-requests/${id}/approve`); load(); };
  const handleReject = async (id) => { await api.put(`/purchase-requests/${id}/reject`); load(); };
  const handleDelete = async (id) => { if (confirm('Hapus PR ini?')) { await api.delete(`/purchase-requests/${id}`); load(); } };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { item_id: '', description: '', qty: '', unit: 'pcs', estimated_price: '' }] });
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  const updateLine = (idx, key, val) => {
    const lines = [...form.lines];
    lines[idx][key] = val;
    // Auto-fill price when item selected
    if (key === 'item_id' && val) {
      const item = items.find(i => i.id == val);
      if (item) {
        lines[idx].estimated_price = item.price || 0;
        lines[idx].unit = item.unit || 'pcs';
      }
    }
    setForm({ ...form, lines });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Purchase Request</h2>
        <button onClick={() => { setShowForm(true); setForm({ ...form, code: `PR-${String(data.length + 1).padStart(4, '0')}` }); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Buat PR</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Kode</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Proyek</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Item</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Estimasi</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Status</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(pr => (
              <tr key={pr.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{pr.code}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Diajukan: {pr.requested_by_name || '-'} · {fmtDate(pr.created_at)}
                  </div>
                  {pr.approved_by_name && (
                    <div className="text-[11px] text-gray-400">
                      {pr.status === 'Approved' ? 'Disetujui' : 'Ditolak'}: {pr.approved_by_name} · {fmtDate(pr.approved_at)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">{pr.project_name || '-'}</td>
                <td className="px-4 py-3">{(pr.items || []).length} item</td>
                <td className="px-4 py-3">{fmt((pr.items || []).reduce((s, i) => s + (i.estimated_price || 0) * (i.qty || 0), 0))}</td>
                <td className="px-4 py-3"><StatusBadge status={pr.status} /></td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  <button onClick={() => setDetail(pr)} className="text-blue-500 hover:text-blue-700"><Eye size={18} /></button>
                  {pr.status === 'Draft' && <button onClick={() => handleApprove(pr.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>}
                  {pr.status === 'Draft' && <button onClick={() => handleReject(pr.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Reject</button>}
                  {pr.status === 'Approved' && <span className="text-blue-600 text-xs font-medium flex items-center gap-1"><ArrowRight size={12} /> Convert ke PO</span>}
                  <button onClick={() => handleDelete(pr.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada Purchase Request</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Detail ${detail?.code || 'PR'}`} size="lg"
        footer={<BtnSecondary onClick={() => setDetail(null)}>Tutup</BtnSecondary>}>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400">Kode</div>
                <div className="font-medium">{detail.code}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Proyek</div>
                <div className="font-medium">{detail.project_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Status</div>
                <div><StatusBadge status={detail.status} /></div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Catatan</div>
                <div className="font-medium">{detail.notes || '-'}</div>
              </div>
            </div>
            {(detail.items || []).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Item</div>
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-left"><th className="px-3 py-2 text-xs text-gray-400">Item</th><th className="px-3 py-2 text-xs text-gray-400">Qty</th><th className="px-3 py-2 text-xs text-gray-400">Unit</th><th className="px-3 py-2 text-xs text-gray-400">Estimasi</th><th className="px-3 py-2 text-xs text-gray-400">Subtotal</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(detail.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{item.item_name || item.description || '-'}</td>
                        <td className="px-3 py-2">{item.qty}</td>
                        <td className="px-3 py-2">{item.unit}</td>
                        <td className="px-3 py-2">{fmt(item.estimated_price || 0)}</td>
                        <td className="px-3 py-2 font-medium">{fmt((item.estimated_price || 0) * (item.qty || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t"><td colSpan={4} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 font-bold">{fmt((detail.items || []).reduce((s, i) => s + (i.estimated_price || 0) * (i.qty || 0), 0))}</td></tr></tfoot>
                </table>
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking</div>
              <div className="text-[11px] text-gray-400">
                Diajukan oleh: {detail.requested_by_name || '-'} · {fmtDate(detail.created_at)}
              </div>
              {detail.approved_by_name && (
                <div className="text-[11px] text-gray-400">
                  {detail.status === 'Approved' ? 'Disetujui' : 'Ditolak'} oleh: {detail.approved_by_name} · {fmtDate(detail.approved_at)}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Buat Purchase Request"
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-pr').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-pr" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Kode PR" required>
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className={inputClass} required />
            </FormField>
            <FormField label="Proyek">
              <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className={selectClass}><option value="">Tanpa Proyek</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            </FormField>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-gray-700">Item</label><button type="button" onClick={addLine} className="text-blue-500 text-sm flex items-center gap-1"><Plus size={14} /> Tambah</button></div>
            {form.lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 mb-2 flex-wrap">
                <select value={line.item_id} onChange={e => updateLine(idx, 'item_id', e.target.value)} className={`flex-1 min-w-[120px] ${selectClass}`}>
                  <option value="">Pilih Item</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <input placeholder="Qty" type="number" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} className={`w-20 ${inputClass}`} required />
                <CurrencyInput value={line.estimated_price} onChange={val => updateLine(idx, 'estimated_price', val)} className="w-28" />
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
