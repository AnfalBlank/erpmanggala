import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass } from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Operational() {
  const [tab, setTab] = useState('expense');
  const [data, setData] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const perPage = 10;
  const [form, setForm] = useState({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), account_id: '', reference: '', client_vendor: '', project_id: '' });

  const load = () => {
    const type = tab === 'expense' ? 'expense' : 'income';
    api.get(`/banking/transactions?type=${type}`).then(res => {
      const all = res.data || [];
      setData(all.filter(t => t.category === 'Operational' || t.category === 'Transport' || t.category === 'Rental' || tab === 'income'));
    }).catch(console.error);
    api.get('/bank_accounts').then(res => setAccounts(res.data || [])).catch(console.error);
    api.get('/projects').then(res => setProjects(res.data || [])).catch(console.error);
  };
  useEffect(load, [tab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/banking/transactions', { ...form, type: tab === 'expense' ? 'expense' : 'income', amount: Number(form.amount), account_id: Number(form.account_id), category: 'Operational', project_id: form.project_id ? Number(form.project_id) : null });
      setShowForm(false); setForm({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), account_id: '', reference: '', client_vendor: '', project_id: '' }); load();
    } finally { setSaving(false); }
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
        <h2 className="text-xl font-semibold text-gray-900">{tab === 'expense' ? 'Biaya' : 'Pendapatan'} Operasional</h2>
        <button onClick={() => setShowForm(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Tambah Transaksi</button>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab('expense'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'expense' ? 'bg-red-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Biaya Operasional</button>
        <button onClick={() => { setTab('income'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'income' ? 'bg-green-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Pendapatan Operasional</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Tanggal</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Deskripsi</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Akun</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Klien/Vendor</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Jumlah</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{t.date}</td>
                  <td className="px-4 py-3">{t.description}</td>
                  <td className="px-4 py-3">{t.account_name || t.category}</td>
                  <td className="px-4 py-3">{t.client_vendor || '-'}</td>
                  <td className={`px-4 py-3 font-medium ${tab === 'expense' ? 'text-red-600' : 'text-green-600'}`}>{fmt(t.amount)}</td>
                  <td className="px-4 py-3"><button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 text-sm">Detail</button></td>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Transaksi"
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-operational').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-operational" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Deskripsi" required>
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={inputClass} required />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Jumlah" required>
              <CurrencyInput value={form.amount} onChange={val => setForm({...form, amount: val})} required />
            </FormField>
            <FormField label="Tanggal">
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputClass} />
            </FormField>
          </div>
          <FormField label="Rekening">
            <select value={form.account_id} onChange={e => setForm({...form, account_id: e.target.value})} className={selectClass}><option value="">Pilih</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          </FormField>
          <FormField label="Proyek">
            <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className={selectClass}><option value="">Tanpa Proyek</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </FormField>
          <FormField label="Klien/Vendor">
            <input value={form.client_vendor} onChange={e => setForm({...form, client_vendor: e.target.value})} className={inputClass} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
