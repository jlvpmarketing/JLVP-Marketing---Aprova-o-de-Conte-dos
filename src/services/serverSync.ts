import { Client, FolderProject, PostContent, AgencyUser, NotificationItem } from '../types';

/**
 * Server Synchronization Service
 * Uses the local full-stack Express backend (/api/*) to guarantee immediate,
 * cross-device persistence for posts, media streaming, and client portal views.
 * Completely immune to third-party cloud quota limits.
 */

export const serverSync = {
  /**
   * Upload video or high-res image to the server disk (/data/media/)
   * Returns a streaming URL (e.g. /api/media/media_123.mp4) that plays natively
   * on all devices (mobile iOS, Android, desktop).
   */
  async uploadMedia(data: string, mimeType: string = 'video/mp4', name?: string): Promise<string> {
    try {
      if (!data) return '';
      // If already a hosted URL or Google Drive link, return directly
      if (data.startsWith('http://') || data.startsWith('https://') || data.startsWith('/api/media/')) {
        return data;
      }

      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, mimeType, name })
      });

      if (!res.ok) {
        throw new Error(`Servidor respondeu com status ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.url) {
        console.log('🎬 Mídia enviada para o servidor:', json.url);
        return json.url;
      }
      return data;
    } catch (err) {
      console.warn('Erro ao enviar mídia para o servidor:', err);
      return data;
    }
  },

  /**
   * Full database sync from server (/api/sync)
   */
  async fetchDatabase(): Promise<{
    clients?: Client[];
    projects?: FolderProject[];
    posts?: PostContent[];
    users?: AgencyUser[];
    notifications?: NotificationItem[];
    updatedAt?: string;
  } | null> {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('Erro ao sincronizar banco do servidor:', err);
      return null;
    }
  },

  /**
   * Fetch all posts from server
   */
  async fetchPosts(): Promise<PostContent[]> {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('Erro ao buscar posts do servidor:', err);
      return [];
    }
  },

  /**
   * Save or update post on the server
   */
  async savePost(post: PostContent): Promise<{ success: boolean; post?: PostContent }> {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      if (!res.ok) return { success: false };
      const json = await res.json();
      return json;
    } catch (err) {
      console.warn('Erro ao salvar post no servidor:', err);
      return { success: false };
    }
  },

  /**
   * Delete post from the server
   */
  async deletePost(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('Erro ao excluir post no servidor:', err);
      return false;
    }
  },

  /**
   * Save client to server
   */
  async saveClient(client: Client): Promise<boolean> {
    try {
      const res = await fetch('/api/sync/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Save project to server
   */
  async saveProject(project: FolderProject): Promise<boolean> {
    try {
      const res = await fetch('/api/sync/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
