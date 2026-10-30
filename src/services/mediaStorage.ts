import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';

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

  // Save large media (video or big file) to Firestore in chunks and to IndexedDB locally
  async storeMedia(dataUrl: string, mimeType: string = 'video/mp4'): Promise<string> {
    // If it's already a chunkref or small data url (< 250KB), return as is
    if (this.isChunkRef(dataUrl) || dataUrl.length < 250 * 1024) {
      return dataUrl;
    }

    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const chunkRef = mimeType.startsWith('video') ? `video_chunkref:${mediaId}` : `chunkref:${mediaId}`;

    // 1. Immediately cache in memory and local IndexedDB
    resolvedUrlCache.set(chunkRef, dataUrl);
    await saveToIndexedDB(mediaId, dataUrl);

    // 2. Upload chunks to Firestore in background
    try {
      const totalLength = dataUrl.length;
      const totalChunks = Math.ceil(totalLength / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalLength);
        const chunkData = dataUrl.substring(start, end);
        const chunkDocId = `${mediaId}_chunk_${i}`;

        await setDoc(doc(db, 'media_chunks', chunkDocId), {
          mediaId,
          index: i,
          totalChunks,
          mimeType,
          chunk: chunkData,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`✅ Mídia pesada armazenada em ${totalChunks} partes no Firestore: ${mediaId}`);
    } catch (err) {
      console.warn('Erro ao salvar partes da mídia no Firestore (persistido localmente):', err);
    }

    return chunkRef;
  },

  // Resolve a chunkref to a playable/displayable URL
  async resolveMedia(url: string): Promise<string> {
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
      return cachedData;
    }

    // Fetch chunks from Firestore
    try {
      const chunksQuery = query(
        collection(db, 'media_chunks'),
        where('mediaId', '==', mediaId)
      );
      const snap = await getDocs(chunksQuery);

      if (snap.empty) {
        console.warn('Partes da mídia não encontradas no Firestore para:', mediaId);
        return url;
      }

      const chunks = snap.docs
        .map(d => d.data() as { index: number; chunk: string; mimeType: string })
        .sort((a, b) => a.index - b.index);

      const fullData = chunks.map(c => c.chunk).join('');
      if (fullData) {
        resolvedUrlCache.set(url, fullData);
        await saveToIndexedDB(mediaId, fullData);
        return fullData;
      }
    } catch (err) {
      console.warn('Erro ao buscar partes da mídia do Firestore:', err);
    }

    return url;
  }
};
