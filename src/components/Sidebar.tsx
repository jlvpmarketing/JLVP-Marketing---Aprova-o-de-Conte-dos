import React from 'react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { 
  Home, 
  Users, 
  Palette, 
  Plus, 
  ShieldCheck, 
  History, 
  Database, 
  LogOut, 
  Edit2, 
  Trash2, 
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenNewClient: () => void;
  onOpenEditClient?: (client: Client) => void;
  onOpenThemeCustomizer: () => void;
  onOpenDatabaseBackup?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onToggleSidebar,
  onOpenNewClient,
  onOpenEditClient,
  onOpenThemeCustomizer,
  onOpenDatabaseBackup,
}) => {
  const { 
    agencyConfig, 
    clients, 
    agencyPage, 
    openClientDetailPage, 
    openHome,
    selectedClientId,
    currentUser,
    logout,
    deleteClient,
    setIsTeamModalOpen,
    setIsAuditModalOpen,
    setIsProfileModalOpen,
    setIsLoginModalOpen
  } = useApp();

  const orderedClients = React.useMemo(() => {
    const order = currentUser?.clientOrder;
    if (!order || !Array.isArray(order) || order.length === 0) return clients;
    const orderMap = new Map(order.map((id, index) => [id, index]));
    return [...clients].sort((a, b) => {
      const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
      const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
      if (posA !== posB) return posA - posB;
      return (a.company || '').localeCompare(b.company || '');
    });
  }, [clients, currentUser?.clientOrder]);

  const handleDeleteClient = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${client.company}"?\n\nTodas as pastas de projetos e publicações vinculadas serão removidas.`)) {
      deleteClient(client.id);
    }
  };

  const handleEditClient = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    if (onOpenEditClient) {
      onOpenEditClient(client);
    }
  };

  return (
    <aside 
      className={`hidden lg:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 select-none transition-all duration-300 ease-in-out z-20 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Agency Brand Header with Toggle Button */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between min-h-[64px]">
        {isOpen ? (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs"
                style={{ backgroundColor: agencyConfig.primaryColor }}
              >
                {agencyConfig.agencyLogo ? (
                  <img src={agencyConfig.agencyLogo} alt="Logo Agência" className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 text-sm truncate leading-tight">
                  {agencyConfig.agencyName}
                </h1>
                <span className="text-[10px] text-slate-400 font-medium">Painel Central</span>
              </div>
            </div>

            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Recolher menu lateral"
                aria-label="Recolher menu lateral"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <div 
              className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs cursor-pointer"
              style={{ backgroundColor: agencyConfig.primaryColor }}
              onClick={onToggleSidebar}
              title={`${agencyConfig.agencyName} - Clique para expandir`}
            >
              {agencyConfig.agencyLogo ? (
                <img src={agencyConfig.agencyLogo} alt="Logo Agência" className="w-full h-full object-cover" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-white" />
              )}
            </div>

            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Expandir menu lateral"
                aria-label="Expandir menu lateral"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Global Menu */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-4">
        {/* Menu Geral */}
        <div className="space-y-1">
          {isOpen && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Menu Geral do Sistema
            </span>
          )}

          {/* Início */}
          <button
            onClick={openHome}
            title="Início"
            className={`w-full flex items-center ${isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              agencyPage === 'home'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            {isOpen && <span>Início</span>}
          </button>

          {/* Responsáveis */}
          <button
            onClick={() => setIsTeamModalOpen(true)}
            title="Responsáveis / Equipe"
            className={`w-full flex items-center ${isOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer group`}
          >
            <div className={`flex items-center ${isOpen ? 'gap-2.5' : 'justify-center'}`}>
              <Users className="w-4 h-4 text-brand group-hover:scale-110 transition-transform shrink-0" />
              {isOpen && <span>Responsáveis</span>}
            </div>
            {isOpen && (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Equipe
              </span>
            )}
          </button>

          {/* Histórico de Atividades */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            title="Histórico de Atividades"
            className={`w-full flex items-center ${isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'} py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer`}
          >
            <History className="w-4 h-4 text-slate-500 shrink-0" />
            {isOpen && <span>Histórico de Atividades</span>}
          </button>
        </div>

        {/* Clientes list section */}
        <div className="space-y-1 pt-3 border-t border-slate-100">
          {isOpen ? (
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Clientes ({clients.length})
              </span>
              <button
                onClick={onOpenNewClient}
                className="text-[10px] font-semibold text-brand hover:opacity-80 flex items-center gap-0.5 cursor-pointer"
                title="Cadastrar Cliente"
              >
                <Plus className="w-3 h-3" />
                Novo
              </button>
            </div>
          ) : (
            <div className="flex justify-center mb-1">
              <button
                onClick={onOpenNewClient}
                className="p-1.5 text-brand hover:bg-brand-light/30 rounded-lg transition-colors cursor-pointer"
                title="Cadastrar Novo Cliente"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-1">
            {orderedClients.map(client => {
              const isSelected = agencyPage === 'client_detail' && selectedClientId === client.id;

              if (!isOpen) {
                return (
                  <button
                    key={client.id}
                    onClick={() => openClientDetailPage(client.id)}
                    title={client.company}
                    className={`w-full flex justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-brand bg-slate-100'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs overflow-hidden"
                      style={{ backgroundColor: client.brandColor || '#000000' }}
                    >
                      {client.logo ? (
                        <img src={client.logo} alt={client.company} className="w-full h-full object-cover" />
                      ) : (
                        client.company.charAt(0).toUpperCase()
                      )}
                    </div>
                  </button>
                );
              }

              return (
                <div
                  key={client.id}
                  onClick={() => openClientDetailPage(client.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                    isSelected
                      ? 'bg-brand-light text-brand-dark font-bold border border-brand-light shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-white text-[10px] shrink-0 overflow-hidden"
                      style={{ backgroundColor: client.brandColor }}
                    >
                      {client.logo ? (
                        <img src={client.logo} alt={client.company} className="w-full h-full object-cover" />
                      ) : (
                        client.company.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="truncate">{client.company}</span>
                  </div>

                  {/* Edit and Delete Icons */}
                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleEditClient(e, client)}
                      className="p-1 rounded-md text-slate-400 hover:text-brand hover:bg-white transition-colors cursor-pointer"
                      title="Editar Cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClient(e, client)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Settings & Current User Profile Card */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50 space-y-2">
        {isOpen ? (
          <>
            {/* Personalizar Aplicativo + Compact Database & Backup Icon */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenThemeCustomizer}
                className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200/80 transition-colors shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-brand" />
                  <span>Personalizar Aplicativo</span>
                </div>
                <div
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                  style={{ backgroundColor: agencyConfig.primaryColor }}
                />
              </button>

              {onOpenDatabaseBackup && (
                <button
                  type="button"
                  onClick={onOpenDatabaseBackup}
                  className="p-2 text-slate-500 hover:text-brand bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors shadow-2xs cursor-pointer shrink-0"
                  title="Banco de Dados & Backup"
                >
                  <Database className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Current Logged-in User Profile Card */}
            {currentUser ? (
              <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-2xs transition-all">
                <div 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                  title="Clique para ver seu perfil e clientes sob sua responsabilidade"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 group-hover:ring-2 group-hover:ring-brand/40 transition-all">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentUser.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-900 block truncate leading-tight group-hover:text-brand transition-colors">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">
                      {currentUser.role === 'owner' ? '👑 Dona da Agência' : currentUser.role === 'manager' ? '💼 Gerente' : currentUser.role === 'creator' ? '🎨 Criador' : '👁️ Visualizador'}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                    {currentUser.email}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Encerrar sessão"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full p-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 rotate-180" />
                <span>Fazer Login</span>
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onOpenThemeCustomizer}
              className="p-2 text-slate-600 hover:text-brand hover:bg-white rounded-xl transition-colors cursor-pointer"
              title="Personalizar Aplicativo"
            >
              <Palette className="w-4 h-4 text-brand" />
            </button>

            {onOpenDatabaseBackup && (
              <button
                type="button"
                onClick={onOpenDatabaseBackup}
                className="p-2 text-slate-500 hover:text-brand hover:bg-white rounded-xl transition-colors cursor-pointer"
                title="Banco de Dados & Backup"
              >
                <Database className="w-4 h-4" />
              </button>
            )}

            {currentUser ? (
              <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-slate-200/80 w-full">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs overflow-hidden hover:ring-2 hover:ring-brand/40 transition-all cursor-pointer shadow-2xs"
                  title={`${currentUser.name} (${currentUser.role})`}
                >
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser.name?.charAt(0) || 'U'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="p-2 text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
                title="Fazer Login"
              >
                <LogOut className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
