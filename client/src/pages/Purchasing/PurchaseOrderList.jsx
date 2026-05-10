import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Trash2, Package, ArrowRight, Eye } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import StatusBadge from '../../components/StatusBadge';
import Modal, { FormField, BtnPrimary, BtnSecondary, selectClass } from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function PurchaseOrderList() {
  const [data, setData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [saving, setSaving] = useState(false);
  const [convertForm, setConvertForm] = useState({ vendor_id: '', items: [] });
  const [detail, setDetail] = useState(null);

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
    setSaving(true);
    try {
      await api.post(`/purchase-requests/${selectedPR.id}/convert-to-po`, {
        vendor_id: Number(convertForm.vendor_id),
        items: convertForm.items.map(i => ({ ...i, amount: (i.qty || 0) * (i.unit_price || 0) })),
      });
      setShowConvertForm(false); setSelectedPR(null); load();
    } finally { setSaving(false); }
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
        <h2 className="text-xl font-semibold text-gray-900">Purchase Order</h2>
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

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Kode PO</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">PR</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Vendor</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Proyek</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Total</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Status</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
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
                  <button onClick={() => setDetail(po)} className="text-blue-500 hover:text-blue-700"><Eye size={18} /></button>
                  {(po.status === 'Draft' || po.status === 'Sent') && <button onClick={() => handleReceive(po)} className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center gap-1"><Package size={12} /> Terima</button>}
                  <button onClick={() => handleDelete(po.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada Purchase Order</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Detail ${detail?.code || 'PO'}`} size="lg"
        footer={<BtnSecondary onClick={() => setDetail(null)}>Tutup</BtnSecondary>}>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400">Kode PO</div>
                <div className="font-medium">{detail.code}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">PR Asal</div>
                <div className="font-medium">{detail.pr_code || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Vendor</div>
                <div className="font-medium">{detail.vendor_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Proyek</div>
                <div className="font-medium">{detail.project_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Total</div>
                <div className="font-bold">{fmt(detail.total)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Status</div>
                <div><StatusBadge status={detail.status} /></div>
              </div>
            </div>
            {(detail.items || []).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Item PO</div>
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-left"><th className="px-3 py-2 text-xs text-gray-400">Item</th><th className="px-3 py-2 text-xs text-gray-400">Qty</th><th className="px-3 py-2 text-xs text-gray-400">Unit</th><th className="px-3 py-2 text-xs text-gray-400">Harga</th><th className="px-3 py-2 text-xs text-gray-400">Subtotal</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(detail.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{item.item_name || item.description || '-'}</td>
                        <td className="px-3 py-2">{item.qty}</td>
                        <td className="px-3 py-2">{item.unit}</td>
                        <td className="px-3 py-2">{fmt(item.unit_price || 0)}</td>
                        <td className="px-3 py-2 font-medium">{fmt(item.amount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t"><td colSpan={4} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 font-bold">{fmt(detail.total)}</td></tr></tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showConvertForm && !!selectedPR} onClose={() => setShowConvertForm(false)} title={`Convert ${selectedPR?.code || ''} ke PO`}
        footer={<>
          <BtnSecondary onClick={() => setShowConvertForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-convert-po').requestSubmit()} disabled={saving}>{saving ? 'Membuat...' : 'Buat PO'}</BtnPrimary>
        </>}>
        <form id="form-convert-po" onSubmit={handleConvertSubmit} className="space-y-4">
          <FormField label="Vendor" required>
            <select value={convertForm.vendor_id} onChange={e => setConvertForm({...convertForm, vendor_id: e.target.value})} className={selectClass} required><option value="">Pilih Vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          </FormField>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Item & Harga</label>
            {(convertForm.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center text-sm">
                <span className="flex-1 text-gray-600">{item.item_name || item.description || `Item ${idx + 1}`}</span>
                <span className="text-gray-400">{item.qty} {item.unit}</span>
                <CurrencyInput value={item.unit_price} onChange={val => updateConvertLine(idx, 'unit_price', val)} className="w-28" />
                <span className="text-gray-500 w-24 text-right">{fmt(item.amount)}</span>
              </div>
            ))}
            <div className="border-t pt-2 text-right font-bold">Total: {fmt(convertForm.items.reduce((s, i) => s + (i.amount || 0), 0))}</div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
