import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostContent, FolderProject } from '../types';
import { NotionKanbanCard } from './NotionKanbanCard';
import { PostDetailView } from './PostDetailView';
import { CalendarView } from './CalendarView';
import { ContentUploadModal } from './ContentUploadModal';
import { ProjectFolderModal } from './ProjectFolderModal';
import { ClientManagerModal } from './ClientManagerModal';
import { PostChatModal } from './PostChatModal';
import { 
  ArrowLeft, 
  Folder, 
  FolderPlus, 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  Send, 
  Phone, 
  Mail, 
  Edit3, 
  Edit2,
  Trash2,
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  KanbanSquare,
  Filter,
  MessageCircle
} from 'lucide-react';
import { buildWhatsAppUrl, createNewContentWhatsAppMessage } from '../utils/whatsapp';

export const ClientDetailPage: React.FC = () => {
  const {
    selectedClientId,
    selectedClient,
    clients,
    projects,
    deleteProject,
    selectedProjectId,
    setSelectedProjectId,
    posts,
    openHome,
    openClientPortalByProject,
    agencyConfig,
    addToast,
    availableMonths
  } = useApp();

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostContent | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<FolderProject | null>(null);
  const [editingClientOpen, setEditingClientOpen] = useState(false);
  const [chatPost, setChatPost] = useState<PostContent | null>(null);
  const [detailPost, setDetailPost] = useState<PostContent | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const client = selectedClient || clients[0];
  const clientProjects = projects.filter(p => p.clientId === client?.id);

  // Active project folder or all client posts
  const activeProject = clientProjects.find(p => p.id === selectedProjectId) || clientProjects[0];

  const clientPosts = posts.filter(p => {
    if (activeProject) return p.projectId === activeProject.id;
    return p.clientId === client?.id;
  });

  // Filter posts by selected month if active
  const filteredClientPosts = clientPosts.filter(p => {
    if (selectedMonth !== 'all') {
      return p.scheduledDate.startsWith(selectedMonth);
    }
    return true;
  });

  // Kanban status groups filtered by month
  const pendingPosts = filteredClientPosts.filter(p => p.status === 'pending_approval');
  const changesPosts = filteredClientPosts.filter(p => p.status === 'changes_requested');
  const approvedPosts = filteredClientPosts.filter(p => p.status === 'approved');

  const handleCopyLink = (projectKey: string) => {
    const link = `${window.location.origin}${window.location.pathname}?view=portal&project=${projectKey}`;
    navigator.clipboard.writeText(link);
    setCopiedKey(projectKey);
    addToast('success', 'Link Exclusivo Copiado!', 'Link direto para aprovação do cliente.');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendProjectWhatsApp = (proj?: FolderProject | null) => {
    const targetProj = proj || activeProject;
    if (!targetProj) {
      addToast('warning', 'Nenhum Projeto Encontrado', 'Crie ou selecione um projeto primeiro.');
      return;
    }
    const portalLink = `${window.location.origin}${window.location.pathname}?view=portal&project=${targetProj.clientAccessKey}&mode=client`;
    const message = `Ei pessoal, segue o link do calendário editorial com as publicações para aprovação:\n\n${portalLink}`;
    const phone = client?.phone || '';
    try {
      if (phone) {
        window.open(buildWhatsAppUrl(phone, message), '_blank');
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      }
      addToast('success', 'WhatsApp Aberto!', 'Mensagem com link do projeto gerada com sucesso.');
    } catch (e) {
      console.warn('Erro ao abrir WhatsApp:', e);
    }
  };

  const handleSendWhatsAppNotification = (post: PostContent) => {
    if (!client?.phone || !activeProject) return;
    const approvalLink = `${window.location.origin}/?view=portal&project=${activeProject.clientAccessKey}`;
    const dateFormatted = new Date(post.scheduledDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const msg = createNewContentWhatsAppMessage({
      clientName: client.name,
      projectName: activeProject.name,
      postTitle: post.title,
      approvalLink,
      agencyName: agencyConfig.agencyName,
      scheduledDateFormatted: dateFormatted,
    });

    window.open(buildWhatsAppUrl(client.phone, msg), '_blank');
  };

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Cliente não encontrado.</p>
        <button onClick={openHome} className="mt-2 text-xs font-semibold text-indigo-600 underline">
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={openHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Tela Inicial (Todos os Clientes)</span>
        </button>

        <span className="text-xs text-slate-400 font-medium">Painel da Agência</span>
      </div>

      {/* Client Profile Header Banner - Dark Background ("mais puxado para o preto") with high contrast */}
      <div 
        className="rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 text-white border border-white/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #070a11 0%, #0d121f 50%, #070a11 100%)',
        }}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl overflow-hidden shrink-0 shadow-lg border-2 border-white/20"
            style={{ backgroundColor: client.brandColor }}
          >
            {client.logo ? (
              <img src={client.logo} alt={client.company} className="w-full h-full object-cover" />
            ) : (
              client.company.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {client.company}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15 backdrop-blur-xs">
                {client.niche}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
              <span>Responsável: <strong className="text-white">{client.name}</strong></span>
              {client.email && <span>· E-mail: {client.email}</span>}
              <span>· WhatsApp: {client.phone}</span>
            </p>
          </div>
        </div>

        {/* Client quick actions */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          {client.phone && (
            <a
              href={buildWhatsAppUrl(client.phone, `Olá ${client.name}! Equipe ${agencyConfig.agencyName} falando.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp do Cliente</span>
            </a>
          )}

          <button
            onClick={() => setEditingClientOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-300" />
            <span>Editar Cliente</span>
          </button>
        </div>
      </div>

      {/* COMPACT SECTION: "Projetos"
          "Na parte de pastas de projetos, mude o nome para 'Projetos' e deixe a visualização menor também."
      */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-bold text-slate-900">
              Projetos ({clientProjects.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-normal">
              Selecione para filtrar os conteúdos
            </span>
          </div>

          <button
            onClick={() => {
              setEditingProject(null);
              setProjectModalOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-semibold text-brand bg-brand-light hover:opacity-80 border border-brand-light rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Novo Projeto</span>
          </button>
        </div>

        {/* Compact Projects Grid / Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {clientProjects.map(proj => {
            const isSelected = activeProject?.id === proj.id;
            const projPosts = posts.filter(p => p.projectId === proj.id);

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-xs ${
                  isSelected
                    ? 'border-brand bg-brand-light ring-1 ring-brand shadow-2xs'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                    <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-slate-400'}`} />
                    <span className="truncate">{proj.name}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white border border-slate-200 shrink-0">
                      {projPosts.length}
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingProject(proj);
                        setProjectModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-200/60 transition-colors"
                      title="Editar projeto"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Deseja excluir o projeto "${proj.name}"? Todos os posts desta pasta serão excluídos.`)) {
                          deleteProject(proj.id);
                          addToast('info', 'Projeto excluído', `A pasta "${proj.name}" foi removida.`);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      title="Excluir projeto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleCopyLink(proj.clientAccessKey);
                      }}
                      className="font-semibold text-slate-500 hover:text-black p-1 rounded hover:bg-slate-200/60 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copiar link exclusivo do cliente"
                    >
                      {copiedKey === proj.clientAccessKey ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === proj.clientAccessKey ? 'Copiado!' : 'Copiar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleSendProjectWhatsApp(proj);
                      }}
                      className="font-bold text-emerald-700 hover:text-emerald-900 px-1.5 py-0.5 rounded hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Enviar link do projeto no WhatsApp com mensagem pré-configurada"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        openClientPortalByProject(proj.clientAccessKey, 'client');
                      }}
                      className="font-bold text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded hover:bg-slate-200/60 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Visualização do Cliente (sem acesso ao painel da agência)"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Link</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      openClientPortalByProject(proj.clientAccessKey, 'agency');
                    }}
                    className="font-bold text-slate-700 hover:text-black px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Visualização da Agência (com opção de voltar ao painel)"
                  >
                    <span>Ver</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WORKFLOW HEADER: Kanban Title, Month Selector & Insert Content Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <KanbanSquare className="w-5 h-5 text-brand" />
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Quadro Kanban de Aprovação (Estilo Notion)
              </h2>
              <p className="text-xs text-slate-500">
                Demandas organizadas por status com data e horário empilhados, sem prévia de mídia.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {activeProject && (
              <button
                type="button"
                onClick={() => handleSendProjectWhatsApp(activeProject)}
                className="px-3.5 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                title="Enviar link deste projeto no WhatsApp com mensagem pré-configurada"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">WhatsApp do Projeto</span>
                <span className="sm:hidden">WhatsApp</span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingPost(null);
                setContentModalOpen(true);
              }}
              style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
              className="px-4 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Conteúdo</span>
            </button>
          </div>
        </div>

        {/* MONTH SELECTOR:
            "Também adicione uma parte de seleção para essa parte para que eu consiga visualizar as opções: para aprovação, em alteração e aprovados, por mês. Assim, eu seleciono o mês que eu quero e vejo todas as publicações daquele mês."
        */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Filtrar Demandas por Mês:</span>
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
                  <CalendarIcon className="w-3 h-3 opacity-70" />
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
      </div>

      {/* SECTION 1: KANBAN POR STATUS ESTILO NOTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* COLUNA 1: PARA APROVAÇÃO (Amarelo) */}
        <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/90 flex flex-col space-y-3 min-h-[460px]">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-amber-300 bg-amber-50 -mx-4 -mt-4 p-3.5 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                Para Aprovação
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400 text-amber-950 border border-amber-500">
              {pendingPosts.length}
            </span>
          </div>

          {/* Column cards list - Notion Style */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-0.5">
            {pendingPosts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Nenhum post aguardando aprovação
              </div>
            ) : (
              pendingPosts.map(post => (
                <NotionKanbanCard
                  key={post.id}
                  post={post}
                  role="agency"
                  onOpenDetail={p => setDetailPost(p)}
                  onOpenChat={p => setChatPost(p)}
                  onSendWhatsApp={client.phone ? handleSendWhatsAppNotification : undefined}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUNA 2: EM ALTERAÇÃO (Vermelho) */}
        <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/90 flex flex-col space-y-3 min-h-[460px]">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-rose-300 bg-rose-50 -mx-4 -mt-4 p-3.5 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-xs font-extrabold text-rose-950 uppercase tracking-wider">
                Em Alteração
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-600 text-white border border-rose-700">
              {changesPosts.length}
            </span>
          </div>

          {/* Column cards list - Notion Style */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-0.5">
            {changesPosts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Nenhum post em alteração
              </div>
            ) : (
              changesPosts.map(post => (
                <NotionKanbanCard
                  key={post.id}
                  post={post}
                  role="agency"
                  onOpenDetail={p => setDetailPost(p)}
                  onOpenChat={p => setChatPost(p)}
                  onSendWhatsApp={client.phone ? handleSendWhatsAppNotification : undefined}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUNA 3: APROVADOS (Verde) */}
        <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/90 flex flex-col space-y-3 min-h-[460px]">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-emerald-300 bg-emerald-50 -mx-4 -mt-4 p-3.5 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                Aprovados
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-600 text-white border border-emerald-700">
              {approvedPosts.length}
            </span>
          </div>

          {/* Column cards list - Notion Style */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-0.5">
            {approvedPosts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Nenhum post aprovado ainda
              </div>
            ) : (
              approvedPosts.map(post => (
                <NotionKanbanCard
                  key={post.id}
                  post={post}
                  role="agency"
                  onOpenDetail={p => setDetailPost(p)}
                  onOpenChat={p => setChatPost(p)}
                  onSendWhatsApp={client.phone ? handleSendWhatsAppNotification : undefined}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: CALENDÁRIO DO CLIENTE ABAIXO DO KANBAN:
          "e abaixo desse kanban deixe a visualização do calendário."
      */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-brand" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Calendário Mensal de Publicações de {client.company}
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhe o cronograma de agendamentos no mês. Clique em qualquer prévia para abrir a página completa da publicação.
              </p>
            </div>
          </div>
        </div>

        {/* Calendar View directly visible below the Kanban: opens publication page on click */}
        <CalendarView
          posts={clientPosts}
          onSelectPost={p => setDetailPost(p)}
        />
      </div>

      {/* Publication Page Modal (Full Media 1080x1350/9:16, Day, Hour, Caption, Comments & Agency controls) */}
      <PostDetailView
        post={detailPost}
        onClose={() => setDetailPost(null)}
        role="agency"
        onEditPost={p => {
          setDetailPost(null);
          setEditingPost(p);
          setContentModalOpen(true);
        }}
      />

      {/* Modals */}
      <ContentUploadModal
        isOpen={contentModalOpen}
        onClose={() => {
          setContentModalOpen(false);
          setEditingPost(null);
        }}
        postToEdit={editingPost}
      />

      <ProjectFolderModal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        projectToEdit={editingProject}
      />

      <ClientManagerModal
        isOpen={editingClientOpen}
        onClose={() => setEditingClientOpen(false)}
        clientToEdit={client}
      />

      <PostChatModal
        isOpen={!!chatPost}
        onClose={() => setChatPost(null)}
        post={chatPost}
        currentRole="agency"
      />
    </div>
  );
};
