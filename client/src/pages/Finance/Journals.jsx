import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BookOpen, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const refLabels = { transaction: 'Transaksi', invoice: 'Invoice', payroll: 'Payroll', inventory_receipt: 'Penerimaan', inventory_issue: 'Pengeluaran', purchase_order: 'PO', depreciation: 'Penyusutan' };

export default function Journals() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [refType, setRefType] = useState('');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '200');
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (accountFilter) params.set('account', accountFilter);
    if (refType) params.set('reference_type', refType);
    api.get(`/journals?${params}`).then(res => setData(res.data || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [from, to, accountFilter, refType]);

  const totalAmount = data.reduce((s, j) => s + (j.amount || 0), 0);

  const inputCls = "h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Jurnal Umum</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} />
        <input value={accountFilter} onChange={e => setAccountFilter(e.target.value)} placeholder="Filter akun..." className={`${inputCls} w-40`} />
        <select value={refType} onChange={e => setRefType(e.target.value)} className={inputCls}>
          <option value="">Semua Referensi</option>
          {Object.entries(refLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Debit</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{fmt(totalAmount)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Kredit</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{fmt(totalAmount)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Deskripsi</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Debit</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Kredit</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Jumlah</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(j => (
                  <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{j.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-700">{j.description}</div>
                      <div className="flex gap-4 mt-1 text-xs">
                        <span className="text-emerald-600 flex items-center gap-1"><ArrowUpRight size={10} /> {j.debit_account}</span>
                        <span className="text-blue-600 flex items-center gap-1"><ArrowDownRight size={10} /> {j.credit_account}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-emerald-600 text-xs">{j.debit_account}</td>
                    <td className="px-4 py-3 text-blue-600 text-xs">{j.credit_account}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fmt(j.amount)}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-500">{refLabels[j.reference_type] || j.reference_type || '-'}</span></td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                    <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada jurnal</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
