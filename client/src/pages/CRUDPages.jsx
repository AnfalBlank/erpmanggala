import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import CurrencyInput from '../components/CurrencyInput';
import { formatRp } from '../lib/currency';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const PTKP_OPTIONS = ['TK/0','K/0','K/1','K/2','K/3'];

export function Employees() {
  return <CRUDPage title="Karyawan" endpoint="/employees" columns={[
    { key: 'name', label: 'Nama' },
    { key: 'position', label: 'Jabatan' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telepon' },
    { key: 'salary', label: 'Gaji', render: i => formatRp(i.salary || i.basic_salary || 0) },
    { key: 'ptkp_status', label: 'PTKP' },
    { key: 'status', label: 'Status', render: i => <StatusBadge status={i.status} /> },
  ]} formFields={[
    { key: 'name', label: 'Nama' },
    { key: 'position', label: 'Jabatan' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telepon' },
    { key: 'salary', label: 'Gaji Pokok', type: 'currency' },
    { key: 'basic_salary', label: 'Basic Salary (Payroll)', type: 'currency' },
    { key: 'ptkp_status', label: 'Status PTKP', type: 'select', options: PTKP_OPTIONS.map(p => ({value: p, label: p})) },
    { key: 'bpjs_kesehatan', label: 'BPJS Kesehatan', type: 'select', options: [{value:'0',label:'Tidak'},{value:'1',label:'Ya'}] },
    { key: 'bpjs_tk', label: 'BPJS TK', type: 'select', options: [{value:'0',label:'Tidak'},{value:'1',label:'Ya'}] },
    { key: 'npwp', label: 'NPWP' },
    { key: 'bank_account', label: 'No. Rekening Bank' },
    { key: 'status', label: 'Status', type: 'select', options: ['Aktif','Nonaktif'] },
  ]} />;
}

export function Customers() {
  return <CRUDPage title="Customer" endpoint="/customers" columns={[
    { key: 'name', label: 'Nama' }, { key: 'contact_person', label: 'Kontak' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Telepon' }, { key: 'npwp', label: 'NPWP' }
  ]} formFields={[
    { key: 'name', label: 'Nama', required: true }, { key: 'contact_person', label: 'Kontak Person' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Telepon' }, { key: 'address', label: 'Alamat', type: 'textarea' }, { key: 'npwp', label: 'NPWP' }
  ]} />;
}

export function Vendors() {
  return <CRUDPage title="Vendor" endpoint="/vendors" columns={[
    { key: 'name', label: 'Nama' }, { key: 'contact_person', label: 'Kontak' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Telepon' }
  ]} formFields={[
    { key: 'name', label: 'Nama' }, { key: 'contact_person', label: 'Kontak Person' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Telepon' }, { key: 'address', label: 'Alamat', type: 'textarea' }
  ]} />;
}

export { Employees as default };

// ── Generic CRUD Page (internal) ──
function CRUDPage({ title, endpoint, columns, formFields }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    api.get(`${endpoint}?search=${search}`).then(res => {
      setData(Array.isArray(res) ? res : (res.data || []));
    }).catch(err => {
      toast('Gagal memuat data: ' + err.message, 'error');
    }).finally(() => setLoading(false));
  };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    for (const f of formFields) {
      if (f.type === 'number') payload[f.key] = Number(form[f.key]) || 0;
      else if (f.type === 'currency') payload[f.key] = Number(form[f.key]) || 0;
      else if (f.type === 'select' && (f.key === 'bpjs_kesehatan' || f.key === 'bpjs_tk')) payload[f.key] = Number(form[f.key]) || 0;
      else payload[f.key] = form[f.key] || '';
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`${endpoint}/${editId}`, payload);
        toast(`${title} berhasil diupdate!`);
      } else {
        await api.post(endpoint, payload);
        toast(`${title} berhasil ditambahkan!`);
      }
      setShowForm(false); setEditId(null); setForm({}); load();
    } catch (err) {
      toast('Gagal menyimpan: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    const f = {};
    formFields.forEach(ff => f[ff.key] = item[ff.key] ?? '');
    setForm(f); setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(`Hapus ${title} ini?`)) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      toast(`${title} berhasil dihapus!`);
      load();
    } catch (err) {
      toast('Gagal menghapus: ' + err.message, 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({}); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left text-gray-500">{columns.map((c,i) => <th key={i} className="px-4 py-3 font-medium">{c.label}</th>)}
              <th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {columns.map((c,i) => <td key={i} className="px-4 py-3 text-gray-600">{c.render ? c.render(item) : item[c.key]}</td>)}
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button><button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={columns.length + 1} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} {title}</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formFields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required={!f.optional}>
                      <option value="">Pilih {f.label}</option>
                      {f.options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  ) : f.type === 'currency' ? (
                    <CurrencyInput value={Number(form[f.key]) || 0} onChange={val => setForm({...form, [f.key]: val})} />
                  ) : (
                    <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required={!f.optional} />
                  )}
                </div>
              ))}
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" disabled={saving} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { CRUDPage };
