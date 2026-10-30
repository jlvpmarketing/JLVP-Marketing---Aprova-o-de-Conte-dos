import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostContent, FolderProject } from '../types';
import { NotionKanbanCard } from './NotionKanbanCard';
import { PostDetailView } from './PostDetailView';
import { CalendarView } from './CalendarView';
import { ProjectFolderModal } from './ProjectFolderModal';
import { ClientManagerModal } from './ClientManagerModal';
import { PostChatModal } from './PostChatModal';
import { GeneralClientChatModal } from './GeneralClientChatModal';
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
  MessageCircle,
  MessageSquare
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
    availableMonths,
    openNewPostModal,
    openEditPostModal
  } = useApp();

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<FolderProject | null>(null);
  const [editingClientOpen, setEditingClientOpen] = useState(false);
  const [chatPost, setChatPost] = useState<PostContent | null>(null);
  const [detailPost, setDetailPost] = useState<PostContent | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [clientChatOpen, setClientChatOpen] = useState(false);

  const client = selectedClient || clients[0];
  const clientProjects = projects.filter(p => p.clientId === client?.id);

  // Active project folder or all client posts
  const isViewingAll = selectedProjectId === 'all';
  const activeProject = isViewingAll ? null : (clientProjects.find(p => p.id === selectedProjectId) || clientProjects[0]);

  const clientPosts = posts.filter(p => {
    if (p.clientId !== client?.id) return false;
    if (activeProject) return p.projectId === activeProject.id;
    return true;
  });

  // Kanban status groups (without month filter as requested)
  const pendingPosts = clientPosts.filter(p => p.status === 'pending_approval');
  const changesPosts = clientPosts.filter(p => p.status === 'changes_requested');
  const approvedPosts = clientPosts.filter(p => p.status === 'approved');

  const handleCopyLink = (projectKey: string) => {
    const link = `${window.location.origin}${window.location.pathname}?view=portal&project=${projectKey}`;
    navigator.clipboard.writeText(link);
    setCopiedKey(projectKey);
    addToast('success', 'Link Exclusivo Copiado!', 'Link direto para aprovação do cliente.');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // THE ONLY WHATSAPP ACTION ON CLIENT PAGE:
  // Sends the project approval link directly into the client's WhatsApp group
  const handleSendProjectToWhatsAppGroup = () => {
    if (!activeProject) {
      addToast('warning', 'Nenhum Projeto Selecionado', 'Crie ou selecione uma pasta de projeto primeiro.');
      return;
    }
    const portalLink = `${window.location.origin}${window.location.pathname}?view=portal&project=${activeProject.clientAccessKey}&mode=client`;
    const message = `Ei pessoal, segue o link do calendário editorial com as publicações para aprovação:\n\n${portalLink}`;

    try {
      navigator.clipboard.writeText(message);
    } catch {
      // ignore
    }

    if (client?.whatsappGroupLink && client.whatsappGroupLink.trim()) {
      let groupUrl = client.whatsappGroupLink.trim();
      if (!groupUrl.startsWith('http://') && !groupUrl.startsWith('https://')) {
        groupUrl = `https://${groupUrl}`;
      }
      window.open(groupUrl, '_blank');
      addToast('success', 'Mensagem Copiada & Abrindo Grupo!', 'Mensagem com o link do projeto copiada! Basta colar no grupo do WhatsApp.');
    } else {
      addToast('info', 'Link do Projeto Copiado!', 'Cadastre o link do grupo do WhatsApp nas configurações do cliente para abrir o grupo diretamente com 1 clique.');
      setEditingClientOpen(true);
    }
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
              {client.assignedManagerNames && client.assignedManagerNames.length > 0 ? (
                <span>Equipe Responsável: <strong className="text-white">{client.assignedManagerNames.join(', ')}</strong></span>
              ) : client.assignedManagerName ? (
                <span>Equipe Responsável: <strong className="text-white">{client.assignedManagerName}</strong></span>
              ) : null}
              {client.whatsappGroupLink && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Grupo de WhatsApp Configurado
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Client quick actions */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => setClientChatOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Chat com o Cliente</span>
          </button>

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
          {clientProjects.length > 1 && (
            <div
              onClick={() => setSelectedProjectId('all')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-xs ${
                isViewingAll
                  ? 'border-brand bg-brand-light ring-1 ring-brand shadow-2xs font-bold'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                  <Folder className={`w-3.5 h-3.5 ${isViewingAll ? 'text-black' : 'text-slate-400'}`} />
                  <span className="truncate">Todos os Projetos</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white border border-slate-200 shrink-0 font-bold">
                  {posts.filter(p => p.clientId === client?.id).length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Ver todas as demandas</span>
            </div>
          )}

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

      {/* WORKFLOW HEADER: Kanban Title & Actions (Single WhatsApp Group Button) */}
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

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {activeProject && (
              <button
                type="button"
                onClick={handleSendProjectToWhatsAppGroup}
                className="px-4 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                title="Enviar link deste projeto no grupo do WhatsApp do cliente"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Enviar no Grupo do WhatsApp</span>
              </button>
            )}

            <button
              onClick={() => {
                const targetProjId = activeProject?.id || clientProjects[0]?.id;
                openNewPostModal(client?.id, targetProjId);
              }}
              style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
              className="px-4 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Conteúdo</span>
            </button>
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
          openEditPostModal(p);
        }}
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

      {client && (
        <GeneralClientChatModal
          isOpen={clientChatOpen}
          onClose={() => setClientChatOpen(false)}
          client={client}
          project={activeProject || undefined}
          role="agency"
        />
      )}
    </div>
  );
};
