import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  AgencyConfig, 
  Client, 
  FolderProject, 
  PostContent, 
  NotificationItem, 
  CommentItem, 
  SupportDocument,
  AgencyUser,
  AuditLogItem,
  UserRole
} from '../types';
import { 
  INITIAL_AGENCY_CONFIG, 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_POSTS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  THEME_COLOR_PRESETS 
} from '../utils/initialData';
import { playNotificationSound, sendBrowserPushNotification } from '../utils/notifications';
import { applyThemeToDocument } from '../utils/themeHelper';
import { firestoreSync } from '../services/firestoreSync';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  // Current user & Auth
  currentUser: AgencyUser | null;
  users: AgencyUser[];
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  logout: () => void;
  createUser: (userData: Omit<AgencyUser, 'id' | 'createdAt'>) => AgencyUser;
  updateUser: (id: string, updates: Partial<AgencyUser>) => void;
  deleteUser: (id: string) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isTeamModalOpen: boolean;
  setIsTeamModalOpen: (open: boolean) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  updateCurrentUserProfile: (updates: Partial<AgencyUser>) => void;
  assignClientManager: (clientId: string, managerId: string, managerName: string) => void;
  assignClientManagers: (clientId: string, managerIds: string[]) => void;

  // Audit Logs & Activity History
  auditLogs: AuditLogItem[];
  addAuditLog: (action: AuditLogItem['action'], details: string, entityId?: string, entityName?: string) => void;
  clearAuditLogs: () => void;
  deleteAuditLogItem: (logId: string) => void;

  // Month filter for posts
  selectedMonthFilter: string; // 'all' or 'YYYY-MM'
  setSelectedMonthFilter: (month: string) => void;
  availableMonths: string[];

  // Database Backup / Persistence
  exportDatabaseBackup: () => void;
  importDatabaseBackup: (jsonContent: string) => boolean;

  agencyConfig: AgencyConfig;
  updateAgencyConfig: (updates: Partial<AgencyConfig>) => void;
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedClient: Client | undefined;
  
  projects: FolderProject[];
  addProject: (project: Omit<FolderProject, 'id' | 'createdAt' | 'clientAccessKey' | 'supportDocs'>) => FolderProject;
  updateProject: (id: string, updates: Partial<FolderProject>) => void;
  deleteProject: (id: string) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedProject: FolderProject | undefined;
  addSupportDocToProject: (projectId: string, doc: Omit<SupportDocument, 'id' | 'uploadDate'>) => void;
  deleteSupportDocFromProject: (projectId: string, docId: string) => void;

  posts: PostContent[];
  addPost: (post: Omit<PostContent, 'id' | 'createdAt' | 'comments'>) => PostContent;
  updatePost: (id: string, updates: Partial<PostContent>) => void;
  deletePost: (id: string) => void;
  approvePost: (postId: string, approvedByName?: string) => void;
  requestChangesPost: (postId: string, note: string) => void;
  addComment: (postId: string, authorRole: 'agency' | 'client', authorName: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  clearPostComments: (postId: string) => void;

  // Global Content Modal Management (Single instance prevents duplicates and stale references)
  isContentModalOpen: boolean;
  setIsContentModalOpen: (open: boolean) => void;
  editingPost: PostContent | null;
  setEditingPost: (post: PostContent | null) => void;
  openNewPostModal: (clientId?: string, projectId?: string) => void;
  openEditPostModal: (post: PostContent) => void;
  closeContentModal: () => void;

  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationsAsRead: (id?: string) => void;
  markMultipleNotificationsAsRead: (ids: string[]) => void;
  clearNotifications: () => void;

  agencyPage: 'home' | 'client_detail' | 'clients' | 'calendar' | 'notifications';
  setAgencyPage: (page: 'home' | 'client_detail' | 'clients' | 'calendar' | 'notifications') => void;
  openClientDetailPage: (clientId: string) => void;
  openHome: () => void;

  currentView: 'agency' | 'client_portal';
  setCurrentView: (view: 'agency' | 'client_portal') => void;
  portalProjectKey: string | null;
  setPortalProjectKey: (key: string | null) => void;
  portalMode: 'client' | 'agency';
  setPortalMode: (mode: 'client' | 'agency') => void;

  openClientPortalByProject: (projectKey: string, mode?: 'client' | 'agency') => void;
  returnToAgencyView: () => void;

  toasts: ToastMessage[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AGENCY: 'aprovaflow_agency_v1',
  CLIENTS: 'aprovaflow_clients_v1',
  PROJECTS: 'aprovaflow_projects_v1',
  POSTS: 'aprovaflow_posts_v1',
  NOTIFS: 'aprovaflow_notifs_v1',
  USERS: 'aprovaflow_users_v1',
  CURRENT_USER: 'aprovaflow_current_user_v1',
  AUDIT_LOGS: 'aprovaflow_audit_logs_v1',
  MONTH_FILTER: 'aprovaflow_month_filter_v1',
};

const SESSION_ACTIVE_KEY = 'aprovaflow_session_active_v1';
const SESSION_DATE_KEY = 'aprovaflow_session_date_v1';

const getTodayDateStr = () => new Date().toISOString().slice(0, 10);

const isSessionValidForToday = (): boolean => {
  try {
    const isActive = sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
    const date = sessionStorage.getItem(SESSION_DATE_KEY);
    return isActive && date === getTodayDateStr();
  } catch {
    return false;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from localStorage or defaults
  const [agencyConfig, setAgencyConfig] = useState<AgencyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AGENCY);
      return saved ? JSON.parse(saved) : INITIAL_AGENCY_CONFIG;
    } catch {
      return INITIAL_AGENCY_CONFIG;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [projects, setProjects] = useState<FolderProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [posts, setPosts] = useState<PostContent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Multi-user & Access Control (RBAC)
  const [users, setUsers] = useState<AgencyUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      let list: AgencyUser[] = saved ? JSON.parse(saved) : INITIAL_USERS;
      // Ensure owner user is Paloma Garcia with updated credentials
      list = list.map(u => {
        if (u.role === 'owner') {
          return {
            ...u,
            name: 'Paloma Garcia',
            email: 'jlvpmarketing@gmail.com',
            password: '26042008',
          };
        }
        return u;
      });
      return list;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<AgencyUser | null>(() => {
    try {
      if (!isSessionValidForToday()) {
        return null;
      }
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id) {
          if (u.role === 'owner') {
            return {
              ...u,
              name: 'Paloma Garcia',
              email: 'jlvpmarketing@gmail.com',
              password: '26042008',
            };
          }
          return u;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Audit Logs & Activity History
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Month Filter ('all' or 'YYYY-MM')
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.MONTH_FILTER) || 'all';
    } catch {
      return 'all';
    }
  });

  // Modals state - Session rules:
  // - On first use of the day or after closing browser: requires login
  // - On refresh (F5): preserves session without re-prompting login
  // - Client portal view: bypasses agency login
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'portal' && params.get('project')) {
        return false;
      }
      if (isSessionValidForToday() && localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  });
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostContent | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string>(() => clients[0]?.id || 'cli-1');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    const defaultProj = projects.find(p => p.clientId === (clients[0]?.id || 'cli-1'));
    return defaultProj ? defaultProj.id : null;
  });

  const [agencyPage, setAgencyPage] = useState<'home' | 'client_detail' | 'clients' | 'calendar' | 'notifications'>('home');
  const [currentView, setCurrentView] = useState<'agency' | 'client_portal'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'portal' && params.get('project') ? 'client_portal' : 'agency';
    } catch {
      return 'agency';
    }
  });
  const [portalProjectKey, setPortalProjectKey] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('project') || null;
    } catch {
      return null;
    }
  });
  const [portalMode, setPortalMode] = useState<'client' | 'agency'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'agency' ? 'agency' : 'client';
    } catch {
      return 'client';
    }
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const openClientDetailPage = (clientId: string) => {
    setSelectedClientId(clientId);
    const clientProjs = projects.filter(p => p.clientId === clientId);
    if (clientProjs.length > 0) {
      setSelectedProjectId(clientProjs[0].id);
    } else {
      setSelectedProjectId(null);
    }
    setAgencyPage('client_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openHome = () => {
    setAgencyPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync with URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const projectKeyParam = params.get('project');
    const modeParam = params.get('mode');
    if (viewParam === 'portal' && projectKeyParam) {
      setCurrentView('client_portal');
      setPortalProjectKey(projectKeyParam);
      setPortalMode(modeParam === 'agency' ? 'agency' : 'client');
    }

    // Seed Firestore if empty and establish real-time sync
    firestoreSync.seedInitialIfEmpty(
      clients,
      projects,
      posts,
      users,
      auditLogs,
      agencyConfig
    );

    const unsubClients = firestoreSync.subscribeToClients((remoteClients) => {
      if (remoteClients && remoteClients.length > 0) {
        setClients(remoteClients);
      }
    });

    const unsubProjects = firestoreSync.subscribeToProjects((remoteProjects) => {
      if (remoteProjects && remoteProjects.length > 0) {
        setProjects(remoteProjects);
      }
    });

    const unsubPosts = firestoreSync.subscribeToPosts((remotePosts) => {
      if (remotePosts) {
        setPosts(remotePosts);
      }
    });

    const unsubConfig = firestoreSync.subscribeToAgencyConfig((remoteConfig) => {
      if (remoteConfig) {
        setAgencyConfig(remoteConfig);
      }
    });

    const unsubUsers = firestoreSync.subscribeToUsers((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers(remoteUsers);
      }
    });

    return () => {
      unsubClients();
      unsubProjects();
      unsubPosts();
      unsubConfig();
      unsubUsers();
    };
  }, []);

  // Automatic cleanup of orphaned posts, projects and notifications from deleted clients
  useEffect(() => {
    if (clients.length === 0) return;
    const validClientIds = new Set(clients.map(c => c.id));
    const validProjectIds = new Set(projects.map(p => p.id));

    // Remove any post belonging to a deleted client or deleted project
    setPosts(prev => {
      const filtered = prev.filter(p => validClientIds.has(p.clientId) && (!p.projectId || validProjectIds.has(p.projectId)));
      if (filtered.length !== prev.length) {
        const removed = prev.filter(p => !validClientIds.has(p.clientId) || (p.projectId && !validProjectIds.has(p.projectId)));
        removed.forEach(p => firestoreSync.deletePost(p.id));
        return filtered;
      }
      return prev;
    });

    // Remove any notification for deleted clients or deleted posts
    setNotifications(prev => {
      const filtered = prev.filter(n => !n.clientId || validClientIds.has(n.clientId));
      if (filtered.length !== prev.length) {
        const removed = prev.filter(n => n.clientId && !validClientIds.has(n.clientId));
        removed.forEach(n => firestoreSync.deleteNotification(n.id));
        return filtered;
      }
      return prev;
    });
  }, [clients, projects]);

  // Update CSS Variables and system-wide theme when primary color changes
  useEffect(() => {
    applyThemeToDocument(agencyConfig.primaryColor, agencyConfig.accentColor);
  }, [agencyConfig.primaryColor, agencyConfig.accentColor]);

  // Compute available months dynamically from posts
  const availableMonths = React.useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => {
      if (p.scheduledDate && p.scheduledDate.length >= 7) {
        set.add(p.scheduledDate.slice(0, 7));
      }
    });
    // Ensure 2026-10 is present
    set.add('2026-10');
    set.add('2026-11');
    return Array.from(set).sort();
  }, [posts]);

  // Persist state safely with try/catch to prevent QuotaExceededError crashes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.AGENCY, JSON.stringify(agencyConfig)); } catch (e) { console.warn(e); }
  }, [agencyConfig]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients)); } catch (e) { console.warn(e); }
  }, [clients]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)); } catch (e) { console.warn(e); }
  }, [projects]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts)); } catch (e) { console.warn(e); }
  }, [posts]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications)); } catch (e) { console.warn(e); }
  }, [notifications]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); } catch (e) { console.warn(e); }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) { console.warn(e); }
  }, [currentUser]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs)); } catch (e) { console.warn(e); }
  }, [auditLogs]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.MONTH_FILTER, selectedMonthFilter); } catch (e) { console.warn(e); }
  }, [selectedMonthFilter]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    playNotificationSound();
    sendBrowserPushNotification(item.title, { body: item.message });
    addToast(
      item.type === 'approval' ? 'success' : item.type === 'changes' ? 'warning' : 'info',
      item.title,
      item.message
    );
  };

  const markNotificationsAsRead = (id?: string) => {
    if (id) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const markMultipleNotificationsAsRead = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
    addToast('success', 'Notificações Atualizadas', `${ids.length} notificação(ões) marcada(s) como concluída(s).`);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addAuditLog = (
    action: AuditLogItem['action'],
    details: string,
    entityId?: string,
    entityName?: string
  ) => {
    const user = currentUser || {
      id: 'system',
      name: 'Sistema / Cliente',
      role: 'viewer' as UserRole,
      email: 'sistema@agencia.com',
    };

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userEmail: user.email,
      action,
      details,
      entityId,
      entityName,
      timestamp: new Date().toISOString(),
    };

    setAuditLogs(prev => [newLog, ...prev]);
    firestoreSync.saveAuditLog(newLog);
  };

  const deleteAuditLogItem = (logId: string) => {
    if (currentUser?.role !== 'owner') {
      addToast('error', 'Ação Não Permitida', 'Apenas a Dona da agência pode excluir ações do histórico.');
      return;
    }
    setAuditLogs(prev => prev.filter(l => l.id !== logId));
    firestoreSync.deleteAuditLog(logId);
    addToast('info', 'Ação Removida', 'O registro foi excluído do histórico com sucesso.');
  };

  const clearAuditLogs = () => {
    if (currentUser?.role !== 'owner') {
      addToast('error', 'Ação Não Permitida', 'Apenas a Dona da agência pode zerar o histórico de auditoria.');
      return;
    }
    auditLogs.forEach(l => firestoreSync.deleteAuditLog(l.id));
    setAuditLogs([]);
    addToast('info', 'Histórico Limpo', 'O histórico de auditoria foi zerado.');
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    let currentUsersList = [...users];

    let user = currentUsersList.find(u => u.email.toLowerCase() === cleanEmail);

    // If user not found in local cache, fetch directly from Firestore live database
    if (!user) {
      try {
        const liveUsers = await firestoreSync.fetchAllUsers();
        if (liveUsers && liveUsers.length > 0) {
          setUsers(liveUsers);
          currentUsersList = liveUsers;
          user = currentUsersList.find(u => u.email.toLowerCase() === cleanEmail);
        }
      } catch (err) {
        console.warn('Erro ao consultar Firestore no login:', err);
      }
    }

    if (!user) {
      return { 
        success: false, 
        message: 'Usuário não encontrado com este e-mail. Verifique suas credenciais ou contate a administração.' 
      };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Senha incorreta. Verifique suas credenciais.' };
    }

    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user!.id ? updatedUser : u));
    firestoreSync.saveUser(updatedUser);

    try {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
      sessionStorage.setItem(SESSION_DATE_KEY, getTodayDateStr());
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
    } catch (err) {
      console.warn('Erro ao salvar sessão:', err);
    }

    addAuditLog('login', `Usuário "${user.name}" (${user.role}) realizou login no sistema.`, user.id, user.name);
    addToast('success', `Bem-vindo(a), ${user.name}!`, `Conectado como ${user.role === 'owner' ? 'Dona da Agência' : user.role === 'manager' ? 'Gerente de Contas' : user.role === 'creator' ? 'Criador de Conteúdo' : 'Visualizador'}.`);
    setIsLoginModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('login', `Usuário "${currentUser.name}" encerrou a sessão.`, currentUser.id, currentUser.name);
    }
    try {
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
      sessionStorage.removeItem(SESSION_DATE_KEY);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (err) {
      console.warn('Erro ao limpar sessão:', err);
    }
    setCurrentUser(null);
    setIsLoginModalOpen(true);
    addToast('info', 'Sessão Encerrada', 'Você saiu da sua conta.');
  };

  const createUser = (userData: Omit<AgencyUser, 'id' | 'createdAt'>): AgencyUser => {
    const newUser: AgencyUser = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    firestoreSync.saveUser(newUser);
    addAuditLog('user_created', `Criou novo usuário "${newUser.name}" com nível de acesso "${newUser.role}".`, newUser.id, newUser.name);
    addToast('success', 'Usuário Criado', `Conta de ${newUser.name} criada. Você pode passar o login para ele(a).`);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<AgencyUser>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...updates };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        firestoreSync.saveUser(updated);
        return updated;
      }
      return u;
    }));
    addAuditLog('user_edited', `Atualizou dados do usuário "${updates.name || id}".`, id, updates.name);
    addToast('info', 'Usuário Atualizado', 'Dados do membro da equipe foram salvos.');
  };

  const deleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    if (target?.role === 'owner' && users.filter(u => u.role === 'owner').length <= 1) {
      addToast('error', 'Ação Não Permitida', 'Não é possível remover a única conta de Dona da agência.');
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    firestoreSync.deleteUser(id);
    if (currentUser?.id === id) {
      setCurrentUser(users.find(u => u.id !== id) || null);
    }
    addAuditLog('user_deleted', `Removeu o usuário "${target?.name || id}" da equipe.`, id, target?.name);
    addToast('info', 'Usuário Removido', `O acesso de ${target?.name || 'membro'} foi revogado.`);
  };

  const updateCurrentUserProfile = (updates: Partial<AgencyUser>) => {
    if (!currentUser) return;
    const updated: AgencyUser = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    firestoreSync.saveUser(updated);
    addAuditLog('user_edited', `Atualizou sua foto de perfil e informações pessoais.`, currentUser.id, currentUser.name);
    addToast('success', 'Perfil Atualizado', 'Sua foto e dados foram salvos com sucesso.');
  };

  const assignClientManager = (clientId: string, managerId: string, managerName: string) => {
    assignClientManagers(clientId, managerId ? [managerId] : []);
  };

  const assignClientManagers = (clientId: string, managerIds: string[]) => {
    const assignedUsers = users.filter(u => managerIds.includes(u.id));
    const names = assignedUsers.map(u => u.name);

    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const updated: Client = {
          ...c,
          assignedManagerIds: managerIds,
          assignedManagerNames: names,
          assignedManagerId: managerIds[0] || undefined,
          assignedManagerName: names.join(', ') || undefined,
        };
        firestoreSync.saveClient(updated);
        return updated;
      }
      return c;
    }));
    addAuditLog('client_edited', `Atualizou os responsáveis do cliente: ${names.join(', ') || 'Nenhum'}.`, clientId);
    addToast('success', 'Responsáveis Atualizados', `Responsáveis vinculados com sucesso.`);
  };

  const exportDatabaseBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      agencyConfig,
      users,
      clients,
      projects,
      posts,
      auditLogs,
      notifications,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aprovaflow-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast('success', 'Backup Exportado!', 'Arquivo JSON baixado com todos os clientes, publicações e histórico.');
  };

  const importDatabaseBackup = (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (data.clients && Array.isArray(data.clients)) setClients(data.clients);
      if (data.projects && Array.isArray(data.projects)) setProjects(data.projects);
      if (data.posts && Array.isArray(data.posts)) setPosts(data.posts);
      if (data.users && Array.isArray(data.users)) setUsers(data.users);
      if (data.auditLogs && Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      if (data.agencyConfig) setAgencyConfig(data.agencyConfig);
      if (data.notifications && Array.isArray(data.notifications)) setNotifications(data.notifications);

      addToast('success', 'Banco de Dados Restaurado!', 'Todos os dados foram recarregados com sucesso.');
      return true;
    } catch {
      addToast('error', 'Erro na Importação', 'Arquivo JSON de backup inválido.');
      return false;
    }
  };

  const updateAgencyConfig = (updates: Partial<AgencyConfig>) => {
    setAgencyConfig(prev => {
      const next = { ...prev, ...updates };
      // If primary color changed, update accent color appropriately
      if (updates.primaryColor && !updates.accentColor) {
        const found = THEME_COLOR_PRESETS.find(p => p.primary.toLowerCase() === updates.primaryColor?.toLowerCase());
        if (found) {
          next.accentColor = found.hover;
        }
      }
      firestoreSync.saveAgencyConfig(next);
      return next;
    });
    addAuditLog('theme_updated', 'Atualizou a identidade visual e cores da agência.');
    addToast('success', 'Configurações Salvas', 'Identidade visual da agência atualizada.');
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdByUserId: currentUser?.id,
      createdByUserName: currentUser?.name,
    };
    setClients(prev => [...prev, newClient]);
    setSelectedClientId(newClient.id);
    firestoreSync.saveClient(newClient);
    addAuditLog('client_created', `Cadastrou o cliente "${newClient.company}" (${newClient.name}).`, newClient.id, newClient.company);
    addToast('success', 'Cliente Cadastrado', `${newClient.name} foi adicionado à agência.`);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        firestoreSync.saveClient(updated);
        return updated;
      }
      return c;
    }));
    addAuditLog('client_edited', `Atualizou informações do cliente "${updates.company || id}".`, id, updates.company);
    addToast('info', 'Cliente Atualizado', 'As informações do cliente foram salvas.');
  };

  const deleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    const clientProjects = projects.filter(p => p.clientId === id);
    const clientProjectIds = new Set(clientProjects.map(p => p.id));
    const postsToDelete = posts.filter(p => p.clientId === id || clientProjectIds.has(p.projectId));
    const postIdsToDelete = new Set(postsToDelete.map(p => p.id));

    // Delete projects in Firestore
    clientProjects.forEach(p => firestoreSync.deleteProject(p.id));

    // Delete posts in Firestore
    postsToDelete.forEach(p => firestoreSync.deletePost(p.id));

    // Delete client in Firestore
    firestoreSync.deleteClient(id);

    // Delete notifications for this client and its posts in Firestore & state
    const notifsToDelete = notifications.filter(n => n.clientId === id || (n.postId && postIdsToDelete.has(n.postId)));
    notifsToDelete.forEach(n => firestoreSync.deleteNotification(n.id));
    setNotifications(prev => prev.filter(n => n.clientId !== id && (!n.postId || !postIdsToDelete.has(n.postId))));

    // Update states
    setClients(prev => prev.filter(c => c.id !== id));
    setProjects(prev => prev.filter(p => p.clientId !== id));
    setPosts(prev => prev.filter(p => p.clientId !== id && !clientProjectIds.has(p.projectId)));

    if (selectedClientId === id) {
      const remaining = clients.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setSelectedClientId(remaining[0].id);
      } else {
        setSelectedClientId('');
      }
    }
    addAuditLog('client_deleted', `Removeu o cliente "${client?.company || id}" e todas as suas demandas.`, id, client?.company);
    addToast('info', 'Cliente Removido', `${client?.name || 'Cliente'} e suas publicações foram removidos.`);
  };

  const addProject = (projData: Omit<FolderProject, 'id' | 'createdAt' | 'clientAccessKey' | 'supportDocs'>): FolderProject => {
    const cleanKey = projData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'projeto';
    
    const uniqueKey = `${cleanKey}-${Math.random().toString(36).substring(2, 6)}`;

    const newProject: FolderProject = {
      ...projData,
      id: `proj-${Date.now()}`,
      clientAccessKey: uniqueKey,
      supportDocs: [],
      createdAt: new Date().toISOString(),
      createdByUserId: currentUser?.id,
      createdByUserName: currentUser?.name,
    };

    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    firestoreSync.saveProject(newProject);
    addAuditLog('project_created', `Criou a pasta de projeto "${newProject.name}".`, newProject.id, newProject.name);
    addToast('success', 'Pasta de Projeto Criada', `Pasta "${newProject.name}" pronta para receber posts.`);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<FolderProject>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        firestoreSync.saveProject(updated);
        return updated;
      }
      return p;
    }));
    addAuditLog('project_edited', `Atualizou a pasta de projeto "${updates.name || id}".`, id, updates.name);
    addToast('info', 'Projeto Atualizado', 'Alterações na pasta salvas com sucesso.');
  };

  const deleteProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    const postsToDelete = posts.filter(p => p.projectId === id);
    const postIdsToDelete = new Set(postsToDelete.map(p => p.id));

    firestoreSync.deleteProject(id);
    postsToDelete.forEach(p => firestoreSync.deletePost(p.id));

    const notifsToDelete = notifications.filter(n => n.postId && postIdsToDelete.has(n.postId));
    notifsToDelete.forEach(n => firestoreSync.deleteNotification(n.id));
    setNotifications(prev => prev.filter(n => !n.postId || !postIdsToDelete.has(n.postId)));

    setProjects(prev => prev.filter(p => p.id !== id));
    setPosts(prev => prev.filter(p => p.projectId !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
    addToast('info', 'Pasta Removida', `A pasta "${proj?.name || ''}" e suas demandas foram excluídas.`);
  };

  const addSupportDocToProject = (projectId: string, doc: Omit<SupportDocument, 'id' | 'uploadDate'>) => {
    const newDoc: SupportDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString(),
    };
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, supportDocs: [...p.supportDocs, newDoc] };
      }
      return p;
    }));
    addToast('success', 'Documento Anexado', `Arquivo "${doc.name}" adicionado à pasta do projeto.`);
  };

  const deleteSupportDocFromProject = (projectId: string, docId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, supportDocs: p.supportDocs.filter(d => d.id !== docId) };
      }
      return p;
    }));
  };

  const addPost = (postData: Omit<PostContent, 'id' | 'createdAt' | 'comments'>): PostContent => {
    const newPost: PostContent = {
      ...postData,
      id: `post-${Date.now()}`,
      comments: [],
      createdAt: new Date().toISOString(),
      createdByUserId: currentUser?.id,
      createdByUserName: currentUser?.name,
    };
    setPosts(prev => [newPost, ...prev]);
    firestoreSync.savePost(newPost);

    // Send notification
    const client = clients.find(c => c.id === newPost.clientId);
    const project = projects.find(p => p.id === newPost.projectId);

    addNotification({
      recipient: 'client',
      title: 'Novo Conteúdo Adicionado',
      message: `Novo post "${newPost.title}" adicionado no projeto ${project?.name || ''}.`,
      type: 'new_content',
      targetPhone: client?.phone,
      postId: newPost.id,
      projectId: newPost.projectId,
      clientId: newPost.clientId,
    });

    const scheduledDateObj = new Date(newPost.scheduledDate);
    const dateFormatted = !isNaN(scheduledDateObj.getTime())
      ? scheduledDateObj.toLocaleDateString('pt-BR')
      : newPost.scheduledDate;

    addAuditLog('post_created', `Criou a demanda de post "${newPost.title}" agendada para ${dateFormatted}.`, newPost.id, newPost.title);
    addToast('success', 'Conteúdo Publicado', 'O post foi adicionado e está disponível para aprovação.');
    return newPost;
  };

  const updatePost = (id: string, updates: Partial<PostContent>) => {
    const prevPost = posts.find(p => p.id === id);
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        firestoreSync.savePost(updated);
        return updated;
      }
      return p;
    }));

    if (prevPost && prevPost.status === 'changes_requested' && (updates.status === 'pending_approval' || (updates.mediaUrls && updates.mediaUrls !== prevPost.mediaUrls))) {
      addNotification({
        recipient: 'client',
        title: 'Solicitação de Ajuste Respondida',
        message: `As alterações em "${prevPost.title}" foram concluídas pela agência e o post está pronto para nova revisão.`,
        type: 'new_content',
        postId: prevPost.id,
        projectId: prevPost.projectId,
        clientId: prevPost.clientId,
        authorName: currentUser?.name || 'Agência',
        authorRole: 'Agência',
      });
    }

    addAuditLog('post_edited', `Editou o post "${updates.title || id}".`, id, updates.title);
    addToast('info', 'Conteúdo Atualizado', 'As alterações do post foram salvas.');
  };

  const deletePost = (id: string) => {
    const post = posts.find(p => p.id === id);
    setPosts(prev => prev.filter(p => p.id !== id));
    firestoreSync.deletePost(id);

    // Automatically remove notifications belonging to this post
    const notifsToDelete = notifications.filter(n => n.postId === id || (post && n.message.includes(post.title)));
    notifsToDelete.forEach(n => firestoreSync.deleteNotification(n.id));
    setNotifications(prev => prev.filter(n => n.postId !== id && (!post || !n.message.includes(post.title))));

    addAuditLog('post_deleted', `Excluiu o post "${post?.title || id}".`, id, post?.title);
    addToast('info', 'Conteúdo Removido', 'O post foi removido com sucesso.');
  };

  const approvePost = (postId: string, approvedByName?: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const client = clients.find(c => c.id === post.clientId);
    const approver = approvedByName || currentUser?.name || client?.name || 'Cliente';
    const authorRole = currentUser ? (currentUser.role === 'owner' ? 'Dona' : 'Agência') : 'Cliente';

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated: PostContent = {
          ...p,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: approver,
          requestedChangesNote: undefined,
        };
        firestoreSync.savePost(updated);
        return updated;
      }
      return p;
    }));

    // Find all assigned managers for this client
    const assignedIds = client?.assignedManagerIds || (client?.assignedManagerId ? [client.assignedManagerId] : []);
    const assignedManagers = users.filter(u => assignedIds.includes(u.id));
    const targetPhones = assignedManagers.map(m => m.phone).filter(Boolean) as string[];
    const fallbackPhone = targetPhones[0] || agencyConfig.accountManagerPhone;

    addNotification({
      recipient: 'agency',
      title: '🎉 Conteúdo Aprovado!',
      message: `${approver} (${authorRole}) aprovou o post "${post.title}". Pronto para publicação!`,
      type: 'approval',
      targetPhone: fallbackPhone,
      postId: post.id,
      clientId: post.clientId,
      authorName: approver,
      authorRole: authorRole,
    });

    addAuditLog('post_approved', `Aprovou o post "${post.title}".`, post.id, post.title);
  };

  const requestChangesPost = (postId: string, note: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const client = clients.find(c => c.id === post.clientId);
    const authorName = currentUser?.name || client?.name || 'Cliente';
    const authorRole = currentUser ? (currentUser.role === 'owner' ? 'Dona' : 'Agência') : 'Cliente';

    const newComment: CommentItem = {
      id: `comm-${Date.now()}`,
      postId,
      authorRole: currentUser ? 'agency' : 'client',
      authorName,
      text: `[SOLICITAÇÃO DE AJUSTE]: ${note}`,
      timestamp: new Date().toISOString(),
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated: PostContent = {
          ...p,
          status: 'changes_requested',
          requestedChangesNote: note,
          comments: [...p.comments, newComment],
        };
        firestoreSync.savePost(updated);
        return updated;
      }
      return p;
    }));

    // Find all assigned managers for this client to receive WhatsApp notification
    const assignedIds = client?.assignedManagerIds || (client?.assignedManagerId ? [client.assignedManagerId] : []);
    const assignedManagers = users.filter(u => assignedIds.includes(u.id));
    const targetPhones = assignedManagers.map(m => m.phone).filter(Boolean) as string[];
    const fallbackPhone = targetPhones[0] || agencyConfig.accountManagerPhone;

    addNotification({
      recipient: 'agency',
      title: '⚠️ Ajustes Solicitados',
      message: `${authorName} (${authorRole}) solicitou alterações em "${post.title}": "${note.slice(0, 70)}..."`,
      type: 'changes',
      targetPhone: fallbackPhone,
      postId: post.id,
      clientId: post.clientId,
      authorName: authorName,
      authorRole: authorRole,
    });

    addAuditLog('post_changes_requested', `Solicitou alterações em "${post.title}": "${note.slice(0, 80)}"`, post.id, post.title);
  };

  const addComment = (postId: string, authorRole: 'agency' | 'client', authorName: string, text: string) => {
    const finalAuthorName = authorRole === 'agency' && currentUser ? currentUser.name : authorName;
    const finalRoleLabel = authorRole === 'agency' ? 'Agência' : 'Cliente';
    const newComment: CommentItem = {
      id: `comm-${Date.now()}`,
      postId,
      authorRole,
      authorName: finalAuthorName,
      text,
      timestamp: new Date().toISOString(),
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated: PostContent = {
          ...p,
          comments: [...p.comments, newComment],
        };
        firestoreSync.savePost(updated);
        return updated;
      }
      return p;
    }));

    const post = posts.find(p => p.id === postId);
    const client = clients.find(c => c.id === post?.clientId);
    const recipient = authorRole === 'agency' ? 'client' : 'agency';

    // Find assigned manager's phone if sent to agency
    const assignedIds = client?.assignedManagerIds || (client?.assignedManagerId ? [client.assignedManagerId] : []);
    const assignedManagers = users.filter(u => assignedIds.includes(u.id));
    const targetPhone = recipient === 'agency'
      ? (assignedManagers[0]?.phone || agencyConfig.accountManagerPhone)
      : client?.phone;

    const isAgencyAuthor = authorRole === 'agency';
    const notifTitle = isAgencyAuthor 
      ? `Ajuste respondido pela Agência (${finalAuthorName})` 
      : `Novo comentário de ${finalAuthorName}`;

    addNotification({
      recipient,
      title: notifTitle,
      message: `Em "${post?.title || 'Conteúdo'}": ${text.slice(0, 70)}`,
      type: 'comment',
      targetPhone,
      postId: post?.id,
      projectId: post?.projectId,
      clientId: post?.clientId,
      authorName: finalAuthorName,
      authorRole: finalRoleLabel,
    });

    addAuditLog('comment_added', `Comentou em "${post?.title || 'post'}": "${text.slice(0, 70)}..."`, post?.id, post?.title);
  };

  const deleteComment = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated: PostContent = {
          ...p,
          comments: p.comments.filter(c => c.id !== commentId),
        };
        firestoreSync.savePost(updated);
        return updated;
      }
      return p;
    }));
    addToast('info', 'Mensagem Excluída', 'O comentário foi removido com sucesso.');
  };

  const clearPostComments = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updated: PostContent = {
          ...p,
          comments: [],
        };
        firestoreSync.savePost(updated);
        return updated;
      }
      return p;
    }));
    addToast('info', 'Conversa Limpa', 'Todas as mensagens deste post foram excluídas.');
  };

  const openNewPostModal = (clientId?: string, projectId?: string) => {
    if (clientId) setSelectedClientId(clientId);
    if (projectId) setSelectedProjectId(projectId);
    setEditingPost(null);
    setIsContentModalOpen(true);
  };

  const openEditPostModal = (post: PostContent) => {
    setSelectedClientId(post.clientId);
    setSelectedProjectId(post.projectId);
    setEditingPost(post);
    setIsContentModalOpen(true);
  };

  const closeContentModal = () => {
    setIsContentModalOpen(false);
    setEditingPost(null);
  };

  const openClientPortalByProject = (projectKey: string, mode: 'client' | 'agency' = 'agency') => {
    setPortalProjectKey(projectKey);
    setPortalMode(mode);
    setCurrentView('client_portal');

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'portal');
      url.searchParams.set('project', projectKey);
      if (mode === 'agency') {
        url.searchParams.set('mode', 'agency');
      } else {
        url.searchParams.delete('mode');
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn(e);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnToAgencyView = () => {
    setCurrentView('agency');
    setPortalMode('agency');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('project');
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        createUser,
        updateUser,
        deleteUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isTeamModalOpen,
        setIsTeamModalOpen,
        isAuditModalOpen,
        setIsAuditModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        updateCurrentUserProfile,
        assignClientManager,
        assignClientManagers,
        auditLogs,
        addAuditLog,
        clearAuditLogs,
        deleteAuditLogItem,
        selectedMonthFilter,
        setSelectedMonthFilter,
        availableMonths,
        exportDatabaseBackup,
        importDatabaseBackup,
        agencyConfig,
        updateAgencyConfig,
        clients,
        addClient,
        updateClient,
        deleteClient,
        selectedClientId,
        setSelectedClientId,
        selectedClient,
        projects,
        addProject,
        updateProject,
        deleteProject,
        selectedProjectId,
        setSelectedProjectId,
        selectedProject,
        addSupportDocToProject,
        deleteSupportDocFromProject,
        posts,
        addPost,
        updatePost,
        deletePost,
        approvePost,
        requestChangesPost,
        addComment,
        deleteComment,
        clearPostComments,
        isContentModalOpen,
        setIsContentModalOpen,
        editingPost,
        setEditingPost,
        openNewPostModal,
        openEditPostModal,
        closeContentModal,
        notifications,
        addNotification,
        markNotificationsAsRead,
        markMultipleNotificationsAsRead,
        clearNotifications,
        agencyPage,
        setAgencyPage,
        openClientDetailPage,
        openHome,
        currentView,
        setCurrentView,
        portalProjectKey,
        setPortalProjectKey,
        portalMode,
        setPortalMode,
        openClientPortalByProject,
        returnToAgencyView,
        toasts,
        addToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
