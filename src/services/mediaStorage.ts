import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { serverSync } from './serverSync';

const CHUNK_SIZE = 600 * 1024; // 600 KB per chunk (well within Firestore's 1MB limit)
const DB_NAME = 'aprovaflow_media_store_v1';
const STORE_NAME = 'media_blobs';

// Open IndexedDB database
function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const idb = req.result;
      if (!idb.objectStoreNames.contains(STORE_NAME)) {
        idb.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Get blob from IndexedDB
async function getFromIndexedDB(key: string): Promise<string | null> {
  try {
    const idb = await openMediaDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Save blob / data to IndexedDB
async function saveToIndexedDB(key: string, dataUrl: string): Promise<void> {
  try {
    const idb = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falha ao salvar no IndexedDB:', err);
  }
}

// In-memory cache of resolved blob URLs
const resolvedUrlCache = new Map<string, string>();

export const mediaStorage = {
  // Check if a URL is a chunk reference
  isChunkRef(url?: string): boolean {
    if (!url) return false;
    return url.startsWith('chunkref:') || url.startsWith('video_chunkref:');
  },

  // Extract media ID from a chunk reference
  getMediaId(url: string): string {
    return url.replace(/^(video_chunkref|chunkref):/, '');
  },

  // Generate a thumbnail frame from a video data URL or File
  async generateVideoThumbnail(videoDataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = videoDataUrl;
        video.muted = true;
        video.playsInline = true;
        video.currentTime = 0.5;

        video.onloadeddata = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(video.videoWidth || 640, 720);
            canvas.height = Math.min(video.videoHeight || 900, 900);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.65));
              return;
            }
          } catch {
            // fallback
          }
          resolve('');
        };
        video.onerror = () => resolve('');
        setTimeout(() => resolve(''), 3000); // 3s timeout safe fallback
      } catch {
        resolve('');
      }
    });
  },

  // Save large media (video or big file) to Server disk (/data/media/) and cache locally
  async storeMedia(dataUrl: string, mimeType: string = 'video/mp4'): Promise<string> {
    // If it's already a hosted URL or small data url (< 150KB), return as is
    if (dataUrl.startsWith('/api/media/') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      return dataUrl;
    }

    // Attempt direct server upload so both client phone and agency share the exact same media
    try {
      const serverUrl = await serverSync.uploadMedia(dataUrl, mimeType);
      if (serverUrl && serverUrl.startsWith('/api/media/')) {
        resolvedUrlCache.set(serverUrl, serverUrl);
        return serverUrl;
      }
    } catch (err) {
      console.warn('Erro ao enviar mídia ao servidor, aplicando fallback local:', err);
    }

    if (this.isChunkRef(dataUrl) || dataUrl.length < 200 * 1024) {
      return dataUrl;
    }

    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const chunkRef = mimeType.startsWith('video') ? `video_chunkref:${mediaId}` : `chunkref:${mediaId}`;

    // Cache locally in IndexedDB as resilience fallback
    resolvedUrlCache.set(chunkRef, dataUrl);
    try {
      await saveToIndexedDB(mediaId, dataUrl);
    } catch {}

    return chunkRef;
  },

  // Resolve a chunkref to a playable/displayable URL
  async resolveMedia(url: string): Promise<string> {
    if (!url) return '';
    if (!this.isChunkRef(url)) {
      return url;
    }

    // Check in-memory cache first
    if (resolvedUrlCache.has(url)) {
      return resolvedUrlCache.get(url)!;
    }

    const mediaId = this.getMediaId(url);

    // Check IndexedDB next
    const cachedData = await getFromIndexedDB(mediaId);
    if (cachedData) {
      resolvedUrlCache.set(url, cachedData);
      // Attempt to upgrade to server URL in background
      serverSync.uploadMedia(cachedData, url.startsWith('video') ? 'video/mp4' : 'image/jpeg')
        .catch(() => {});
      return cachedData;
    }

    // Check if server disk has this media file
    try {
      const serverMediaUrl = `/api/media/${mediaId}.mp4`;
      const checkRes = await fetch(serverMediaUrl, { method: 'HEAD' });
      if (checkRes.ok) {
        resolvedUrlCache.set(url, serverMediaUrl);
        return serverMediaUrl;
      }
    } catch {}

    // Fetch chunks from Firestore with timeout fallback
    try {
      const chunksQuery = query(
        collection(db, 'media_chunks'),
        where('mediaId', '==', mediaId)
      );
      const queryPromise = getDocs(chunksQuery);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const snap = await Promise.race([queryPromise, timeoutPromise]);

      if (snap && 'docs' in snap && !snap.empty) {
        const chunks = snap.docs
          .map(d => d.data() as { index: number; chunk: string; mimeType: string })
          .sort((a, b) => a.index - b.index);

        const fullData = chunks.map(c => c.chunk).join('');
        if (fullData) {
          resolvedUrlCache.set(url, fullData);
          await saveToIndexedDB(mediaId, fullData);
          return fullData;
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar partes da mídia do Firestore:', err);
    }

    return '';
  }
};
