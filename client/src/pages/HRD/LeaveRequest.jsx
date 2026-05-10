import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Eye } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass, textareaClass } from '../../components/Modal';

const fmtDate = (d) => d ? new Date(d).toLocaleString('id-ID') : '-';

export default function LeaveRequest() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ employee_id: '', type: 'Cuti Tahunan', start_date: '', end_date: '', reason: '' });
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';

  const load = () => { api.get('/leaves').then(res => setData(res.data || [])).catch(console.error); api.get('/employees').then(res => setEmployees(res.data || [])).catch(console.error); };
  useEffect(load, []);

  // For staff, auto-find their employee record
  useEffect(() => {
    if (isStaff && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      if (emp) setForm(f => ({ ...f, employee_id: emp.id }));
    }
  }, [isStaff, employees, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/leaves', { ...form, employee_id: Number(form.employee_id) });
      setShowForm(false); setForm({ employee_id: '', type: 'Cuti Tahunan', start_date: '', end_date: '', reason: '' }); load();
    } finally { setSaving(false); }
  };

  // Calculate used leaves for current year (approved annual leave)
  const usedLeaves = data.filter(l => l.status === 'Approved' && l.type === 'Cuti Tahunan').reduce((s, l) => {
    const start = new Date(l.start_date);
    const end = new Date(l.end_date);
    return s + Math.ceil((end - start) / 86400000) + 1;
  }, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{isStaff ? 'Cuti Saya' : 'Permohonan Cuti'}</h2>
        <button onClick={() => setShowForm(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"><Plus size={16} /> Ajukan Cuti</button>
      </div>

      {/* Leave Balance Cards */}
      {isStaff && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-xs text-gray-400">Jatah Cuti</div>
          </div>
          <div className="bg-white rounded-2xl border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{usedLeaves}</div>
            <div className="text-xs text-gray-400">Terpakai</div>
          </div>
          <div className="bg-white rounded-2xl border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{12 - usedLeaves}</div>
            <div className="text-xs text-gray-400">Sisa</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Karyawan</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Tipe</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Mulai</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Selesai</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Alasan</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Status</th><th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{l.employee_name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Diajukan: {l.requested_by_name || '-'} · {fmtDate(l.created_at)}
                  </div>
                  {l.approved_by_name && (
                    <div className="text-[11px] text-gray-400">
                      {l.status === 'Approved' ? 'Disetujui' : 'Ditolak'}: {l.approved_by_name} · {fmtDate(l.approved_at)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">{l.type}</td><td className="px-4 py-3">{l.start_date}</td><td className="px-4 py-3">{l.end_date}</td><td className="px-4 py-3">{l.reason}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetail(l)} className="text-blue-500 hover:text-blue-700"><Eye size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Cuti"
        footer={<BtnSecondary onClick={() => setDetail(null)}>Tutup</BtnSecondary>}>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400">Karyawan</div>
                <div className="font-medium">{detail.employee_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Tipe</div>
                <div className="font-medium">{detail.type}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Mulai</div>
                <div className="font-medium">{detail.start_date}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Selesai</div>
                <div className="font-medium">{detail.end_date}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-400">Alasan</div>
                <div className="font-medium">{detail.reason || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Status</div>
                <div><StatusBadge status={detail.status} /></div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking</div>
              <div className="text-[11px] text-gray-400">
                Diajukan oleh: {detail.requested_by_name || '-'} · {fmtDate(detail.created_at)}
              </div>
              {detail.approved_by_name && (
                <div className="text-[11px] text-gray-400">
                  {detail.status === 'Approved' ? 'Disetujui' : 'Ditolak'} oleh: {detail.approved_by_name} · {fmtDate(detail.approved_at)}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Ajukan Cuti"
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-leave').requestSubmit()} disabled={saving}>{saving ? 'Mengirim...' : 'Kirim'}</BtnPrimary>
        </>}>
        <form id="form-leave" onSubmit={handleSubmit} className="space-y-4">
          {!isStaff && <FormField label="Karyawan" required>
            <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className={selectClass} required><option value="">Pilih</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          </FormField>}
          <FormField label="Tipe">
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={selectClass}><option>Cuti Tahunan</option><option>Sakit</option><option>Cuti Khusus</option></select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Mulai" required>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className={inputClass} required />
            </FormField>
            <FormField label="Selesai" required>
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className={inputClass} required />
            </FormField>
          </div>
          <FormField label="Alasan">
            <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={2} className={textareaClass} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
