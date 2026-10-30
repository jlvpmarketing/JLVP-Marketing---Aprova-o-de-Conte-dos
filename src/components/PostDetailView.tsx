import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostContent, AgencyUser } from '../types';
import { getDriveEmbedUrl } from '../utils/drivePlayer';
import { DriveVideoPlayer } from './DriveVideoPlayer';
import { getContentTypeInfo, isVideoUrl, isDriveVideoUrl } from '../utils/contentTypeHelper';
import { useResolvedMedia } from '../hooks/useResolvedMedia';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Send, 
  Video, 
  Layers, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Film,
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';

interface PostDetailViewProps {
  post: PostContent | null;
  onClose: () => void;
  onRequestChanges?: (post: PostContent) => void;
  role?: 'agency' | 'client';
  onEditPost?: (post: PostContent) => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
  post,
  onClose,
  onRequestChanges,
  role = 'client',
  onEditPost,
}) => {
  const { 
    approvePost, 
    deletePost,
    addComment, 
    agencyConfig, 
    clients, 
    projects, 
    users,
    addToast 
  } = useApp();

  const { resolvedUrls } = useResolvedMedia(post?.mediaUrls || []);
  const [activeSlide, setActiveSlide] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [approving, setApproving] = useState(false);

  if (!post) return null;

  const client = clients.find(c => c.id === post.clientId);
  const project = projects.find(p => p.id === post.projectId);
  const contentInfo = getContentTypeInfo(post);

  // Format scheduled day and hour separately
  const dateObj = new Date(post.scheduledDate);
  const scheduledDayStr = isNaN(dateObj.getTime())
    ? 'Data não definida'
    : dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  const scheduledHourStr = isNaN(dateObj.getTime())
    ? '--:--'
    : dateObj.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

  const handleApprove = () => {
    setApproving(true);
    approvePost(post.id, client?.name || 'Cliente');
    addToast('success', 'Post Aprovado com Sucesso!', 'O status foi atualizado para Aprovado.');
    onClose();
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const authorRole = role === 'agency' ? 'agency' : 'client';
    const authorName = role === 'agency'
      ? (agencyConfig.accountManagerName || agencyConfig.agencyName)
      : (client?.name || 'Cliente');

    addComment(post.id, authorRole, authorName, newComment.trim());
    setNewComment('');
    addToast('success', 'Comentário Registrado', 'Mensagem enviada no histórico do post.');
  };

  const isVerticalFormat = contentInfo.type === 'reel' || contentInfo.type === 'story';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs py-4 sm:py-8 px-2 sm:px-6">
      {/* Outer scroll container: natural full-page flow, user can scroll down easily */}
      <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Sticky Header with Title and Close button */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 sm:px-8 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Voltar para a lista"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Status Pill */}
            {post.status === 'pending_approval' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-950 border border-amber-500 shrink-0 shadow-2xs">
                Para Aprovação
              </span>
            )}
            {post.status === 'changes_requested' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white border border-rose-700 shrink-0 shadow-2xs">
                Em Alteração
              </span>
            )}
            {post.status === 'approved' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white border border-emerald-700 shrink-0 shadow-2xs">
                Aprovado
              </span>
            )}

            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{post.title}</h2>
              <span className="text-[11px] text-slate-500 block truncate">{project?.name}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body: Rolagem de página inteira */}
        <div className="p-5 sm:p-8 space-y-8">
          
          {/* SECTION 1: VISUALIZAÇÃO DO CONTEÚDO (Altura e Proporção Adaptativas) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Visualização do Conteúdo
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${contentInfo.badgeStyle}`}>
                  {contentInfo.label} ({contentInfo.sublabel})
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {post.mediaType === 'drive_video' ? 'Vídeo do Google Drive' : post.mediaType === 'carousel' ? 'Carrossel' : 'Arte'}
              </span>
            </div>

            {/* ADAPTIVE MEDIA CONTAINER:
                - If Reel or Story: true 9:16 vertical ratio (like a smartphone screen)
                - If Carousel or Static: true 1080x1350 (4:5) portrait ratio
            */}
            <div className="flex justify-center py-2 bg-slate-900/5 rounded-3xl p-4">
              <div
                className={`relative w-full ${contentInfo.aspectClass} rounded-2xl overflow-hidden bg-slate-950 shadow-xl flex items-center justify-center border border-slate-800`}
              >
                {post.mediaType === 'drive_video' ? (
                  post.driveVideoUrl ? (
                    <div className="w-full h-full relative">
                      <DriveVideoPlayer
                        url={post.driveVideoUrl}
                        title={post.title}
                        aspectClass={contentInfo.aspectClass}
                      />
                    </div>
                  ) : (
                    <div className="p-10 text-center text-slate-400">
                      <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Link de vídeo não disponível</p>
                    </div>
                  )
                ) : resolvedUrls && resolvedUrls.length > 0 ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    {(() => {
                      const currentMedia = resolvedUrls[activeSlide] || resolvedUrls[0];
                      if (isDriveVideoUrl(currentMedia)) {
                        return (
                          <div className="w-full h-full relative">
                            <DriveVideoPlayer
                              url={currentMedia}
                              title={`${post.title} - Slide ${activeSlide + 1}`}
                              aspectClass={contentInfo.aspectClass}
                            />
                          </div>
                        );
                      }
                      if (isVideoUrl(currentMedia)) {
                        return (
                          <video
                            src={currentMedia}
                            controls
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        );
                      }
                      return (
                        <img
                          src={currentMedia}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      );
                    })()}

                    {/* Carousel navigation controls if multi-image */}
                    {resolvedUrls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                          disabled={activeSlide === 0}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 disabled:opacity-20 transition-opacity"
                          aria-label="Slide anterior"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSlide(prev => Math.min(resolvedUrls.length - 1, prev + 1))}
                          disabled={activeSlide === resolvedUrls.length - 1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 disabled:opacity-20 transition-opacity"
                          aria-label="Próximo slide"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                          {resolvedUrls.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveSlide(i)}
                              className={`h-2 rounded-full transition-all ${
                                i === activeSlide ? 'bg-white w-6' : 'bg-white/50 w-2'
                              }`}
                            />
                          ))}
                        </div>

                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-mono bg-black/75 text-white backdrop-blur-xs flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          Lâmina {activeSlide + 1} de {resolvedUrls.length}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-10 text-center text-slate-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sem mídia anexada</p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center pt-1">
              Role para baixo para conferir a data, horário, legenda e aprovar o post.
            </p>
          </div>

          {/* SECTION 2: PROGRAMAÇÃO & TIPO DE CONTEÚDO (Estático, Carrossel, Reel ou Story) */}
          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200/90 space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Programação de Agendamento
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Dia da Publicação</span>
                  <strong className="text-sm text-slate-900 font-bold capitalize block">
                    {scheduledDayStr}
                  </strong>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Horário da Publicação</span>
                  <strong className="text-sm text-slate-900 font-bold font-mono block">
                    {scheduledHourStr}
                  </strong>
                </div>
              </div>
            </div>

            {/* TIPO DE CONTEÚDO:
                "ao invés de mostrar as opções de 'Redes Sociais programadas',
                 mostre que tipo de conteúdo é: Estático, Carrossel, Reel ou Story."
            */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-600 font-semibold">Tipo de Conteúdo:</span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs ${contentInfo.badgeStyle}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${contentInfo.dotColor}`} />
                <span className="text-sm">{contentInfo.label}</span>
                <span className="opacity-75 text-[11px] font-normal">({contentInfo.sublabel})</span>
              </span>
            </div>
          </div>

          {/* SECTION 3: AJUSTE SOLICITADO ANTERIORMENTE (se houver) */}
          {post.requestedChangesNote && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Observação do Ajuste Solicitado:</span>
              </div>
              <p className="text-rose-800 text-xs leading-relaxed pl-6">
                "{post.requestedChangesNote}"
              </p>
            </div>
          )}

          {/* SECTION 4: LEGENDA DA PUBLICAÇÃO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Legenda da Publicação (Texto do Post)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {post.caption?.length || 0} caracteres
              </span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans shadow-2xs">
              {post.caption || 'Nenhuma legenda cadastrada para esta publicação.'}
            </div>
          </div>

          {/* SECTION 5: CHAT DE AJUSTE (Exibido APENAS quando ajuste for solicitado) */}
          {(post.status === 'changes_requested' || Boolean(post.requestedChangesNote) || post.comments.some(c => c.text.includes('[SOLICITAÇÃO DE AJUSTE]'))) && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-600" />
                <span>Alinhamento do Ajuste Solicitado ({post.comments.length})</span>
              </h3>

              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                {post.comments.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-3 text-xs">
                    Nenhum detalhe adicional registrado no ajuste. Deseja complementar? Digite abaixo.
                  </p>
                ) : (
                  post.comments.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <strong className="text-slate-800 font-semibold">{c.authorName}</strong>
                        <span className="font-mono">
                          {new Date(c.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}

                {/* Comment submission form */}
                <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Escrever resposta ou observação sobre o ajuste..."
                    className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SECTION 6: BOTÕES DE AÇÃO */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {role === 'agency'
                  ? 'Painel da Agência'
                  : post.status === 'approved'
                  ? 'Material Aprovado'
                  : 'Decisão de Aprovação'}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                {role === 'agency'
                  ? `Status atual: ${
                      post.status === 'approved'
                        ? 'Aprovado'
                        : post.status === 'changes_requested'
                        ? 'Em Alteração'
                        : 'Aguardando Aprovação do Cliente'
                    }.`
                  : post.status === 'approved'
                  ? 'Este post já está com aprovação confirmada e pronto para publicação.'
                  : 'Aprove com um clique ou envie observações de ajustes para a agência.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              {role === 'agency' ? (
                <>
                  {onEditPost && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditPost(post);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Editar Post</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir a publicação "${post.title}"?`)) {
                        deletePost(post.id);
                        addToast('info', 'Publicação excluída', `"${post.title}" foi removida.`);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>

                  {post.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={approving}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar como Aprovado</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    Fechar
                  </button>
                </>
              ) : (
                <>
                  {/* Client actions: CRITICAL: Aprovar antes de Pedir Ajuste */}
                  {post.status !== 'approved' ? (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={approving}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprovar Post</span>
                    </button>
                  ) : (
                    <span className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Post Já Aprovado
                    </span>
                  )}

                  {post.status !== 'approved' && onRequestChanges && (
                    <button
                      type="button"
                      onClick={() => onRequestChanges(post)}
                      className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Pedir Ajuste</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
