import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Camera, CameraOff, MapPin, CheckCircle, XCircle, Clock, Shield, MapPinned, AlertTriangle } from 'lucide-react';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function Attendance() {
  const [mode, setMode] = useState('checkin');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionStep, setPermissionStep] = useState(0); // 0=welcome, 1=location, 2=camera, 3=done
  const [locationPermission, setLocationPermission] = useState('unknown'); // unknown, granted, denied
  const [cameraPermission, setCameraPermission] = useState('unknown');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isStaff = user?.role === 'Staff';

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      // Check if permissions API is available
      if (navigator.permissions) {
        const locPerm = await navigator.permissions.query({ name: 'geolocation' });
        const camPerm = await navigator.permissions.query({ name: 'camera' });
        
        setLocationPermission(locPerm.state);
        setCameraPermission(camPerm.state);

        // If both granted, no need to show modal
        if (locPerm.state === 'granted' && camPerm.state === 'granted') {
          getLocation();
          return;
        }

        // Check if user already dismissed the modal (session storage)
        const dismissed = sessionStorage.getItem('attendance_perm_dismissed');
        if (dismissed) {
          getLocation();
          return;
        }

        // Show permission modal
        setShowPermissionModal(true);

        // Listen for changes
        locPerm.onchange = () => {
          setLocationPermission(locPerm.state);
          if (locPerm.state === 'granted') getLocation();
        };
        camPerm.onchange = () => setCameraPermission(camPerm.state);
      } else {
        // Fallback: just try to get location
        getLocation();
      }
    } catch (e) {
      // Permissions API not supported, just proceed
      getLocation();
    }
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung GPS');
      setLocationPermission('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setLocationError('');
        setLocationPermission('granted');
      },
      (err) => {
        if (err.code === 1) {
          setLocationPermission('denied');
          setLocationError('Izin lokasi ditolak. Absensi tetap bisa dilakukan tanpa GPS.');
        } else {
          setLocationError('Gagal mengambil lokasi. Pastikan GPS aktif.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      stream.getTracks().forEach(t => t.stop());
      setCameraPermission('granted');
    } catch (err) {
      setCameraPermission('denied');
    }
  };

  const handlePermissionNext = async () => {
    if (permissionStep === 0) {
      setPermissionStep(1);
      requestLocationPermission();
    } else if (permissionStep === 1) {
      setPermissionStep(2);
      requestCameraPermission();
    } else {
      setShowPermissionModal(false);
      getLocation();
    }
  };

  const handlePermissionSkip = () => {
    sessionStorage.setItem('attendance_perm_dismissed', '1');
    setShowPermissionModal(false);
    getLocation();
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setLocationError('');
        validateGeofence(loc);
      },
      () => setLocationError('Gagal mengambil lokasi. Pastikan GPS aktif.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const validateGeofence = (loc) => {
    if (!loc || officeLocations.length === 0) return;
    let nearest = null;
    let minDist = Infinity;
    for (const ol of officeLocations) {
      const dist = haversine(loc.lat, loc.lng, ol.latitude, ol.longitude);
      if (dist < minDist) { minDist = dist; nearest = ol; }
    }
    const inRange = nearest ? minDist <= (nearest.radius_meters || 100) : false;
    setGeofenceStatus({ inRange, distance: Math.round(minDist), location: nearest });
  };

  useEffect(() => {
    getLocation();
    loadTodayStatus();
    loadHistory();
    api.get('/employees').then(res => setEmployees(res.data || [])).catch(() => {});
    api.get('/office-locations').then(res => setOfficeLocations(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => { validateGeofence(location); }, [officeLocations]);

  const loadTodayStatus = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await api.get(`/attendance?date=${today}`);
      const records = res.data || [];
      const myRecord = records.find(r => r.employee_name === user.name);
      setTodayStatus(myRecord || null);
    } catch (e) { console.error(e); }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get(`/attendance?date=${selectedDate}`);
      setHistory(res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadHistory(); }, [selectedDate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('capturing');
      setMessage('');
    } catch (err) {
      toast('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
      setStatus('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStatus('idle');
  };

  const handleAbsen = async (type) => {
    if (status !== 'capturing') {
      await startCamera();
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (videoRef.current) ctx.drawImage(videoRef.current, 0, 0, 480, 480);
    const photoData = canvas.toDataURL('image/jpeg', 0.7);

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);

    try {
      const emps = await api.get('/employees');
      const emp = (emps.data || []).find(e => e.name === user.name);
      if (!emp) { toast('Data karyawan tidak ditemukan', 'error'); setStatus('error'); return; }

      const today = now.toISOString().slice(0, 10);
      const geo = geofenceStatus || {};

      if (type === 'checkin') {
        await api.post('/attendance', {
          employee_id: emp.id, date: today, check_in: timeStr, status: 'Hadir',
          check_in_lat: location?.lat, check_in_lng: location?.lng,
          check_in_photo: photoData,
          check_in_location_id: geo.location?.id,
          check_in_distance: geo.distance,
        });
        toast(`Absen masuk berhasil! ${timeStr}${geo.distance ? ` (${geo.distance}m dari kantor)` : ''}`);
      } else {
        const res = await api.get(`/attendance?date=${today}`);
        const record = (res.data || []).find(r => r.employee_id === emp.id);
        if (record) {
          await api.put(`/attendance/${record.id}`, {
            ...record,
            check_out: timeStr,
            check_out_lat: location?.lat, check_out_lng: location?.lng,
            check_out_photo: photoData,
            check_out_location_id: geo.location?.id,
            check_out_distance: geo.distance,
          });
        }
        toast(`Absen keluar berhasil! ${timeStr}`);
      }

      setStatus('success');
      stopCamera();
      loadTodayStatus();
      loadHistory();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      toast('Gagal menyimpan absensi: ' + (err.message || 'Error'));
      setStatus('error');
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const isCheckedIn = todayStatus?.check_in;
  const isCheckedOut = todayStatus?.check_out;

  return (
    <div>
      {/* Permission Request Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            {permissionStep === 0 && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Selamat Datang! 👋</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Untuk menggunakan fitur absensi, kami membutuhkan izin akses <strong>Lokasi GPS</strong> dan <strong>Kamera</strong>.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin size={20} className="text-blue-500" />
                    <div className="text-left"><div className="text-sm font-medium text-gray-700">Lokasi GPS</div><div className="text-xs text-gray-400">Untuk verifikasi Anda di area kantor</div></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Camera size={20} className="text-blue-500" />
                    <div className="text-left"><div className="text-sm font-medium text-gray-700">Kamera</div><div className="text-xs text-gray-400">Untuk foto selfie saat absen</div></div>
                  </div>
                </div>
                <button onClick={handlePermissionNext} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">
                  Lanjutkan
                </button>
                <button onClick={handlePermissionSkip} className="w-full text-gray-400 text-sm mt-2 py-2 hover:text-gray-600">
                  Lewati untuk sekarang
                </button>
              </div>
            )}

            {permissionStep === 1 && (
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${locationPermission === 'granted' ? 'bg-green-100' : locationPermission === 'denied' ? 'bg-red-100' : 'bg-blue-100'}`}>
                  {locationPermission === 'granted' ? <CheckCircle size={32} className="text-green-500" /> : locationPermission === 'denied' ? <XCircle size={32} className="text-red-500" /> : <MapPin size={32} className="text-blue-500 animate-pulse" />}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {locationPermission === 'granted' ? 'Lokasi Aktif ✅' : locationPermission === 'denied' ? 'Lokasi Ditolak ❌' : 'Aktifkan Lokasi GPS'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {locationPermission === 'granted' 
                    ? 'Izin lokasi berhasil diaktifkan!'
                    : locationPermission === 'denied'
                    ? 'Lokasi tidak diizinkan. Anda tetap bisa absen tanpa GPS.'
                    : 'Klik tombol di bawah lalu pilih "Izinkan" pada popup browser.'}
                </p>
                {locationPermission !== 'granted' && locationPermission !== 'denied' && (
                  <button onClick={requestLocationPermission} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 mb-2">
                    📍 Izinkan Akses Lokasi
                  </button>
                )}
                <button onClick={handlePermissionNext} className="w-full text-blue-500 py-2 text-sm font-medium hover:text-blue-600">
                  {locationPermission === 'granted' ? 'Lanjut ke Kamera →' : 'Lewati →'}
                </button>
              </div>
            )}

            {permissionStep === 2 && (
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${cameraPermission === 'granted' ? 'bg-green-100' : cameraPermission === 'denied' ? 'bg-red-100' : 'bg-blue-100'}`}>
                  {cameraPermission === 'granted' ? <CheckCircle size={32} className="text-green-500" /> : cameraPermission === 'denied' ? <XCircle size={32} className="text-red-500" /> : <Camera size={32} className="text-blue-500 animate-pulse" />}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {cameraPermission === 'granted' ? 'Kamera Aktif ✅' : cameraPermission === 'denied' ? 'Kamera Ditolak ❌' : 'Aktifkan Kamera'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {cameraPermission === 'granted'
                    ? 'Izin kamera berhasil diaktifkan!'
                    : cameraPermission === 'denied'
                    ? 'Kamera tidak diizinkan. Anda tetap bisa absen tanpa foto.'
                    : 'Klik tombol di bawah lalu pilih "Izinkan" pada popup browser.'}
                </p>
                {cameraPermission !== 'granted' && cameraPermission !== 'denied' && (
                  <button onClick={requestCameraPermission} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 mb-2">
                    📸 Izinkan Akses Kamera
                  </button>
                )}
                <button onClick={handlePermissionNext} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">
                  Mulai Absensi →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-6">{isStaff ? 'Kehadiran Saya' : 'Absensi'}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-blue-500" /> Absensi
          </h3>

          {/* GPS Status */}
          {locationError ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{locationError}</span>
            </div>
          ) : location && geofenceStatus ? (
            <div className={`text-sm rounded-lg p-3 mb-4 flex items-center gap-2 ${geofenceStatus.inRange ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {geofenceStatus.inRange ? <MapPinned size={16} /> : <AlertTriangle size={16} />}
              <span>
                {geofenceStatus.inRange
                  ? `✅ Di area kantor (${geofenceStatus.distance}m dari ${geofenceStatus.location?.name || 'kantor'})`
                  : `⚠️ Di luar area kantor (${geofenceStatus.distance}m dari ${geofenceStatus.location?.name || 'kantor'})`}
              </span>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
              <MapPin size={16} className="animate-pulse" /> Mendeteksi lokasi GPS...
            </div>
          )}

          {/* Today status */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Status Hari Ini</div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
              isCheckedOut ? 'bg-gray-200 text-gray-600' : isCheckedIn ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {isCheckedOut ? 'Selesai' : isCheckedIn ? 'Sudah Masuk' : 'Belum Absen'}
            </div>
            {isCheckedIn && (
              <div className="mt-2 text-xs text-gray-500">
                Masuk: {todayStatus.check_in}
                {isCheckedOut && ` • Keluar: ${todayStatus.check_out}`}
              </div>
            )}
          </div>

          {/* Camera */}
          <div className="relative mb-4">
            <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
              {status === 'capturing' ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
              ) : (
                <div className="text-center text-gray-500">
                  <Camera size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Kamera belum aktif</p>
                </div>
              )}
            </div>
            {status === 'capturing' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 border-2 border-blue-400 rounded-[50%] opacity-60 animate-pulse" />
              </div>
            )}
          </div>

          {message && (
            <div className={`text-sm rounded-lg p-3 mb-4 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {!isCheckedIn ? (
              <button onClick={() => handleAbsen('checkin')}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <Camera size={18} />
                {status === 'capturing' ? '📸 Ambil Foto & Absen Masuk' : 'ABSEN MASUK'}
              </button>
            ) : !isCheckedOut ? (
              <button onClick={() => handleAbsen('checkout')}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-medium text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <Camera size={18} />
                {status === 'capturing' ? '📸 Ambil Foto & Absen Keluar' : 'ABSEN KELUAR'}
              </button>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                <CheckCircle size={18} /> Absensi Hari Ini Selesai
              </div>
            )}
            {status === 'capturing' && (
              <button onClick={stopCamera} className="px-4 py-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300">
                <CameraOff size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Right: History */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-gray-500" /> Riwayat Absensi
          </h3>
          <div className="mb-4">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full" />
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center text-gray-400 py-10">Tidak ada data absensi</div>
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
                    <div className="text-xs text-gray-500">
                      {a.check_in || '-'} → {a.check_out || '-'}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.status === 'Hadir' ? 'bg-green-100 text-green-600' :
                      a.status === 'Terlambat' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {a.status}
                    </span>
                    {a.check_in_distance != null && (
                      <div className="text-[10px] text-gray-400 mt-0.5">{Math.round(a.check_in_distance)}m</div>
                    )}
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
