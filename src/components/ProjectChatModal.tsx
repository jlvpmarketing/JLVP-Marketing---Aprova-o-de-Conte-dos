import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FolderProject, Client, PostContent } from '../types';
import { MessageSquare, Send, X, User, ShieldCheck, Trash2 } from 'lucide-react';

interface ProjectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: FolderProject;
  client: Client;
  posts: PostContent[];
  role?: 'client' | 'agency';
}

export const ProjectChatModal: React.FC<ProjectChatModalProps> = ({
  isOpen,
  onClose,
  project,
  client,
  posts,
  role = 'client'
}) => {
  const { addComment, deleteComment, clearPostComments, agencyConfig, currentUser, addToast } = useApp();
  
  // Selected post to chat about or first post
  const [selectedPostId, setSelectedPostId] = useState<string>(() => {
    return posts[0]?.id || '';
  });
  const [messageText, setMessageText] = useState('');

  if (!isOpen) return null;

  const currentPost = posts.find(p => p.id === selectedPostId) || posts[0];
  const comments = currentPost ? currentPost.comments : [];

  const authorName = role === 'agency'
    ? `${currentUser?.name || agencyConfig.accountManagerName || 'Agência'}`
    : `${client?.name || 'Cliente'}`;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (!currentPost) {
      addToast('warning', 'Nenhum post selecionado', 'Crie pelo menos uma publicação para iniciar uma conversa.');
      return;
    }

    addComment(currentPost.id, role, authorName, messageText.trim());
    setMessageText('');
    addToast('success', 'Mensagem enviada!', 'Sua mensagem foi enviada à agência com sucesso.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[580px] max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-black text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center shrink-0 border border-zinc-700">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">
                Chat do Projeto · {project.name}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">
                {role === 'client' ? `Falando como ${client.company}` : `Painel da Agência`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Selection Tabs if multiple posts */}
        {posts.length > 1 && (
          <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0 pl-1">
              Publicação:
            </span>
            {posts.map(p => {
              const isSelected = p.id === (currentPost?.id || '');
              const commentCount = p.comments.length;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPostId(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-black text-white shadow-xs font-bold'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span className="max-w-[120px] truncate">{p.title}</span>
                  {commentCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-amber-400 text-black font-bold' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {commentCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Post Indicator & Clear Chat */}
        {currentPost && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="text-slate-500 font-medium">Post em discussão:</span>
              <span className="font-bold text-slate-900 truncate">{currentPost.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {comments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja excluir todas as mensagens deste chat?')) {
                      clearPostComments(currentPost.id);
                    }
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  title="Excluir todas as mensagens"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar chat</span>
                </button>
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                currentPost.status === 'approved' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : currentPost.status === 'changes_requested'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {currentPost.status === 'approved' ? 'Aprovado' : currentPost.status === 'changes_requested' ? 'Em Alteração' : 'Para Aprovação'}
              </span>
            </div>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-200/60 flex items-center justify-center text-slate-400 mb-3">
                <MessageSquare className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-slate-700">Nenhuma mensagem nesta publicação</p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                Envie observações, dúvidas sobre o texto ou peça esclarecimentos diretamente aqui. A agência será notificada.
              </p>
            </div>
          ) : (
            comments.map(c => {
              const isAgency = c.authorRole === 'agency';
              const isMine = (role === 'client' && !isAgency) || (role === 'agency' && isAgency);

              return (
                <div
                  key={c.id}
                  className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                    <span className="font-bold text-slate-700">{c.authorName}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      isAgency ? 'bg-zinc-900 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {isAgency ? 'Agência' : 'Cliente'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(c.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteComment(currentPost.id, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer ml-1"
                      title="Excluir mensagem"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs relative ${
                      isMine
                        ? 'bg-slate-900 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{c.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Input */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Digite sua mensagem para a equipe da agência..."
              className="flex-1 px-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="px-4 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
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
