import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Client, PostContent, NotificationItem } from '../types';
import { CalendarView } from './CalendarView';
import { PostDetailView } from './PostDetailView';
import { ContentUploadModal } from './ContentUploadModal';
import { getContentTypeInfo } from '../utils/contentTypeHelper';
import { 
  Users, 
  Bell, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Plus, 
  FolderKanban, 
  CheckCheck, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
  Edit2,
  Check,
  CheckSquare,
  Square,
  ChevronDown
} from 'lucide-react';
import { NotificationsDrawer } from './NotificationsDrawer';

interface HomeOverviewProps {
  onOpenNewClient: () => void;
  onOpenNewPost: () => void;
  onOpenEditClient?: (client: Client) => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({ 
  onOpenNewClient, 
  onOpenNewPost,
  onOpenEditClient
}) => {
  const {
    agencyConfig,
    clients,
    deleteClient,
    projects,
    posts,
    notifications,
    markNotificationsAsRead,
    markMultipleNotificationsAsRead,
    clearNotifications,
    openClientDetailPage,
    openClientPortalByProject,
    currentUser,
    addToast,
    selectedMonthFilter,
    setSelectedMonthFilter,
    availableMonths
  } = useApp();

  // Modals & Publication Page
  const [selectedPostDetail, setSelectedPostDetail] = useState<PostContent | null>(null);
  const [editingPost, setEditingPost] = useState<PostContent | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [filterNotifs, setFilterNotifs] = useState<'all' | 'unread'>('all');
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);
  
  // Interactive KPI Filter State
  const [activeKpiFilter, setActiveKpiFilter] = useState<'none' | 'pending' | 'changes' | 'approved'>('none');

  // Active clients & projects filter - ignore any posts from deleted clients or projects
  const activeClientIds = new Set(clients.map(c => c.id));
  const activeProjectIds = new Set(projects.map(p => p.id));
  const activePosts = posts.filter(p => activeClientIds.has(p.clientId) && activeProjectIds.has(p.projectId));

  // Month-filtered posts across active clients
  const monthFilteredPosts = activePosts.filter(p => {
    if (selectedMonthFilter !== 'all') {
      return p.scheduledDate && p.scheduledDate.startsWith(selectedMonthFilter);
    }
    return true;
  });

  // Global KPIs across active clients (filtered by month)
  const pendingPosts = monthFilteredPosts.filter(p => p.status === 'pending_approval');
  const changesPosts = monthFilteredPosts.filter(p => p.status === 'changes_requested');
  const approvedPosts = monthFilteredPosts.filter(p => p.status === 'approved');

