import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MediaType, SocialPlatform, PostContent, ContentTypeFormat } from '../types';
import { getDriveEmbedUrl, isValidDriveUrl } from '../utils/drivePlayer';
import { getPostContentType } from '../utils/contentTypeHelper';
import { compressImage } from '../utils/imageCompressor';
import { 
  PlusCircle, 
  Upload, 
  Video, 
  Image as ImageIcon, 
  Layers, 
  Calendar, 
  X, 
  Trash2, 
  Eye, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Film,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  GripHorizontal,
  FolderPlus
} from 'lucide-react';

interface ContentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  postToEdit?: PostContent | null;
}

export const ContentUploadModal: React.FC<ContentUploadModalProps> = ({ isOpen, onClose, postToEdit }) => {
  const { 
    clients,
    selectedClientId, 
    selectedClient, 
    projects, 
    selectedProjectId, 
    addPost, 
    updatePost, 
    addProject,
    agencyConfig,
    addToast 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client Selection
  const [targetClientId, setTargetClientId] = useState<string>(() => {
    if (postToEdit) return postToEdit.clientId;
    return selectedClientId || (clients[0]?.id || '');
  });

  const clientProjects = projects.filter(p => p.clientId === targetClientId);

  // Form states
  const [projectId, setProjectId] = useState<string>(() => {
    if (postToEdit) return postToEdit.projectId;
    if (selectedProjectId && projects.some(p => p.id === selectedProjectId && p.clientId === targetClientId)) {
      return selectedProjectId;
    }
    return clientProjects[0]?.id || '';
  });

  useEffect(() => {
    if (!clientProjects.some(p => p.id === projectId)) {
      setProjectId(clientProjects[0]?.id || '');
    }
  }, [targetClientId, projects]);

  const [contentType, setContentType] = useState<ContentTypeFormat>(() => {
    if (postToEdit?.contentType) return postToEdit.contentType;
    if (postToEdit) return getPostContentType(postToEdit);
    return 'static';
  });

  const [title, setTitle] = useState(postToEdit ? postToEdit.title : '');
  const [mediaType, setMediaType] = useState<MediaType>(() => {
    if (postToEdit) return postToEdit.mediaType;
    return 'image';
  });
  const [mediaUrls, setMediaUrls] = useState<string[]>(postToEdit ? postToEdit.mediaUrls : []);
  const [driveVideoUrl, setDriveVideoUrl] = useState(postToEdit?.driveVideoUrl || '');
  const [caption, setCaption] = useState(postToEdit ? postToEdit.caption : '');
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (postToEdit) return postToEdit.scheduledDate;
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // Carousel slide active index for preview
  const [activeSlide, setActiveSlide] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const currentClient = clients.find(c => c.id === targetClientId) || selectedClient || clients[0];

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        if (file.type.startsWith('image/')) {
          // Compress client-side to prevent QuotaExceededError and app crashing
          const compressed = await compressImage(file, 1200, 1200, 0.82);
          newUrls.push(compressed);
        } else {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newUrls.push(base64);
        }
      } catch (err) {
        console.warn('Erro ao processar mídia:', err);
      }
    }

    setIsUploading(false);

    if (newUrls.length > 0) {
      const hasVideo = newUrls.some(u => u.startsWith('data:video') || u.includes('.mp4') || u.includes('.mov') || u.includes('.webm'));
      if (hasVideo && contentType === 'static') {
        setMediaType('video');
      } else if (contentType === 'carousel') {
        setMediaType('carousel');
      }

      if (contentType === 'carousel' || contentType === 'story') {
        setMediaUrls(prev => [...prev, ...newUrls]);
      } else {
        setMediaUrls([newUrls[0]]);
      }
      addToast('success', 'Mídia processada', `${newUrls.length} arquivo(s) preparado(s) e anexado(s).`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
    if (activeSlide >= mediaUrls.length - 1) {
      setActiveSlide(Math.max(0, mediaUrls.length - 2));
    }
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropTargetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropTargetIndex) return;

    setMediaUrls(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(dropTargetIndex, 0, movedItem);
      return updated;
    });
    setDraggedIndex(null);
  };

  const moveMedia = (fromIndex: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (targetIdx < 0 || targetIdx >= mediaUrls.length) return;

    setMediaUrls(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(targetIdx, 0, movedItem);
      return updated;
    });
  };

  const handleCreateQuickFolder = () => {
    if (!targetClientId) return;
    const newProj = addProject({
      clientId: targetClientId,
      name: 'Geral / Feed',
      description: 'Pasta padrão criada automaticamente para os conteúdos deste cliente.',
      status: 'active',
    });
    setProjectId(newProj.id);
    addToast('success', 'Pasta criada', 'Pasta "Geral / Feed" criada com sucesso.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      addToast('error', 'Título obrigatório', 'Por favor, insira o título do conteúdo.');
      return;
    }

    let finalProjectId = projectId;
    if (!finalProjectId) {
      // Auto-create project folder if missing so the app never crashes
      const newProj = addProject({
        clientId: targetClientId,
        name: 'Geral / Feed',
        description: 'Pasta padrão criada automaticamente',
        status: 'active',
      });
      finalProjectId = newProj.id;
    }

    if (mediaType === 'drive_video' && !driveVideoUrl) {
      addToast('error', 'Link do Drive ausente', 'Insira o link de compartilhamento do Google Drive.');
      return;
    }

    if ((mediaType === 'image' || mediaType === 'carousel') && mediaUrls.length === 0) {
      addToast('error', 'Mídia necessária', 'Suba ao menos uma imagem para o conteúdo.');
      return;
    }

    try {
      if (postToEdit) {
        updatePost(postToEdit.id, {
          projectId: finalProjectId,
          clientId: targetClientId,
          title,
          contentType,
          mediaType,
          mediaUrls,
          driveVideoUrl: mediaType === 'drive_video' ? driveVideoUrl : undefined,
          caption,
          scheduledDate,
          platforms: ['instagram_feed'],
        });
        addToast('success', 'Publicação atualizada', 'As alterações foram salvas com sucesso.');
      } else {
        addPost({
          projectId: finalProjectId,
          clientId: targetClientId,
          title,
          status: 'pending_approval',
          contentType,
          mediaType,
          mediaUrls,
          driveVideoUrl: mediaType === 'drive_video' ? driveVideoUrl : undefined,
          caption,
          scheduledDate,
          platforms: ['instagram_feed'],
        });
        addToast('success', 'Publicação criada', 'Conteúdo publicado e pronto para aprovação.');
      }
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar publicação:', err);
      addToast('error', 'Erro ao salvar', 'Houve um problema ao salvar. Verifique os dados e tente novamente.');
    }
  };

  // Format date for preview
  const scheduledDateObj = new Date(scheduledDate);
  const formattedScheduled = isNaN(scheduledDateObj.getTime())
    ? 'Data não definida'
    : scheduledDateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
            >
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                {postToEdit ? 'Editar Publicação' : 'Inserir Novo Conteúdo para Aprovação'}
              </h3>
              <p className="text-xs text-slate-500">
                Cliente selecionado: <span className="font-semibold text-slate-700">{currentClient?.company || 'Geral'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body split: Form (left) + Live Mockup Preview (right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left: Input Form */}
          <form id="post-form" onSubmit={handleSubmit} className="lg:col-span-7 p-6 space-y-5">
            {/* Client and Folder Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Client Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cliente *
                </label>
                <select
                  required
                  value={targetClientId}
                  onChange={e => setTargetClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Folder / Project selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Projeto / Pasta *</span>
                  {clientProjects.length === 0 && (
                    <button
                      type="button"
                      onClick={handleCreateQuickFolder}
                      className="text-[10px] text-brand hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3" />
                      Criar Pasta Rápida
                    </button>
                  )}
                </label>
                <select
                  required
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                >
                  {clientProjects.length === 0 ? (
                    <option value="">Nenhuma pasta criada (será criada Geral)</option>
                  ) : (
                    clientProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        📁 {p.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Post Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome da Demanda / Título do Conteúdo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Carrossel Educativo: Dicas de Harmonização"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {/* Content Type Selector (Estático, Carrossel, Reel, Story) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Tipo de Conteúdo *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'static', label: 'Estático', sub: 'Foto única', icon: ImageIcon },
                  { id: 'carousel', label: 'Carrossel', sub: 'Multi-fotos', icon: Layers },
                  { id: 'reel', label: 'Reel', sub: 'Vídeo 9:16', icon: Film },
                  { id: 'story', label: 'Story', sub: 'Vertical 9:16', icon: Smartphone },
                ].map(type => {
                  const Icon = type.icon;
                  const isSelected = contentType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setContentType(type.id as ContentTypeFormat);
                        if (type.id === 'carousel') {
                          setMediaType('carousel');
                        } else if (type.id === 'reel') {
                          setMediaType('drive_video');
                        } else if (type.id === 'story') {
                          setMediaType(mediaUrls.length > 0 ? 'image' : 'drive_video');
                        } else {
                          setMediaType('image');
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-medium gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-black bg-zinc-900 text-white shadow-2xs font-bold ring-1 ring-black'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold">{type.label}</span>
                      <span className="text-[10px] opacity-70">{type.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google Drive Video Player Input for Reels or Video */}
            {(contentType === 'reel' || mediaType === 'drive_video') && (
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-zinc-900" />
                    Link do Google Drive do Vídeo *
                  </label>
                  <span className="text-[11px] text-zinc-700 font-medium">Player Integrado Automático</span>
                </div>
                <input
                  type="url"
                  required={contentType === 'reel' && mediaUrls.length === 0}
                  value={driveVideoUrl}
                  onChange={e => {
                    setDriveVideoUrl(e.target.value);
                    setMediaType('drive_video');
                  }}
                  placeholder="https://drive.google.com/file/d/1vB28fL.../view?usp=sharing"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 Cole o link com permissão de visualização ("Qualquer pessoa com o link"). O sistema converte automaticamente para o player integrado do Google Drive.
                </p>
              </div>
            )}

            {/* Media Upload with Drag and Drop Reordering */}
            {(contentType === 'static' || contentType === 'carousel' || contentType === 'story') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {contentType === 'carousel' 
                      ? 'Mídias do Carrossel (Imagens ou Vídeos - Arraste para reordenar)' 
                      : contentType === 'story'
                      ? 'Mídias do Story (Uma ou mais fotos/vídeos)'
                      : 'Arquivo de Mídia (Foto ou Vídeo)'}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {mediaUrls.length} {mediaUrls.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaUpload}
                  accept="image/*,video/*"
                  multiple={contentType === 'carousel' || contentType === 'story'}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2.5 items-center">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-24 w-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-black hover:bg-zinc-50 flex flex-col items-center justify-center text-slate-500 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-semibold">
                      {isUploading ? 'Otimizando...' : (contentType === 'carousel' || contentType === 'story' ? 'Adicionar Mídias' : 'Subir Arquivo')}
                    </span>
                  </button>

                  {/* Reorderable Media Items List */}
                  {mediaUrls.map((url, idx) => {
                    const isVideo = url.startsWith('data:video') || url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={e => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={e => handleDrop(e, idx)}
                        className={`relative h-24 w-24 rounded-xl border overflow-hidden group shrink-0 bg-slate-100 transition-all cursor-grab active:cursor-grabbing select-none ${
                          draggedIndex === idx
                            ? 'border-black ring-2 ring-black opacity-50 scale-95'
                            : 'border-slate-200 hover:border-slate-400 shadow-2xs'
                        }`}
                        title="Arraste para o lado para alterar a ordem"
                      >
                        {isVideo ? (
                          <video src={url} className="w-full h-full object-cover pointer-events-none" />
                        ) : (
                          <img src={url} alt={`Mídia ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />
                        )}

                        {/* Drag Handle Overlay */}
                        <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/60 text-white flex items-center gap-0.5 text-[9px] font-mono pointer-events-none">
                          <GripHorizontal className="w-2.5 h-2.5" />
                          <span>#{idx + 1}</span>
                          {isVideo && <span className="ml-0.5 text-[8px] bg-red-600 px-1 rounded">VÍDEO</span>}
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveMedia(idx);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        {/* Move Left / Right Buttons for accessibility and mobile */}
                        {(contentType === 'carousel' || contentType === 'story') && mediaUrls.length > 1 && (
                          <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={e => {
                                e.stopPropagation();
                                moveMedia(idx, 'left');
                              }}
                              className="p-1 rounded bg-black/70 text-white hover:bg-black disabled:opacity-30 cursor-pointer"
                              title="Mover para a esquerda"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === mediaUrls.length - 1}
                              onClick={e => {
                                e.stopPropagation();
                                moveMedia(idx, 'right');
                              }}
                              className="p-1 rounded bg-black/70 text-white hover:bg-black disabled:opacity-30 cursor-pointer"
                              title="Mover para a direita"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {contentType === 'carousel' && mediaUrls.length > 1 && (
                  <p className="text-[11px] text-slate-400">
                    💡 Clique em cima da mídia e arraste para o lado para reorganizar a sequência dos slides, ou use as setas.
                  </p>
                )}
              </div>
            )}

            {/* Scheduled Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-900" />
                Data e Horário da Publicação *
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full sm:w-72 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono"
              />
            </div>

            {/* Caption & Copywriting */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Legenda do Post (Texto de Aprovação)
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {caption.length} caracteres
                </span>
              </div>
              <textarea
                rows={5}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Insira a legenda completa com emojis, parágrafos, chamada para ação (CTA) e hashtags..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 leading-relaxed font-sans resize-y"
              />
            </div>
          </form>

          {/* Right: Real-time Live Phone Mockup Preview */}
          <div className="lg:col-span-5 p-6 bg-slate-50 flex flex-col items-center justify-center">
            <div className="w-full max-w-xs flex items-center justify-between mb-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-zinc-900" />
                Prévia ao Vivo do Cliente
              </span>
              <span className="text-[11px] bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded-full font-medium">
                {contentType === 'reel' ? 'Reels' : contentType === 'story' ? 'Story' : 'Instagram Feed'}
              </span>
            </div>

            {/* Smartphone frame */}
            <div className="w-full max-w-[320px] bg-white rounded-3xl border-4 border-slate-800 shadow-xl overflow-hidden flex flex-col text-slate-800 text-xs">
              {/* Phone status bar */}
              <div className="bg-slate-900 text-white px-4 py-1.5 flex items-center justify-between text-[10px] font-mono">
                <span>09:41</span>
                <div className="w-12 h-2.5 bg-slate-800 rounded-full mx-auto" />
                <span>5G 100%</span>
              </div>

              {/* Instagram post header */}
              <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px] overflow-hidden shrink-0 shadow-2xs"
                    style={{ backgroundColor: currentClient?.brandColor || '#000000' }}
                  >
                    {currentClient?.logo ? (
                      <img src={currentClient.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      currentClient?.company?.charAt(0).toUpperCase() || 'C'
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-[11px] truncate">
                      {currentClient?.company?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'cliente_oficial'}
                    </p>
                    <p className="text-[9px] text-slate-400">Programado · {formattedScheduled}</p>
                  </div>
                </div>
                <span className="text-slate-400 text-sm">•••</span>
              </div>

              {/* Media viewer inside mockup with adaptive aspect ratio: 1080x1350 (4:5) for Static/Carousel, 9:16 for Reel/Story */}
              <div className={`relative w-full bg-slate-900 flex items-center justify-center overflow-hidden transition-all duration-200 ${
                contentType === 'reel' || contentType === 'story' ? 'aspect-[9/16]' : 'aspect-[4/5]'
              }`}>
                {mediaType === 'drive_video' ? (
                  driveVideoUrl ? (
                    <iframe
                      src={getDriveEmbedUrl(driveVideoUrl)}
                      className="w-full h-full border-0"
                      allow="autoplay"
                      title="Prévia do Vídeo Google Drive"
                    />
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      <Video className="w-8 h-8 mx-auto mb-1 opacity-40" />
                      <p className="text-[11px]">Insira o link do Google Drive para carregar o player integrado</p>
                    </div>
                  )
                ) : mediaUrls.length > 0 ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {(() => {
                      const currentMedia = mediaUrls[activeSlide] || mediaUrls[0];
                      const isVideo = currentMedia.startsWith('data:video') || currentMedia.includes('.mp4') || currentMedia.includes('.mov') || currentMedia.includes('.webm');
                      return isVideo ? (
                        <video
                          src={currentMedia}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={currentMedia}
                          alt="Prévia"
                          className="w-full h-full object-cover"
                        />
                      );
                    })()}

                    {/* Lateral Side Navigation Arrows for previewing next/previous media */}
                    {mediaUrls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setActiveSlide(prev => (prev > 0 ? prev - 1 : mediaUrls.length - 1));
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all shadow-md z-20 cursor-pointer"
                          title="Mídia anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setActiveSlide(prev => (prev < mediaUrls.length - 1 ? prev + 1 : 0));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all shadow-md z-20 cursor-pointer"
                          title="Próxima mídia"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded-full text-[10px] font-mono z-20">
                          {activeSlide + 1}/{mediaUrls.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                    <p className="text-[11px]">Nenhuma mídia anexada ainda</p>
                  </div>
                )}

                {/* Carousel dots if multiple */}
                {(contentType === 'carousel' || contentType === 'story') && mediaUrls.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
                    {mediaUrls.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveSlide(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === activeSlide ? 'bg-white w-3' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons (Instagram style) */}
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-700">
                  <Heart className="w-4 h-4 hover:text-rose-500 cursor-pointer" />
                  <MessageCircle className="w-4 h-4 cursor-pointer" />
                  <Share2 className="w-4 h-4 cursor-pointer" />
                </div>
                <Bookmark className="w-4 h-4 text-slate-700 cursor-pointer" />
              </div>

              {/* Likes & Caption Preview */}
              <div className="px-3 pb-3 space-y-1">
                <p className="text-[10px] font-semibold text-slate-900">42 curtidas</p>
                <div className="text-[10px] text-slate-800 leading-snug line-clamp-3">
                  <span className="font-semibold mr-1">
                    {currentClient?.company?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'cliente'}
                  </span>
                  {caption || 'A legenda que você digitar ao lado aparecerá aqui exatamente como o cliente verá.'}
                </div>
                <p className="text-[9px] text-slate-400 uppercase pt-0.5">
                  Ver todos os 3 comentários
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Assim o cliente verá o material na tela de aprovação.
            </p>
          </div>
        </div>

        {/* Footer with agency customized button color */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="post-form"
            style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
            className="px-5 py-2 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90 shadow-xs cursor-pointer"
          >
            {postToEdit ? 'Salvar Alterações' : 'Publicar para Aprovação'}
          </button>
        </div>
      </div>
    </div>
  );
};
