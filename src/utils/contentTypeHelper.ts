import { PostContent, ContentTypeFormat } from '../types';

export function getPostContentType(post: PostContent): ContentTypeFormat {
  if (post.contentType) {
    return post.contentType;
  }

  const titleLower = post.title.toLowerCase();

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

  if (post.mediaType === 'carousel' || (post.mediaUrls && post.mediaUrls.length > 1)) {
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
  if (/\.(mp4|mov|webm|m4v|ogg|avi|mkv)(\?.*)?$/i.test(lower)) return true;
  return false;
}

export function isImageUrl(url?: string): boolean {
  if (!url) return false;
  return !isVideoUrl(url);
}

