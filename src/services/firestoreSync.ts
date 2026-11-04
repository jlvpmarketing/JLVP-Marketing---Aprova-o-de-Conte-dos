import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db, testFirestoreConnection } from '../firebase';
import { Client, FolderProject, PostContent, AgencyUser, AuditLogItem, AgencyConfig, NotificationItem, GeneralChatMessage, MediaItem } from '../types';
import { isDriveVideoUrl, isVideoUrl, normalizePostFromFirestore, normalizePostStatus } from '../utils/contentTypeHelper';
import { uploadToCloudinary } from './cloudinary';

let isFirestoreConnected = false;

// Check connection
testFirestoreConnection().then(connected => {
  isFirestoreConnected = connected;
  if (connected) {
    console.log('⚡ Conectado ao Firebase Firestore com sucesso.');
  }
}).catch(err => {
  console.warn('Modo offline do Firestore ativado:', err);
});

export function sanitizeForFirestore<T>(data: T): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item));
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

import { mediaStorage } from './mediaStorage';

export const firestoreSync = {
  isConnected: () => isFirestoreConnected,

  // Initial seed to Firestore if collections are empty
  async seedInitialIfEmpty(
    initialClients: Client[], 
    initialProjects: FolderProject[], 
    _initialPosts: PostContent[],
    initialUsers: AgencyUser[],
    initialLogs: AuditLogItem[],
    initialConfig: AgencyConfig
  ) {
    try {
      // 1. Clients
      const clientsSnap = await getDocs(collection(db, 'clients'));
      if (clientsSnap.empty && initialClients.length > 0) {
        for (const c of initialClients) {
          await setDoc(doc(db, 'clients', c.id), c);
        }
      }

      // 2. Projects
      const projectsSnap = await getDocs(collection(db, 'projects'));
      if (projectsSnap.empty && initialProjects.length > 0) {
        for (const p of initialProjects) {
          await setDoc(doc(db, 'projects', p.id), p);
        }
      }

      // 3. Posts - NEVER seed mock posts! Also clean up old demo posts if present.
      try {
        const mockPostIds = ['post-1', 'post-2', 'post-3', 'post-4', 'post-5', 'post-6'];
        for (const mId of mockPostIds) {
          await deleteDoc(doc(db, 'posts', mId));
        }
      } catch (cleanErr) {
        console.warn('Limpeza de posts mock:', cleanErr);
      }

      // 4. Agency Users - check and ensure owner is present
      const usersSnap = await getDocs(collection(db, 'agency_users'));
      if (usersSnap.empty) {
        for (const u of initialUsers) {
          await setDoc(doc(db, 'agency_users', u.id), u);
        }
      } else {
        // Ensure owner Paloma Garcia exists in Firestore agency_users
        const ownerExists = usersSnap.docs.some(d => (d.data() as AgencyUser).email?.toLowerCase() === 'jlvpmarketing@gmail.com');
        if (!ownerExists && initialUsers.length > 0) {
          const ownerUser = initialUsers.find(u => u.email === 'jlvpmarketing@gmail.com') || initialUsers[0];
          await setDoc(doc(db, 'agency_users', ownerUser.id), ownerUser);
        }
      }

      // 5. Audit logs
      const logsSnap = await getDocs(collection(db, 'audit_logs'));
      if (logsSnap.empty && initialLogs.length > 0) {
        for (const l of initialLogs) {
          await setDoc(doc(db, 'audit_logs', l.id), l);
        }
      }

      // 6. Config
      const configDoc = await getDocs(collection(db, 'agency_config'));
      if (configDoc.empty) {
        await setDoc(doc(db, 'agency_config', 'main'), initialConfig);
      }
      console.log('⚡ Verificação de dados do Firestore concluída.');
    } catch (e) {
      console.warn('Não foi possível verificar ou popular dados no Firestore:', e);
    }
  },

  // Direct fetch for instant authentication verification across all devices
  async fetchAllUsers(): Promise<AgencyUser[]> {
    try {
      const snap = await getDocs(collection(db, 'agency_users'));
      return snap.docs.map(doc => doc.data() as AgencyUser);
    } catch (err) {
      console.warn('Erro ao buscar usuários do Firestore:', err);
      return [];
    }
  },

  // Save/Update Post (guaranteed remote Firestore persistence + local caching)
  async savePost(post: PostContent): Promise<{ success: boolean; error?: string }> {
    try {
      let finalPost = { ...post };

      // Ensure post has updated timestamp
      if (!finalPost.updatedAt) {
        finalPost.updatedAt = new Date().toISOString();
      }

      // Ensure media array of {url, type} is always populated and free of base64
      if (finalPost.media && finalPost.media.length > 0) {
        finalPost.media = await Promise.all(
          finalPost.media.map(async (m: MediaItem) => {
            let url = m.url || '';
            let type: 'image' | 'video' = m.type === 'video' ? 'video' : 'image';
            if (url.startsWith('data:')) {
              try {
                const uploaded = await uploadToCloudinary(url, m.name);
                url = uploaded.url;
                type = uploaded.type;
              } catch (uErr) {
                console.warn('Erro ao enviar mídia ao Cloudinary:', uErr);
              }
            }
            return {
              url,
              type,
              ...(m.name ? { name: m.name } : {}),
              ...(m.driveFileId ? { driveFileId: m.driveFileId } : {}),
            };
          })
        );
        finalPost.mediaUrls = finalPost.media.map(m => m.url);
      } else if (finalPost.mediaUrls && finalPost.mediaUrls.length > 0) {
        const processedMedia: MediaItem[] = await Promise.all(
          finalPost.mediaUrls.map(async (url: string) => {
            let finalUrl = url;
            let finalType: 'image' | 'video' = isVideoUrl(url) ? 'video' : 'image';
            if (url.startsWith('data:')) {
              try {
                const uploaded = await uploadToCloudinary(url);
                finalUrl = uploaded.url;
                finalType = uploaded.type;
              } catch (uErr) {
                console.warn('Erro ao enviar base64 para o Cloudinary:', uErr);
              }
            }
            return {
              url: finalUrl,
              type: finalType,
            };
          })
        );
        finalPost.media = processedMedia;
        finalPost.mediaUrls = processedMedia.map(m => m.url);
      }

      const cleanData = sanitizeForFirestore(finalPost);

      // Direct Firestore write without artificial timeout
      await setDoc(doc(db, 'posts', finalPost.id), cleanData, { merge: true });
      console.log('✅ Post gravado no Firestore com sucesso e compartilhado:', finalPost.id);
      return { success: true };
    } catch (err: any) {
      console.error('❌ Erro ao salvar post no Firestore:', err?.message || err);
      return { success: false, error: err?.message || 'Falha ao salvar no Firestore' };
    }
  },

  // Delete Post
  async deletePost(postId: string) {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      console.log('🗑️ Post removido do Firestore:', postId);
    } catch (err) {
      console.warn('Erro ao remover post do Firestore:', err);
    }
  },

  // Save/Update Client
  async saveClient(client: Client) {
    try {
      const cleanData = sanitizeForFirestore(client);
      await setDoc(doc(db, 'clients', client.id), cleanData, { merge: true });
      console.log('✅ Cliente gravado no Firestore:', client.id);
    } catch (err) {
      console.error('❌ Erro ao salvar cliente no Firestore:', err);
    }
  },

  // Delete Client
  async deleteClient(clientId: string) {
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      console.log('🗑️ Cliente removido do Firestore:', clientId);
    } catch (err) {
      console.warn('Erro ao remover cliente do Firestore:', err);
    }
  },

  // Save/Update Project
  async saveProject(project: FolderProject) {
    try {
      const cleanData = sanitizeForFirestore(project);
      await setDoc(doc(db, 'projects', project.id), cleanData, { merge: true });
      console.log('✅ Projeto gravado no Firestore:', project.id);
    } catch (err) {
      console.error('❌ Erro ao salvar projeto no Firestore:', err);
    }
  },

  // Delete Project
  async deleteProject(projectId: string) {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      console.log('🗑️ Projeto removido do Firestore:', projectId);
    } catch (err) {
      console.warn('Erro ao remover projeto do Firestore:', err);
    }
  },

  // Save/Update User
  async saveUser(user: AgencyUser) {
    try {
      const cleanData = sanitizeForFirestore(user);
      await setDoc(doc(db, 'agency_users', user.id), cleanData, { merge: true });
      console.log('✅ Usuário gravado no Firestore:', user.id);
    } catch (err) {
      console.error('❌ Erro ao salvar usuário no Firestore:', err);
    }
  },

  // Delete User
  async deleteUser(userId: string) {
    try {
      await deleteDoc(doc(db, 'agency_users', userId));
    } catch (err) {
      console.warn('Erro ao remover usuário do Firestore:', err);
    }
  },

  // Save Audit Log
  async saveAuditLog(log: AuditLogItem) {
    try {
      await setDoc(doc(db, 'audit_logs', log.id), log);
    } catch (err) {
      console.warn('Erro ao sincronizar log de auditoria no Firestore:', err);
    }
  },

  // Delete Audit Log
  async deleteAuditLog(logId: string) {
    try {
      await deleteDoc(doc(db, 'audit_logs', logId));
    } catch (err) {
      console.warn('Erro ao remover log do Firestore:', err);
    }
  },

  // Save Agency Config
  async saveAgencyConfig(config: AgencyConfig) {
    try {
      const cleanData = sanitizeForFirestore(config);
      await setDoc(doc(db, 'agency_config', 'main'), cleanData, { merge: true });
    } catch (err) {
      console.warn('Erro ao salvar configurações da agência no Firestore:', err);
    }
  },

  // Save Notification
  async saveNotification(notif: NotificationItem) {
    try {
      const cleanData = sanitizeForFirestore(notif);
      await setDoc(doc(db, 'notifications', notif.id), cleanData, { merge: true });
    } catch (err) {
      console.warn('Erro ao salvar notificação no Firestore:', err);
    }
  },

  // Delete Notification
  async deleteNotification(notifId: string) {
    try {
      await deleteDoc(doc(db, 'notifications', notifId));
    } catch (err) {
      console.warn('Erro ao remover notificação do Firestore:', err);
    }
  },

  // Real-time listener for clients
  subscribeToClients(onUpdate: (clients: Client[]) => void) {
    try {
      return onSnapshot(collection(db, 'clients'), (snapshot) => {
        const loadedClients = snapshot.docs.map(doc => doc.data() as Client);
        onUpdate(loadedClients);
      }, (err) => {
        console.warn('Assinatura de clientes falhou:', err);
      });
    } catch {
      return () => {};
    }
  },

  // Real-time listener for projects
  subscribeToProjects(onUpdate: (projects: FolderProject[]) => void) {
    try {
      return onSnapshot(collection(db, 'projects'), (snapshot) => {
        const loadedProjects = snapshot.docs.map(doc => doc.data() as FolderProject);
        onUpdate(loadedProjects);
      }, (err) => {
        console.warn('Assinatura de projetos falhou:', err);
      });
    } catch {
      return () => {};
    }
  },

  // Real-time listener for posts
  subscribeToPosts(onUpdate: (posts: PostContent[]) => void) {
    try {
      return onSnapshot(collection(db, 'posts'), (snapshot) => {
        const loadedPosts = snapshot.docs.map(doc => normalizePostFromFirestore(doc.data(), doc.id));
        console.log('Dados recebidos do banco:', loadedPosts);
        onUpdate(loadedPosts);
      }, (err) => {
        console.warn('Assinatura de posts falhou:', err);
      });
    } catch (err) {
      console.warn('Erro ao criar listener de posts:', err);
      return () => {};
    }
  },

  // Real-time listener for users
  subscribeToUsers(onUpdate: (users: AgencyUser[]) => void) {
    try {
      return onSnapshot(collection(db, 'agency_users'), (snapshot) => {
        const loadedUsers = snapshot.docs.map(doc => doc.data() as AgencyUser);
        onUpdate(loadedUsers);
      }, (err) => {
        console.warn('Assinatura de usuários falhou:', err);
      });
    } catch {
      return () => {};
    }
  },

  // Real-time listener for agency config
  subscribeToAgencyConfig(onUpdate: (config: AgencyConfig) => void) {
    try {
      return onSnapshot(doc(db, 'agency_config', 'main'), (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as AgencyConfig);
        }
      }, (err) => {
        console.warn('Assinatura de configurações falhou:', err);
      });
    } catch {
      return () => {};
    }
  },

  // Save General Chat Message
  async saveChatMessage(message: GeneralChatMessage) {
    try {
      const cleanData = sanitizeForFirestore(message);
      await setDoc(doc(db, 'chat_messages', message.id), cleanData, { merge: true });
      return { success: true };
    } catch (err: any) {
      console.warn('Erro ao salvar mensagem de chat no Firestore:', err);
      return { success: false, error: err?.message };
    }
  },

  // Delete specific chat message
  async deleteChatMessage(messageId: string) {
    try {
      await deleteDoc(doc(db, 'chat_messages', messageId));
      return { success: true };
    } catch (err: any) {
      console.warn('Erro ao remover mensagem do Firestore:', err);
      return { success: false, error: err?.message };
    }
  },

  // Clear all chat messages for a specific client
  async clearClientChat(clientId: string) {
    try {
      const q = query(collection(db, 'chat_messages'), where('clientId', '==', clientId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'chat_messages', d.id));
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Erro ao limpar conversa no Firestore:', err);
      return { success: false, error: err?.message };
    }
  },

  // Subscribe to real-time chat messages for a specific client
  subscribeToClientChat(clientId: string, onUpdate: (messages: GeneralChatMessage[]) => void) {
    try {
      const q = query(collection(db, 'chat_messages'), where('clientId', '==', clientId));
      return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(d => d.data() as GeneralChatMessage);
        // Sort chronologically ascending
        msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        onUpdate(msgs);
      }, (err) => {
        console.warn('Assinatura de mensagens de chat falhou:', err);
      });
    } catch {
      return () => {};
    }
  },

  // Direct fetch methods directly via Firebase SDK (No HTTP fetch API calls)
  async fetchAllPosts(): Promise<PostContent[]> {
    try {
      const snap = await getDocs(collection(db, 'posts'));
      const posts = snap.docs.map(d => normalizePostFromFirestore(d.data(), d.id));
      console.log('Dados recebidos do banco:', posts);
      return posts;
    } catch (err) {
      console.warn('Erro ao consultar posts no Firestore:', err);
      return [];
    }
  },

  async fetchAllProjects(): Promise<FolderProject[]> {
    try {
      const snap = await getDocs(collection(db, 'projects'));
      return snap.docs.map(d => ({ ...d.data(), id: d.id || d.data().id } as FolderProject));
    } catch (err) {
      console.warn('Erro ao consultar projetos no Firestore:', err);
      return [];
    }
  },

  async fetchAllClients(): Promise<Client[]> {
    try {
      const snap = await getDocs(collection(db, 'clients'));
      return snap.docs.map(d => ({ ...d.data(), id: d.id || d.data().id } as Client));
    } catch (err) {
      console.warn('Erro ao consultar clientes no Firestore:', err);
      return [];
    }
  },

  // Direct portal data loader using Firebase SDK exclusively
  async fetchDirectPortalData(keyLower: string): Promise<{
    project: FolderProject | null;
    client: Client | null;
    posts: PostContent[];
  } | null> {
    try {
      const [projectsSnap, clientsSnap, postsSnap] = await Promise.all([
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'clients')),
        getDocs(collection(db, 'posts'))
      ]);

      const allProjects = projectsSnap.docs.map(d => ({ ...d.data(), id: d.id || d.data().id } as FolderProject));
      const allClients = clientsSnap.docs.map(d => ({ ...d.data(), id: d.id || d.data().id } as Client));
      const allPosts = postsSnap.docs.map(d => normalizePostFromFirestore(d.data(), d.id));
      console.log('Dados recebidos do banco:', allPosts);

      if (allProjects.length === 0) return null;

      const safeKey = (keyLower || '').trim().toLowerCase();
      let matchedProj: FolderProject | null = null;

      if (safeKey) {
        matchedProj = allProjects.find(p =>
          (p.clientAccessKey && p.clientAccessKey.trim().toLowerCase() === safeKey) ||
          (p.id && p.id.trim().toLowerCase() === safeKey) ||
          (p.name && p.name.trim().toLowerCase() === safeKey)
        ) || null;

        if (!matchedProj) {
          matchedProj = allProjects.find(p =>
            p.clientAccessKey && p.clientAccessKey.toLowerCase().includes(safeKey)
          ) || null;
        }

        // Also check if safeKey matches a client's company or name
        if (!matchedProj) {
          const matchedCli = allClients.find(c =>
            (c.id && c.id.toLowerCase() === safeKey) ||
            (c.company && c.company.trim().toLowerCase() === safeKey) ||
            (c.name && c.name.trim().toLowerCase() === safeKey)
          );
          if (matchedCli) {
            matchedProj = allProjects.find(p => p.clientId === matchedCli.id) || null;
          }
        }
      }

      if (!matchedProj) {
        matchedProj = allProjects[0];
      }

      const matchedClient = allClients.find(c => c.id === matchedProj!.clientId) || null;

      // Match posts by projectId, or by clientId as a safe fallback
      const matchedPosts = allPosts.filter(p => {
        if (!p) return false;
        if (matchedProj && p.projectId && p.projectId === matchedProj.id) return true;
        if (matchedClient && p.clientId && p.clientId === matchedClient.id) return true;
        return false;
      });

      return {
        project: matchedProj,
        client: matchedClient,
        posts: matchedPosts
      };
    } catch (err) {
      console.warn('Erro ao consultar portal no Firestore:', err);
      return null;
    }
  }
};
