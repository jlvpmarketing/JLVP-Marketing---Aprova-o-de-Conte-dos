import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostContent } from '../types';
import { AlertTriangle, Send, X, MessageSquare, Check } from 'lucide-react';

interface RequestChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostContent | null;
}

export const RequestChangesModal: React.FC<RequestChangesModalProps> = ({ isOpen, onClose, post }) => {
  const { requestChangesPost, agencyConfig, clients, projects, users, addToast } = useApp();
  const [note, setNote] = useState('');

  if (!isOpen || !post) return null;

  const client = clients.find(c => c.id === post.clientId);
  const project = projects.find(p => p.id === post.projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      addToast('warning', 'Campo obrigatório', 'Por favor descreva os ajustes necessários para a agência.');
      return;
    }

    requestChangesPost(post.id, note.trim());
    addToast('warning', 'Solicitação Registrada', 'Sua solicitação de ajuste foi registrada e a equipe foi notificada.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Solicitar Alteração no Conteúdo</h3>
              <p className="text-xs text-slate-500">Descreva o que a agência precisa ajustar neste material</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-medium text-slate-500 block">Post Selecionado:</span>
            <span className="font-semibold text-slate-900">{post.title}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              O que você gostaria de mudar? *
            </label>
            <textarea
              rows={4}
              required
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: Trocar a foto do balcão pela imagem enviada ontem; alterar a frase da legenda no segundo parágrafo para 'Entrada franca até as 20h'..."
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Enviar Solicitação de Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
