import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Operational() {
  const [tab, setTab] = useState('expense');
  const [data, setData] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const perPage = 10;
  const [form, setForm] = useState({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), account_id: '', reference: '', client_vendor: '' });

  const load = () => {
    const type = tab === 'expense' ? 'expense' : 'income';
    api.get(`/banking/transactions?type=${type}`).then(res => {
      const all = res.data || [];
      setData(all.filter(t => t.category === 'Operational' || t.category === 'Transport' || t.category === 'Rental' || tab === 'income'));
    }).catch(console.error);
    api.get('/bank_accounts').then(res => setAccounts(res.data || [])).catch(console.error);
  };
  useEffect(load, [tab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/banking/transactions', { ...form, type: tab === 'expense' ? 'expense' : 'income', amount: Number(form.amount), account_id: Number(form.account_id), category: 'Operational' });
    setShowForm(false); setForm({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), account_id: '', reference: '', client_vendor: '' }); load();
  };

  const filtered = data.filter(t => {
    const q = search.toLowerCase();
    return !q || (t.description || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">{tab === 'expense' ? 'Biaya' : 'Pendapatan'} Operasional</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah Transaksi</button>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab('expense'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'expense' ? 'bg-red-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Biaya Operasional</button>
        <button onClick={() => { setTab('income'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'income' ? 'bg-green-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Pendapatan Operasional</button>
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
            <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Deskripsi</th><th className="px-4 py-3 font-medium">Akun</th><th className="px-4 py-3 font-medium">Klien/Vendor</th><th className="px-4 py-3 font-medium">Jumlah</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{t.date}</td>
                  <td className="px-4 py-3">{t.description}</td>
                  <td className="px-4 py-3">{t.account_name || t.category}</td>
                  <td className="px-4 py-3">{t.client_vendor || '-'}</td>
                  <td className={`px-4 py-3 font-medium ${tab === 'expense' ? 'text-red-600' : 'text-green-600'}`}>{fmt(t.amount)}</td>
                  <td className="px-4 py-3"><button className="text-blue-500 hover:text-blue-700 text-sm">Detail</button></td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>}
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
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Tambah Transaksi</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Rekening</label><select value={form.account_id} onChange={e => setForm({...form, account_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Pilih</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Klien/Vendor</label><input value={form.client_vendor} onChange={e => setForm({...form, client_vendor: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
