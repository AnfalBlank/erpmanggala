import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const statusBadge = (dueDate, paid) => {
  if (paid) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Lunas</span>;
  const due = new Date(dueDate);
  const now = new Date();
  if (due < now) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Jatuh Tempo</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Belum Dibayar</span>;
};

export default function Ledgers() {
  const [tab, setTab] = useState('piutang');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const perPage = 10;

  useEffect(() => {
    const endpoint = tab === 'piutang' ? '/invoices' : '/purchases';
    api.get(`${endpoint}?search=${search}`).then(res => setData(res.data || [])).catch(() => setData([]));
    setPage(1);
  }, [tab, search]);

  const filtered = data.filter(d => {
    const q = search.toLowerCase();
    return !q || (d.client_name || d.vendor_name || '').toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const cols = tab === 'piutang'
    ? [{ key: 'due_date', label: 'Jatuh Tempo' }, { key: 'number', label: 'Asal' }, { key: 'client_name', label: 'Klien' }, { key: 'total', label: 'Total', fmt: true }, { key: 'balance_due', label: 'Sisa Tagihan', fmt: true }, { key: 'status', label: 'Status' }]
    : [{ key: 'due_date', label: 'Jatuh Tempo' }, { key: 'number', label: 'Asal' }, { key: 'vendor_name', label: 'Vendor' }, { key: 'total', label: 'Total', fmt: true }, { key: 'balance_due', label: 'Sisa Tagihan', fmt: true }, { key: 'status', label: 'Status' }];

  const clientKey = tab === 'piutang' ? 'client_name' : 'vendor_name';

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Buku Besar</h2>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('piutang')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'piutang' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Piutang (Uang Masuk)</button>
        <button onClick={() => setTab('hutang')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'hutang' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Hutang (Uang Keluar)</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                {cols.map((c, i) => <th key={i} className="px-4 py-3 font-medium">{c.label}</th>)}
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{item.due_date || '-'}</td>
                  <td className="px-4 py-3 font-medium">{item.number || '-'}</td>
                  <td className="px-4 py-3">{item[clientKey] || '-'}</td>
                  <td className="px-4 py-3">{fmt(item.total || 0)}</td>
                  <td className="px-4 py-3 font-medium">{fmt(item.balance_due ?? item.total ?? 0)}</td>
                  <td className="px-4 py-3">{statusBadge(item.due_date, item.status === 'Paid' || item.status === 'Lunas')}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-500 hover:text-blue-700 text-sm">Detail</button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
