import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, testFirestoreConnection } from '../firebase';
import { Client, FolderProject, PostContent, AgencyUser, AuditLogItem, AgencyConfig, NotificationItem } from '../types';

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

export const firestoreSync = {
  isConnected: () => isFirestoreConnected,

  // Initial seed to Firestore if collections are empty
  async seedInitialIfEmpty(
    initialClients: Client[], 
    initialProjects: FolderProject[], 
    initialPosts: PostContent[],
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

      // 3. Posts
      const postsSnap = await getDocs(collection(db, 'posts'));
      if (postsSnap.empty && initialPosts.length > 0) {
        for (const post of initialPosts) {
          await setDoc(doc(db, 'posts', post.id), post);
        }
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

  // Save/Update Post
  async savePost(post: PostContent) {
    try {
      const cleanData = sanitizeForFirestore(post);
      await setDoc(doc(db, 'posts', post.id), cleanData, { merge: true });
      console.log('✅ Post gravado no Firestore:', post.id);
    } catch (err) {
      console.error('❌ Erro ao salvar post no Firestore:', err);
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
        const loadedPosts = snapshot.docs.map(doc => doc.data() as PostContent);
        onUpdate(loadedPosts);
      }, (err) => {
        console.warn('Assinatura de posts falhou:', err);
      });
    } catch {
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
  }
};
