import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostContent, Client, FolderProject } from '../types';
import { PostApprovalCard } from './PostApprovalCard';
import { CalendarView } from './CalendarView';
import { ContentUploadModal } from './ContentUploadModal';
import { ProjectFolderModal } from './ProjectFolderModal';
import { ClientManagerModal } from './ClientManagerModal';
import { PostChatModal } from './PostChatModal';
import { HowToApproveGuide } from './HowToApproveGuide';
import { 
  Plus, 
  FolderPlus, 
  UserPlus, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Send, 
  Eye, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Folder, 
  FileText, 
  Building2, 
  Users, 
  Calendar as CalendarIcon, 
  Sparkles,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Share2
} from 'lucide-react';
import { buildWhatsAppUrl, createNewContentWhatsAppMessage } from '../utils/whatsapp';

interface AgencyDashboardViewProps {
  currentTab: string;
  onOpenNewClient: () => void;
  onOpenNewProject: () => void;
}

export const AgencyDashboardView: React.FC<AgencyDashboardViewProps> = ({
  currentTab,
  onOpenNewClient,
  onOpenNewProject,
}) => {
  const {
    selectedClientId,
    selectedClient,
    clients,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    posts,
    openClientPortalByProject,
    agencyConfig,
    deleteClient,
    deleteProject,
    addToast
  } = useApp();

  // Modals
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostContent | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingProject, setEditingProject] = useState<FolderProject | null>(null);
  const [chatPost, setChatPost] = useState<PostContent | null>(null);

  // Link copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter inside the dashboard
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'changes' | 'approved'>('all');

  // Client's folders & posts
  const clientProjects = projects.filter(p => p.clientId === selectedClientId);
  const activeProject = projects.find(p => p.id === selectedProjectId) || clientProjects[0];

  const currentProjectPosts = posts.filter(p => {
    if (!activeProject) return p.clientId === selectedClientId;
    return p.projectId === activeProject.id;
  });

  const pendingCount = currentProjectPosts.filter(p => p.status === 'pending_approval').length;
  const changesCount = currentProjectPosts.filter(p => p.status === 'changes_requested').length;
  const approvedCount = currentProjectPosts.filter(p => p.status === 'approved').length;

  const filteredPosts = currentProjectPosts.filter(p => {
    if (statusFilter === 'pending') return p.status === 'pending_approval';
    if (statusFilter === 'changes') return p.status === 'changes_requested';
    if (statusFilter === 'approved') return p.status === 'approved';
    return true;
  });

  const handleCopyLink = (projectKey: string) => {
    const link = `${window.location.origin}/?view=portal&project=${projectKey}`;
    navigator.clipboard.writeText(link);
    setCopiedKey(projectKey);
    addToast('success', 'Link Único Copiado!', 'Link direto de aprovação para o cliente.');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendWhatsAppNotification = (post: PostContent) => {
    if (!selectedClient?.phone || !activeProject) return;
    const approvalLink = `${window.location.origin}/?view=portal&project=${activeProject.clientAccessKey}`;
    const dateFormatted = new Date(post.scheduledDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const msg = createNewContentWhatsAppMessage({
      clientName: selectedClient.name,
      projectName: activeProject.name,
      postTitle: post.title,
      approvalLink,
      agencyName: agencyConfig.agencyName,
      scheduledDateFormatted: dateFormatted,
    });

    window.open(buildWhatsAppUrl(selectedClient.phone, msg), '_blank');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* View 1: Clients Management View */}
      {currentTab === 'clients' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestão de Clientes</h1>
              <p className="text-xs text-slate-500">Cadastre clientes, personalize cores e gerencie informações de contato.</p>
            </div>
            <button
              onClick={onOpenNewClient}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clients.map(client => {
              const clientProjs = projects.filter(p => p.clientId === client.id);
              const clientPostsCount = posts.filter(p => p.clientId === client.id).length;

              return (
                <div
                  key={client.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base overflow-hidden shrink-0 shadow-2xs"
                          style={{ backgroundColor: client.brandColor }}
                        >
                          {client.logo ? (
                            <img src={client.logo} alt={client.company} className="w-full h-full object-cover" />
                          ) : (
                            client.company.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">{client.company}</h3>
                          <span className="text-xs text-slate-500">{client.name}</span>
                          <span className="block text-[11px] text-slate-400">{client.niche}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingClient(client)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Editar Cliente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remover o cliente ${client.company}? Todos os projetos e posts serão excluídos.`)) {
                              deleteClient(client.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Excluir Cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats & Contacts */}
                    <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>WhatsApp:</span>
                        <a
                          href={buildWhatsAppUrl(client.phone, `Olá ${client.name}!`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </a>
                      </div>
                      {client.email && (
                        <div className="flex items-center justify-between text-slate-600 truncate">
                          <span>E-mail:</span>
                          <span className="font-mono text-slate-700 truncate max-w-[170px]">{client.email}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Pastas de Projeto:</span>
                        <span className="font-semibold text-slate-900">{clientProjs.length} pastas</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Total de Conteúdos:</span>
                        <span className="font-semibold text-slate-900">{clientPostsCount} posts</span>
                      </div>
                    </div>

                    {client.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        "{client.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                    {clientProjs[0] && (
                      <button
                        onClick={() => openClientPortalByProject(clientProjs[0].clientAccessKey)}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Portal</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Monthly Calendar */}
      {currentTab === 'calendar' && (
        <CalendarView
          posts={currentProjectPosts}
          onSelectPost={p => setChatPost(p)}
        />
      )}

      {/* View 3: How to approve guide */}
      {currentTab === 'guide' && (
        <HowToApproveGuide />
      )}

      {/* View 4: Main Dashboard & Project Board */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total de Conteúdos
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                {currentProjectPosts.length}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Na pasta atual
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-200/70 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
                  Para Aprovação
                </span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-2xl font-bold font-mono text-indigo-900 mt-1 block">
                {pendingCount}
              </span>
              <span className="text-[10px] text-indigo-600 mt-0.5 block">
                Aguardando cliente
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200/70 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
                  Em Alteração
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-2xl font-bold font-mono text-amber-900 mt-1 block">
                {changesCount}
              </span>
              <span className="text-[10px] text-amber-600 mt-0.5 block">
                Ajustes solicitados
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200/70 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                  Aprovados
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-2xl font-bold font-mono text-emerald-900 mt-1 block">
                {approvedCount}
              </span>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">
                Prontos para postagem
              </span>
            </div>
          </div>

          {/* Project & Client Selector Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base overflow-hidden shrink-0 shadow-2xs"
                style={{ backgroundColor: selectedClient?.brandColor || '#4F46E5' }}
              >
                {selectedClient?.logo ? (
                  <img src={selectedClient.logo} alt={selectedClient.company} className="w-full h-full object-cover" />
                ) : (
                  selectedClient?.company?.charAt(0).toUpperCase() || 'C'
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedClient?.company}
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {selectedClient?.niche}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pasta ativa:{' '}
                  <span className="font-semibold text-indigo-700">
                    {activeProject ? activeProject.name : 'Nenhuma pasta selecionada'}
                  </span>
                </p>
              </div>
            </div>

            {/* Folder unique link generator & Share */}
            {activeProject && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleCopyLink(activeProject.clientAccessKey)}
                  className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedKey === activeProject.clientAccessKey ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === activeProject.clientAccessKey ? 'Link Copiado!' : 'Copiar Link do Cliente'}</span>
                </button>

                {selectedClient?.phone && (
                  <a
                    href={buildWhatsAppUrl(
                      selectedClient.phone,
                      `Olá ${selectedClient.name}!\nAqui está o link exclusivo para aprovação dos conteúdos do projeto *${activeProject.name}*:\n${window.location.origin}/?view=portal&project=${activeProject.clientAccessKey}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
                    title="Enviar link via WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  onClick={() => openClientPortalByProject(activeProject.clientAccessKey)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                  title="Abrir como cliente para testar"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ver como Cliente</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Toolbar: Folder Selector Pills & New Post Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Folder selection pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {clientProjects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeProject?.id === p.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Folder className="w-3 h-3" />
                  <span>{p.name}</span>
                </button>
              ))}

              <button
                onClick={onOpenNewProject}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1 shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Nova Pasta</span>
              </button>
            </div>

            {/* Inserir Conteúdo button */}
            <button
              onClick={() => {
                setEditingPost(null);
                setContentModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Conteúdo para Aprovação</span>
            </button>
          </div>

          {/* Status filter tabs for the posts */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: `Todos (${currentProjectPosts.length})` },
                { id: 'pending', label: `Para Aprovação (${pendingCount})` },
                { id: 'changes', label: `Em Alteração (${changesCount})` },
                { id: 'approved', label: `Aprovados (${approvedCount})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === f.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {activeProject && (
              <button
                onClick={() => setEditingProject(activeProject)}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Configurar Pasta
              </button>
            )}
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-base font-bold text-slate-900">Nenhum conteúdo nesta visualização</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Clique no botão "Inserir Conteúdo para Aprovação" para subir artes, carrosséis ou vídeos do Google Drive.
              </p>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setContentModalOpen(true);
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeiro Post</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPosts.map(post => (
                <div key={post.id} className="relative group">
                  <PostApprovalCard
                    post={post}
                    role="agency"
                    onOpenChat={p => setChatPost(p)}
                    onEditPost={p => {
                      setEditingPost(p);
                      setContentModalOpen(true);
                    }}
                    onPreviewPost={p => {
                      setEditingPost(p);
                      setContentModalOpen(true);
                    }}
                  />

                  {/* WhatsApp Quick Notification Trigger from Agency to Client */}
                  {selectedClient?.phone && (
                    <div className="mt-1 flex items-center justify-end">
                      <button
                        onClick={() => handleSendWhatsAppNotification(post)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 py-1 px-2 rounded-md hover:bg-emerald-50 transition-colors"
                        title="Enviar aviso de aprovação no WhatsApp do cliente"
                      >
                        <Send className="w-3 h-3" />
                        <span>Avisar no WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Support Documents Box for this Project */}
          {activeProject && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Arquivos de Apoio e Briefings da Pasta ({activeProject.supportDocs.length})
                  </h3>
                </div>
                <button
                  onClick={() => setEditingProject(activeProject)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Gerenciar Documentos
                </button>
              </div>

              {activeProject.supportDocs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Nenhum documento de suporte anexado nesta pasta. Clique em "Gerenciar Documentos" para subir PDFs ou briefings.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeProject.supportDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{doc.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {doc.size}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ContentUploadModal
        isOpen={contentModalOpen}
        onClose={() => {
          setContentModalOpen(false);
          setEditingPost(null);
        }}
        postToEdit={editingPost}
      />

      <ClientManagerModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        clientToEdit={editingClient}
      />

      <ProjectFolderModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        projectToEdit={editingProject}
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
