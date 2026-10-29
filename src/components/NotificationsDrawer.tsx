import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { requestPushPermission } from '../utils/notifications';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Check,
  CheckSquare,
  Square
} from 'lucide-react';
import { PostDetailView } from './PostDetailView';
import { PostContent, NotificationItem } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filterClientId?: string;
  filterProjectId?: string;
  title?: string;
  role?: 'agency' | 'client';
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ 
  isOpen, 
  onClose,
  filterClientId,
  filterProjectId,
  title = 'Notificações em Tempo Real',
  role = 'agency'
}) => {
  const { 
    notifications, 
    markNotificationsAsRead, 
    markMultipleNotificationsAsRead,
    clearNotifications,
    addToast,
    posts,
    clients,
    projects,
    openClientDetailPage
  } = useApp();

  const [selectedPost, setSelectedPost] = useState<PostContent | null>(null);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);

  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Active validation: filter out deleted clients and projects if applicable
  const activeClientIds = new Set(clients.map(c => c.id));
  const activeProjectIds = new Set(projects.map(p => p.id));

  const relevantNotifications = notifications.filter(notif => {
    // If notif belongs to a client that was deleted, hide it
    if (notif.clientId && !activeClientIds.has(notif.clientId)) {
      return false;
    }
    // If scoped by filterClientId
    if (filterClientId && notif.clientId && notif.clientId !== filterClientId) {
      return false;
    }
    // If scoped by filterProjectId
    if (filterProjectId && notif.postId) {
      const p = posts.find(post => post.id === notif.postId);
      if (p && p.projectId !== filterProjectId) {
        return false;
      }
    }
    return true;
  });

  const displayedNotifications = filterMode === 'unread'
    ? relevantNotifications.filter(n => !n.read)
    : relevantNotifications;

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  const handleRequestPush = async () => {
    const res = await requestPushPermission();
    setPushStatus(res);
    if (res === 'granted') {
      addToast('success', 'Push Ativado', 'Você receberá notificações instantâneas no seu navegador!');
    } else {
      addToast('warning', 'Push Não Autorizado', 'As notificações do navegador foram bloqueadas ou recusadas.');
    }
  };

  const handleToggleSingleRead = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    markNotificationsAsRead(notifId);
    addToast('success', 'Notificação atualizada', 'Marcada como lida com sucesso.');
  };

  const handleToggleSelect = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    setSelectedNotifIds(prev => 
      prev.includes(notifId) ? prev.filter(id => id !== notifId) : [...prev, notifId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifIds.length === displayedNotifications.length) {
      setSelectedNotifIds([]);
    } else {
      setSelectedNotifIds(displayedNotifications.map(n => n.id));
    }
  };

  const handleMarkBatchRead = () => {
    if (selectedNotifIds.length === 0) return;
    markMultipleNotificationsAsRead(selectedNotifIds);
    addToast('success', 'Notificações Concluídas', `${selectedNotifIds.length} notificações marcadas como lidas.`);
    setSelectedNotifIds([]);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markNotificationsAsRead(notif.id);

    if (notif.postId) {
      const found = posts.find(p => p.id === notif.postId);
      if (found) {
        setSelectedPost(found);
        return;
      }
    }

    const matched = posts.find(p => notif.message.includes(p.title) || notif.title.includes(p.title));
    if (matched) {
      setSelectedPost(matched);
      return;
    }

    if (notif.clientId && role === 'agency') {
      openClientDetailPage(notif.clientId);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end transition-opacity">
        <div 
          className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 bg-black text-white flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{title}</h3>
                <p className="text-[11px] text-zinc-400">
                  {relevantNotifications.length} no histórico · {unreadCount} pendentes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Push status bar */}
          <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-300">Push no Navegador:</span>
              {pushStatus === 'granted' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativadas
                </span>
              ) : pushStatus === 'denied' ? (
                <span className="text-rose-400 font-medium text-[11px]">Bloqueadas</span>
              ) : (
                <span className="text-amber-400 font-medium text-[11px]">Desativadas</span>
              )}
            </div>
            {pushStatus !== 'granted' && (
              <button
                onClick={handleRequestPush}
                className="px-2.5 py-1 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Ativar Push
              </button>
            )}
          </div>

          {/* Filter & Selection Action bar */}
          <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50 text-xs">
            {/* Filter mode */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  filterMode === 'all' ? 'bg-black text-white shadow-2xs' : 'text-slate-600 hover:text-black'
                }`}
              >
                Todas ({relevantNotifications.length})
              </button>
              <button
                onClick={() => setFilterMode('unread')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  filterMode === 'unread' ? 'bg-black text-white shadow-2xs' : 'text-slate-600 hover:text-black'
                }`}
              >
                Não Lidas ({unreadCount})
              </button>
            </div>

            {/* Select and actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSelectAll}
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                title="Selecionar / Desmarcar todas exibidas"
              >
                {selectedNotifIds.length > 0 && selectedNotifIds.length === displayedNotifications.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-black" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Todas</span>
              </button>

              {selectedNotifIds.length > 0 && (
                <button
                  onClick={handleMarkBatchRead}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-black hover:bg-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs animate-in fade-in"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Concluir ({selectedNotifIds.length})</span>
                </button>
              )}

              <button
                onClick={() => markNotificationsAsRead()}
                className="p-1 text-slate-500 hover:text-black rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                title="Marcar todas como concluídas"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={clearNotifications}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Limpar histórico"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {displayedNotifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Bell className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Tudo calmo por aqui</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {filterMode === 'unread' 
                    ? 'Você não tem notificações não lidas no momento.' 
                    : 'Novos posts, aprovações e respostas a ajustes aparecerão aqui em tempo real.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map(notif => {
                let Icon = Bell;
                let iconBg = 'bg-slate-100 text-slate-600';

                if (notif.type === 'approval') {
                  Icon = CheckCircle2;
                  iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
                } else if (notif.type === 'changes') {
                  Icon = AlertTriangle;
                  iconBg = 'bg-amber-50 text-amber-600 border border-amber-200';
                } else if (notif.type === 'comment') {
                  Icon = MessageSquare;
                  iconBg = 'bg-blue-50 text-blue-600 border border-blue-200';
                } else if (notif.type === 'new_content') {
                  Icon = Clock;
                  iconBg = 'bg-purple-50 text-purple-700 border border-purple-200';
                }

                const isSelected = selectedNotifIds.includes(notif.id);
                const timeStr = new Date(notif.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? 'border-black ring-1 ring-black bg-zinc-50'
                        : notif.read
                        ? 'bg-white border-slate-200/70 opacity-75'
                        : 'bg-amber-50/40 border-amber-200 shadow-2xs'
                    }`}
                  >
                    {/* Top action row */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 text-[11px]">
                      <button
                        type="button"
                        onClick={e => handleToggleSelect(e, notif.id)}
                        className="flex items-center gap-1.5 text-slate-600 hover:text-black cursor-pointer font-medium"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-black" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>Selecionar</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">{timeStr}</span>
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={e => handleToggleSingleRead(e, notif.id)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Concluir</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                        
                        {Boolean(notif.authorName || notif.authorRole) && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                            <span className="truncate">
                              Por: <strong className="text-zinc-800">{notif.authorName || 'Usuário'}</strong>
                            </span>
                          </div>
                        )}

                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-black hover:underline">
                            Ver publicação ↗
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Publication Page Modal */}
      <PostDetailView
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        role={role}
      />
    </>
  );
};
