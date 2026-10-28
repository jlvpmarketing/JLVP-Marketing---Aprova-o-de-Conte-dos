/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { HomeOverview } from './components/HomeOverview';
import { ClientDetailPage } from './components/ClientDetailPage';
import { CalendarView } from './components/CalendarView';
import { ClientPortalView } from './components/ClientPortalView';
import { ToastContainer } from './components/ToastContainer';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { ClientManagerModal } from './components/ClientManagerModal';
import { ProjectFolderModal } from './components/ProjectFolderModal';
import { ContentUploadModal } from './components/ContentUploadModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { PostChatModal } from './components/PostChatModal';
import { PostDetailView } from './components/PostDetailView';
import { LoginModal } from './components/LoginModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { AuditLogModal } from './components/AuditLogModal';
import { DatabaseBackupModal } from './components/DatabaseBackupModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PostContent, Client } from './types';

const MainApp: React.FC = () => {
  const { currentView, agencyPage, posts, clients, projects } = useApp();

  const activeClientIds = new Set(clients.map(c => c.id));
  const activeProjectIds = new Set(projects.map(p => p.id));
  const activePosts = posts.filter(p => activeClientIds.has(p.clientId) && activeProjectIds.has(p.projectId));

  // Global modals
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [databaseBackupOpen, setDatabaseBackupOpen] = useState(false);
  const [selectedCalendarPost, setSelectedCalendarPost] = useState<PostContent | null>(null);

  const handleOpenNewClient = () => {
    setClientToEdit(null);
    setClientModalOpen(true);
  };

  const handleOpenEditClient = (client: Client) => {
    setClientToEdit(client);
    setClientModalOpen(true);
  };

  // If viewing client portal directly via unique link
  if (currentView === 'client_portal') {
    return (
      <>
        <ClientPortalView />
        <ToastContainer />
      </>
    );
  }

  // Agency View (PC lateral sidebar + Mobile hamburger top bar)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800">
      {/* PC lateral sidebar: menu geral, todo o sistema e notificações */}
      <Sidebar
        onOpenNewClient={handleOpenNewClient}
        onOpenEditClient={handleOpenEditClient}
        onOpenThemeCustomizer={() => setThemeCustomizerOpen(true)}
        onOpenDatabaseBackup={() => setDatabaseBackupOpen(true)}
      />

      {/* Mobile top bar with hamburger menu */}
      <MobileHeader
        onOpenNewClient={handleOpenNewClient}
        onOpenThemeCustomizer={() => setThemeCustomizerOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      {/* Main Agency Viewport:
          Default is 'home' (Tela Inicial com todos os clientes, notificações de todos e calendário geral)
      */}
      <main className="flex-1 overflow-y-auto">
        {agencyPage === 'home' && (
          <HomeOverview
            onOpenNewClient={handleOpenNewClient}
            onOpenEditClient={handleOpenEditClient}
            onOpenNewPost={() => setContentModalOpen(true)}
          />
        )}

        {agencyPage === 'client_detail' && (
          <ClientDetailPage />
        )}

        {agencyPage === 'calendar' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Calendário Geral de Publicações
              </h1>
              <p className="text-xs text-slate-500">
                Visualização consolidada de todos os posts agendados para todos os seus clientes neste mês.
              </p>
            </div>
            <CalendarView
              posts={activePosts}
              onSelectPost={p => setSelectedCalendarPost(p)}
            />
          </div>
        )}

        {agencyPage === 'notifications' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-4xl mx-auto">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Central Geral de Notificações
              </h1>
              <p className="text-xs text-slate-500">
                Acompanhe em tempo real todas as aprovações, solicitações de ajustes e comentários de todos os clientes.
              </p>
            </div>
            <HomeOverview
              onOpenNewClient={handleOpenNewClient}
              onOpenEditClient={handleOpenEditClient}
              onOpenNewPost={() => setContentModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <ThemeCustomizerModal
        isOpen={themeCustomizerOpen}
        onClose={() => setThemeCustomizerOpen(false)}
      />

      <ClientManagerModal
        isOpen={clientModalOpen}
        onClose={() => {
          setClientModalOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
      />

      <ProjectFolderModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
      />

      <ContentUploadModal
        isOpen={contentModalOpen}
        onClose={() => setContentModalOpen(false)}
      />

      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <PostDetailView
        post={selectedCalendarPost}
        onClose={() => setSelectedCalendarPost(null)}
        role="agency"
        onEditPost={p => {
          setSelectedCalendarPost(null);
          setContentModalOpen(true);
        }}
      />

      {/* System Modals: Login, Equipe, Auditoria, Perfil e Backup */}
      <LoginModal />
      <TeamManagementModal />
      <AuditLogModal />
      <UserProfileModal />
      <DatabaseBackupModal
        isOpen={databaseBackupOpen}
        onClose={() => setDatabaseBackupOpen(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
