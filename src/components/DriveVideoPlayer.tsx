import React, { useState, useRef, useEffect } from 'react';
import { extractDriveFileId, getDriveEmbedUrl } from '../utils/drivePlayer';
import { Maximize2, ExternalLink, RefreshCw, Video, AlertCircle, Play, X } from 'lucide-react';

interface DriveVideoPlayerProps {
  url: string;
  title?: string;
  aspectClass?: string;
  autoPlay?: boolean;
  className?: string;
  forceMode?: 'native' | 'iframe';
  onModeChange?: (mode: 'native' | 'iframe') => void;
}

export const DriveVideoPlayer: React.FC<DriveVideoPlayerProps> = ({
  url,
  title = 'Vídeo',
  aspectClass = 'aspect-[9/16]',
  autoPlay = false,
  className = '',
  forceMode,
  onModeChange,
}) => {
  const fileId = extractDriveFileId(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playerMode, setPlayerMode] = useState<'native' | 'iframe'>(forceMode || 'native');
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOverlayFullscreen, setIsOverlayFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (forceMode && forceMode !== playerMode) {
      setPlayerMode(forceMode);
      setVideoError(false);
      setIsLoading(false);
    }
  }, [forceMode]);

  if (!fileId) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
        <Video className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-xs font-semibold text-slate-300">Link do Google Drive não identificado</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
          Cole o link de compartilhamento do Google Drive com permissão "Qualquer pessoa com o link pode ver".
        </p>
      </div>
    );
  }

  // Endpoints
  const serverStreamUrl = `/api/drive-video/${fileId}`;
  const cleanDriveViewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  const cleanDrivePreviewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const embedUrl = cleanDrivePreviewUrl;

  const handleToggleMode = () => {
    const nextMode = playerMode === 'native' ? 'iframe' : 'native';
    setPlayerMode(nextMode);
    setVideoError(false);
    setIsLoading(false);
    if (onModeChange) onModeChange(nextMode);
  };

  const retryNativeVideo = () => {
    setVideoError(false);
    setIsLoading(false);
    setRetryCount(prev => prev + 1);
    setTimeout(() => {
      if (videoRef.current) {
        try {
          videoRef.current.src = `${serverStreamUrl}?retry=${Date.now()}`;
          videoRef.current.load();
          videoRef.current.play().catch(() => {});
        } catch (e) {
          console.warn('Erro ao reiniciar vídeo:', e);
        }
      }
    }, 50);
  };

  const handleToggleFullscreen = () => {
    setIsOverlayFullscreen(true);
    try {
      const elem = containerRef.current || videoRef.current;
      if (elem && elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
    } catch {}
  };

  const handleExitFullscreen = () => {
    setIsOverlayFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      data-testid="drive-video-container"
      data-player-mode={playerMode}
      className={`relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden rounded-2xl select-none group ${className}`}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-auto">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 backdrop-blur-md text-white/90 border border-white/15 flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span data-testid="player-mode-badge">{playerMode === 'native' ? 'Vídeo (Player Limpo)' : 'Google Drive (Iframe)'}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {/* Toggle Native / Iframe mode */}
          <button
            type="button"
            onClick={handleToggleMode}
            data-testid="toggle-player-mode"
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 hover:bg-black text-sky-300 hover:text-sky-200 backdrop-blur-md border border-sky-400/30 flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Alternar entre Player Nativo e Modo Iframe"
          >
            <RefreshCw className="w-3 h-3 text-sky-400" />
            <span>{playerMode === 'native' ? 'Modo Iframe' : 'Player Nativo'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            data-testid="fullscreen-btn"
            aria-label="Tela Cheia"
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 hover:bg-black text-amber-300 hover:text-amber-200 backdrop-blur-md border border-amber-400/30 flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Assistir em Tela Cheia"
          >
            <Maximize2 className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Tela Cheia</span>
          </button>

          {/* Open direct clean view in Google Drive */}
          <a
            href={cleanDriveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 flex items-center gap-1 shadow-md transition-all active:scale-95"
            title="Abrir no Google Drive oficial"
          >
            <ExternalLink className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Drive</span>
          </a>
        </div>
      </div>

      {/* Main Video Display Area */}
      <div className="relative w-full h-full flex items-center justify-center bg-black min-h-[300px]">
        {playerMode === 'native' ? (
          videoError ? (
            <div className="w-full h-full min-h-[280px] p-6 flex flex-col items-center justify-center text-center bg-slate-950 text-white space-y-4">
              <Video className="w-12 h-12 text-amber-400/80 animate-pulse" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Carregamento do Vídeo</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  O vídeo está pronto para ser reproduzido. Clique em tentar novamente ou assista pelo modo embutido.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={retryNativeVideo}
                  data-testid="retry-video-btn"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Tentar Novamente (Player Limpo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVideoError(false);
                    setPlayerMode('iframe');
                    if (onModeChange) onModeChange('iframe');
                  }}
                  data-testid="switch-to-iframe-btn"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl text-xs font-semibold transition-all border border-slate-700 active:scale-95 cursor-pointer"
                >
                  Assistir via Iframe
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              key={`native-video-${fileId}-${retryCount}`}
              src={`${serverStreamUrl}?retry=${retryCount}`}
              controls
              playsInline
              autoPlay={autoPlay || retryCount > 0}
              controlsList="nodownload"
              data-testid="native-video-player"
              className="w-full h-full object-contain bg-black"
              onCanPlay={() => {
                setIsLoading(false);
                setVideoError(false);
              }}
              onLoadedMetadata={() => {
                setIsLoading(false);
                setVideoError(false);
              }}
              onError={() => {
                console.warn('Stream com oscilação, exibindo opção de recarregar');
                setVideoError(true);
                setIsLoading(false);
              }}
            />
          )
        ) : (
          <iframe
            ref={iframeRef}
            key={`iframe-${fileId}`}
            src={embedUrl}
            data-testid="drive-iframe"
            title={`Player Google Drive - ${title}`}
            className="w-full h-full border-0 bg-black min-h-[350px]"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
          />
        )}
      </div>

      {/* Bottom Quick Bar */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto z-20">
        <button
          type="button"
          onClick={handleToggleFullscreen}
          data-testid="bottom-fullscreen-btn"
          aria-label="Tela Cheia"
          className="px-3 py-1.5 rounded-xl bg-black/85 hover:bg-black text-amber-300 text-xs font-semibold backdrop-blur-md border border-amber-400/30 flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Tela Cheia (Vídeo Limpo)</span>
        </button>

        <a
          href={cleanDriveViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 rounded-xl bg-black/85 hover:bg-black text-slate-200 text-[11px] font-medium backdrop-blur-md border border-white/20 flex items-center gap-1 shadow-md transition-colors"
          title="Abrir no Google Drive oficial"
        >
          <ExternalLink className="w-3 h-3 text-sky-400" />
          <span>Abrir no Drive</span>
        </a>
      </div>

      {/* Fullscreen Overlay Viewer */}
      {isOverlayFullscreen && (
        <div
          data-testid="fullscreen-viewer"
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-50">
            <span className="text-sm font-bold text-white bg-black/80 px-3.5 py-1.5 rounded-xl border border-white/20 backdrop-blur-md">
              {title} (Tela Cheia)
            </span>
            <button
              type="button"
              onClick={handleExitFullscreen}
              data-testid="exit-fullscreen-btn"
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              aria-label="Sair da tela cheia"
            >
              <X className="w-4 h-4" />
              <span>Sair da Tela Cheia</span>
            </button>
          </div>

          <div className="w-full h-full max-h-[92vh] max-w-5xl flex items-center justify-center">
            {playerMode === 'native' ? (
              <video
                key={`fs-video-${fileId}-${retryCount}`}
                src={`${serverStreamUrl}?fs=1&retry=${retryCount}`}
                controls
                playsInline
                autoPlay
                data-testid="fullscreen-video"
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                key={`fs-iframe-${fileId}`}
                src={embedUrl}
                data-testid="fullscreen-iframe"
                title={`Tela Cheia - ${title}`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
