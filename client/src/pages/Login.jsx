import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Eye, EyeOff, ArrowRight, BarChart3, Users, Package, Landmark } from 'lucide-react';

const features = [
  { icon: BarChart3, label: 'Dashboard & Laporan Real-time' },
  { icon: Users, label: 'HRD, Absensi & Payroll Otomatis' },
  { icon: Package, label: 'Inventaris & Purchasing' },
  { icon: Landmark, label: 'Kas, Bank & Akuntansi' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(email, password);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)' }}>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #c7d2fe, transparent)' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-base">M</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">Manggala</div>
              <div className="text-indigo-300 text-xs">ERP System</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Kelola bisnis<br />lebih efisien
          </h1>
          <p className="text-indigo-200 text-base leading-relaxed mb-10">
            Platform ERP terintegrasi untuk PT Manggala Utama Indonesia. Semua modul dalam satu sistem.
          </p>

          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <f.icon size={15} className="text-indigo-200" />
                </div>
                <span className="text-indigo-100 text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-indigo-400 text-xs">© {new Date().getFullYear()} PT Manggala Utama Indonesia</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <div className="text-gray-900 font-bold text-base">Manggala ERP</div>
              <div className="text-gray-400 text-xs">PT Manggala Utama Indonesia</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Selamat datang</h2>
            <p className="text-gray-500 text-sm mt-1">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-red-500 text-[10px] font-bold">!</span>
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="nama@perusahaan.id"
                required autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Masukkan password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn btn-primary btn-lg w-full mt-2 group"
              style={{ background: loading ? '#818cf8' : 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              {loading ? (
                <><span className="spinner" />Memproses...</>
              ) : (
                <>Masuk <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-8 text-center">
            © {new Date().getFullYear()} PT Manggala Utama Indonesia
          </p>
        </div>
      </div>
    </div>
  );
}
