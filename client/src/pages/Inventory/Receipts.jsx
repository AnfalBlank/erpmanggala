import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, X, Package } from 'lucide-react';

export default function Receipts() {
  const [data, setData] = useState([]);
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ po_number: '', vendor_id: '', date: new Date().toISOString().slice(0, 10), lines: [{ item_id: '', qty: '' }] });

  const load = () => {
    api.get('/inventory/receipts').then(res => setData(res.data || [])).catch(console.error);
    api.get('/inventory/items').then(res => setItems(res.data || [])).catch(console.error);
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, lines: form.lines.map(l => ({ ...l, qty: Number(l.qty), item_id: Number(l.item_id) })) };
    await api.post('/inventory/receipts', payload);
    setShowForm(false); setForm({ po_number: '', vendor_id: '', date: new Date().toISOString().slice(0, 10), lines: [{ item_id: '', qty: '' }] }); load();
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { item_id: '', qty: '' }] });
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  const updateLine = (idx, key, val) => { const lines = [...form.lines]; lines[idx][key] = val; setForm({ ...form, lines }); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Penerimaan Barang</h2>
        <button onClick={() => setShowForm(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 flex items-center gap-2"><Plus size={16} /> Terima Barang</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">PO Number</th><th className="px-4 py-3 font-medium">Vendor</th><th className="px-4 py-3 font-medium">Tanggal PO</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.po_number || r.reference || '-'}</td>
                <td className="px-4 py-3">{r.vendor_name || '-'}</td>
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="text-blue-500 hover:text-blue-700 text-sm">Detail</button>
                  <button onClick={async () => { await api.delete(`/inventory/receipts/${r.id}`); load(); }} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Tidak ada data penerimaan</td></tr>}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Terima Barang</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label><input value={form.po_number} onChange={e => setForm({...form, po_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-gray-700">Item</label><button type="button" onClick={addLine} className="text-blue-500 text-sm flex items-center gap-1"><Plus size={14} /> Tambah Item</button></div>
                {form.lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select value={line.item_id} onChange={e => updateLine(idx, 'item_id', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" required>
                      <option value="">Pilih Item</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                    </select>
                    <input type="number" placeholder="Qty" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} className="w-24 px-3 py-2 border rounded-lg text-sm" required />
                    {form.lines.length > 1 && <button type="button" onClick={() => removeLine(idx)} className="text-red-500"><X size={16} /></button>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
