import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { Camera, CameraOff, MapPin, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

export default function Attendance() {
  const [mode, setMode] = useState('checkin'); // checkin | checkout | history
  const [status, setStatus] = useState('idle'); // idle | capturing | success | error
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const employee = JSON.parse(localStorage.getItem('erp_user') || '{}');

  // Get location
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError('');
      },
      (err) => {
        setLocationError('Gagal mengambil lokasi. Pastikan GPS aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Load today status
  useEffect(() => {
    getLocation();
    loadTodayStatus();
    loadHistory();
    api.get('/employees').then(res => setEmployees(res.data || [])).catch(() => {});
  }, []);

  const loadTodayStatus = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await api.get(`/attendance?date=${today}`);
      const records = res.data || [];
      const myRecord = records.find(r => r.employee_name === employee.name);
      setTodayStatus(myRecord || null);
    } catch (e) { console.error(e); }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get(`/attendance?date=${selectedDate}`);
      setHistory(res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedDate]);

  // Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 480, height: 480 } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('capturing');
      setMessage('');
    } catch (err) {
      setMessage('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
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
    setMode(type === 'checkin' ? 'checkin' : 'checkout');
    
    // Start camera first
    if (status !== 'capturing') {
      await startCamera();
      return;
    }

    // Capture snapshot
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, 480, 480);
    }
    const photoData = canvas.toDataURL('image/jpeg', 0.8);

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);

    try {
      // Find employee ID
      const emps = await api.get('/employees');
      const emp = (emps.data || []).find(e => e.name === employee.name);
      if (!emp) {
        setMessage('Data karyawan tidak ditemukan');
        setStatus('error');
        return;
      }

      const today = now.toISOString().slice(0, 10);

      if (type === 'checkin') {
        await api.post('/attendance', {
          employee_id: emp.id,
          date: today,
          check_in: timeStr,
          status: 'Hadir'
        });
        setMessage(`✅ Absen masuk berhasil! ${timeStr}`);
      } else {
        // Find today's record and update
        const res = await api.get(`/attendance?date=${today}`);
        const record = (res.data || []).find(r => r.employee_id === emp.id);
        if (record) {
          await api.put(`/attendance/${record.id}`, { ...record, check_out: timeStr });
        }
        setMessage(`✅ Absen keluar berhasil! ${timeStr}`);
      }

      setStatus('success');
      stopCamera();
      loadTodayStatus();
      loadHistory();

      // Auto clear message
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage('Gagal menyimpan absensi: ' + (err.message || 'Error'));
      setStatus('error');
    }
  };

  const empName = (id) => employees.find(e => e.id === id)?.name || '-';
  const today = new Date().toISOString().slice(0, 10);
  const isCheckedIn = todayStatus?.check_in;
  const isCheckedOut = todayStatus?.check_out;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Absensi Face ID</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Face ID Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-blue-500" /> Face ID Absensi
          </h3>

          {/* Location alert */}
          {locationError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg p-3 mb-4 flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}
          {location && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
              <MapPin size={16} />
              <span>Lokasi terdeteksi: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            </div>
          )}

          {/* Today status */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Status Hari Ini</div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
              isCheckedOut ? 'bg-gray-200 text-gray-600' :
              isCheckedIn ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
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

          {/* Camera view */}
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
            {/* Face frame overlay */}
            {status === 'capturing' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 border-2 border-blue-400 rounded-[50%] opacity-60 animate-pulse" />
              </div>
            )}
          </div>

          {/* Success/Error message */}
          {message && (
            <div className={`text-sm rounded-lg p-3 mb-4 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {!isCheckedIn ? (
              <button onClick={() => handleAbsen('checkin')} disabled={status === 'capturing' && !location}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                <Camera size={18} />
                {status === 'capturing' ? 'Ambil Foto & Absen Masuk' : 'ABSEN MASUK (FACE ID)'}
              </button>
            ) : !isCheckedOut ? (
              <button onClick={() => handleAbsen('checkout')}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-medium text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                <Camera size={18} />
                {status === 'capturing' ? 'Ambil Foto & Absen Keluar' : 'ABSEN KELUAR (FACE ID)'}
              </button>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                <CheckCircle size={18} /> Absensi Hari Ini Selesai
              </div>
            )}
            {status === 'capturing' && (
              <button onClick={stopCamera} className="px-4 py-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors">
                <CameraOff size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Today's history */}
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
