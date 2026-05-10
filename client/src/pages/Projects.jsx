import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2, BarChart3 } from 'lucide-react';
import CurrencyInput from '../components/CurrencyInput';
import StatusBadge from '../components/StatusBadge';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass, textareaClass } from '../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const BUDGET_CATEGORIES = ['Material', 'Tenaga Kerja', 'Overhead', 'Lainnya'];

export default function Projects() {
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', client_id: '', status: 'Planning', start_date: '', end_date: '', value: '', description: '' });

  // RAB state
  const [selectedProject, setSelectedProject] = useState(null);
  const [tab, setTab] = useState('list');
  const [budgets, setBudgets] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: 'Material', description: '', budget_amount: '' });

  const load = () => {
    api.get(`/projects?search=${search}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/customers').then(res => setCustomers(res.data || [])).catch(console.error);
  };
  useEffect(load, [search]);

  const loadProjectDetail = (id) => {
    setSelectedProject(data.find(p => p.id === id) || null);
    api.get(`/projects/${id}/budgets`).then(res => setBudgets(res.data || [])).catch(console.error);
    api.get(`/projects/${id}/budget-summary`).then(res => setBudgetSummary(res)).catch(console.error);
    setTab('detail');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value) || 0, client_id: Number(form.client_id) || null };
      if (editId) { await api.put(`/projects/${editId}`, payload); } else { await api.post('/projects', payload); }
      setShowForm(false); setEditId(null); setForm({ name: '', client_id: '', status: 'Planning', start_date: '', end_date: '', value: '', description: '' }); load();
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, client_id: item.client_id, status: item.status, start_date: item.start_date || '', end_date: item.end_date || '', value: item.value, description: item.description || '' });
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (confirm('Hapus proyek ini?')) { await api.delete(`/projects/${id}`); load(); } };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setBudgetSaving(true);
    try {
      await api.post(`/projects/${selectedProject.id}/budgets`, { ...budgetForm, budget_amount: Number(budgetForm.budget_amount) || 0 });
      setShowBudgetForm(false); setBudgetForm({ category: 'Material', description: '', budget_amount: '' });
      loadProjectDetail(selectedProject.id);
    } finally { setBudgetSaving(false); }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!selectedProject) return;
    await api.delete(`/projects/${selectedProject.id}/budgets/${budgetId}`);
    loadProjectDetail(selectedProject.id);
  };

  const custName = (id) => customers.find(c => c.id === id)?.name || '-';

  if (tab === 'detail' && selectedProject) {
    const summary = budgetSummary || {};
    const usagePercent = summary.totalBudget > 0 ? Math.round((summary.totalCost / summary.totalBudget) * 100) : 0;
    const barColor = usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500';

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setTab('list')} className="text-blue-500 hover:text-blue-700 text-sm">&larr; Kembali</button>
          <h2 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h2>
          <StatusBadge status={selectedProject.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4"><div className="text-xs text-gray-500">Nilai Kontrak</div><div className="text-lg font-bold text-blue-600">{fmt(selectedProject.value)}</div></div>
          <div className="bg-green-50 rounded-xl p-4"><div className="text-xs text-gray-500">Revenue</div><div className="text-lg font-bold text-green-600">{fmt(summary.revenue || 0)}</div></div>
          <div className="bg-red-50 rounded-xl p-4"><div className="text-xs text-gray-500">Total Biaya</div><div className="text-lg font-bold text-red-600">{fmt(summary.totalCost || 0)}</div></div>
          <div className={`rounded-xl p-4 ${(summary.profit || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-xs text-gray-500">Laba/Rugi</div>
            <div className={`text-lg font-bold ${(summary.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(summary.profit || 0)}</div>
          </div>
        </div>

        {/* Budget vs Actual */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">RAB (Rencana Anggaran Biaya)</h3>
            <button onClick={() => setShowBudgetForm(true)} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-1"><Plus size={14} /> Tambah</button>
          </div>
          {summary.totalBudget > 0 && (
            <div className="p-4 border-b">
              <div className="flex justify-between text-sm mb-2">
                <span>Penggunaan Budget</span>
                <span className="font-medium">{usagePercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className={`${barColor} h-3 rounded-full transition-all`} style={{ width: `${Math.min(100, usagePercent)}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Actual: {fmt(summary.totalCost || 0)}</span>
                <span>Budget: {fmt(summary.totalBudget)}</span>
              </div>
            </div>
          )}
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Kategori</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Deskripsi</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-right">Budget</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-right">Actual</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-right">Selisih</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {budgets.map(b => {
                const diff = b.budget_amount - (b.actual_amount || 0);
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{b.category}</span></td>
                    <td className="px-4 py-3">{b.description || '-'}</td>
                    <td className="px-4 py-3 text-right">{fmt(b.budget_amount)}</td>
                    <td className="px-4 py-3 text-right">{fmt(b.actual_amount || 0)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(diff)}</td>
                    <td className="px-4 py-3"><button onClick={() => handleDeleteBudget(b.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button></td>
                  </tr>
                );
              })}
              {budgets.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada RAB</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Cost breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-semibold mb-3">Breakdown Biaya</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Biaya Transaksi</div>
              <div className="font-bold">{fmt(summary.txActual || 0)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Biaya Material (Inventory)</div>
              <div className="font-bold">{fmt(summary.issueActual || 0)}</div>
            </div>
          </div>
        </div>

        <Modal open={showBudgetForm} onClose={() => setShowBudgetForm(false)} title="Tambah Budget"
          footer={<>
            <BtnSecondary onClick={() => setShowBudgetForm(false)}>Batal</BtnSecondary>
            <BtnPrimary loading={budgetSaving} onClick={() => document.getElementById('form-budget').requestSubmit()} disabled={budgetSaving}>{budgetSaving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
          </>}>
          <form id="form-budget" onSubmit={handleBudgetSubmit} className="space-y-4">
            <FormField label="Kategori">
              <select value={budgetForm.category} onChange={e => setBudgetForm({...budgetForm, category: e.target.value})} className={selectClass}>{BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </FormField>
            <FormField label="Deskripsi">
              <input value={budgetForm.description} onChange={e => setBudgetForm({...budgetForm, description: e.target.value})} className={inputClass} />
            </FormField>
            <FormField label="Jumlah Budget" required>
              <CurrencyInput value={budgetForm.budget_amount} onChange={val => setBudgetForm({...budgetForm, budget_amount: val})} required />
            </FormField>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Proyek</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', client_id: '', status: 'Planning', start_date: '', end_date: '', value: '', description: '' }); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Tambah Proyek</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari proyek..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Nama</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Client</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Status</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Mulai</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Nilai</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => loadProjectDetail(p.id)}>{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{custName(p.client_id)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{p.start_date}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(p.value)}</td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <button onClick={() => loadProjectDetail(p.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-green-500" title="Detail & RAB"><BarChart3 size={16} /></button>
                    <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} Proyek`}
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-project').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-project" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nama Proyek" required>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} required />
          </FormField>
          <FormField label="Client">
            <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className={selectClass}><option value="">Pilih Client</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Status">
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={selectClass}><option>Planning</option><option>Running</option><option>Done</option></select>
            </FormField>
            <FormField label="Nilai (Rp)">
              <CurrencyInput value={form.value} onChange={val => setForm({...form, value: val})} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Mulai">
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className={inputClass} />
            </FormField>
            <FormField label="Selesai">
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className={inputClass} />
            </FormField>
          </div>
          <FormField label="Deskripsi">
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className={textareaClass} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
