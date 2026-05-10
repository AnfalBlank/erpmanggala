import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Edit2, Trash2, Search, Shield } from 'lucide-react';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass } from '../components/Modal';

const roleBadge = { 'Super Admin': 'bg-red-100 text-red-700', Admin: 'bg-blue-100 text-blue-700', Finance: 'bg-green-100 text-green-700', Staff: 'bg-purple-100 text-purple-700' };

export default function Users() {
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Staff', status: 'Aktif' });

  const load = () => { api.get('/users').then(res => setData(res.data || [])).catch(console.error); };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await api.put(`/users/${editId}`, form); else await api.post('/users', form);
      setShowForm(false); setEditId(null); setForm({ name: '', email: '', password: '', role: 'Staff', status: 'Aktif' }); load();
    } catch (err) { alert('Gagal: ' + (err.message || 'Error')); }
    finally { setSaving(false); }
  };

  const handleEdit = (u) => { setForm({ name: u.name, email: u.email, password: '', role: u.role, status: u.status }); setEditId(u.id); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Hapus user ini?')) { await api.delete(`/users/${id}`); load(); } };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">{data.length} user terdaftar</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', email: '', password: '', role: 'Staff', status: 'Aktif' }); }}
          className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
          <Plus size={16} /> Tambah User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50/80 text-left">
            <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-gray-400">User</th>
            <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-gray-400">Role</th>
            <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-gray-400">Status</th>
            <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-gray-400">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(u => (
              <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-sm font-bold">
                      {u.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${roleBadge[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    <Shield size={11} /> {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${u.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Aktif' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} User`} icon={editId ? '✏️' : '👤'}
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('user-form').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nama Lengkap" required>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} required placeholder="Masukkan nama lengkap" />
          </FormField>
          <FormField label="Email" required>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} required placeholder="email@manggala.id" />
          </FormField>
          <FormField label={editId ? 'Password (kosongkan jika tidak diubah)' : 'Password'} required={!editId}>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inputClass} {...(editId ? {} : {required:true})} placeholder="Minimal 6 karakter" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Role" required>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className={selectClass}>
                <option>Super Admin</option><option>Admin</option><option>Finance</option><option>Staff</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={selectClass}>
                <option>Aktif</option><option>Nonaktif</option>
              </select>
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
