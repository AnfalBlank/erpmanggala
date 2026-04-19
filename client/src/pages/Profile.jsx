import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/profile').then(setProfile).catch(console.error);
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (form.new_password !== form.confirm_password) return setError('Konfirmasi password tidak cocok');
    if (form.new_password.length < 6) return setError('Password baru minimal 6 karakter');
    try {
      const res = await api.put('/auth/profile', { old_password: form.old_password, new_password: form.new_password });
      setMsg(res.message || 'Password berhasil diubah');
      setForm({ old_password: '', new_password: '', confirm_password: '' });
      setChangingPassword(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Profil Saya</h2>
      <div className="max-w-lg">
        {/* Avatar & Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
            <div>
              <div className="text-lg font-bold text-gray-800">{profile?.name || user?.name}</div>
              <div className="text-sm text-gray-500">{profile?.email || user?.email}</div>
              <div className="text-xs mt-1"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{profile?.role || user?.role}</span></div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Status</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${profile?.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{profile?.status || 'Aktif'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Terdaftar</span>
              <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : '-'}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Lock size={18} /> Ubah Password</h3>
            {!changingPassword && (
              <button onClick={() => setChangingPassword(true)} className="text-sm text-blue-500 hover:text-blue-700">Ubah Password</button>
            )}
          </div>
          {msg && <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3 mb-4 flex items-center gap-2"><CheckCircle size={16} /> {msg}</div>}
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>}
          {changingPassword && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
                <input type="password" value={form.old_password} onChange={e => setForm({...form, old_password: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <input type="password" value={form.new_password} onChange={e => setForm({...form, new_password: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                <input type="password" value={form.confirm_password} onChange={e => setForm({...form, confirm_password: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setChangingPassword(false); setError(''); setForm({old_password:'',new_password:'',confirm_password:''}); }} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center gap-2"><Save size={16} /> Simpan</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
