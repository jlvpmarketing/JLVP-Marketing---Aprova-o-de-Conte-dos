import { PostContent, ContentTypeFormat, MediaItem } from '../types';
import { extractDriveFileId } from './drivePlayer';

export function normalizePostStatus(status?: string): 'pending_approval' | 'changes_requested' | 'approved' {
  if (!status) return 'pending_approval';
  const s = status.trim().toLowerCase();
  if (s === 'approved' || s === 'aprovado') return 'approved';
  if (s === 'changes_requested' || s === 'changes' || s === 'alteracao' || s === 'em_alteracao' || s === 'ajuste') return 'changes_requested';
  return 'pending_approval';
}

export function getPostContentType(post: PostContent | any): ContentTypeFormat {
  if (!post) return 'static';
  if (post.contentType) {
    return post.contentType;
  }
  if (post.type && ['static', 'carousel', 'reel', 'story'].includes(post.type)) {
    return post.type as ContentTypeFormat;
  }

  const titleLower = (post.title || '').toLowerCase();

  if (
    post.platforms?.includes('reels') || 
    titleLower.includes('reel') || 
    post.mediaType === 'drive_video' ||
    post.mediaType === 'video'
  ) {
    return 'reel';
  }

  if (
    post.platforms?.includes('instagram_story') && 
    !post.platforms?.includes('instagram_feed') ||
    titleLower.includes('story')
  ) {
    return 'story';
  }

  if (post.mediaType === 'carousel' || (post.mediaUrls && post.mediaUrls.length > 1) || (post.media && post.media.length > 1)) {
    return 'carousel';
  }

  return 'static';
}

export function getContentTypeInfo(post: PostContent) {
  const type = getPostContentType(post);

  switch (type) {
    case 'reel':
      return {
        type: 'reel' as ContentTypeFormat,
        label: 'Reel',
        sublabel: 'Vídeo Vertical (9:16)',
        aspectClass: 'aspect-[9/16] max-w-[330px] max-h-[620px]',
        badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300',
        dotColor: 'bg-purple-500',
      };
    case 'story':
      return {
        type: 'story' as ContentTypeFormat,
        label: 'Story',
        sublabel: 'Formato Vertical (9:16)',
        aspectClass: 'aspect-[9/16] max-w-[330px] max-h-[620px]',
        badgeStyle: 'bg-pink-100 text-pink-900 border-pink-300',
        dotColor: 'bg-pink-500',
      };
    case 'carousel':
      return {
        type: 'carousel' as ContentTypeFormat,
        label: 'Carrossel',
        sublabel: 'Lâminas Feed (1080x1350)',
        aspectClass: 'aspect-[4/5] max-w-[420px] max-h-[620px]',
        badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300',
        dotColor: 'bg-blue-500',
      };
    case 'static':
    default:
      return {
        type: 'static' as ContentTypeFormat,
        label: 'Estático',
        sublabel: 'Feed Retrato (1080x1350)',
        aspectClass: 'aspect-[4/5] max-w-[420px] max-h-[620px]',
        badgeStyle: 'bg-slate-100 text-slate-900 border-slate-300',
        dotColor: 'bg-slate-500',
      };
  }
}

export function isDriveVideoUrl(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.startsWith('drive:') ||
    clean.startsWith('drive_video:') ||
    clean.includes('drive.google.com')
  );
}

export function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  if (lower.startsWith('data:video/')) return true;
  if (lower.startsWith('video_chunkref:')) return true;
  if (isDriveVideoUrl(lower)) return true;
  if (lower.includes('/video/upload/')) return true;
  if (/\.(mp4|mov|webm|m4v|ogg|avi|mkv)(\?.*)?$/i.test(lower)) return true;
  return false;
}

export function isImageUrl(url?: string): boolean {
  if (!url) return false;
  return !isVideoUrl(url);
}

export interface SlideMediaInfo {
  url: string;
  type: 'image' | 'video';
  isDrive: boolean;
  driveFileId?: string;
  name?: string;
}

export function getSlideMediaInfo(
  item?: string | MediaItem, 
  fallbackUrl?: string
): SlideMediaInfo {
  let url = '';
  let explicitType: 'image' | 'video' | undefined;
  let driveId: string | undefined;
  let name: string | undefined;

  if (typeof item === 'string') {
    url = item;
  } else if (item && typeof item === 'object') {
    url = item.url || '';
    explicitType = item.type;
    driveId = item.driveFileId;
    name = item.name;
  }

  if (!url && fallbackUrl) {
    url = fallbackUrl;
  }

  url = url ? url.trim() : '';
  const isDrive = isDriveVideoUrl(url);
  if (!driveId && isDrive) {
    driveId = extractDriveFileId(url) || undefined;
  }

  // Prioritize explicit type, then detect video, fallback to image
  let finalType: 'image' | 'video' = 'image';
  if (explicitType === 'video') {
    finalType = 'video';
  } else if (explicitType === 'image') {
    finalType = 'image';
  } else if (isDrive || isVideoUrl(url)) {
    finalType = 'video';
  } else {
    finalType = 'image';
  }

  return {
    url,
    type: finalType,
    isDrive,
    driveFileId: driveId,
    name,
  };
}

