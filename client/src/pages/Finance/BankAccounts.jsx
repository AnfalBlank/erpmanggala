import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass } from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function BankAccounts() {
  const [data, setData] = useState([]);
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', bank: '', account_number: '', coa_id: '', status: 'Aktif' });

  const load = () => {
    api.get('/bank_accounts').then(res => setData(res.data || [])).catch(console.error);
    api.get('/coa_accounts').then(res => setCoaAccounts(res.data || [])).catch(console.error);
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, coa_id: form.coa_id ? Number(form.coa_id) : null };
      if (editId) { await api.put(`/bank_accounts/${editId}`, payload); } else { await api.post('/bank_accounts', payload); }
      setShowForm(false); setEditId(null); setForm({}); load();
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setForm({ name: item.name || '', bank: item.bank || '', account_number: item.account_number || '', coa_id: item.coa_id || '', status: item.status || 'Aktif' });
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (confirm('Hapus rekening ini?')) { await api.delete(`/bank_accounts/${id}`); load(); } };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Rekening Bank</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({}); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Tambah Akun Bank</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Nama Akun</th>
              <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Bank/Tipe</th>
              <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">No. Rekening</th>
              <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Saldo</th>
              <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Akun COA</th>
              <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Status</th>
              <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2"><Building2 size={16} className="text-gray-400" /><span className="font-medium">{a.name}</span></div>
                </td>
                <td className="px-4 py-3">{a.bank}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.account_number}</td>
                <td className="px-4 py-3 font-medium">{fmt(a.balance)}</td>
                <td className="px-4 py-3 text-gray-600">{a.coa_name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status !== 'Nonaktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {a.status !== 'Nonaktif' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button onClick={() => handleEdit(a)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada rekening bank</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} Akun Bank`}
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-bank-account').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-bank-account" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nama Akun" required>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} required />
          </FormField>
          <FormField label="Bank/Tipe" required>
            <input value={form.bank} onChange={e => setForm({...form, bank: e.target.value})} className={inputClass} required />
          </FormField>
          <FormField label="No. Rekening">
            <input value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})} className={inputClass} />
          </FormField>
          <FormField label="Akun COA">
            <select value={form.coa_id} onChange={e => setForm({...form, coa_id: e.target.value})} className={selectClass}><option value="">Pilih</option>{coaAccounts.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}</select>
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={selectClass}><option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option></select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
