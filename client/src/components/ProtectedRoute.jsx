import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldOff } from 'lucide-react';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export function RoleGuard({ roles, children }) {
  const { user } = useAuth();
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh] animate-fade-in">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Akses Ditolak</h2>
          <p className="text-gray-500 text-sm">Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator jika Anda memerlukan akses.</p>
        </div>
      </div>
    );
  }
  return children;
}
