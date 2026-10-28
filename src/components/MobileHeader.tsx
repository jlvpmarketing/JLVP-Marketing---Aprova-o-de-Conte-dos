import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Palette, 
  Plus, 
  ShieldCheck,
  ChevronRight,
  UserPlus,
  LogIn,
  History
} from 'lucide-react';

interface MobileHeaderProps {
  onOpenNewClient: () => void;
  onOpenThemeCustomizer: () => void;
  onOpenNotifications?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenNewClient,
  onOpenThemeCustomizer,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { 
    agencyConfig, 
    clients, 
    agencyPage, 
    openClientDetailPage,
    openHome,
    selectedClientId,
    currentUser,
    setIsLoginModalOpen,
    setIsTeamModalOpen,
    setIsAuditModalOpen,
    setIsProfileModalOpen
  } = useApp();

  const handleNavigateHome = () => {
    openHome();
    setDrawerOpen(false);
  };

  const handleSelectClient = (clientId: string) => {
    openClientDetailPage(clientId);
    setDrawerOpen(false);
  };

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Abrir Menu Lateral"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Agency Brand Center */}
        <div 
          onClick={handleNavigateHome}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white overflow-hidden shadow-2xs"
            style={{ backgroundColor: agencyConfig.primaryColor }}
          >
            {agencyConfig.agencyLogo ? (
              <img src={agencyConfig.agencyLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-white" />
            )}
          </div>
          <span className="font-bold text-slate-900 text-sm truncate max-w-[140px]">
            {agencyConfig.agencyName}
          </span>
        </div>

        {/* Right profile shortcut */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden cursor-pointer shadow-2xs"
          title="Ver Perfil & Clientes"
        >
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            <span>{currentUser?.name?.charAt(0) || 'U'}</span>
          )}
        </button>
      </div>

      {/* Slide-over Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white overflow-hidden shrink-0"
                  style={{ backgroundColor: agencyConfig.primaryColor }}
                >
                  {agencyConfig.agencyLogo ? (
                    <img src={agencyConfig.agencyLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm truncate">{agencyConfig.agencyName}</h3>
                  <span className="text-[10px] text-slate-400">Menu Geral</span>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Global Navigation list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1">
                  Menu Geral
                </span>

                <button
                  onClick={handleNavigateHome}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    agencyPage === 'home' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Início (Visão Geral)</span>
                </button>

                {/* Adicionar Responsáveis */}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setIsTeamModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-4 h-4 text-brand" />
                    <span>Adicionar Responsáveis</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    Equipe
                  </span>
                </button>

                {/* Página de Login */}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <LogIn className="w-4 h-4 text-slate-500" />
                    <span>Página de Login</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Trocar</span>
                </button>

                {/* Histórico de Atividades */}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setIsAuditModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Histórico de Atividades</span>
                </button>
              </div>

              {/* Clientes section */}
              <div className="space-y-1 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Páginas dos Clientes ({clients.length})
                  </span>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenNewClient();
                    }}
                    className="text-[10px] font-semibold text-brand cursor-pointer"
                  >
                    + Novo
                  </button>
                </div>

                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left cursor-pointer ${
                      agencyPage === 'client_detail' && selectedClientId === client.id
                        ? 'bg-brand-light text-brand-dark font-bold border border-brand-light'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                        style={{ backgroundColor: client.brandColor }}
                      >
                        {client.company.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{client.company}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Footer: User Profile & Personalize */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
              {/* Profile Card */}
              <div 
                onClick={() => {
                  setDrawerOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="p-2.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs cursor-pointer hover:border-brand transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentUser?.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                      {currentUser?.name || 'Não autenticado'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">
                      {currentUser?.role === 'owner' ? '👑 Dona' : currentUser?.role === 'manager' ? '💼 Gerente' : currentUser?.role === 'creator' ? '🎨 Criador' : '👁️ Visualizador'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-brand">Perfil &rarr;</span>
              </div>

              <button
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenThemeCustomizer();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 cursor-pointer"
              >
                <Palette className="w-4 h-4 text-brand" />
                Personalizar Cores & Agência
              </button>
            </div>
          </div>

          <div className="flex-1" onClick={() => setDrawerOpen(false)} />
        </div>
      )}
    </div>
  );
};
