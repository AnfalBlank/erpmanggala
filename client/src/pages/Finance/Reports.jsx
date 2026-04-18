import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { TrendingUp, TrendingDown, DollarSign, Building2, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Reports() {
  const [tab, setTab] = useState('pl');
  const [data, setData] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    api.get(`/reports/dashboard?${params}`).then(setData).catch(console.error);
  }, [dateFrom, dateTo]);

  if (!data) return <div className="text-center py-20 text-gray-400">Memuat...</div>;

  const income = data.income || 0;
  const expense = data.expense || 0;
  const profit = data.profit || income - expense;
  const cashFlow = data.cashFlow || [];

  const months = {};
  cashFlow.forEach(c => { if (!months[c.month]) months[c.month] = { income: 0, expense: 0 }; months[c.month][c.type] = c.total; });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Laporan Keuangan</h2>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          <span className="text-gray-400">s/d</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'pl', label: 'Laba/Rugi', icon: TrendingUp },
          { key: 'neraca', label: 'Neraca', icon: Building2 },
          { key: 'cashflow', label: 'Arus Kas', icon: DollarSign },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === t.key ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'pl' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Laporan Laba/Rugi</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Deskripsi</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="bg-green-50"><td colSpan={2} className="py-2 px-4 font-semibold text-green-700">Pendapatan</td></tr>
              <tr><td className="py-3 px-4 pl-8">Pendapatan Operasional</td><td className="text-right py-3 px-4 text-green-600 font-medium">{fmt(income)}</td></tr>
              <tr className="border-t border-gray-200 bg-green-50"><td className="py-2 px-4 font-semibold text-green-700">Total Pendapatan</td><td className="text-right py-2 px-4 font-bold text-green-700">{fmt(income)}</td></tr>
              <tr className="bg-red-50"><td colSpan={2} className="py-2 px-4 font-semibold text-red-700">Beban</td></tr>
              <tr><td className="py-3 px-4 pl-8">Beban Operasional</td><td className="text-right py-3 px-4 text-red-600 font-medium">{fmt(expense)}</td></tr>
              <tr className="border-t border-gray-200 bg-red-50"><td className="py-2 px-4 font-semibold text-red-700">Total Beban</td><td className="text-right py-2 px-4 font-bold text-red-700">{fmt(expense)}</td></tr>
              <tr className="border-t-2 border-gray-300 bg-blue-50">
                <td className="py-3 px-4 font-bold text-blue-800">{profit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</td>
                <td className={`text-right py-3 px-4 font-bold text-lg ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(profit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'neraca' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><ArrowUpCircle className="text-blue-500" size={18} /> Aset</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-blue-50 rounded-lg"><span className="text-gray-600">Kas & Bank</span><span className="font-medium">{fmt(data.cashBalance || 0)}</span></div>
              <div className="flex justify-between p-3 bg-blue-50 rounded-lg"><span className="text-gray-600">Piutang</span><span className="font-medium">{fmt(data.receivables || 0)}</span></div>
              <div className="flex justify-between p-3 bg-blue-50 rounded-lg"><span className="text-gray-600">Aset Tetap</span><span className="font-medium">{fmt(data.fixedAssets || 0)}</span></div>
              <div className="flex justify-between p-3 bg-blue-100 rounded-lg border-t-2 border-blue-300"><span className="font-bold text-blue-800">Total Aset</span><span className="font-bold text-blue-800">{fmt(data.totalAssets || 0)}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><ArrowDownCircle className="text-orange-500" size={18} /> Kewajiban & Modal</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-orange-50 rounded-lg"><span className="text-gray-600">Hutang</span><span className="font-medium">{fmt(data.payables || 0)}</span></div>
              <div className="flex justify-between p-3 bg-orange-100 rounded-lg border-b border-orange-200"><span className="font-semibold text-orange-700">Total Kewajiban</span><span className="font-semibold text-orange-700">{fmt(data.totalLiabilities || 0)}</span></div>
              <div className="flex justify-between p-3 bg-green-50 rounded-lg"><span className="text-gray-600">Modal</span><span className="font-medium">{fmt(data.equity || 0)}</span></div>
              <div className="flex justify-between p-3 bg-purple-50 rounded-lg"><span className="text-gray-600">Laba Ditahan</span><span className="font-medium">{fmt(profit)}</span></div>
              <div className="flex justify-between p-3 bg-orange-100 rounded-lg border-t-2 border-orange-300"><span className="font-bold text-orange-800">Total Kewajiban + Modal</span><span className="font-bold text-orange-800">{fmt((data.totalLiabilities || 0) + (data.equity || 0) + profit)}</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'cashflow' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Arus Kas</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 text-center"><div className="text-sm text-gray-500">Total Masuk</div><div className="text-xl font-bold text-green-600">+{fmt(income)}</div></div>
            <div className="bg-red-50 rounded-xl p-4 text-center"><div className="text-sm text-gray-500">Total Keluar</div><div className="text-xl font-bold text-red-600">-{fmt(expense)}</div></div>
            <div className="bg-blue-50 rounded-xl p-4 text-center"><div className="text-sm text-gray-500">Saldo Bersih</div><div className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(profit)}</div></div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Bulan</th><th className="px-4 py-3 font-medium text-right">Masuk</th><th className="px-4 py-3 font-medium text-right">Keluar</th><th className="px-4 py-3 font-medium text-right">Net</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(months).map(([m, v]) => {
                const net = v.income - v.expense;
                return (
                  <tr key={m} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{m}</td>
                    <td className="px-4 py-3 text-right text-green-600">+{fmt(v.income)}</td>
                    <td className="px-4 py-3 text-right text-red-600">-{fmt(v.expense)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(net)}</td>
                  </tr>
                );
              })}
              {Object.keys(months).length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Tidak ada data arus kas</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
