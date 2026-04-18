import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Edit2, Trash2, X, Search, ChevronRight, ChevronDown } from 'lucide-react';

const typeColors = {
  Asset: 'bg-blue-100 text-blue-700',
  Liability: 'bg-red-100 text-red-700',
  Equity: 'bg-purple-100 text-purple-700',
  Income: 'bg-green-100 text-green-700',
  Expense: 'bg-orange-100 text-orange-700',
};

export default function COA() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ code: '', name: '', type: 'Asset', parent_id: '', normal_balance: 'Debit' });

  const load = () => { api.get(`/coa?search=${search}`).then(res => setData(res.data || [])).catch(console.error); };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, parent_id: form.parent_id ? Number(form.parent_id) : null };
    if (editId) { await api.put(`/coa/${editId}`, payload); } else { await api.post('/coa', payload); }
    setShowForm(false); setEditId(null); setForm({}); load();
  };

  const handleEdit = (item) => {
    setForm({ code: item.code || '', name: item.name || '', type: item.type || 'Asset', parent_id: item.parent_id || '', normal_balance: item.normal_balance || 'Debit' });
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (confirm('Hapus akun ini?')) { await api.delete(`/coa/${id}`); load(); } };

  const toggleExpand = (id) => setExpanded({ ...expanded, [id]: !expanded[id] });

  const roots = data.filter(d => !d.parent_id);
  const getChildren = (parentId) => data.filter(d => d.parent_id === parentId);

  const renderRow = (item, depth = 0) => {
    const children = getChildren(item.id);
    const hasChildren = children.length > 0;
    return (
      <React.Fragment key={item.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-4 py-3 font-mono text-xs" style={{ paddingLeft: `${16 + depth * 24}px` }}>
            <span className="flex items-center gap-1">
              {hasChildren ? (
                <button onClick={() => toggleExpand(item.id)} className="text-gray-400 hover:text-gray-600">
                  {expanded[item.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : <span className="w-[14px]" />}
              {item.code}
            </span>
          </td>
          <td className="px-4 py-3 font-medium">{item.name}</td>
          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[item.type] || 'bg-gray-100 text-gray-700'}`}>{item.type}</span></td>
          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${item.normal_balance === 'Debit' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{item.normal_balance || 'Debit'}</span></td>
          <td className="px-4 py-3 flex gap-2">
            <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
          </td>
        </tr>
        {hasChildren && expanded[item.id] && children.map(child => renderRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Chart of Accounts</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({}); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah</button>
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
            <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Kode</th><th className="px-4 py-3 font-medium">Nama</th><th className="px-4 py-3 font-medium">Tipe</th><th className="px-4 py-3 font-medium">Saldo Normal</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {search ? data.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[item.type] || 'bg-gray-100 text-gray-700'}`}>{item.type}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${item.normal_balance === 'Debit' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{item.normal_balance || 'Debit'}</span></td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )) : roots.map(item => renderRow(item))}
              {data.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} Akun</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Kode</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="Asset">Asset</option><option value="Liability">Kewajiban</option><option value="Equity">Modal</option><option value="Income">Pendapatan</option><option value="Expense">Beban</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Saldo Normal</label><select value={form.normal_balance} onChange={e => setForm({...form, normal_balance: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="Debit">Debit</option><option value="Kredit">Kredit</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Akun Induk</label><select value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">-- Tidak Ada --</option>{data.filter(d => d.id !== editId).map(d => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}</select></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