export function getPostMediaList(post?: PostContent | null, resolvedUrls: string[] = []): SlideMediaInfo[] {
  if (!post) return [];

  if (post.media && Array.isArray(post.media) && post.media.length > 0) {
    return post.media.map((item, idx) => {
      const resolved = resolvedUrls[idx] || item.url;
      const info = getSlideMediaInfo(item, resolved);
      if (resolved) {
        info.url = resolved;
      }
      return info;
    });
  }

  if (post.mediaUrls && Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
    return post.mediaUrls.map((url, idx) => {
      const resolved = resolvedUrls[idx] || url;
      return getSlideMediaInfo(resolved || url);
    });
  }

  if (post.imageUrl) {
    const resolved = resolvedUrls[0] || post.imageUrl;
    return [getSlideMediaInfo(resolved)];
  }

  if (post.driveVideoUrl) {
    return [getSlideMediaInfo(post.driveVideoUrl)];
  }

  return [];
}

export function normalizePostFromFirestore(raw: any, docId?: string): PostContent {
  if (!raw) return raw;
  const id = docId || raw.id || `post-${Date.now()}`;
  const status = normalizePostStatus(raw.status);

  // Normalize media arrays
  let mediaUrls: string[] = [];
  if (Array.isArray(raw.mediaUrls)) {
    mediaUrls = raw.mediaUrls.filter(Boolean);
  } else if (typeof raw.mediaUrls === 'string') {
    mediaUrls = [raw.mediaUrls];
  } else if (raw.imageUrl) {
    mediaUrls = [raw.imageUrl];
  } else if (raw.driveVideoUrl) {
    mediaUrls = [raw.driveVideoUrl];
  }

  // Normalize media items with explicit type
  let media: MediaItem[] = [];
  if (Array.isArray(raw.media) && raw.media.length > 0) {
    media = raw.media.map((item: any, i: number) => {
      const url = item?.url || mediaUrls[i] || '';
      const isDrive = isDriveVideoUrl(url);
      const isVid = item?.type === 'video' ? true : item?.type === 'image' ? false : (isDrive || isVideoUrl(url));
      return {
        url,
        type: isVid ? ('video' as const) : ('image' as const),
        name: item?.name,
        driveFileId: isDrive ? (extractDriveFileId(url) || item?.driveFileId) : undefined,
      };
    });
  } else if (mediaUrls.length > 0) {
    media = mediaUrls.map(u => {
      const isDrive = isDriveVideoUrl(u);
      const isVid = isDrive || isVideoUrl(u);
      return {
        url: u,
        type: isVid ? ('video' as const) : ('image' as const),
        driveFileId: isDrive ? extractDriveFileId(u) || undefined : undefined,
      };
    });
  }

  // Normalize contentType and mediaType
  let contentType = raw.contentType;
  if (!contentType && raw.type && ['static', 'carousel', 'reel', 'story'].includes(raw.type)) {
    contentType = raw.type;
  }
  if (!contentType) {
    if (media.length > 1 || raw.mediaType === 'carousel') {
      contentType = 'carousel';
    } else if (raw.mediaType === 'video' || raw.mediaType === 'drive_video' || raw.driveVideoUrl || media.some(m => m.type === 'video')) {
      contentType = 'reel';
    } else {
      contentType = 'static';
    }
  }

  let mediaType = raw.mediaType;
  if (!mediaType) {
    if (contentType === 'carousel') {
      mediaType = 'carousel';
    } else if (raw.driveVideoUrl || media.some(m => isDriveVideoUrl(m.url))) {
      mediaType = 'drive_video';
    } else if (media.some(m => m.type === 'video')) {
      mediaType = 'video';
    } else {
      mediaType = 'image';
    }
  }

  const scheduledDate = raw.scheduledDate || raw.date || raw.scheduledAt || new Date().toISOString().slice(0, 16);

  return {
    id,
    projectId: raw.projectId || '',
    clientId: raw.clientId || '',
    title: raw.title || 'Sem título',
    status,
    contentType,
    mediaType,
    mediaUrls,
    media,
    imageUrl: raw.imageUrl || (media.length > 0 && media[0].type === 'image' ? media[0].url : undefined),
    driveVideoUrl: raw.driveVideoUrl || (media.find(m => isDriveVideoUrl(m.url))?.url),
    caption: raw.caption || '',
    scheduledDate,
    platforms: Array.isArray(raw.platforms) ? raw.platforms : ['instagram_feed'],
    comments: Array.isArray(raw.comments) ? raw.comments : [],
    requestedChangesNote: raw.requestedChangesNote,
    supportFiles: Array.isArray(raw.supportFiles) ? raw.supportFiles : [],
    approvedAt: raw.approvedAt,
    approvedBy: raw.approvedBy,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    createdByUserId: raw.createdByUserId,
    createdByUserName: raw.createdByUserName,
  };
}

