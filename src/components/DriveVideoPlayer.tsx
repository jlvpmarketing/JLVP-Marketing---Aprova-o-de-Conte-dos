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

  // High performance endpoints
  const serverStreamUrl = `/api/drive-video/${fileId}`;
  const directGoogleStreamUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const cleanDriveViewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  const cleanDrivePreviewUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  // Default to native clean player (controls strictly at the bottom, zero overlays in the middle)
  const [playerMode, setPlayerMode] = useState<'native' | 'iframe'>('native');
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Enter native hardware full screen (lets phone native player take over cleanly)
  const handleToggleFullscreen = () => {
    try {
      const elem = videoRef.current || containerRef.current || iframeRef.current;
      if (!elem) return;

      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).webkitEnterFullscreen) {
          // iOS Safari native video fullscreen
          (elem as any).webkitEnterFullscreen();
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
      console.warn('Fullscreen fallback para aba cheia:', err);
      window.open(cleanDrivePreviewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden rounded-2xl select-none group ${className}`}
    >
      {/* Top Floating Control Bar - unobtrusive and translucent */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-auto">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 backdrop-blur-md text-white/90 border border-white/15 flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{playerMode === 'native' ? 'Vídeo (Player Limpo)' : 'Google Drive'}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {/* Toggle Native / Iframe mode */}
          <button
            type="button"
            onClick={() => setPlayerMode(prev => prev === 'native' ? 'iframe' : 'native')}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 hover:bg-black text-sky-300 hover:text-sky-200 backdrop-blur-md border border-sky-400/30 flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Alternar entre Player Nativo (sem botões no meio) e Embutido"
          >
            <RefreshCw className="w-3 h-3 text-sky-400" />
            <span>{playerMode === 'native' ? 'Modo Iframe' : 'Player Nativo'}</span>
          </button>

          {/* Fullscreen Button: Native Fullscreen removes middle controls on phones */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 hover:bg-black text-amber-300 hover:text-amber-200 backdrop-blur-md border border-amber-400/30 flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Assistir em Tela Cheia no celular"
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
            <span className="hidden sm:inline">Drive</span>
          </a>
        </div>
      </div>

      {/* Main Video Display Area */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {playerMode === 'native' && !videoError ? (
          <video
            ref={videoRef}
            src={serverStreamUrl}
            controls
            playsInline
            controlsList="nodownload"
            className="w-full h-full object-contain bg-black"
            onError={() => {
              // Try direct Google stream with confirm=t before falling back to iframe
              if (videoRef.current && videoRef.current.src !== directGoogleStreamUrl) {
                videoRef.current.src = directGoogleStreamUrl;
              } else {
                setVideoError(true);
                setPlayerMode('iframe');
              }
            }}
          />
        ) : (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full border-0 bg-black"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
            title={`Player Google Drive - ${title}`}
          />
        )}
      </div>

      {/* Bottom Quick Bar: prominent full screen and external view buttons */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto z-20">
        <button
          type="button"
          onClick={handleToggleFullscreen}
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
    </div>
  );
};
