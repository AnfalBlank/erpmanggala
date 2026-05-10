import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-t-2xl sm:rounded-2xl w-full ${sizes[size]} max-h-[92vh] flex flex-col shadow-2xl animate-slide-up sm:animate-fade-in`}
        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon text-gray-400">
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export const inputClass = "input";
export const selectClass = "input select";
export const textareaClass = "input textarea";

export function BtnPrimary({ children, loading, ...props }) {
  return (
    <button {...props} className={`btn btn-primary ${props.className || ''}`}>
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}

export function BtnSecondary({ children, ...props }) {
  return (
    <button {...props} className={`btn btn-secondary ${props.className || ''}`}>
      {children}
    </button>
  );
}

export function BtnDanger({ children, loading, ...props }) {
  return (
    <button {...props} className={`btn btn-danger ${props.className || ''}`}>
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}
