import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-[280px] max-w-[400px] animate-[slideIn_0.3s_ease] ${
            t.type === 'success' ? 'bg-green-500 text-white' :
            t.type === 'error' ? 'bg-red-500 text-white' :
            t.type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {t.type === 'success' ? <CheckCircle size={18} /> :
             t.type === 'error' ? <AlertCircle size={18} /> :
             <Info size={18} />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="hover:opacity-70 shrink-0"><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
