import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PostContent } from '../types';
import { PostApprovalCard } from './PostApprovalCard';
import { PostDetailView } from './PostDetailView';
import { CalendarView } from './CalendarView';
import { HowToApproveGuide } from './HowToApproveGuide';
import { PostChatModal } from './PostChatModal';
import { RequestChangesModal } from './RequestChangesModal';
import { NotificationsDrawer } from './NotificationsDrawer';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar as CalendarIcon, 
  HelpCircle, 
  ArrowLeft, 
  Send, 
  Bell, 
  Sparkles,
  FolderOpen,
  Filter
} from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsapp';

export const ClientPortalView: React.FC = () => {
  const { 
    projects, 
    clients, 
    posts, 
    portalProjectKey, 
    portalMode,
    returnToAgencyView,
    agencyConfig,
    notifications,
    currentUser,
    availableMonths
  } = useApp();

  // Find the exact project matching this exclusive link key
  const currentProject = projects.find(p => p.clientAccessKey === portalProjectKey);
  const client = currentProject ? clients.find(c => c.id === currentProject.clientId) : null;
  const clientProjects = client ? projects.filter(p => p.clientId === client.id) : [];

  // Smooth loading state while initial Firestore snapshot arrives
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentProject && client) {
      setIsLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentProject, client]);

  // Folder filter: allows viewing all client posts or a specific folder
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');

  // Month selector for client view
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // All client posts matching the selected folder or project
  const clientPosts = posts.filter(p => {
    if (selectedFolderId !== 'all') {
      return p.projectId === selectedFolderId;
    }
    if (currentProject && p.projectId === currentProject.id) {
      return true;
    }
    if (client && p.clientId === client.id) {
      return true;
    }
    return false;
  });

  // Filter project posts by selected month
  const filteredProjectPosts = clientPosts.filter(p => {
    if (selectedMonth !== 'all') {
      return p.scheduledDate.startsWith(selectedMonth);
    }
    return true;
  });

  // Distinct main views separated into different parts as requested
  const [mainSection, setMainSection] = useState<'content' | 'calendar' | 'guide'>('content');

  // Sub-status tabs for contents: 'pending', 'changes', 'approved'
  const [contentStatusTab, setContentStatusTab] = useState<'pending' | 'changes' | 'approved'>('pending');

  // Modals / Detail View
  const [detailPost, setDetailPost] = useState<PostContent | null>(null);
  const [chatPost, setChatPost] = useState<PostContent | null>(null);
  const [changesPost, setChangesPost] = useState<PostContent | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pendingPosts = filteredProjectPosts.filter(p => p.status === 'pending_approval');
  const changesPosts = filteredProjectPosts.filter(p => p.status === 'changes_requested');
  const approvedPosts = filteredProjectPosts.filter(p => p.status === 'approved');

  const unreadCount = notifications.filter(n => !n.read && n.recipient === 'client').length;

  // If still loading initial snapshot from Firestore, show friendly loading spinner
  if (isLoading && (!currentProject || !client)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-white tracking-tight">Carregando conteúdos do projeto...</h2>
        <p className="text-xs text-zinc-400 mt-1">Conectando ao banco de dados em tempo real</p>
      </div>
    );
  }

  // Strict check: if project or client was not found after loading timeout, show exclusive not found screen
  if (!currentProject || !client) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto text-xl border border-amber-400/20">
            🔒
          </div>
          <h2 className="text-lg font-bold text-white">Projeto não encontrado</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Este link de acesso exclusivo não corresponde a nenhum projeto ativo ou pode ter sido alterado. Entre em contato com a equipe da agência para solicitar seu link atualizado.
          </p>
          {currentUser && (
            <button
              onClick={returnToAgencyView}
              className="mt-4 px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Voltar ao Painel da Agência
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Banner: EXCLUSIVE TO AGENCY MEMBERS in agency preview mode - Clients NEVER see this */}
      {portalMode === 'agency' && currentUser && (
        <div className="bg-black text-white px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 text-xs shadow-md z-40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>
              <strong>Visualização da Agência:</strong> Você está visualizando o portal do cliente como <strong>{currentUser.name}</strong> ({currentUser.role === 'owner' ? 'Proprietário(a)' : 'Colaborador(a)'}).
            </span>
          </div>
          <button
            onClick={returnToAgencyView}
            className="self-end sm:self-auto px-3.5 py-1.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel da Agência</span>
          </button>
        </div>
      )}

      {/* Main Header with White Label Branding */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand logos */}
          <div className="flex items-center gap-3.5">
            <div 
              className="w-12 h-12 rounded-2xl border-2 shadow-xs flex items-center justify-center overflow-hidden shrink-0"
              style={{ borderColor: client?.brandColor || '#4F46E5', backgroundColor: client?.brandColor || '#4F46E5' }}
            >
              {client?.logo ? (
                <img src={client.logo} alt={client.company} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">
                  {client?.company?.charAt(0).toUpperCase() || 'C'}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 truncate tracking-tight">
                  {client?.company}
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Portal de Aprovação
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                <span>Criado por {agencyConfig.agencyName}</span>
                <span>·</span>
                <span>Gerente: {agencyConfig.accountManagerName}</span>
              </p>
            </div>
          </div>

          {/* Quick Direct Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {agencyConfig.accountManagerPhone && (
              <a
                href={buildWhatsAppUrl(
                  agencyConfig.accountManagerPhone,
                  `Olá ${agencyConfig.accountManagerName}! Estou visualizando o portal de aprovação do projeto ${currentProject?.name} e gostaria de falar com você.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Falar no WhatsApp</span>
              </a>
            )}

            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>

        {/* Separated Main Section Switcher:
            "separe em partes diferentes a visualização de calendário e a parte de como aprovar. Pode tirar aquela parte de documentos."
        */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 border-t border-slate-100">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMainSection('content')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mainSection === 'content'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Posts para Aprovação</span>
              </button>

              <button
                onClick={() => setMainSection('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mainSection === 'calendar'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Calendário Mensal</span>
              </button>

              <button
                onClick={() => setMainSection('guide')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mainSection === 'guide'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Como Aprovar (Tutorial)</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* PARTE 1: POSTS PARA APROVAÇÃO */}
        {mainSection === 'content' && (
          <div className="space-y-6">
            {/* Project Header Info - Solid Pure Black Background */}
            <div 
              className="rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 text-white border border-zinc-800 relative overflow-hidden bg-black"
            >
              <div className="relative z-10">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Portal de Conteúdos
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {currentProject?.name || client?.company}
                </h2>
                <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                  {currentProject?.description || 'Clique em qualquer publicação para conferir a legenda, mídias e aprovar com um clique.'}
                </p>
              </div>

              {/* Progress Summary in high contrast */}
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 w-full md:w-60 shrink-0 text-xs relative z-10 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-zinc-200">Progresso de Aprovação</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {clientPosts.length > 0 ? `${Math.round((approvedPosts.length / clientPosts.length) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                    style={{
                      width: `${clientPosts.length > 0 ? (approvedPosts.length / clientPosts.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-300 mt-2 font-mono">
                  <span className="text-emerald-400 font-bold">{approvedPosts.length}/{clientPosts.length} aprovados</span>
                  <span className="text-amber-300 font-bold">{pendingPosts.length} pendentes</span>
                </div>
              </div>
            </div>

            {/* Folder / Project Filter if multiple folders exist */}
            {clientProjects.length > 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-xs font-bold text-slate-700 shrink-0 flex items-center gap-1.5 pl-1">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                  Pastas:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFolderId('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedFolderId === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas as Pastas ({posts.filter(p => p.clientId === client?.id).length})
                </button>
                {clientProjects.map(proj => {
                  const projCount = posts.filter(p => p.projectId === proj.id).length;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setSelectedFolderId(proj.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedFolderId === proj.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {proj.name} ({projCount})
                    </button>
                  );
                })}
              </div>
            )}

            {/* MONTH SELECTOR FOR CLIENT VIEW:
                "Também adicione uma parte de seleção para essa parte para que eu consiga visualizar as opções: para aprovação, em alteração e aprovados, por mês. Assim, eu seleciono o mês que eu quero e vejo todas as publicações daquele mês."
            */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-800">Filtrar Publicações por Mês:</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedMonth('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedMonth === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos os Meses ({clientPosts.length})
                </button>

                {availableMonths.map(monthStr => {
                  const [y, m] = monthStr.split('-');
                  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                  const label = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                  const count = clientPosts.filter(p => p.scheduledDate.startsWith(monthStr)).length;
                  const isSelected = selectedMonth === monthStr;

                  return (
                    <button
                      key={monthStr}
                      type="button"
                      onClick={() => setSelectedMonth(monthStr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="capitalize">{label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colored Tabs for Content Status:
                REQUIREMENT:
                "Coloque uma cor na guia dos conteúdo para aprovação, em alteração e aprovados.
                 Para aprovação deve ficar em amarelo,
                 Em alteração deve ficar em vermelho
                 e os aprovados devem ficar em verde."
            */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
              {/* Para Aprovação (AMARELO) */}
              <button
                onClick={() => setContentStatusTab('pending')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
                  contentStatusTab === 'pending'
                    ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm ring-2 ring-amber-400/30 font-extrabold'
                    : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Para Aprovação</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                  contentStatusTab === 'pending' ? 'bg-amber-900 text-white' : 'bg-amber-200 text-amber-900'
                }`}>
                  {pendingPosts.length}
                </span>
              </button>

              {/* Em Alteração (VERMELHO) */}
              <button
                onClick={() => setContentStatusTab('changes')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 ${
                  contentStatusTab === 'changes'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-500/30 font-extrabold'
                    : 'bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Em Alteração</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                  contentStatusTab === 'changes' ? 'bg-white text-rose-900 font-bold' : 'bg-rose-200 text-rose-900'
                }`}>
                  {changesPosts.length}
                </span>
              </button>

              {/* Aprovados (VERDE) */}
              <button
                onClick={() => setContentStatusTab('approved')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 ${
                  contentStatusTab === 'approved'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/30 font-extrabold'
                    : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Aprovados</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                  contentStatusTab === 'approved' ? 'bg-white text-emerald-900 font-bold' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {approvedPosts.length}
                </span>
              </button>
            </div>

            {/* Helper notice */}
            <p className="text-xs text-slate-500 italic">
              💡 Toque em qualquer card para abrir a visualização detalhada com o <strong>dia</strong>, a <strong>hora</strong> e a <strong>legenda completa</strong>.
            </p>

            {/* Posts Cards Grid (Visual Preview only, caption shown on detail view click) */}
            <div>
              {contentStatusTab === 'pending' && (
                pendingPosts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 stroke-[1.5]" />
                    <h3 className="text-base font-bold text-slate-900">Nenhum post pendente de aprovação!</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Todos os posts deste projeto foram revisados ou estão sendo produzidos pela agência.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {pendingPosts.map(post => (
                      <PostApprovalCard
                        key={post.id}
                        post={post}
                        role="client"
                        onOpenChat={p => setChatPost(p)}
                        onRequestChanges={p => setChangesPost(p)}
                        onOpenDetail={p => setDetailPost(p)}
                      />
                    ))}
                  </div>
                )
              )}

              {contentStatusTab === 'changes' && (
                changesPosts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                    <CheckCircle2 className="w-12 h-12 text-indigo-400 mx-auto mb-3 stroke-[1.5]" />
                    <h3 className="text-base font-bold text-slate-900">Nenhum post com alterações pendentes</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Quando você solicitar ajustes em qualquer postagem, ela aparecerá aqui para você acompanhar a nova versão.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {changesPosts.map(post => (
                      <PostApprovalCard
                        key={post.id}
                        post={post}
                        role="client"
                        onOpenChat={p => setChatPost(p)}
                        onRequestChanges={p => setChangesPost(p)}
                        onOpenDetail={p => setDetailPost(p)}
                      />
                    ))}
                  </div>
                )
              )}

              {contentStatusTab === 'approved' && (
                approvedPosts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
                    <h3 className="text-base font-bold text-slate-900">Nenhum post aprovado ainda</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Os posts aprovados por você serão listados aqui prontos para publicação nas redes.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {approvedPosts.map(post => (
                      <PostApprovalCard
                        key={post.id}
                        post={post}
                        role="client"
                        onOpenChat={p => setChatPost(p)}
                        onOpenDetail={p => setDetailPost(p)}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* PARTE 2: VISUALIZAÇÃO SEPARADA DE CALENDÁRIO */}
        {mainSection === 'calendar' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">Grade do Calendário Mensal</h2>
              <p className="text-xs text-slate-500">
                Visualize os dias e horários previstos para cada publicação deste projeto. Clique em qualquer post para abrir os detalhes.
              </p>
            </div>
            <CalendarView
              posts={clientPosts}
              onSelectPost={p => setDetailPost(p)}
            />
          </div>
        )}

        {/* PARTE 3: VISUALIZAÇÃO SEPARADA DO GUIA DE COMO APROVAR */}
        {mainSection === 'guide' && (
          <HowToApproveGuide />
        )}
      </main>

      {/* Dedicated Post Detail View (Opens on card click, showing day, hour, full caption, and actions) */}
      <PostDetailView
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onRequestChanges={p => {
          setDetailPost(null);
          setChangesPost(p);
        }}
      />

      {/* Chat Modal */}
      <PostChatModal
        isOpen={!!chatPost}
        onClose={() => setChatPost(null)}
        post={chatPost}
        currentRole="client"
      />

      {/* Request Changes Modal */}
      <RequestChangesModal
        isOpen={!!changesPost}
        onClose={() => setChangesPost(null)}
        post={changesPost}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
};
