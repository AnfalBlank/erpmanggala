import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, BookOpen, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Journals() {
  const [data, setData] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [refType, setRefType] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    params.set('limit', '200');
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (accountFilter) params.set('account', accountFilter);
    if (refType) params.set('reference_type', refType);
    api.get(`/journals?${params}`).then(res => setData(res.data || [])).catch(console.error);
  };
  useEffect(load, [from, to, accountFilter, refType]);

  const totalDebit = data.reduce((s, j) => s + (j.amount || 0), 0);
  const totalCredit = data.reduce((s, j) => s + (j.amount || 0), 0);

  const refLabels = {
    transaction: 'Transaksi',
    invoice: 'Invoice',
    payroll: 'Payroll',
    inventory_receipt: 'Penerimaan',
    inventory_issue: 'Pengeluaran',
    purchase_order: 'PO',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BookOpen size={20} /> Jurnal Umum</h2>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" placeholder="Dari" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
        <input value={accountFilter} onChange={e => setAccountFilter(e.target.value)} placeholder="Filter akun..." className="px-3 py-2 border rounded-lg text-sm" />
        <select value={refType} onChange={e => setRefType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Semua Referensi</option>
          <option value="transaction">Transaksi</option>
          <option value="invoice">Invoice</option>
          <option value="payroll">Payroll</option>
          <option value="inventory_receipt">Penerimaan</option>
          <option value="inventory_issue">Pengeluaran</option>
          <option value="purchase_order">Purchase Order</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-sm text-gray-500">Total Debit</div>
          <div className="text-xl font-bold text-green-600">{fmt(totalDebit)}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-sm text-gray-500">Total Kredit</div>
          <div className="text-xl font-bold text-blue-600">{fmt(totalCredit)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Deskripsi</th>
              <th className="px-4 py-3 font-medium">Debit</th>
              <th className="px-4 py-3 font-medium">Kredit</th>
              <th className="px-4 py-3 font-medium">Jumlah</th>
              <th className="px-4 py-3 font-medium">Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(j => (
              <tr key={j.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{j.date}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-700">{j.description}</div>
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className="text-green-600 flex items-center gap-1"><ArrowUpRight size={10} /> {j.debit_account}</span>
                    <span className="text-blue-600 flex items-center gap-1"><ArrowDownRight size={10} /> {j.credit_account}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-green-600 font-medium">{j.debit_account}</td>
                <td className="px-4 py-3 text-blue-600 font-medium">{j.credit_account}</td>
                <td className="px-4 py-3 font-medium">{fmt(j.amount)}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{refLabels[j.reference_type] || j.reference_type || '-'}</span></td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada jurnal</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
