import React from 'react';
import { LogOut, X, ArrowLeft } from 'lucide-react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmExit: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onCancel,
  onConfirmExit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4">
          <LogOut className="w-7 h-7" />
        </div>

        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
          Deseja mesmo sair do aplicativo?
        </h3>

        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Você está na página inicial do projeto. Se sair agora, você fechará a visualização das publicações.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-sm order-1 sm:order-2"
          >
            Continuar no Aplicativo
          </button>

          <button
            type="button"
            onClick={onConfirmExit}
            className="py-3 px-4 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold rounded-2xl text-xs transition-colors cursor-pointer border border-slate-200 order-2 sm:order-1"
          >
            Sair do Aplicativo
          </button>
        </div>
      </div>
    </div>
  );
};
