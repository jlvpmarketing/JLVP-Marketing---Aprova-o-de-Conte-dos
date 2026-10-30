import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Client, GeneralChatMessage, FolderProject } from '../types';
import { firestoreSync } from '../services/firestoreSync';
import { 
  MessageSquare, 
  Send, 
  X, 
  Search, 
  Trash2, 
  ShieldCheck, 
  User, 
  Sparkles,
  CheckCheck,
  AlertCircle
} from 'lucide-react';

interface GeneralClientChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  project?: FolderProject;
  role?: 'client' | 'agency';
}

export const GeneralClientChatModal: React.FC<GeneralClientChatModalProps> = ({
  isOpen,
  onClose,
  client,
  project,
  role = 'client'
}) => {
  const { agencyConfig, currentUser, addToast, addNotification } = useApp();
  
  const [messages, setMessages] = useState<GeneralChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat messages for this client
  useEffect(() => {
    if (!isOpen || !client?.id) return;

    // Load from local storage cache first for instant display
    try {
      const cacheKey = `aprovaflow_chat_${client.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setMessages(JSON.parse(cached));
      }
    } catch {
      // Ignore cache read error
    }

    const unsubscribe = firestoreSync.subscribeToClientChat(client.id, (loaded) => {
      setMessages(loaded);
      try {
        localStorage.setItem(`aprovaflow_chat_${client.id}`, JSON.stringify(loaded));
      } catch {
        // Ignore cache write error
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, client?.id]);

  // Scroll to bottom when new messages arrive if not actively searching
  useEffect(() => {
    if (!searchQuery && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, searchQuery]);

  if (!isOpen || !client) return null;

  const authorName = role === 'agency'
    ? (currentUser?.name || agencyConfig.accountManagerName || 'Agência')
    : (client.company || client.name || 'Cliente');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessageText.trim();
    if (!text || isSending) return;

    setIsSending(true);

    const newMsg: GeneralChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientId: client.id,
      projectId: project?.id,
      authorRole: role,
      authorName,
      text,
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);
    setNewMessageText('');

    try {
      await firestoreSync.saveChatMessage(newMsg);

      // Trigger notification for the other party
      const recipient = role === 'agency' ? 'client' : 'agency';
      const notifTitle = role === 'agency'
        ? `Mensagem da Agência (${authorName})`
        : `Mensagem de ${authorName}`;

      addNotification({
        recipient,
        title: notifTitle,
        message: text.length > 70 ? `${text.slice(0, 70)}...` : text,
        type: 'comment',
        clientId: client.id,
        projectId: project?.id,
        authorName,
        authorRole: role === 'agency' ? 'Agência' : 'Cliente',
      });

    } catch (err) {
      addToast('error', 'Erro ao enviar', 'Não foi possível gravar a mensagem. Verifique a conexão.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Deseja excluir esta mensagem?')) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    await firestoreSync.deleteChatMessage(msgId);
    addToast('info', 'Mensagem Excluída', 'A mensagem foi removida da conversa.');
  };

  const handleClearAllChat = async () => {
    if (!window.confirm('Tem certeza que deseja excluir TODAS as mensagens deste chat? Esta ação não pode ser desfeita.')) return;
    setMessages([]);
    await firestoreSync.clearClientChat(client.id);
    addToast('info', 'Chat Excluído', 'Todas as mensagens da conversa foram apagadas.');
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.text.toLowerCase().includes(q) || m.authorName.toLowerCase().includes(q);
  });

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-amber-300 text-black px-0.5 rounded font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px] max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 bg-black text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center shrink-0 border border-zinc-700">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate flex items-center gap-2">
                <span>Chat com {client.company}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">
                {role === 'client' ? 'Conversa geral com a equipe da agência' : `Painel da Agência · ${client.name || client.company}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsSearching(!isSearching);
                if (isSearching) setSearchQuery('');
              }}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isSearching || searchQuery
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Pesquisar mensagens"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Clear All Chat Button */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllChat}
                className="p-2 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Excluir todo o chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar Input (shown when active or query present) */}
        {(isSearching || searchQuery) && (
          <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2 shrink-0 animate-in slide-in-from-top duration-150">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar mensagens na conversa..."
                autoFocus
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                {filteredMessages.length} {filteredMessages.length === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-200/60 flex items-center justify-center text-slate-400 mb-3">
                <MessageSquare className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-slate-700">Chat Geral Iniciado</p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                Este é o canal direto entre você e a equipe da agência. Envie dúvidas, briefings ou alinhamentos gerais.
              </p>
            </div>
          ) : filteredMessages.length === 0 && searchQuery ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Search className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">Nenhuma mensagem encontrada</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Nenhum resultado corresponde à pesquisa "{searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs font-semibold text-black hover:underline cursor-pointer"
              >
                Limpar pesquisa
              </button>
            </div>
          ) : (
            filteredMessages.map(msg => {
              const isAgency = msg.authorRole === 'agency';
              const isMine = (role === 'client' && !isAgency) || (role === 'agency' && isAgency);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                    <span className="font-bold text-slate-700">{msg.authorName}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      isAgency ? 'bg-zinc-900 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {isAgency ? 'Agência' : 'Cliente'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg.id)}
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
                    <p className="whitespace-pre-wrap">{highlightMatch(msg.text, searchQuery)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              placeholder="Digite sua mensagem geral..."
              className="flex-1 px-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all"
            />
            <button
              type="submit"
              disabled={!newMessageText.trim() || isSending}
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
