import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Warehouse, Package } from 'lucide-react';

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

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Laporan Stok</h2>

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
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" />
          </div>
          <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Semua Gudang</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Nama Barang</th><th className="px-4 py-3 font-medium">Kategori</th><th className="px-4 py-3 font-medium">Stok</th><th className="px-4 py-3 font-medium">Harga Rata-rata</th><th className="px-4 py-3 font-medium">Total Nilai</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(i => (
                <tr key={i.id} className={`hover:bg-gray-50 ${i.stock <= i.min_stock ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{i.name}</td>
                  <td className="px-4 py-3">{i.category}</td>
                  <td className="px-4 py-3">{i.stock} {i.unit}</td>
                  <td className="px-4 py-3">{fmt(i.price)}</td>
                  <td className="px-4 py-3 font-medium">{fmt(i.stock * i.price)}</td>
                  <td className="px-4 py-3"><button className="text-blue-500 hover:text-blue-700 text-sm">Detail</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
