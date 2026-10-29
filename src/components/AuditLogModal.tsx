import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLogItem } from '../types';
import { 
  History, 
  X, 
  Search, 
  Filter, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  MessageSquare, 
  Trash2, 
  Clock, 
  ShieldCheck,
  Calendar,
  Download
} from 'lucide-react';

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  post_created: { label: 'Post Criado', icon: PlusCircle, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  post_approved: { label: 'Post Aprovado', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  post_changes_requested: { label: 'Ajuste Solicitado', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  post_edited: { label: 'Post Editado', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  post_deleted: { label: 'Post Excluído', icon: Trash2, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  comment_added: { label: 'Comentário', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  client_created: { label: 'Cliente Criado', icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  client_edited: { label: 'Cliente Editado', icon: User, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  client_deleted: { label: 'Cliente Excluído', icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  project_created: { label: 'Projeto Criado', icon: PlusCircle, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  user_created: { label: 'Usuário Criado', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  user_edited: { label: 'Usuário Editado', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  user_deleted: { label: 'Usuário Removido', icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  theme_updated: { label: 'Tema / Visual', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  login: { label: 'Sessão / Login', icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
};

export const AuditLogModal: React.FC = () => {
  const { 
    isAuditModalOpen, 
    setIsAuditModalOpen, 
    auditLogs, 
    clearAuditLogs, 
    deleteAuditLogItem,
    users, 
    currentUser,
    exportDatabaseBackup 
  } = useApp();

  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  if (!isAuditModalOpen) return null;

  const filteredLogs = auditLogs.filter(log => {
    if (userFilter !== 'all' && log.userId !== userFilter && log.userName !== userFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchName = log.userName.toLowerCase().includes(q);
      const matchEntity = (log.entityName || '').toLowerCase().includes(q);
      if (!matchDetails && !matchName && !matchEntity) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 p-6 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <History className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Histórico de Atividades & Auditoria
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90 border border-white/20">
                  {auditLogs.length} registros
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Saiba exatamente quem fez cada ação no sistema (criação, aprovação, ajustes e cadastros).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportDatabaseBackup}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Baixar Backup do Banco de Dados"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAuditModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between text-xs">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, post, cliente ou detalhe..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* User selector */}
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand shrink-0"
          >
            <option value="all">Todos os Usuários</option>
            {users.map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>

          {/* Action selector */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand shrink-0"
          >
            <option value="all">Todas as Ações</option>
            <option value="post_created">Posts Criados</option>
            <option value="post_approved">Posts Aprovados</option>
            <option value="post_changes_requested">Ajustes Solicitados</option>
            <option value="comment_added">Comentários</option>
            <option value="client_created">Clientes Criados</option>
            <option value="user_created">Usuários da Equipe</option>
            <option value="login">Logins & Sessões</option>
          </select>
        </div>

        {/* Audit Timeline */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              Nenhuma ação encontrada com os filtros selecionados.
            </div>
          ) : (
            filteredLogs.map(log => {
              const actionMeta = ACTION_CONFIG[log.action] || {
                label: 'Ação do Sistema',
                icon: Clock,
                color: 'text-slate-600',
                bg: 'bg-slate-50 border-slate-200',
              };
              const IconComp = actionMeta.icon;

              const dateObj = new Date(log.timestamp);
              const formattedTime = isNaN(dateObj.getTime())
                ? log.timestamp
                : dateObj.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

              return (
                <div
                  key={log.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all flex items-start gap-3.5 shadow-2xs"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${actionMeta.bg}`}>
                    <IconComp className={`w-4 h-4 ${actionMeta.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {log.userName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {log.userRole === 'owner' ? '👑 Dona' : log.userRole === 'manager' ? '💼 Gerente' : log.userRole === 'creator' ? '🎨 Criador' : '👁️ Visualizador'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${actionMeta.bg} ${actionMeta.color}`}>
                          {actionMeta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formattedTime}
                        </span>
                        {currentUser?.role === 'owner' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Excluir esta ação do histórico de auditoria?')) {
                                deleteAuditLogItem(log.id);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Excluir ação (apenas Dona da agência)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {log.details}
                    </p>

                    {log.entityName && (
                      <span className="inline-block mt-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                        Item: {log.entityName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Exibindo {filteredLogs.length} de {auditLogs.length} registros
          </span>

          {currentUser?.role === 'owner' && auditLogs.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja zerar o histórico de auditoria?')) {
                  clearAuditLogs();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
            >
              Limpar Histórico
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
