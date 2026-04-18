import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Trash2, X, Package, ArrowRight } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function PurchaseOrderList() {
  const [data, setData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [convertForm, setConvertForm] = useState({ vendor_id: '', items: [] });

  const load = () => {
    api.get('/purchase-orders').then(res => setData(res.data || [])).catch(console.error);
    api.get('/vendors').then(res => setVendors(res.data || [])).catch(console.error);
    api.get('/purchase-requests').then(res => setPurchaseRequests((res.data || []).filter(pr => pr.status === 'Approved'))).catch(console.error);
  };
  useEffect(load, []);

  const handleConvert = (pr) => {
    setSelectedPR(pr);
    setConvertForm({ vendor_id: '', items: (pr.items || []).map(i => ({ ...i, unit_price: i.estimated_price || 0, amount: (i.qty || 0) * (i.estimated_price || 0) })) });
    setShowConvertForm(true);
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPR) return;
    await api.post(`/purchase-requests/${selectedPR.id}/convert-to-po`, {
      vendor_id: Number(convertForm.vendor_id),
      items: convertForm.items.map(i => ({ ...i, amount: (i.qty || 0) * (i.unit_price || 0) })),
    });
    setShowConvertForm(false); setSelectedPR(null); load();
  };

  const handleReceive = async (po) => {
    if (!confirm(`Terima barang PO ${po.code}? Stok akan ditambahkan otomatis.`)) return;
    await api.put(`/purchase-orders/${po.id}/receive`, { date: new Date().toISOString().slice(0, 10) });
    load();
  };

  const updateConvertLine = (idx, key, val) => {
    const items = [...convertForm.items];
    items[idx][key] = val;
    items[idx].amount = (Number(items[idx].qty) || 0) * (Number(items[idx].unit_price) || 0);
    setConvertForm({ ...convertForm, items });
  };

  const handleDelete = async (id) => { if (confirm('Hapus PO ini?')) { await api.delete(`/purchase-orders/${id}`); load(); } };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Purchase Order</h2>
      </div>

      {purchaseRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-sm mb-2">PR Menunggu Convert ke PO:</h3>
          <div className="flex flex-wrap gap-2">
            {purchaseRequests.map(pr => (
              <button key={pr.id} onClick={() => handleConvert(pr)} className="px-3 py-1.5 bg-yellow-200 rounded-lg text-sm hover:bg-yellow-300 flex items-center gap-1">
                <ArrowRight size={12} /> {pr.code}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Kode PO</th><th className="px-4 py-3 font-medium">PR</th><th className="px-4 py-3 font-medium">Vendor</th><th className="px-4 py-3 font-medium">Proyek</th><th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(po => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{po.code}</td>
                <td className="px-4 py-3 text-gray-500">{po.pr_code || '-'}</td>
                <td className="px-4 py-3">{po.vendor_name || '-'}</td>
                <td className="px-4 py-3">{po.project_name || '-'}</td>
                <td className="px-4 py-3">{fmt(po.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  {(po.status === 'Draft' || po.status === 'Sent') && <button onClick={() => handleReceive(po)} className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center gap-1"><Package size={12} /> Terima</button>}
                  <button onClick={() => handleDelete(po.id)} className="text-red-500"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada Purchase Order</td></tr>}
          </tbody>
        </table>
      </div>

      {showConvertForm && selectedPR && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Convert {selectedPR.code} ke PO</h3><button onClick={() => setShowConvertForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleConvertSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label><select value={convertForm.vendor_id} onChange={e => setConvertForm({...convertForm, vendor_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required><option value="">Pilih Vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Item & Harga</label>
                {(convertForm.items || []).map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center text-sm">
                    <span className="flex-1 text-gray-600">{item.item_name || item.description || `Item ${idx + 1}`}</span>
                    <span className="text-gray-400">{item.qty} {item.unit}</span>
                    <input type="number" value={item.unit_price} onChange={e => updateConvertLine(idx, 'unit_price', e.target.value)} className="w-28 px-2 py-1 border rounded text-sm" placeholder="Harga" />
                    <span className="text-gray-500 w-24 text-right">{fmt(item.amount)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 text-right font-bold">Total: {fmt(convertForm.items.reduce((s, i) => s + (i.amount || 0), 0))}</div>
              </div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowConvertForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Buat PO</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
