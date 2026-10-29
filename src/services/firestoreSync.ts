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
        const ownerExists = usersSnap.docs.some(d => (d.data() as AgencyUser).email?.toLowerCase() === 'jlvp
