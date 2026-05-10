import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Camera, CameraOff, MapPin, MapPinOff, CheckCircle, XCircle,
  Clock, Shield, AlertTriangle, Settings, RefreshCw, Loader2
} from 'lucide-react';

// ── Permission helpers ──
async function checkCameraPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'camera' });
    return result.state; // 'granted' | 'denied' | 'prompt'
  } catch {
    return 'prompt'; // fallback for browsers that don't support permissions API
  }
}

async function checkLocationPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    return 'prompt';
  }
}

// ── Permission Banner Component ──
function PermissionBanner({ type, state, onRetry }) {
  if (state === 'granted') return null;

  const isCamera = type === 'camera';
  const Icon = isCamera ? CameraOff : MapPinOff;
  const label = isCamera ? 'Kamera' : 'Lokasi';

  if (state === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <Icon size={20} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-red-800">Akses {label} Diblokir</h4>
            <p className="text-xs text-red-600 mt-1">
              Izin {label.toLowerCase()} telah ditolak. Untuk mengaktifkan kembali:
            </p>
            <ol className="text-xs text-red-600 mt-2 space-y-1 list-decimal list-inside">
              <li>Klik ikon 🔒 di address bar browser</li>
              <li>Ubah izin <strong>{label}</strong> menjadi <strong>"Izinkan"</strong></li>
              <li>Refresh halaman ini</li>
            </ol>
            <div className="flex gap-2 mt-3">
              <button
                onClick={onRetry}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
              >
                <RefreshCw size={12} /> Coba Lagi
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <Settings size={12} /> Refresh Halaman
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // state === 'prompt' or 'requesting'
  if (state === 'requesting') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="text-blue-500 animate-spin" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Meminta Izin {label}...</h4>
            <p className="text-xs text-blue-600 mt-0.5">Klik "Izinkan" pada dialog browser yang muncul.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Live Clock Component ──
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return (
    <div className="text-center mb-4">
      <div className="text-4xl font-bold font-mono text-gray-800 tracking-wider">
        {time.toTimeString().slice(0, 8)}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {dayNames[time.getDay()]}, {time.getDate()} {monthNames[time.getMonth()]} {time.getFullYear()}
      </div>
    </div>
  );
}

// ── Main Attendance Component ──
export default function Attendance() {
  const [cameraState, setCameraState] = useState('loading'); // loading | requesting | active | denied | error
  const [locationState, setLocationState] = useState('loading'); // loading | requesting | active | denied | error
  const [location, setLocation] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [submitting, setSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const locationWatchRef = useRef(null);
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';

  // ── Initialize: auto-start camera + location on mount ──
  useEffect(() => {
    initCamera();
    initLocation();
    loadTodayStatus();
    loadHistory();
    loadEmployeeId();

    return () => {
      // Cleanup on unmount
      stopCamera();
      if (locationWatchRef.current != null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  // ── Camera initialization ──
  const initCamera = async () => {
    setCameraState('loading');

    // Check permission first
    const perm = await checkCameraPermission();
    if (perm === 'denied') {
      setCameraState('denied');
      return;
    }

    // Request camera
    setCameraState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState('active');
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
      } else {
        setCameraState('error');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // ── Location initialization with watch ──
  const initLocation = async () => {
    if (!navigator.geolocation) {
      setLocationState('error');
      return;
    }

    setLocationState('loading');
    const perm = await checkLocationPermission();
    if (perm === 'denied') {
      setLocationState('denied');
      return;
    }

    setLocationState('requesting');

    // Use watchPosition for real-time updates
    locationWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocationState('active');
      },
      (err) => {
        console.error('Location error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationState('denied');
        } else {
          setLocationState('error');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  // ── Load employee ID ──
  const loadEmployeeId = async () => {
    try {
      const res = await api.get('/employees');
      const emps = res.data || [];
      setEmployees(emps);
      const emp = emps.find(e => e.email === user.email);
      if (emp) setEmployeeId(emp.id);
    } catch {}
  };

  // ── Load today's attendance status ──
  const loadTodayStatus = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [attRes, empRes] = await Promise.all([
        api.get(`/attendance?date=${today}`),
        api.get('/employees')
      ]);
      const records = attRes.data || [];
      const emp = (empRes.data || []).find(e => e.email === user.email);
      setTodayStatus(emp ? records.find(r => r.employee_id === emp.id) || null : null);
    } catch (e) { console.error(e); }
  };

  // ── Load history ──
  const loadHistory = async () => {
    try {
      const res = await api.get(`/attendance?date=${selectedDate}`);
      setHistory(res.data || []);
    } catch {}
  };

  useEffect(() => { loadHistory(); }, [selectedDate]);

  // ── Handle check-in / check-out ──
  const handleAbsen = async (type) => {
    if (cameraState !== 'active') {
      setMessage({ type: 'error', text: 'Kamera belum aktif. Izinkan akses kamera terlebih dahulu.' });
      return;
    }
    if (locationState !== 'active' || !location) {
      setMessage({ type: 'error', text: 'Lokasi belum terdeteksi. Izinkan akses lokasi terlebih dahulu.' });
      return;
    }
    if (!employeeId) {
      setMessage({ type: 'error', text: 'Data karyawan tidak ditemukan. Hubungi admin.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 8);
      const today = now.toISOString().slice(0, 10);

      // Capture photo from camera
      let photoData = null;
      if (videoRef.current && cameraState === 'active') {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 480, 480);
        photoData = canvas.toDataURL('image/jpeg', 0.6);
      }

      if (type === 'checkin') {
        await api.post('/attendance', {
          employee_id: employeeId,
          date: today,
          check_in: timeStr,
          status: 'Hadir',
          photo_in: photoData,
          lat_in: location?.lat,
          lng_in: location?.lng,
        });
        setMessage({ type: 'success', text: `Absen masuk berhasil! Jam ${timeStr}` });
      } else {
        const res = await api.get(`/attendance?date=${today}`);
        const record = (res.data || []).find(r => r.employee_id === employeeId);
        if (record) {
          await api.put(`/attendance/${record.id}`, {
            ...record,
            check_out: timeStr,
            photo_out: photoData,
            lat_out: location?.lat,
            lng_out: location?.lng,
          });
          setMessage({ type: 'success', text: `Absen keluar berhasil! Jam ${timeStr}` });
        } else {
          setMessage({ type: 'error', text: 'Record absen masuk tidak ditemukan.' });
        }
      }

      await loadTodayStatus();
      await loadHistory();
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + (err.message || 'Error') });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 6000);
    }
  };

  const isCheckedIn = todayStatus?.check_in;
  const isCheckedOut = todayStatus?.check_out;
  const allReady = cameraState === 'active' && locationState === 'active' && location;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {isStaff ? 'Kehadiran Saya' : 'Absensi Face ID'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Face ID Panel ── */}
        <div className="space-y-4">
          {/* Permission Banners */}
          <PermissionBanner type="camera" state={cameraState === 'loading' ? 'requesting' : cameraState === 'active' ? 'granted' : cameraState} onRetry={initCamera} />
          <PermissionBanner type="location" state={locationState === 'loading' ? 'requesting' : locationState === 'active' ? 'granted' : locationState} onRetry={initLocation} />

          {/* Main Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Live Clock */}
            <LiveClock />

            {/* Status Indicators */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                cameraState === 'active' ? 'bg-green-100 text-green-700' :
                cameraState === 'denied' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {cameraState === 'active' ? <Camera size={12} /> : cameraState === 'denied' ? <CameraOff size={12} /> : <Loader2 size={12} className="animate-spin" />}
                Kamera {cameraState === 'active' ? 'Aktif' : cameraState === 'denied' ? 'Diblokir' : 'Loading...'}
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                locationState === 'active' ? 'bg-green-100 text-green-700' :
                locationState === 'denied' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {locationState === 'active' ? <MapPin size={12} /> : locationState === 'denied' ? <MapPinOff size={12} /> : <Loader2 size={12} className="animate-spin" />}
                GPS {locationState === 'active' ? 'Aktif' : locationState === 'denied' ? 'Diblokir' : 'Loading...'}
              </div>
            </div>

            {/* Camera View */}
            <div className="relative mb-4">
              <div className="w-full aspect-square max-h-[400px] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                {cameraState === 'active' ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : cameraState === 'denied' ? (
                  <div className="text-center text-gray-400 p-6">
                    <CameraOff size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">Kamera Diblokir</p>
                    <p className="text-xs mt-1 opacity-75">Izinkan akses kamera di pengaturan browser</p>
                  </div>
                ) : cameraState === 'error' ? (
                  <div className="text-center text-gray-400 p-6">
                    <AlertTriangle size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">Kamera Tidak Tersedia</p>
                    <button onClick={initCamera} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors">
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Loader2 size={40} className="mx-auto mb-2 animate-spin opacity-50" />
                    <p className="text-sm">Mengaktifkan kamera...</p>
                  </div>
                )}
              </div>

              {/* Face frame overlay */}
              {cameraState === 'active' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 border-2 border-white/40 rounded-[50%]" />
                  {/* Corner markers */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                </div>
              )}
            </div>

            {/* Location info */}
            {location && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2">
                <MapPin size={14} className="text-green-500 shrink-0" />
                <span>📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                {location.accuracy && <span className="text-gray-400">±{Math.round(location.accuracy)}m</span>}
              </div>
            )}

            {/* Today status */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status Hari Ini</div>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${
                isCheckedOut ? 'bg-gray-200 text-gray-600' :
                isCheckedIn ? 'bg-green-100 text-green-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {isCheckedOut ? <CheckCircle size={16} /> : isCheckedIn ? <Clock size={16} /> : <AlertTriangle size={16} />}
                {isCheckedOut ? 'Selesai' : isCheckedIn ? 'Sudah Masuk' : 'Belum Absen'}
              </div>
              {isCheckedIn && (
                <div className="mt-2 text-xs text-gray-500">
                  Masuk: <strong>{todayStatus.check_in}</strong>
                  {isCheckedOut && <> · Keluar: <strong>{todayStatus.check_out}</strong></>}
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`text-sm rounded-xl p-3 mb-4 flex items-center gap-2 animate-fade-in ${
                message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {message.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isCheckedIn ? (
                <button
                  onClick={() => handleAbsen('checkin')}
                  disabled={!allReady || submitting}
                  className="flex-1 bg-blue-500 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/25"
                >
                  {submitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Memproses...</>
                  ) : (
                    <><Camera size={18} /> ABSEN MASUK</>
                  )}
                </button>
              ) : !isCheckedOut ? (
                <button
                  onClick={() => handleAbsen('checkout')}
                  disabled={!allReady || submitting}
                  className="flex-1 bg-orange-500 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm shadow-orange-500/25"
                >
                  {submitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Memproses...</>
                  ) : (
                    <><Camera size={18} /> ABSEN KELUAR</>
                  )}
                </button>
              ) : (
                <div className="flex-1 bg-green-50 border border-green-200 text-green-700 py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> Absensi Hari Ini Selesai
                </div>
              )}
            </div>

            {/* Help text when not ready */}
            {!allReady && !isCheckedOut && (
              <p className="text-xs text-center text-gray-400 mt-3">
                {cameraState !== 'active' && locationState !== 'active'
                  ? 'Izinkan akses kamera dan lokasi untuk melakukan absensi'
                  : cameraState !== 'active'
                  ? 'Izinkan akses kamera untuk melakukan absensi'
                  : 'Menunggu lokasi GPS terdeteksi...'}
              </p>
            )}
          </div>
        </div>

        {/* ── Right: History Panel ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-gray-500" /> Riwayat Absensi
          </h3>

          <div className="mb-4">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                <Clock size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada data absensi</p>
              </div>
            ) : (
              history.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium shrink-0">
                    {(a.employee_name || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">{a.employee_name || '-'}</div>
                    <div className="text-xs text-gray-400">{a.date}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-500 font-mono">
                      {a.check_in || '--:--'} → {a.check_out || '--:--'}
                    </div>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.status === 'Hadir' ? 'bg-green-100 text-green-600' :
                      a.status === 'Terlambat' ? 'bg-yellow-100 text-yellow-600' :
                      a.status === 'Izin' ? 'bg-blue-100 text-blue-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
