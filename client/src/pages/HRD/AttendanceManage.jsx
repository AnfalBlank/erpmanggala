import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Edit2, X, MapPin, Plus, Trash2 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

export default function AttendanceManage() {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ employee_id: '', check_in: '', check_out: '', status: 'Hadir' });
  const [formErrors, setFormErrors] = useState({});

  // Office locations state
  const [locations, setLocations] = useState([]);
  const [showLocForm, setShowLocForm] = useState(false);
  const [editLocId, setEditLocId] = useState(null);
  const [locForm, setLocForm] = useState({ name: '', latitude: '', longitude: '', radius_meters: '100' });
  const [locFormErrors, setLocFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get(`/attendance?date=${date}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/employees').then(res => setEmployees(res.data || [])).catch(console.error);
  };

  const loadLocations = () => {
    api.get("/office-locations").then(res => setLocations(Array.isArray(res) ? res : [])).catch(() => {});
  };

  useEffect(() => { load(); loadLocations(); }, [date]);

  // ─── Attendance Form ───
  const validateForm = () => {
    const errors = {};
    if (!form.employee_id) errors.employee_id = 'Pilih karyawan';
    if (!form.check_in && !form.check_out) errors.check_in = 'Isi jam masuk atau jam keluar';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById('att-' + firstKey);
      if (el) el.focus();
    }
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      if (editId) {
        await api.put(`/attendance/${editId}`, form);
        toast('Absensi berhasil diupdate!');
      } else {
        await api.post('/attendance', { ...form, date });
        toast('Absensi berhasil ditambahkan!');
      }
      setShowForm(false); setEditId(null); setFormErrors({}); load();
    } catch (err) {
      toast('Gagal menyimpan: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleEdit = (a) => {
    setForm({ employee_id: a.employee_id, check_in: a.check_in || '', check_out: a.check_out || '', status: a.status });
    setEditId(a.id); setShowForm(true); setFormErrors({});
  };

  // ─── Office Location Form ───
  const validateLocForm = () => {
    const errors = {};
    if (!locForm.name.trim()) errors.name = 'Nama lokasi wajib diisi';
    if (!locForm.latitude || isNaN(parseFloat(locForm.latitude))) errors.latitude = 'Latitude wajib diisi (angka)';
    else if (parseFloat(locForm.latitude) < -90 || parseFloat(locForm.latitude) > 90) errors.latitude = 'Latitude harus -90 sampai 90';
    if (!locForm.longitude || isNaN(parseFloat(locForm.longitude))) errors.longitude = 'Longitude wajib diisi (angka)';
    else if (parseFloat(locForm.longitude) < -180 || parseFloat(locForm.longitude) > 180) errors.longitude = 'Longitude harus -180 sampai 180';
    if (!locForm.radius_meters || parseInt(locForm.radius_meters) <= 0) errors.radius_meters = 'Radius harus lebih dari 0';
    setLocFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById('loc-' + firstKey);
      if (el) el.focus();
    }
    return Object.keys(errors).length === 0;
  };

  const handleLocSubmit = async (e) => {
    e.preventDefault();
    if (!validateLocForm()) return;
    const payload = {
      name: locForm.name.trim(),
      latitude: parseFloat(locForm.latitude),
      longitude: parseFloat(locForm.longitude),
      radius_meters: parseInt(locForm.radius_meters) || 100,
    };
    try {
      setSaving(true);
      if (editLocId) {
        await api.patch(`/office-locations/${editLocId}`, payload);
        toast('Lokasi kantor berhasil diupdate!');
      } else {
        await api.post('/office-locations', payload);
        toast('Lokasi kantor berhasil ditambahkan!');
      }
      setShowLocForm(false); setEditLocId(null); setLocForm({ name: '', latitude: '', longitude: '', radius_meters: '100' });
      setLocFormErrors({});
      loadLocations();
    } catch (err) {
      toast('Gagal menyimpan lokasi: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDeleteLoc = async (id) => {
    if (!confirm('Hapus lokasi kantor ini?')) return;
    try {
      await api.delete(`/office-locations/${id}`);
      toast('Lokasi kantor berhasil dihapus!');
      loadLocations();
    } catch (err) {
      toast('Gagal menghapus: ' + err.message, 'error');
    }
  };

  const handleEditLoc = (loc) => {
    setLocForm({ name: loc.name, latitude: String(loc.latitude), longitude: String(loc.longitude), radius_meters: String(loc.radius_meters) });
    setEditLocId(loc.id); setShowLocForm(true); setLocFormErrors({});
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Kelola Absensi</h2>
        <div className="flex gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ employee_id: '', check_in: '', check_out: '', status: 'Hadir' }); setFormErrors({}); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">+ Tambah Absensi</button>
        </div>
      </div>

      {/* Office Locations Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-blue-500" /> Lokasi Kantor (Geofencing)
          </h3>
          <button onClick={() => { setShowLocForm(true); setEditLocId(null); setLocForm({ name: '', latitude: '', longitude: '', radius_meters: '100' }); setLocFormErrors({}); }}
            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-1">
            <Plus size={16} /> Tambah Lokasi
          </button>
        </div>

        {locations.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm">Belum ada lokasi kantor. Tambahkan lokasi untuk mengaktifkan geofencing.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locations.map(loc => (
              <div key={loc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" /> {loc.name}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditLoc(loc)} className="text-blue-500 p-1 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteLoc(loc.id)} className="text-red-500 p-1 hover:bg-red-50 rounded" title="Hapus"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <div>Lat: {loc.latitude} | Lng: {loc.longitude}</div>
                  <div>Radius: {loc.radius_meters}m</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Karyawan</th><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Masuk</th><th className="px-4 py-3 font-medium">Keluar</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.employee_name}</td><td className="px-4 py-3">{a.date}</td><td className="px-4 py-3">{a.check_in||'-'}</td><td className="px-4 py-3">{a.check_out||'-'}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3"><button onClick={() => handleEdit(a)} className="text-blue-500"><Edit2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Attendance Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} Absensi</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Karyawan <span className="text-red-500">*</span></label>
                <select id="att-employee_id" value={form.employee_id} onChange={e => { setForm({...form, employee_id: e.target.value}); setFormErrors({...formErrors, employee_id: ''}); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.employee_id ? 'border-red-400 bg-red-50' : ''}`} required>
                  <option value="">Pilih Karyawan</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                {formErrors.employee_id && <p className="text-xs text-red-500 mt-1">{formErrors.employee_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label>
                  <input id="att-check_in" type="time" value={form.check_in} onChange={e => { setForm({...form, check_in: e.target.value}); setFormErrors({...formErrors, check_in: ''}); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.check_in ? 'border-red-400 bg-red-50' : ''}`} />
                  {formErrors.check_in && <p className="text-xs text-red-500 mt-1">{formErrors.check_in}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Keluar</label>
                  <input type="time" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option>Hadir</option><option>Izin</option><option>Sakit</option><option>Alpha</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Office Location Form Dialog */}
      {showLocForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editLocId ? 'Edit' : 'Tambah'} Lokasi Kantor</h3>
              <button onClick={() => setShowLocForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleLocSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lokasi <span className="text-red-500">*</span></label>
                <input id="loc-name" type="text" value={locForm.name} onChange={e => { setLocForm({...locForm, name: e.target.value}); setLocFormErrors({...locFormErrors, name: ''}); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${locFormErrors.name ? 'border-red-400 bg-red-50' : ''}`} placeholder="Contoh: Kantor Jakarta" />
                {locFormErrors.name && <p className="text-xs text-red-500 mt-1">{locFormErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude <span className="text-red-500">*</span></label>
                  <input id="loc-latitude" type="number" step="any" value={locForm.latitude} onChange={e => { setLocForm({...locForm, latitude: e.target.value}); setLocFormErrors({...locFormErrors, latitude: ''}); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${locFormErrors.latitude ? 'border-red-400 bg-red-50' : ''}`} placeholder="-6.2088" />
                  {locFormErrors.latitude && <p className="text-xs text-red-500 mt-1">{locFormErrors.latitude}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
                  <input id="loc-longitude" type="number" step="any" value={locForm.longitude} onChange={e => { setLocForm({...locForm, longitude: e.target.value}); setLocFormErrors({...locFormErrors, longitude: ''}); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${locFormErrors.longitude ? 'border-red-400 bg-red-50' : ''}`} placeholder="106.8456" />
                  {locFormErrors.longitude && <p className="text-xs text-red-500 mt-1">{locFormErrors.longitude}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meter) <span className="text-red-500">*</span></label>
                <input id="loc-radius_meters" type="number" value={locForm.radius_meters} onChange={e => { setLocForm({...locForm, radius_meters: e.target.value}); setLocFormErrors({...locFormErrors, radius_meters: ''}); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${locFormErrors.radius_meters ? 'border-red-400 bg-red-50' : ''}`} placeholder="100" />
                {locFormErrors.radius_meters && <p className="text-xs text-red-500 mt-1">{locFormErrors.radius_meters}</p>}
              </div>
              <p className="text-xs text-gray-400">💡 Tip: Buka Google Maps → klik lokasi kantor → copy koordinat latitude & longitude</p>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowLocForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
