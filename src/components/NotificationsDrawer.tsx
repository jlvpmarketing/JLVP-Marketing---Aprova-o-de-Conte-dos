import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { requestPushPermission } from '../utils/notifications';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';

import { PostDetailView } from './PostDetailView';
import { PostContent, NotificationItem } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markNotificationsAsRead, 
    clearNotifications,
    addToast,
    posts,
    openClientDetailPage
  } = useApp();

  const [selectedPost, setSelectedPost] = useState<PostContent | null>(null);

  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, [isOpen]);

  const handleRequestPush = async () => {
    const res = await requestPushPermission();
    setPushStatus(res);
    if (res === 'granted') {
      addToast('success', 'Push Ativado', 'Você receberá notificações instantâneas no navegador!');
    } else {
      addToast('warning', 'Push Não Autorizado', 'As notificações do navegador foram bloqueadas ou recusadas.');
    }
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

    if (notif.clientId) {
      openClientDetailPage(notif.clientId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
        <div 
          className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center text-brand">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Notificações em Tempo Real</h3>
                <p className="text-xs text-slate-500">{notifications.length} registros no histórico</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Push status bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-medium">Notificações Push:</span>
              {pushStatus === 'granted' ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativadas
                </span>
              ) : pushStatus === 'denied' ? (
                <span className="text-rose-600 font-medium">Bloqueadas</span>
              ) : (
                <span className="text-amber-600 font-medium">Desativadas</span>
              )}
            </div>
            {pushStatus !== 'granted' && (
              <button
                onClick={handleRequestPush}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-md transition-colors"
              >
                Ativar Push
              </button>
            )}
          </div>

          {/* Action bar */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => markNotificationsAsRead()}
              className="flex items-center gap-1.5 hover:text-brand transition-colors font-medium cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar lidas
            </button>
            <button
              onClick={clearNotifications}
              className="flex items-center gap-1.5 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar tudo
            </button>
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Bell className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300" />
                <p className="text-sm font-medium text-slate-700">Tudo calmo por aqui</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  As aprovações de clientes, pedidos de alteração e novos comentários aparecerão aqui instantaneamente.
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                let Icon = Bell;
                let iconBg = 'bg-slate-100 text-slate-600';

                if (notif.type === 'approval') {
                  Icon = CheckCircle2;
                  iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                } else if (notif.type === 'changes') {
                  Icon = AlertTriangle;
                  iconBg = 'bg-amber-50 text-amber-600 border border-amber-100';
                } else if (notif.type === 'comment') {
                  Icon = MessageSquare;
                  iconBg = 'bg-blue-50 text-blue-600 border border-blue-100';
                } else if (notif.type === 'new_content') {
                  Icon = Clock;
                  iconBg = 'bg-brand-light text-brand border border-brand-light';
                }

                const timeStr = new Date(notif.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:border-brand ${
                      notif.read ? 'bg-white border-slate-200/70' : 'bg-brand-light border-brand-light shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{timeStr}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-brand hover:underline">
                            Ver publicação ↗
                          </span>

                          {notif.targetPhone && (
                            <a
                              href={buildWhatsAppUrl(notif.targetPhone, `*Notificação AprovaFlow*\n${notif.title}\n${notif.message}`)}
                              onClick={e => e.stopPropagation()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline"
                            >
                              <Send className="w-3 h-3" />
                              WhatsApp
                            </a>
                          )}
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
        role="agency"
      />
    </>
  );
};
