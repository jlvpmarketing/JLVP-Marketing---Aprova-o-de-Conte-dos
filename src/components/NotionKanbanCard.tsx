import React from 'react';
import { PostContent } from '../types';
import { getContentTypeInfo, isVideoUrl } from '../utils/contentTypeHelper';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Send, 
  AlertCircle, 
  FileText,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface NotionKanbanCardProps {
  post: PostContent;
  role?: 'agency' | 'client';
  onOpenDetail: (post: PostContent) => void;
  onOpenChat?: (post: PostContent) => void;
  onSendWhatsApp?: (post: PostContent) => void;
}

export const NotionKanbanCard: React.FC<NotionKanbanCardProps> = ({
  post,
  role = 'agency',
  onOpenDetail,
  onOpenChat,
  onSendWhatsApp,
}) => {
  const contentInfo = getContentTypeInfo(post);

  const dateObj = new Date(post.scheduledDate);
  const isValidDate = !isNaN(dateObj.getTime());

  // Formatted date (ex: 28 de Outubro de 2026)
  const formattedDate = isValidDate
    ? dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Data a definir';

  // Formatted time (ex: 18:30)
  const formattedTime = isValidDate
    ? dateObj.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  return (
    <div
      onClick={() => onOpenDetail(post)}
      className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-400 hover:shadow-md transition-all p-3.5 flex flex-col space-y-2.5 cursor-pointer group shadow-2xs relative"
    >
      {/* 1. Nome da Demanda (Título no topo) */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand leading-snug line-clamp-2 transition-colors">
          {post.title}
        </h4>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* 2. Informações em linha uma abaixo da outra (Estilo Notion Properties) */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px]">
        {/* Data de Publicação */}
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-[10px] text-slate-400 font-medium w-12 shrink-0">Data:</span>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 truncate">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>
        </div>

        {/* Horário de Publicação */}
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-[10px] text-slate-400 font-medium w-12 shrink-0">Horário:</span>
          <div className="flex items-center gap-1.5 font-mono text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Formato / Tipo do Conteúdo */}
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-[10px] text-slate-400 font-medium w-12 shrink-0">Tipo:</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${contentInfo.badgeStyle}`}>
            {contentInfo.label}
          </span>
        </div>
      </div>

      {/* Note if changes requested */}
      {post.status === 'changes_requested' && post.requestedChangesNote && (
        <div className="mt-1 p-2 bg-rose-50 border border-rose-200/80 rounded-lg text-[10px] text-rose-800 line-clamp-2">
          <span className="font-bold">Ajuste:</span> {post.requestedChangesNote}
        </div>
      )}

      {/* Media Preview - Video with controls or Img tag */}
      {(() => {
        const media = (post.media && post.media.length > 0)
          ? post.media[0]
          : (post.mediaUrls && post.mediaUrls.length > 0)
          ? { url: post.mediaUrls[0], type: (isVideoUrl(post.mediaUrls[0]) ? 'video' : 'image') as 'image' | 'video' }
          : null;

        if (!media || !media.url) return null;

        if (media.type === 'video') {
          return (
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-black relative border border-slate-200">
              <video
                src={media.url}
                controls
                playsInline
                muted
                onClick={e => e.stopPropagation()}
                className="w-full h-full object-cover"
              />
            </div>
          );
        }

        // media.type === 'image' or undefined default to <img>
        return (
          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 relative border border-slate-200">
            <img
              src={media.url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        );
      })()}

      {/* Card Footer: Comments & Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {post.comments.length > 0 && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                if (onOpenChat) onOpenChat(post);
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              <span className="font-mono text-[10px]">{post.comments.length}</span>
            </button>
          )}

          {post.approvedBy && (
            <span className="text-[10px] text-emerald-700 font-medium truncate max-w-[120px]">
              Por: {post.approvedBy}
            </span>
          )}
        </div>

        {onSendWhatsApp && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onSendWhatsApp(post);
            }}
            className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
          >
            <Send className="w-2.5 h-2.5" />
            <span>Avisar</span>
          </button>
        )}
      </div>
    </div>
  );
};
