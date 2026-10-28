import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostContent } from '../types';
import { getDriveEmbedUrl } from '../utils/drivePlayer';
import { getContentTypeInfo, isVideoUrl } from '../utils/contentTypeHelper';
import { buildWhatsAppUrl, createApprovedWhatsAppMessage } from '../utils/whatsapp';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  Video, 
  Layers, 
  Image as ImageIcon, 
  Calendar, 
  Edit3, 
  Trash2, 
  Eye, 
  Check, 
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface PostApprovalCardProps {
  post: PostContent;
  role: 'agency' | 'client';
  onOpenChat: (post: PostContent) => void;
  onRequestChanges?: (post: PostContent) => void;
  onEditPost?: (post: PostContent) => void;
  onPreviewPost?: (post: PostContent) => void;
  onOpenDetail?: (post: PostContent) => void;
}

export const PostApprovalCard: React.FC<PostApprovalCardProps> = ({
  post,
  role,
  onOpenChat,
  onRequestChanges,
  onEditPost,
  onPreviewPost,
  onOpenDetail,
}) => {
  const { approvePost, deletePost, agencyConfig, clients, projects, addToast } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);
  const [approving, setApproving] = useState(false);

  const client = clients.find(c => c.id === post.clientId);
  const project = projects.find(p => p.id === post.projectId);

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setApproving(true);
    approvePost(post.id, client?.name || 'Cliente');

    if (agencyConfig.accountManagerPhone) {
      const waMsg = createApprovedWhatsAppMessage({
        managerName: agencyConfig.accountManagerName,
        clientName: client?.name || 'Cliente',
        projectName: project?.name || 'Projeto',
        postTitle: post.title,
        agencyName: agencyConfig.agencyName,
      });
      window.open(buildWhatsAppUrl(agencyConfig.accountManagerPhone, waMsg), '_blank');
      addToast('success', 'Post Aprovado!', 'A agência foi notificada em tempo real.');
    }
  };

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(post);
    } else if (onPreviewPost) {
      onPreviewPost(post);
    }
  };

  const scheduledDateObj = new Date(post.scheduledDate);
  const formattedScheduled = isNaN(scheduledDateObj.getTime())
    ? 'Data a definir'
    : scheduledDateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

  const contentInfo = getContentTypeInfo(post);

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col group cursor-pointer shadow-xs hover:shadow-lg ${
        post.status === 'pending_approval'
          ? 'border-amber-300 hover:border-amber-400'
          : post.status === 'changes_requested'
          ? 'border-rose-300 hover:border-rose-400'
          : 'border-emerald-300 hover:border-emerald-400'
      }`}
    >
      {/* Top Status & Date Bar */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
        {/* Status Badge in explicit colors */}
        <div className="flex items-center gap-1.5 min-w-0">
          {post.status === 'pending_approval' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Para Aprovação
            </span>
          )}
          {post.status === 'changes_requested' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Em Alteração
            </span>
          )}
          {post.status === 'approved' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Aprovado
            </span>
          )}

          {/* Content Type Badge: Estático, Carrossel, Reel ou Story */}
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${contentInfo.badgeStyle}`}>
            {contentInfo.label}
          </span>
        </div>

        {/* Scheduled time */}
        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono shrink-0">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{formattedScheduled}</span>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 py-2.5 border-b border-slate-50 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {post.title}
        </h3>
        <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
          <span>Abrir</span>
          <Maximize2 className="w-3 h-3" />
        </span>
      </div>

      {/* Visual Content Preview (WITHOUT CAPTION: 1080x1350 [4:5] for Static/Carousel, 9:16 for Reel/Story) */}
      <div className={`relative w-full bg-slate-950 flex items-center justify-center overflow-hidden ${
        contentInfo.type === 'reel' || contentInfo.type === 'story'
          ? 'aspect-[9/16] max-h-[480px]'
          : 'aspect-[4/5] max-h-[480px]'
      }`}>
        {post.mediaType === 'drive_video' ? (
          post.driveVideoUrl ? (
            <div className="w-full h-full relative">
              <iframe
                src={getDriveEmbedUrl(post.driveVideoUrl)}
                className="w-full h-full border-0 pointer-events-none"
                title={`Vídeo Drive - ${post.title}`}
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <div className="bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-lg">
                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Vídeo do Drive (Clique para Ver)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400">
              <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Link do Drive não inserido</p>
            </div>
          )
        ) : post.mediaUrls && post.mediaUrls.length > 0 ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {isVideoUrl(post.mediaUrls[activeSlide] || post.mediaUrls[0]) ? (
              <video
                src={post.mediaUrls[activeSlide] || post.mediaUrls[0]}
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
            ) : (
              <img
                src={post.mediaUrls[activeSlide] || post.mediaUrls[0]}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}

            {/* Carousel navigation buttons */}
            {post.mediaUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setActiveSlide(prev => Math.max(0, prev - 1));
                  }}
                  disabled={activeSlide === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 disabled:opacity-20 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setActiveSlide(prev => Math.min(post.mediaUrls.length - 1, prev + 1));
                  }}
                  disabled={activeSlide === post.mediaUrls.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 disabled:opacity-20 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                  {post.mediaUrls.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeSlide ? 'bg-white w-4' : 'bg-white/50 w-1.5'
                      }`}
                    />
                  ))}
                </div>

                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/70 text-white backdrop-blur-xs flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {activeSlide + 1}/{post.mediaUrls.length}
                </span>
              </>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
              <span className="text-white text-xs font-semibold flex items-center gap-1.5 drop-shadow-sm">
                <Maximize2 className="w-3.5 h-3.5" /> Clique para ver post, dia, hora e legenda completa
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Sem mídia visual anexada</p>
          </div>
        )}
      </div>

      {/* Note banner if in change request */}
      {post.requestedChangesNote && (
        <div className="p-2.5 bg-rose-50 border-t border-rose-200 text-xs text-rose-900 leading-snug">
          <strong className="text-rose-950 font-semibold block mb-0.5">Ajuste Solicitado:</strong>
          <p className="line-clamp-2 text-rose-800 text-[11px]">{post.requestedChangesNote}</p>
        </div>
      )}

      {/* Card Action Controls */}
      <div 
        className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2 mt-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpenChat(post)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          <span>Chat ({post.comments.length})</span>
        </button>

        {/* Client Portal Controls:
            CRITICAL REQUIREMENT:
            "O botão de aprovar o post deve ficar antes do botão de pedir ajuste"
        */}
        {role === 'client' ? (
          <div className="flex items-center gap-1.5">
            {/* 1. Botão de Aprovar (PRIMEIRO) */}
            {post.status !== 'approved' ? (
              <button
                type="button"
                onClick={handleApprove}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprovar</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Aprovado
              </span>
            )}

            {/* 2. Botão de Pedir Ajuste (DEPOIS) */}
            {post.status !== 'approved' && onRequestChanges && (
              <button
                type="button"
                onClick={() => onRequestChanges(post)}
                className="px-2.5 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Pedir Ajuste</span>
              </button>
            )}
          </div>
        ) : (
          /* Agency Controls */
          <div className="flex items-center gap-1">
            {onPreviewPost && (
              <button
                type="button"
                onClick={() => onPreviewPost(post)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Editar/Ver no Celular"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEditPost && (
              <button
                type="button"
                onClick={() => onEditPost(post)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Editar Post"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir este conteúdo?')) {
                  deletePost(post.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Excluir Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
