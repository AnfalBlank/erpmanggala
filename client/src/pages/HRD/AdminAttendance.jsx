import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Camera, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminAttendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const r = await api.get('/attendance?date=' + selectedDate);
      const list = Array.isArray(r) ? r : (r.data || []);
      setAttendanceData(list);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPhoto = (photoData) => {
    if (!photoData) {
      return (
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg w-24 h-24 flex items-center justify-center">
          <Camera size={24} className="text-gray-400" />
        </div>
      );
    }
    return (
      <div className="relative">
        <img src={photoData} alt="Absensi" className="w-24 h-24 rounded-lg object-cover border" />
        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">✓</div>
      </div>
    );
  };

  const renderLocation = (lat, lng, distance) => {
    if (!lat || !lng) {
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <MapPin size={14} /> Tidak ada GPS
        </div>
      );
    }
    
    return (
      <div className="text-sm">
        <div className="font-medium">{lat.toFixed(6)}, {lng.toFixed(6)}</div>
        {distance && (
          <div className="flex items-center gap-1 text-yellow-600">
            <MapPin size={14} /> {Math.round(distance)}m
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Verifikasi Absensi Admin</h2>
      
      <div className="mb-6 flex items-center gap-4">
        <label className="font-medium">Filter Tanggal:</label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={e => setSelectedDate(e.target.value)} 
          className="px-3 py-2 border rounded-lg"
        />
        <button 
          onClick={loadAttendance}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {attendanceData.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Camera size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Belum ada data absensi untuk {selectedDate}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {attendanceData.map(att => (
            <div key={att.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {renderPhoto(att.check_in_photo)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{att.employee_name || 'Unknown'}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        {att.date} | {att.status}
                      </div>
                    </div>
                    {att.late_minutes > 0 && (
                      <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                        <AlertTriangle size={16} /> {att.late_minutes} menit telat
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 p-3 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-green-600" />
                        <h4 className="font-medium text-green-800">MASUK</h4>
                      </div>
                      <div className="font-medium text-green-700">{att.check_in || '-'}</div>
                      <div className="mt-2">
                        {renderLocation(att.check_in_lat, att.check_in_lng, att.check_in_distance)}
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-orange-600" />
                        <h4 className="font-medium text-orange-800">KELUAR</h4>
                      </div>
                      <div className="font-medium text-orange-700">{att.check_out || '-'}</div>
                      <div className="mt-2">
                        {renderLocation(att.check_out_lat, att.check_out_lng, att.check_out_distance)}
                      </div>
                    </div>
                  </div>
                  
                  {att.check_out_photo && (
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-2">Foto Keluar:</h4>
                      <img src={att.check_out_photo} alt="Absensi Keluar" className="w-20 h-20 rounded object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
