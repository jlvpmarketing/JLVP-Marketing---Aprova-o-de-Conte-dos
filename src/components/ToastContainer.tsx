import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(toast => {
        let Icon = Info;
        let bgStyle = 'bg-slate-900 text-white border-slate-800';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          bgStyle = 'bg-emerald-950 text-emerald-50 border-emerald-800';
        } else if (toast.type === 'warning') {
          Icon = AlertCircle;
          bgStyle = 'bg-amber-950 text-amber-50 border-amber-800';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          bgStyle = 'bg-rose-950 text-rose-50 border-rose-800';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-2 ${bgStyle}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-90" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight leading-snug">{toast.title}</h4>
              <p className="text-xs opacity-85 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
