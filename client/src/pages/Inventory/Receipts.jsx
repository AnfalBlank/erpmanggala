import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, X } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass } from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Receipts() {
  const [data, setData] = useState([]);
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ po_number: '', vendor_id: '', date: new Date().toISOString().slice(0, 10), lines: [{ item_id: '', qty: '', unit_price: '' }] });

  const load = () => {
    api.get('/inventory_receipts').then(res => setData(res.data || [])).catch(console.error);
    api.get('/inventory/items').then(res => setItems(res.data || [])).catch(console.error);
    api.get('/purchase-orders').then(res => setPurchases(res.data || [])).catch(console.error);
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Create each line as separate receipt for backward compatibility
      for (const line of form.lines) {
        if (!line.item_id || !line.qty) continue;
        await api.post('/inventory_receipts', {
          item_id: Number(line.item_id),
          qty: Number(line.qty),
          unit_price: Number(line.unit_price) || 0,
          date: form.date,
          reference: form.po_number || '',
          notes: '',
        });
      }
      setShowForm(false); setForm({ po_number: '', vendor_id: '', date: new Date().toISOString().slice(0, 10), lines: [{ item_id: '', qty: '', unit_price: '' }] }); load();
    } finally { setSaving(false); }
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { item_id: '', qty: '', unit_price: '' }] });
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  const updateLine = (idx, key, val) => { const lines = [...form.lines]; lines[idx][key] = val; setForm({ ...form, lines }); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Penerimaan Barang</h2>
        <button onClick={() => setShowForm(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Terima Barang</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Tanggal</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Item</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Qty</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Harga Satuan</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Total Nilai</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Ref</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3 font-medium">{r.item_name}</td>
                <td className="px-4 py-3">{r.qty}</td>
                <td className="px-4 py-3">{fmt(r.unit_price || r.avg_cost || 0)}</td>
                <td className="px-4 py-3 font-medium">{fmt(r.total_value || (r.qty * (r.unit_price || r.avg_cost || 0)))}</td>
                <td className="px-4 py-3 text-gray-500">{r.reference || '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={async () => { await api.delete(`/inventory_receipts/${r.id}`); load(); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data penerimaan</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Terima Barang"
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-receipt').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-receipt" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="PO / Referensi" hint="Pilih PO untuk auto-isi item">
              <select value={form.po_number} onChange={e => {
                const poNum = e.target.value;
                setForm(f => ({...f, po_number: poNum}));
                // Auto-fill items from PO
                const po = purchases.find(p => p.code === poNum);
                if (po && po.items && po.items.length > 0) {
                  setForm(f => ({
                    ...f,
                    po_number: poNum,
                    lines: po.items.map(item => ({
                      item_id: String(item.item_id || ''),
                      qty: String(item.qty || ''),
                      unit_price: String(item.unit_price || item.estimated_price || ''),
                    }))
                  }));
                }
              }} className={selectClass}>
                <option value="">Pilih atau ketik manual</option>
                {purchases.map(p => <option key={p.id} value={p.code}>{p.code} — {p.vendor_name || ''}</option>)}
              </select>
            </FormField>
            <FormField label="Tanggal">
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputClass} />
            </FormField>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-gray-700">Item</label><button type="button" onClick={addLine} className="text-blue-500 text-sm flex items-center gap-1"><Plus size={14} /> Tambah Item</button></div>
            {form.lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 mb-2 flex-wrap">
                <select value={line.item_id} onChange={e => updateLine(idx, 'item_id', e.target.value)} className={`flex-1 min-w-[120px] ${selectClass}`} required>
                  <option value="">Pilih Item</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                </select>
                <input type="number" placeholder="Qty" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} className={`w-20 ${inputClass}`} required />
                <CurrencyInput value={line.unit_price} onChange={val => updateLine(idx, 'unit_price', val)} className="w-28" />
                {form.lines.length > 1 && <button type="button" onClick={() => removeLine(idx)} className="text-red-500"><X size={16} /></button>}
              </div>
            ))}
          </div>
        </form>
      </Modal>
    </div>
  );
}
