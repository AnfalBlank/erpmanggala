import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, FileDown } from 'lucide-react';
import ResponsiveTable from '../../components/ResponsiveTable';
import { exportCSV } from '../../lib/exportUtils';

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
  const [data, setData] = useState([]);

  useEffect(() => {
    const endpoint = tab === 'piutang' ? '/invoices' : '/purchases';
    api.get(`${endpoint}?search=${search}`).then(res => setData(res.data || [])).catch(() => setData([]));
  }, [tab, search]);

  const clientKey = tab === 'piutang' ? 'client_name' : 'vendor_name';

  const columns = [
    { key: 'due_date', label: 'Jatuh Tempo' },
    { key: 'number', label: 'Asal' },
    { key: clientKey, label: tab === 'piutang' ? 'Klien' : 'Vendor' },
    { key: 'total', label: 'Total', render: r => fmt(r.total || 0) },
    { key: 'status', label: 'Status', render: r => statusBadge(r.due_date, r.status === 'Paid' || r.status === 'Lunas') },
  ];

  const handleExportCSV = () => {
    exportCSV(data, [
      { key: 'due_date', label: 'Jatuh Tempo' },
      { key: 'number', label: 'Nomor' },
      { key: clientKey, label: tab === 'piutang' ? 'Klien' : 'Vendor' },
      { key: 'total', label: 'Total' },
      { key: 'status', label: 'Status' },
    ], `${tab === 'piutang' ? 'Piutang' : 'Hutang'}-${new Date().toISOString().slice(0,10)}`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Buku Besar</h2>
        <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 no-print"><FileDown size={16} /> Export CSV</button>
      </div>
      <div className="flex gap-2 mb-4 no-print">
        <button onClick={() => setTab('piutang')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'piutang' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Piutang (Uang Masuk)</button>
        <button onClick={() => setTab('hutang')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'hutang' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Hutang (Uang Keluar)</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 no-print">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" />
          </div>
        </div>
        <ResponsiveTable columns={columns} data={data} />
      </div>
    </div>
  );
}
