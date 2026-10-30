import React, { useState, useRef } from 'react';
import { extractDriveFileId, getDriveEmbedUrl } from '../utils/drivePlayer';
import { Maximize2, ExternalLink, RefreshCw, Video, AlertCircle, Play } from 'lucide-react';

interface DriveVideoPlayerProps {
  url: string;
  title?: string;
  aspectClass?: string;
  autoPlay?: boolean;
  className?: string;
}

export const DriveVideoPlayer: React.FC<DriveVideoPlayerProps> = ({
  url,
  title = 'Vídeo',
  aspectClass = 'aspect-[9/16]',
  autoPlay = false,
  className = '',
}) => {
  const fileId = extractDriveFileId(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

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

  // Official clean Google Drive embed & direct view URLs
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const cleanDriveViewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  const cleanDrivePreviewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const directStreamUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  // State to support native clean player (controls strictly at the bottom) or iframe
  const [playerMode, setPlayerMode] = useState<'iframe' | 'native'>('iframe');

  // Enter native hardware full screen (removes all centered overlays on mobile by letting phone native player take over)
  const handleToggleFullscreen = () => {
    try {
      const elem = containerRef.current || iframeRef.current;
      if (!elem) return;

      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          (elem as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen não suportado diretamente:', err);
      // Fallback: open full-screen preview tab
      window.open(cleanDrivePreviewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden rounded-2xl select-none group ${className}`}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-auto">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/75 backdrop-blur-md text-white/90 border border-white/15 flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Google Drive</span>
        </span>

        <div className="flex items-center gap-1.5">
          {/* Toggle Native / Iframe mode */}
          <button
            type="button"
            onClick={() => setPlayerMode(prev => prev === 'iframe' ? 'native' : 'iframe')}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 hover:bg-black text-sky-300 hover:text-sky-200 backdrop-blur-md border border-sky-400/30 flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Alternar modo de player"
          >
            <RefreshCw className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">{playerMode === 'native' ? 'Modo Embutido' : 'Player Limpo'}</span>
          </button>

          {/* Fullscreen Button: Native Fullscreen removes middle controls on phones */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 hover:bg-black text-amber-300 hover:text-amber-200 backdrop-blur-md border border-amber-400/30 flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Assistir em Tela Cheia (elimina botões na frente da tela no celular)"
          >
            <Maximize2 className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Tela Cheia</span>
          </button>

          {/* Open direct clean view in Google Drive with sharing permission parameter */}
          <a
            href={cleanDriveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 flex items-center gap-1 shadow-md transition-all active:scale-95"
            title="Abrir no Google Drive oficial"
          >
            <ExternalLink className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Abrir no Drive</span>
          </a>
        </div>
      </div>

      {/* Embedded Player */}
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
        {playerMode === 'native' ? (
          <video
            src={directStreamUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
            onError={() => {
              // If Google Drive blocks direct uc download (e.g. file needs virus check confirmation), fallback to iframe
              setPlayerMode('iframe');
            }}
          />
        ) : (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
            title={`Player Google Drive - ${title}`}
          />
        )}
      </div>

      {/* Mobile Friendly Bottom Quick Assist Bar */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto z-20">
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="px-3 py-1.5 rounded-xl bg-black/85 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/25 flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Tela Cheia (Sem botões no meio)</span>
        </button>

        <a
          href={cleanDrivePreviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 rounded-xl bg-black/80 hover:bg-black text-slate-200 text-[11px] font-medium backdrop-blur-md border border-white/15 flex items-center gap-1 shadow-md transition-colors"
          title="Abrir em aba cheia"
        >
          <ExternalLink className="w-3 h-3 text-sky-400" />
          <span className="hidden sm:inline">Nova Aba</span>
        </a>
      </div>
    </div>
  );
};
