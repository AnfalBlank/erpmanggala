import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Camera, CameraOff, MapPin, CheckCircle, XCircle, Clock, Shield, MapPinned, AlertTriangle } from 'lucide-react';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function Attendance() {
  const [status, setStatus] = useState('idle');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showPermModal, setShowPermModal] = useState(false);
  const [permStep, setPermStep] = useState(0);
  const [locPerm, setLocPerm] = useState('unknown');
  const [camPerm, setCamPerm] = useState('unknown');
  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showEmpSelect, setShowEmpSelect] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { checkPermissions(); loadEmployee(); }, []);

  const loadEmployee = async () => {
    try {
      const res = await api.get('/employees');
      const list = Array.isArray(res) ? res : (res.data || []);
      setEmployees(list);
      // Try to find linked employee by email first, then by name
      let emp = list.find(e => e.email === user?.email);
      if (!emp) emp = list.find(e => e.name === user?.name);
      if (emp) {
        setEmployee(emp);
      } else if (list.length > 0) {
        setShowEmpSelect(true);
      }
    } catch (err) { console.error(err); }
  };

  const checkPermissions = async () => {
    try {
      if (navigator.permissions) {
        const lp = await navigator.permissions.query({ name: 'geolocation' });
        const cp = await navigator.permissions.query({ name: 'camera' });
        setLocPerm(lp.state); setCamPerm(cp.state);
        if (lp.state === 'granted' && cp.state === 'granted') { getLocation(); return; }
      }
      if (!sessionStorage.getItem('att_perm_skip')) setShowPermModal(true);
      else getLocation();
    } catch { getLocation(); }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationError('Browser tidak mendukung GPS'); setLocPerm('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationError(''); setLocPerm('granted'); },
      () => { setLocPerm('denied'); setLocationError('Izin lokasi ditolak. Absensi tetap bisa dilakukan.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const requestCamera = async () => {
    try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); s.getTracks().forEach(t => t.stop()); setCamPerm('granted'); }
    catch { setCamPerm('denied'); }
  };

  const handlePermNext = () => {
    if (permStep === 0) { setPermStep(1); requestLocation(); }
    else if (permStep === 1) { setPermStep(2); requestCamera(); }
    else { setShowPermModal(false); getLocation(); }
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setLocation(loc); validateGeofence(loc); },
      () => {}, { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const validateGeofence = (loc) => {
    if (!loc || !officeLocations.length) return;
    let nearest = null, minDist = Infinity;
    for (const ol of officeLocations) { const dist = haversine(loc.lat, loc.lng, ol.latitude, ol.longitude); if (dist < minDist) { minDist = dist; nearest = ol; } }
    setGeofenceStatus({ inRange: nearest ? minDist <= nearest.radius_meters : false, distance: Math.round(minDist), location: nearest });
  };

  useEffect(() => { getLocation(); loadToday(); loadHistory(); api.get('/office-locations').then(r => setOfficeLocations(Array.isArray(r) ? r : [])).catch(() => {}); }, []);
  useEffect(() => { validateGeofence(location); }, [officeLocations]);

  const loadToday = async () => {
    try {
      const r = await api.get('/attendance?date=' + new Date().toISOString().slice(0, 10));
      const list = Array.isArray(r) ? r : (r.data || []);
      if (employee) {
        const rec = list.find(a => a.employee_id === employee.id);
        setTodayStatus(rec || null);
      }
    } catch {}
  };

  const loadHistory = async () => {
    try { const r = await api.get('/attendance?date=' + selectedDate); setHistory(Array.isArray(r) ? r : (r.data || [])); } catch {}
  };
  useEffect(() => { loadHistory(); }, [selectedDate]);
  useEffect(() => { if (employee) loadToday(); }, [employee]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('capturing');
    } catch (err) { toast('Gagal akses kamera: ' + err.message, 'error'); setStatus('error'); }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setStatus('idle');
  };

  const handleAbsen = async (type) => {
    if (!employee) { toast('Pilih karyawan terlebih dahulu', 'error'); return; }
    if (status !== 'capturing') { await startCamera(); return; }
    const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (videoRef.current) ctx.drawImage(videoRef.current, 0, 0, 480, 480);
    const photo = canvas.toDataURL('image/jpeg', 0.7);
    const now = new Date(); const timeStr = now.toTimeString().slice(0, 8);
    const today = now.toISOString().slice(0, 10);
    const geo = geofenceStatus || {};
    try {
      if (type === 'checkin') {
        await api.post('/attendance', { employee_id: employee.id, date: today, check_in: timeStr, status: 'Hadir', check_in_lat: location?.lat, check_in_lng: location?.lng, check_in_photo: photo, check_in_location_id: geo.location?.id, check_in_distance: geo.distance });
        toast('Absen masuk berhasil! ' + timeStr);
      } else {
        const r = await api.get('/attendance?date=' + today);
        const list = Array.isArray(r) ? r : (r.data || []);
        const rec = list.find(a => a.employee_id === employee.id);
        if (rec) await api.put('/attendance/' + rec.id, { ...rec, check_out: timeStr, check_out_lat: location?.lat, check_out_lng: location?.lng, check_out_photo: photo, check_out_location_id: geo.location?.id, check_out_distance: geo.distance });
        else toast('Belum ada record masuk hari ini', 'error');
      }
      setStatus('success'); stopCamera(); loadToday(); loadHistory();
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
  };

  const isCheckedIn = todayStatus?.check_in;
  const isCheckedOut = todayStatus?.check_out;

  return (
    <div>
      {!window.isSecureContext && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} /> Camera & GPS memerlukan HTTPS.
        </div>
      )}

      {showPermModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            {permStep === 0 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><Shield size={32} className="text-blue-500" /></div>
                <h3 className="text-lg font-bold mb-2">Selamat Datang! 👋</h3>
                <p className="text-sm text-gray-500 mb-6">Untuk absensi, kami butuh izin <strong>Lokasi GPS</strong> dan <strong>Kamera</strong>.</p>
                <button onClick={handlePermNext} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">Lanjutkan</button>
                <button onClick={() => { sessionStorage.setItem('att_perm_skip', '1'); setShowPermModal(false); getLocation(); }} className="w-full text-gray-400 text-sm mt-2 py-2">Lewati</button>
              </div>
            )}
            {permStep === 1 && (
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${locPerm === 'granted' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {locPerm === 'granted' ? <CheckCircle size={32} className="text-green-500" /> : <MapPin size={32} className="text-blue-500 animate-pulse" />}
                </div>
                <h3 className="text-lg font-bold mb-2">{locPerm === 'granted' ? 'Lokasi Aktif ✅' : 'Aktifkan Lokasi GPS'}</h3>
                {locPerm !== 'granted' && <button onClick={requestLocation} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 mb-2">📍 Izinkan Lokasi</button>}
                <button onClick={handlePermNext} className="w-full text-blue-500 py-2 text-sm font-medium">Lanjut →</button>
              </div>
            )}
            {permStep === 2 && (
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${camPerm === 'granted' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {camPerm === 'granted' ? <CheckCircle size={32} className="text-green-500" /> : <Camera size={32} className="text-blue-500 animate-pulse" />}
                </div>
                <h3 className="text-lg font-bold mb-2">{camPerm === 'granted' ? 'Kamera Aktif ✅' : 'Aktifkan Kamera'}</h3>
                {camPerm !== 'granted' && <button onClick={requestCamera} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 mb-2">📸 Izinkan Kamera</button>}
                <button onClick={handlePermNext} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">Mulai Absensi →</button>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-6">Absensi</h2>

      {/* Employee Selection */}
      {!employee && !showEmpSelect && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm text-yellow-700">
          ⚠️ Akun Anda belum terhubung ke data karyawan. Hubungi admin.
          <button onClick={() => setShowEmpSelect(true)} className="ml-2 text-blue-500 underline">Pilih manual</button>
        </div>
      )}
      {(showEmpSelect || !employee) && employees.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Karyawan Anda *</label>
          <select value={employee?.id || ''} onChange={e => { const emp = employees.find(x => x.id === Number(e.target.value)); setEmployee(emp || null); setShowEmpSelect(false); }} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">-- Pilih --</option>
            {employees.filter(e => e.status !== 'Nonaktif').map(e => <option key={e.id} value={e.id}>{e.name} — {e.position || e.email}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Pilih sekali saja. Pilihan akan diingat otomatis.</p>
        </div>
      )}
      {employee && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700 flex items-center justify-between">
          <span>👤 {employee.name} — {employee.position || employee.email}</span>
          <button onClick={() => setShowEmpSelect(true)} className="text-blue-500 underline text-xs">Ganti</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Shield size={20} className="text-blue-500" /> Absensi</h3>
          {locationError && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg p-3 mb-4 flex items-center gap-2"><AlertTriangle size={16} />{locationError}</div>}
          {location && geofenceStatus && (
            <div className={`text-sm rounded-lg p-3 mb-4 flex items-center gap-2 ${geofenceStatus.inRange ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {geofenceStatus.inRange ? <MapPinned size={16} /> : <AlertTriangle size={16} />}
              {geofenceStatus.inRange ? `✅ Di area kantor (${geofenceStatus.distance}m)` : `⚠️ Di luar area (${geofenceStatus.distance}m)`}
            </div>
          )}
          {!location && !locationError && <div className="bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-lg p-3 mb-4 flex items-center gap-2"><MapPin size={16} className="animate-pulse" /> Mendeteksi lokasi...</div>}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Status Hari Ini</div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${isCheckedOut ? 'bg-gray-200 text-gray-600' : isCheckedIn ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              {!employee ? 'Pilih Karyawan' : isCheckedOut ? 'Selesai' : isCheckedIn ? 'Sudah Masuk' : 'Belum Absen'}
            </div>
            {isCheckedIn && <div className="mt-2 text-xs text-gray-500">Masuk: {todayStatus.check_in}{isCheckedOut && ` • Keluar: ${todayStatus.check_out}`}</div>}
          </div>
          <div className="relative mb-4">
            <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
              {status === 'capturing' ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" /> :
              <div className="text-center text-gray-500"><Camera size={48} className="mx-auto mb-2 opacity-50" /><p className="text-sm">Kamera belum aktif</p></div>}
            </div>
          </div>
          <div className="flex gap-3">
            {employee && !isCheckedIn ? (
              <button onClick={() => handleAbsen('checkin')} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-600 flex items-center justify-center gap-2">
                <Camera size={18} />{status === 'capturing' ? '📸 Ambil Foto & Masuk' : 'ABSEN MASUK'}
              </button>
            ) : employee && !isCheckedOut ? (
              <button onClick={() => handleAbsen('checkout')} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-medium text-sm hover:bg-orange-600 flex items-center justify-center gap-2">
                <Camera size={18} />{status === 'capturing' ? '📸 Ambil Foto & Keluar' : 'ABSEN KELUAR'}
              </button>
            ) : employee ? (
              <div className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"><CheckCircle size={18} /> Selesai</div>
            ) : null}
            {status === 'capturing' && <button onClick={stopCamera} className="px-4 py-3 bg-gray-200 rounded-xl"><CameraOff size={18} /></button>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-gray-500" /> Riwayat</h3>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm w-full mb-4" />
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.length === 0 ? <div className="text-center text-gray-400 py-10">Tidak ada data</div> :
            history.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">{(a.employee_name || '?')[0]}</div>
                <div className="flex-1"><div className="text-sm font-medium">{a.employee_name || '-'}</div><div className="text-xs text-gray-400">{a.date}</div></div>
                <div className="text-right"><div className="text-xs text-gray-500">{a.check_in || '-'} → {a.check_out || '-'}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'Hadir' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{a.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
