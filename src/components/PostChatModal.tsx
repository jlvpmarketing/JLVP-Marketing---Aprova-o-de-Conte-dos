import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostContent } from '../types';
import { buildWhatsAppUrl, createCommentWhatsAppMessage } from '../utils/whatsapp';
import { 
  MessageSquare, 
  Send, 
  X, 
  Share2, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface PostChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostContent | null;
  currentRole: 'agency' | 'client';
}

export const PostChatModal: React.FC<PostChatModalProps> = ({ isOpen, onClose, post, currentRole }) => {
  const { addComment, clients, projects, agencyConfig, addToast } = useApp();
  const [commentText, setCommentText] = useState('');
  const [sendToWhatsApp, setSendToWhatsApp] = useState(false);

  if (!isOpen || !post) return null;

  const client = clients.find(c => c.id === post.clientId);
  const project = projects.find(p => p.id === post.projectId);

  const authorName = currentRole === 'agency' 
    ? `${agencyConfig.accountManagerName} (Agência)`
    : `${client?.name || 'Cliente'}`;

  const targetPhone = currentRole === 'agency' ? client?.phone : agencyConfig.accountManagerPhone;
  const targetRecipientName = currentRole === 'agency' ? client?.name || 'Cliente' : agencyConfig.accountManagerName;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addComment(post.id, currentRole, authorName, commentText.trim());

    if (sendToWhatsApp && targetPhone) {
      const shareUrl = `${window.location.origin}/?view=portal&project=${project?.clientAccessKey || ''}`;
      const waMsg = createCommentWhatsAppMessage({
        recipientName: targetRecipientName,
        authorName,
        projectName: project?.name || 'Projeto',
        postTitle: post.title,
        commentText: commentText.trim(),
        link: shareUrl,
      });
      window.open(buildWhatsAppUrl(targetPhone, waMsg), '_blank');
    }

    setCommentText('');
    addToast('success', 'Comentário Enviado', 'Mensagem registrada com sucesso no histórico do post.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[560px] max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm truncate">{post.title}</h3>
              <p className="text-[11px] text-slate-400 truncate">
                Chat direto · {currentRole === 'agency' ? 'Falando como Agência' : 'Falando como Cliente'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {post.comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">Nenhum comentário ainda</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                Utilize este canal para alinhar ajustes de texto, referências visuais e aprovações rápidas.
              </p>
            </div>
          ) : (
            post.comments.map(c => {
              const isMe = (currentRole === 'agency' && c.authorRole === 'agency') ||
                           (currentRole === 'client' && c.authorRole === 'client');

              const isChangeRequest = c.text.startsWith('[SOLICITAÇÃO DE AJUSTE]');

              const timeStr = new Date(c.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={c.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-slate-700">{c.authorName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">· {timeStr}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-2xs ${
                      isChangeRequest
                        ? 'bg-amber-50 border border-amber-200 text-amber-950 font-medium'
                        : isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {c.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white shrink-0 space-y-2">
          {targetPhone && (
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendToWhatsApp}
                  onChange={e => setSendToWhatsApp(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Enviar também no WhatsApp de {targetRecipientName}</span>
              </label>
              <span className="text-[10px] text-emerald-600 font-medium">WhatsApp Sync</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Digite seu comentário ou dúvida..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
