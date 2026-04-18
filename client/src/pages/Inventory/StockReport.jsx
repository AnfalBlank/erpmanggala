import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Warehouse, FileDown } from 'lucide-react';
import ResponsiveTable from '../../components/ResponsiveTable';
import { exportCSV } from '../../lib/exportUtils';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function StockReport() {
  const [data, setData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  useEffect(() => {
    api.get(`/inventory/items?search=${search}&limit=100`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/inventory/warehouses').then(res => setWarehouses(res.data || [])).catch(console.error);
  }, [search]);

  const filtered = data.filter(i => !warehouseFilter || i.warehouse_id == warehouseFilter);
  const totalValue = filtered.reduce((s, i) => s + i.stock * i.price, 0);
  const lowStock = filtered.filter(i => i.stock <= i.min_stock).length;

  const warehouseSummary = warehouses.map(w => {
    const items = data.filter(i => i.warehouse_id == w.id);
    return { ...w, itemCount: items.length, totalValue: items.reduce((s, i) => s + i.stock * i.price, 0) };
  });

  const columns = [
    { key: 'name', label: 'Nama Barang' },
    { key: 'category', label: 'Kategori' },
    { key: 'stock', label: 'Stok', render: r => <span className={r.stock <= r.min_stock ? 'text-orange-600 font-medium' : ''}>{r.stock} {r.unit}</span> },
    { key: 'price', label: 'Harga Rata-rata', render: r => fmt(r.price) },
    { key: 'totalValue', label: 'Total Nilai', render: r => <span className="font-medium">{fmt(r.stock * r.price)}</span> },
  ];

  const handleExportCSV = () => {
    exportCSV(filtered, [
      { key: 'name', label: 'Nama' }, { key: 'sku', label: 'SKU' }, { key: 'category', label: 'Kategori' },
      { key: 'stock', label: 'Stok' }, { key: 'unit', label: 'Satuan' }, { key: 'min_stock', label: 'Min Stok' },
      { key: 'price', label: 'Harga' },
    ], `Laporan-Stok-${new Date().toISOString().slice(0,10)}`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Laporan Stok</h2>
        <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 no-print"><FileDown size={16} /> Export CSV</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {warehouseSummary.map(w => (
          <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2"><Warehouse size={16} className="text-blue-500" /><span className="font-medium text-gray-700">{w.name}</span></div>
            <div className="text-lg font-bold">{fmt(w.totalValue)}</div>
            <div className="text-xs text-gray-500">{w.itemCount} item</div>
          </div>
        ))}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="text-sm text-gray-500">Total Nilai Stok</div>
          <div className="text-lg font-bold text-blue-600">{fmt(totalValue)}</div>
          <div className="text-xs text-gray-500">{filtered.length} item</div>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <div className="text-sm text-gray-500">Stok Menipis</div>
          <div className="text-lg font-bold text-orange-600">{lowStock}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 no-print">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" />
          </div>
          <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Semua Gudang</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <ResponsiveTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
