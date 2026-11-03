import { Client, FolderProject, PostContent, AgencyUser, NotificationItem, AuditLogItem } from '../types';

/**
 * Server Synchronization Service
 * Uses the local full-stack Express backend (/api/*) to guarantee immediate,
 * cross-device persistence for posts, media streaming, and client portal views.
 * Completely immune to third-party cloud quota limits.
 */

async function safeJsonParse<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    // If response is HTML (e.g. SPA fallback index.html), return null quietly
    return null;
  }
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

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
        body: JSON.stringify({ data, mimeType, name }),
        signal: AbortSignal.timeout(15000)
      });

      const json = await safeJsonParse<{ success: boolean; url: string }>(res);
      if (json && json.success && json.url) {
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
    auditLogs?: AuditLogItem[];
    updatedAt?: string;
  } | null> {
    try {
      const res = await fetch('/api/sync');
      return await safeJsonParse<any>(res);
    } catch {
      return null;
    }
  },

  /**
   * Fetch all posts from server
   */
  async fetchPosts(): Promise<PostContent[]> {
    try {
      const res = await fetch('/api/posts');
      const data = await safeJsonParse<PostContent[]>(res);
      return Array.isArray(data) ? data : [];
    } catch {
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
      const json = await safeJsonParse<{ success: boolean; post?: PostContent }>(res);
      return json || { success: res.ok };
    } catch {
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
   * Delete project from the server (cascades linked posts)
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('Erro ao excluir projeto no servidor:', err);
      return false;
    }
  },

  /**
   * Delete client from the server (cascades linked projects and posts)
   */
  async deleteClient(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/clients/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('Erro ao excluir cliente no servidor:', err);
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
