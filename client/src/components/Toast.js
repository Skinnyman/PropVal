import React, { useEffect } from 'react';
import { CheckCircle, Clock, XCircle, X, Info } from 'lucide-react';

export const TOAST_TYPES = {
  approved: { icon: CheckCircle, bg: 'bg-emerald-500', label: 'Approved' },
  pending: { icon: Clock, bg: 'bg-amber-500', label: 'Pending' },
  rejected: { icon: XCircle, bg: 'bg-red-500', label: 'Rejected' },
  info: { icon: Info, bg: 'bg-blue-500', label: 'Info' },
};

// Single toast item
export const Toast = ({ toast, onDismiss }) => {
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="flex items-start bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-100 p-4 min-w-[320px] max-w-sm animate-in slide-in-from-right duration-300">
      <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center mr-4 shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-primary truncate">{toast.title}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-3 p-1 text-slate-300 hover:text-slate-600 transition shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// Toast container – globally positioned, bottom-right
export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col space-y-3">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
