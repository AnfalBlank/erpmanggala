import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Edit2, Trash2, X, Building2 } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function BankAccounts() {
  const [data, setData] = useState([]);
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', bank: '', account_number: '', coa_id: '', status: 'Aktif' });

  const load = () => {
    api.get('/bank_accounts').then(res => setData(res.data || [])).catch(console.error);
    api.get('/coa').then(res => setCoaAccounts(res.data || [])).catch(console.error);
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, coa_id: form.coa_id ? Number(form.coa_id) : null };
    if (editId) { await api.put(`/bank_accounts/${editId}`, payload); } else { await api.post('/bank_accounts', payload); }
    setShowForm(false); setEditId(null); setForm({}); load();
  };

  const handleEdit = (item) => {
    setForm({ name: item.name || '', bank: item.bank || '', account_number: item.account_number || '', coa_id: item.coa_id || '', status: item.status || 'Aktif' });
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (confirm('Hapus rekening ini?')) { await api.delete(`/bank_accounts/${id}`); load(); } };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Rekening Bank</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({}); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah Akun Bank</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Nama Akun</th>
              <th className="px-4 py-3 font-medium">Bank/Tipe</th>
              <th className="px-4 py-3 font-medium">No. Rekening</th>
              <th className="px-4 py-3 font-medium">Saldo</th>
              <th className="px-4 py-3 font-medium">Akun COA</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
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
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => handleEdit(a)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada rekening bank</td></tr>}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} Akun Bank</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank/Tipe</label><input value={form.bank} onChange={e => setForm({...form, bank: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening</label><input value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Akun COA</label><select value={form.coa_id} onChange={e => setForm({...form, coa_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Pilih</option>{coaAccounts.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option></select></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