  const displayedNotifications = filterNotifs === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Single notification mark as read
  const handleToggleSingleRead = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    markNotificationsAsRead(notifId);
    addToast('success', 'Notificação atualizada', 'Marcada como lida com sucesso.');
  };

  // Toggle notification selection
  const handleToggleSelectNotif = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    setSelectedNotifIds(prev => 
      prev.includes(notifId) ? prev.filter(id => id !== notifId) : [...prev, notifId]
    );
  };

  const handleSelectAllDisplayed = () => {
    if (selectedNotifIds.length === displayedNotifications.length) {
      setSelectedNotifIds([]);
    } else {
      setSelectedNotifIds(displayedNotifications.map(n => n.id));
    }
  };

  const handleMarkSelectedAsRead = () => {
    if (selectedNotifIds.length === 0) return;
    markMultipleNotificationsAsRead(selectedNotifIds);
    addToast('success', 'Notificações concluídas', `${selectedNotifIds.length} notificações marcadas como lidas.`);
    setSelectedNotifIds([]);
  };

  // Notification click handler: opens the publication page directly
  const handleNotificationClick = (notif: NotificationItem) => {
    markNotificationsAsRead(notif.id);

    if (notif.postId) {
      const found = posts.find(p => p.id === notif.postId);
      if (found) {
        setSelectedPostDetail(found);
        return;
      }
    }

    // Fallback: match by title inside message
    const matched = posts.find(p => notif.message.includes(p.title) || notif.title.includes(p.title));
    if (matched) {
      setSelectedPostDetail(matched);
      return;
    }

    // Fallback: navigate to client page
    if (notif.clientId) {
      openClientDetailPage(notif.clientId);
    }
  };

  const getFilteredKpiPosts = () => {
    if (activeKpiFilter === 'pending') return pendingPosts;
    if (activeKpiFilter === 'changes') return changesPosts;
    if (activeKpiFilter === 'approved') return approvedPosts;
    return [];
  };

  const filteredKpiList = getFilteredKpiPosts();

  const greetingName = currentUser?.name || agencyConfig.accountManagerName || 'Paloma Garcia';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Agency KPI Header - Solid Pure Black #000000, no degradê */}
      <div 
        className="rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-300 bg-black border border-zinc-800"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 max-w-2xl">
            {/* Agency Profile Image: fills space completely */}
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-white/20 flex items-center justify-center bg-black"
            >
              {agencyConfig.agencyLogo ? (
                <img 
                  src={agencyConfig.agencyLogo} 
                  alt={agencyConfig.agencyName} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <ShieldCheck className="w-8 h-8 text-white" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/90 border border-white/15 backdrop-blur-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Painel Central da Agência
                </span>
                <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                  {agencyConfig.agencyName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Olá, {greetingName}!
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm mt-0.5 leading-relaxed">
                Acompanhe clientes, cronograma de postagens e aprovações em tempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Bell Notifications Button */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2.5 text-white hover:text-amber-400 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              title="Notificações do Sistema"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-black">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenNewClient}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>Novo Cliente</span>
            </button>
            <button
              onClick={onOpenNewPost}
              style={{ backgroundColor: agencyConfig?.primaryColor || '#000000', border: '1px solid rgba(255,255,255,0.2)' }}
              className="px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Conteúdo</span>
            </button>
          </div>
        </div>

        {/* Month Selector Dropdown for Agency Dashboard */}
        <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-400 font-bold">Mês de Referência:</span>
            <span className="text-zinc-400 text-[11px]">Filtre as métricas e posts por mês</span>
          </div>

          <div className="relative min-w-[220px]">
            <select
              value={selectedMonthFilter}
              onChange={e => setSelectedMonthFilter(e.target.value)}
              className="w-full appearance-none bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white text-xs font-bold py-2.5 pl-4 pr-10 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-inner"
            >
              <option value="all" className="bg-zinc-950 text-white">
                Todos os Meses ({posts.length} posts)
              </option>
              {availableMonths.map(monthStr => {
                const [y, m] = monthStr.split('-');
                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                const count = posts.filter(p => p.scheduledDate.startsWith(monthStr)).length;
                return (
                  <option key={monthStr} value={monthStr} className="bg-zinc-950 text-white">
                    {label.charAt(0).toUpperCase() + label.slice(1)} ({count} posts)
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
              <ChevronDown className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Global KPI Interactive Clickable Stats Row with user exact colors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {/* Card 1: Total de Clientes */}
          <button
            type="button"
            onClick={() => {
              setActiveKpiFilter('none');
              document.getElementById('todos-os-clientes-section')?.scrollIntoView({ behavior: 'smooth' });
              addToast('info', 'Todos os Clientes', 'Visualizando a lista completa de clientes cadastrados.');
            }}
            className="bg-zinc-900 hover:bg-zinc-800 active:scale-95 rounded-2xl p-3.5 border border-zinc-800 text-left transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block group-hover:text-white transition-colors">
                Total de Clientes
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {clients.length}
            </span>
            <span className="text-[10px] text-zinc-400 mt-0.5 block flex items-center justify-between">
              <span>Ativos</span>
              <span className="underline opacity-75 group-hover:opacity-100">Ver clientes ↓</span>
            </span>
          </button>

          {/* Card 2: Para Aprovação (background-color: #56530c) */}
          <button
            type="button"
            style={{ backgroundColor: '#56530c' }}
            onClick={() => setActiveKpiFilter(prev => prev === 'pending' ? 'none' : 'pending')}
            className={`rounded-2xl p-3.5 border text-left transition-all cursor-pointer active:scale-95 group shadow-2xs ${
              activeKpiFilter === 'pending'
                ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-md'
                : 'border-yellow-900/60 hover:brightness-110'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-yellow-200 uppercase tracking-wider block">
                Para Aprovação
              </span>
              <Clock className="w-3.5 h-3.5 text-yellow-300" />
            </div>
            <span className="text-2xl font-bold font-mono text-yellow-200 mt-1 block">
              {pendingPosts.length}
            </span>
            <span className="text-[10px] text-yellow-200/80 mt-0.5 block flex items-center justify-between">
              <span>Aguardando</span>
              <span className="underline opacity-75 group-hover:opacity-100">
                {activeKpiFilter === 'pending' ? 'Ocultar' : 'Ver posts'}
              </span>
            </span>
          </button>

          {/* Card 3: Em Alteração (background-color: #6d0909) */}
          <button
            type="button"
            style={{ backgroundColor: '#6d0909' }}
            onClick={() => setActiveKpiFilter(prev => prev === 'changes' ? 'none' : 'changes')}
            className={`rounded-2xl p-3.5 border text-left transition-all cursor-pointer active:scale-95 group shadow-2xs ${
              activeKpiFilter === 'changes'
                ? 'border-rose-400 ring-2 ring-rose-400 shadow-md'
                : 'border-rose-900/60 hover:brightness-110'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-200 uppercase tracking-wider block">
                Em Alteração
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
            </div>
            <span className="text-2xl font-bold font-mono text-rose-200 mt-1 block">
              {changesPosts.length}
            </span>
            <span className="text-[10px] text-rose-200/80 mt-0.5 block flex items-center justify-between">
              <span>Ajustes pedidos</span>
              <span className="underline opacity-75 group-hover:opacity-100">
                {activeKpiFilter === 'changes' ? 'Ocultar' : 'Ver posts'}
              </span>
            </span>
          </button>

          {/* Card 4: Aprovados (background-color: #1a581a) */}
          <button
            type="button"
            style={{ backgroundColor: '#1a581a' }}
            onClick={() => setActiveKpiFilter(prev => prev === 'approved' ? 'none' : 'approved')}
            className={`rounded-2xl p-3.5 border text-left transition-all cursor-pointer active:scale-95 group shadow-2xs ${
              activeKpiFilter === 'approved'
                ? 'border-emerald-400 ring-2 ring-emerald-400 shadow-md'
                : 'border-emerald-900/60 hover:brightness-110'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider block">
                Aprovados
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <span className="text-2xl font-bold font-mono text-emerald-200 mt-1 block">
              {approvedPosts.length}
            </span>
            <span className="text-[10px] text-emerald-200/80 mt-0.5 block flex items-center justify-between">
              <span>Prontos</span>
              <span className="underline opacity-75 group-hover:opacity-100">
                {activeKpiFilter === 'approved' ? 'Ocultar' : 'Ver posts'}
              </span>
            </span>
          </button>
        </div>

        {/* EXPANDABLE POSTS LIST WHEN A KPI CARD IS CLICKED */}
        {activeKpiFilter !== 'none' && (
          <div className="mt-5 pt-5 border-t border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <h3 className="text-sm font-bold text-white">
                  {activeKpiFilter === 'pending' && `Publicações Para Aprovação (${pendingPosts.length})`}
                  {activeKpiFilter === 'changes' && `Publicações Em Alteração (${changesPosts.length})`}
                  {activeKpiFilter === 'approved' && `Publicações Aprovadas (${approvedPosts.length})`}
                </h3>
                <span className="text-[11px] text-zinc-400">
                  — Clique em qualquer card para ver a página da publicação
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveKpiFilter('none')}
                className="text-xs text-white/80 hover:text-white flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fechar</span>
              </button>
            </div>

            {filteredKpiList.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs">
                Nenhum post com este status no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredKpiList.map(post => {
                  const client = clients.find(c => c.id === post.clientId);
                  const contentInfo = getContentTypeInfo(post);
                  const scheduledDateObj = new Date(post.scheduledDate);
                  const formattedScheduled = isNaN(scheduledDateObj.getTime())
                    ? 'Data a definir'
                    : scheduledDateObj.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPostDetail(post)}
                      className="bg-white text-slate-900 rounded-xl p-3 border border-slate-200 hover:border-black hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {contentInfo.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {formattedScheduled}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-black transition-colors">
                          {post.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cliente: <strong>{client?.company || 'Cliente'}</strong>
                        </p>

                        {post.requestedChangesNote && (
                          <div className="mt-2 p-1.5 bg-rose-50 rounded-lg border border-rose-200 text-[10px] text-rose-800 line-clamp-2">
                            <strong>Ajuste:</strong> {post.requestedChangesNote}
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {post.mediaType === 'drive_video' ? 'Vídeo Drive' : `${post.mediaUrls.length} imagem(ns)`}
                        </span>
                        <span className="font-semibold text-slate-900 flex items-center gap-1 group-hover:underline">
                          <span>Ver publicação</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1: CLIENTES */}
      <section id="todos-os-clientes-section" className="space-y-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs"
              style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Clientes</h2>
              <p className="text-xs text-slate-500">Clique em qualquer card para abrir diretamente a página do cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono">
              {clients.length} cadastrados
            </span>
            <button
              type="button"
              onClick={onOpenNewClient}
              style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
              className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Cliente</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map(client => {
            const clientProjects = projects.filter(p => p.clientId === client.id);
            const clientPosts = posts.filter(p => p.clientId === client.id);
            const clientPending = clientPosts.filter(p => p.status === 'pending_approval').length;
            const clientChanges = clientPosts.filter(p => p.status === 'changes_requested').length;
            const clientApproved = clientPosts.filter(p => p.status === 'approved').length;

            return (
              <div
                key={client.id}
                onClick={() => openClientDetailPage(client.id)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-black p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer relative"
              >
                <div>
                  {/* Client card header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base overflow-hidden shrink-0 shadow-2xs"
                        style={{ backgroundColor: client.brandColor || '#000000' }}
                      >
                        {client.logo ? (
                          <img src={client.logo} alt={client.company} className="w-full h-full object-cover" />
                        ) : (
                          client.company.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm leading-tight truncate group-hover:text-black">
                          {client.company}
                        </h3>
                        <span className="text-xs text-slate-500 block truncate">{client.name}</span>
                        {client.assignedManagerNames && client.assignedManagerNames.length > 0 ? (
                          <span className="text-[10px] text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5 truncate max-w-[200px]" title={client.assignedManagerNames.join(', ')}>
                            Resp: {client.assignedManagerNames.join(', ')}
                          </span>
                        ) : client.assignedManagerName ? (
                          <span className="text-[10px] text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                            Resp: {client.assignedManagerName}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Quick Edit and Delete buttons for Client */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          if (onOpenEditClient) {
                            onOpenEditClient(client);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Deseja realmente excluir o cliente "${client.company}"?`)) {
                            deleteClient(client.id);
                            addToast('info', 'Cliente Excluído', `${client.company} foi removido.`);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Client Status Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-center my-3">
                    <div>
                      <span className="text-[10px] text-amber-700 font-semibold block">Pendentes</span>
                      <span className="text-sm font-bold font-mono text-amber-900">{clientPending}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-700 font-semibold block">Alteração</span>
                      <span className="text-sm font-bold font-mono text-rose-900">{clientChanges}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 font-semibold block">Aprovados</span>
                      <span className="text-sm font-bold font-mono text-emerald-900">{clientApproved}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="w-3.5 h-3.5 text-slate-600" />
                      {clientProjects.length} pastas de projeto
                    </span>
                    {client.whatsappGroupLink && (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Grupo Configurado
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Action: Go to Client's separate page */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <div className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs group-hover:bg-zinc-800">
                    <span>Acessar Painel do Cliente</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {clientProjects[0] && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        openClientPortalByProject(clientProjects[0].clientAccessKey);
                      }}
                      className="p-2 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Abrir Link de Aprovação do Cliente"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: CALENDÁRIO COM AS PUBLICAÇÕES DE TODOS OS CLIENTES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
            >
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Calendário Geral de Publicações</h2>
              <p className="text-xs text-slate-500">
                Visualização unificada de todos os posts agendados. Toque na prévia de qualquer post para abrir a página completa da publicação.
              </p>
            </div>
          </div>
        </div>

        {/* Global Calendar View: Clicking post preview OPENS Publication Page (PostDetailView) */}
        <CalendarView
          posts={activePosts}
          onSelectPost={p => setSelectedPostDetail(p)}
        />
      </section>

      {/* Publication Page Modal (Full Media 1080x1350/9:16, Day, Hour, Caption, Comments & Agency controls) */}
      <PostDetailView
        post={selectedPostDetail}
        onClose={() => setSelectedPostDetail(null)}
        role="agency"
        onEditPost={p => {
          setSelectedPostDetail(null);
          setEditingPost(p);
        }}
      />

      {/* Edit Content Modal if triggered from publication page */}
      <ContentUploadModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        postToEdit={editingPost}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Notificações da Agência"
        role="agency"
      />
    </div>
  );
};
