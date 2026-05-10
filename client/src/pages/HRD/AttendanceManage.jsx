import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Edit2, Search, Calendar, Clock, Users, AlertTriangle, CheckCircle, XCircle, MapPin, Camera, ChevronDown, Download, Eye, X, TrendingUp, Timer } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass } from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function AttendanceManage() {
  const [tab, setTab] = useState('daily'); // daily | recap
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [empFilter, setEmpFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employee_id: '', check_in: '', check_out: '', status: 'Hadir' });
  const [detailRecord, setDetailRecord] = useState(null);
  const [recap, setRecap] = useState(null);
  const [recapLoading, setRecapLoading] = useState(false);

  const loadDaily = () => {
    let url = `/attendance?date=${date}`;
    if (empFilter) url += `&employee_id=${empFilter}`;
    api.get(url).then(res => setData(res.data || [])).catch(console.error);
    api.get('/employees').then(res => setEmployees(res.data || [])).catch(console.error);
  };

  const loadRecap = () => {
    setRecapLoading(true);
    api.get(`/attendance/recap?month=${month}`).then(res => setRecap(res)).catch(console.error).finally(() => setRecapLoading(false));
  };

  useEffect(() => { if (tab === 'daily') loadDaily(); }, [date, empFilter, tab]);
  useEffect(() => { if (tab === 'recap') loadRecap(); }, [month, tab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) await api.put(`/attendance/${editId}`, form);
      else await api.post('/attendance', { ...form, date });
      setShowForm(false); setEditId(null); loadDaily();
    } finally { setSaving(false); }
  };

  const handleEdit = (a) => {
    setForm({ employee_id: a.employee_id, check_in: a.check_in || '', check_out: a.check_out || '', status: a.status });
    setEditId(a.id); setShowForm(true);
  };

  // Stats for daily view
  const totalToday = data.length;
  const hadirToday = data.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length;
  const terlambatToday = data.filter(a => a.status === 'Terlambat' || (a.late_minutes > 0)).length;
  const belumAbsen = employees.length - totalToday;

  const tabs = [
    { key: 'daily', label: 'Monitoring Harian', icon: Calendar },
    { key: 'recap', label: 'Rekap Bulanan', icon: TrendingUp },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Kelola Absensi</h2>
          <p className="text-sm text-gray-400 mt-0.5">Monitoring kehadiran & rekap bulanan karyawan</p>
        </div>
        {tab === 'daily' && (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ employee_id: '', check_in: '', check_out: '', status: 'Hadir' }); }}
            className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
            + Tambah Manual
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ DAILY TAB ═══ */}
      {tab === 'daily' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Users size={18} className="text-blue-600" /></div>
                <div><div className="text-2xl font-bold text-gray-800">{totalToday}</div><div className="text-xs text-gray-400">Total Absen</div></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle size={18} className="text-green-600" /></div>
                <div><div className="text-2xl font-bold text-green-600">{hadirToday}</div><div className="text-xs text-gray-400">Hadir</div></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Timer size={18} className="text-amber-600" /></div>
                <div><div className="text-2xl font-bold text-amber-600">{terlambatToday}</div><div className="text-xs text-gray-400">Terlambat</div></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><XCircle size={18} className="text-red-500" /></div>
                <div><div className="text-2xl font-bold text-red-500">{belumAbsen > 0 ? belumAbsen : 0}</div><div className="text-xs text-gray-400">Belum Absen</div></div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none">
              <option value="">Semua Karyawan</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-left">
                  <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Karyawan</th>
                  <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Masuk</th>
                  <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Keluar</th>
                  <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Terlambat</th>
                  <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Foto</th>
                  <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Lokasi</th>
                  <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Status</th>
                  <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(a => (
                  <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold">{(a.employee_name||'?')[0]}</div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">{a.employee_name || '-'}</div>
                          <div className="text-[11px] text-gray-400">{a.date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{a.check_in || <span className="text-gray-300">--:--</span>}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{a.check_out || <span className="text-gray-300">--:--</span>}</td>
                    <td className="px-4 py-3">
                      {a.late_minutes > 0 ? (
                        <span className="text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded-lg">{a.late_minutes} menit</span>
                      ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {a.photo_in && <img src={a.photo_in} className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-blue-400" onClick={() => setDetailRecord(a)} title="Foto Masuk" />}
                        {a.photo_out && <img src={a.photo_out} className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-orange-400" onClick={() => setDetailRecord(a)} title="Foto Keluar" />}
                        {!a.photo_in && !a.photo_out && <span className="text-gray-300 text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.lat_in ? (
                        <a href={`https://maps.google.com/?q=${a.lat_in},${a.lng_in}`} target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1"><MapPin size={12} /> Lihat</a>
                      ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={a.late_minutes > 0 ? 'Terlambat' : a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setDetailRecord(a)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500" title="Detail"><Eye size={15} /></button>
                        <button onClick={() => handleEdit(a)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Edit"><Edit2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                    <Clock size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Tidak ada data absensi untuk tanggal ini</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══ RECAP TAB ═══ */}
      {tab === 'recap' && (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
          </div>

          {recapLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : recap ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[
                  { label: 'Hari Kerja', value: recap.summary.working_days, color: 'blue' },
                  { label: 'Rata-rata Kehadiran', value: `${recap.summary.avg_attendance_rate}%`, color: 'green' },
                  { label: 'Total Terlambat', value: `${recap.summary.total_late}x`, color: 'amber' },
                  { label: 'Total Alpha', value: `${recap.summary.total_alpha}x`, color: 'red' },
                  { label: 'Total Denda', value: fmt(recap.summary.total_penalty), color: 'purple' },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-400 mb-1">{c.label}</div>
                    <div className={`text-xl font-bold text-${c.color}-600`}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Recap Table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 text-left">
                      <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Karyawan</th>
                      <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center">Hadir</th>
                      <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center">Terlambat</th>
                      <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center">Izin</th>
                      <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center">Sakit</th>
                      <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center">Alpha</th>
                      <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center">Telat (menit)</th>
                      <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center">Denda</th>
                      <th className="px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center">% Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(recap.recap || []).map(r => (
                      <tr key={r.employee_id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{r.employee_name}</div>
                          <div className="text-[11px] text-gray-400">{r.position}</div>
                        </td>
                        <td className="px-4 py-3 text-center"><span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold">{r.hadir}</span></td>
                        <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${r.terlambat > 0 ? 'bg-amber-50 text-amber-700' : 'text-gray-300'}`}>{r.terlambat}</span></td>
                        <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${r.izin > 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-300'}`}>{r.izin}</span></td>
                        <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${r.sakit > 0 ? 'bg-orange-50 text-orange-700' : 'text-gray-300'}`}>{r.sakit}</span></td>
                        <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${r.alpha > 0 ? 'bg-red-50 text-red-700' : 'text-gray-300'}`}>{r.alpha}</span></td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{r.total_late_minutes > 0 ? r.total_late_minutes : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{r.total_penalty > 0 ? fmt(r.total_penalty) : '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${r.attendance_rate >= 80 ? 'bg-green-500' : r.attendance_rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${r.attendance_rate}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-600">{r.attendance_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ═══ DETAIL MODAL ═══ */}
      <Modal open={!!detailRecord} onClose={() => setDetailRecord(null)} title="Detail Absensi" size="md">
        {detailRecord && (
          <div className="space-y-5">
            {/* Employee info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-lg">{(detailRecord.employee_name||'?')[0]}</div>
              <div>
                <div className="font-bold text-gray-800">{detailRecord.employee_name}</div>
                <div className="text-sm text-gray-400">{detailRecord.date}</div>
              </div>
              <div className="ml-auto"><StatusBadge status={detailRecord.late_minutes > 0 ? 'Terlambat' : detailRecord.status} /></div>
            </div>

            {/* Time info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <div className="text-xs text-gray-500 mb-1">Jam Masuk</div>
                <div className="text-2xl font-bold font-mono text-green-700">{detailRecord.check_in || '--:--'}</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl text-center">
                <div className="text-xs text-gray-500 mb-1">Jam Keluar</div>
                <div className="text-2xl font-bold font-mono text-orange-700">{detailRecord.check_out || '--:--'}</div>
              </div>
            </div>

            {/* Late info */}
            {detailRecord.late_minutes > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                <Timer size={18} className="text-amber-600" />
                <div>
                  <div className="text-sm font-semibold text-amber-800">Terlambat {detailRecord.late_minutes} menit</div>
                  {detailRecord.penalty_amount > 0 && <div className="text-xs text-amber-600">Denda: {fmt(detailRecord.penalty_amount)}</div>}
                </div>
              </div>
            )}

            {/* Photos */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Camera size={16} /> Foto Absensi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">Foto Masuk</div>
                  {detailRecord.photo_in ? (
                    <img src={detailRecord.photo_in} className="w-full aspect-square object-cover rounded-xl border border-gray-200" />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-300"><Camera size={32} /></div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">Foto Keluar</div>
                  {detailRecord.photo_out ? (
                    <img src={detailRecord.photo_out} className="w-full aspect-square object-cover rounded-xl border border-gray-200" />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-300"><Camera size={32} /></div>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><MapPin size={16} /> Lokasi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Lokasi Masuk</div>
                  {detailRecord.lat_in ? (
                    <a href={`https://maps.google.com/?q=${detailRecord.lat_in},${detailRecord.lng_in}`} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 text-xs font-mono flex items-center gap-1">
                      <MapPin size={12} /> {Number(detailRecord.lat_in).toFixed(6)}, {Number(detailRecord.lng_in).toFixed(6)}
                    </a>
                  ) : <span className="text-xs text-gray-300">Tidak tersedia</span>}
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Lokasi Keluar</div>
                  {detailRecord.lat_out ? (
                    <a href={`https://maps.google.com/?q=${detailRecord.lat_out},${detailRecord.lng_out}`} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 text-xs font-mono flex items-center gap-1">
                      <MapPin size={12} /> {Number(detailRecord.lat_out).toFixed(6)}, {Number(detailRecord.lng_out).toFixed(6)}
                    </a>
                  ) : <span className="text-xs text-gray-300">Tidak tersedia</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ EDIT MODAL ═══ */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} Absensi`}
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-attendance').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-attendance" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Karyawan" required>
            <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className={selectClass} required>
              <option value="">Pilih Karyawan</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Jam Masuk"><input type="time" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} className={inputClass} /></FormField>
            <FormField label="Jam Keluar"><input type="time" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} className={inputClass} /></FormField>
          </div>
          <FormField label="Status">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={selectClass}>
              <option>Hadir</option><option>Terlambat</option><option>Izin</option><option>Sakit</option><option>Alpha</option>
            </select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
