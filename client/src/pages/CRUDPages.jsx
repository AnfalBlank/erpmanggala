import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import CurrencyInput from '../components/CurrencyInput';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass, textareaClass } from '../components/Modal';
import { formatRp } from '../lib/currency';

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
    { key: 'bpjs_kesehetan', label: 'BPJS Kesehatan', type: 'select', options: [{value:'0',label:'Tidak'},{value:'1',label:'Ya'}] },
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

function CRUDPage({ title, endpoint, columns, formFields }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); api.get(`${endpoint}?search=${search}`).then(res => setData(res.data || [])).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      for (const f of formFields) {
        if (f.type === 'number' || f.type === 'currency') payload[f.key] = Number(form[f.key]) || 0;
        else if (f.type === 'select' && (f.key === 'bpjs_kesehatan' || f.key === 'bpjs_tk')) payload[f.key] = Number(form[f.key]) || 0;
        else payload[f.key] = form[f.key] || '';
      }
      if (editId) await api.put(`${endpoint}/${editId}`, payload); else await api.post(endpoint, payload);
      setShowForm(false); setEditId(null); setForm({}); load();
    } catch (err) { alert('Gagal: ' + (err.message || 'Error')); }
    finally { setSaving(false); }
  };

  const handleEdit = (item) => { const f = {}; formFields.forEach(ff => f[ff.key] = item[ff.key] ?? ''); setForm(f); setEditId(item.id); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Hapus data ini?')) { await api.delete(`${endpoint}/${id}`); load(); } };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({}); }}
          className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
          <Plus size={16} /> Tambah {title}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Cari ${title.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}</div>
          ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50/80 text-left">{columns.map((c,i) => <th key={i} className="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-gray-400">{c.label}</th>)}
              <th className="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-gray-400">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  {columns.map((c,i) => <td key={i} className="px-4 py-3.5 text-gray-600">{c.render ? c.render(item) : (item[c.key] || <span className="text-gray-300">-</span>)}</td>)}
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="text-center py-16 text-gray-400">
                  <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <p className="text-sm font-medium">Belum ada data {title.toLowerCase()}</p>
                  <p className="text-xs mt-1">Klik tombol "Tambah" untuk menambahkan data baru</p>
                </td></tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} ${title}`} icon={editId ? '✏️' : '➕'}
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('crud-form').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="crud-form" onSubmit={handleSubmit} className="space-y-4">
          {formFields.map(f => (
            <FormField key={f.key} label={f.label} required={f.required}>
              {f.type === 'select' ? (
                <select value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} className={selectClass} required={f.required}>
                  <option value="">Pilih {f.label}</option>
                  {f.options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} rows={3} className={textareaClass} />
              ) : f.type === 'currency' ? (
                <CurrencyInput value={Number(form[f.key]) || 0} onChange={val => setForm({...form, [f.key]: val})} />
              ) : (
                <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} className={inputClass} required={f.required} />
              )}
            </FormField>
          ))}
        </form>
      </Modal>
    </div>
  );
}

export { CRUDPage };
