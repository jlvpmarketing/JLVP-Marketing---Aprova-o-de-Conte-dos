import React, { useState, useRef } from 'react';
import { extractDriveFileId, getDriveEmbedUrl } from '../utils/drivePlayer';
import { Play, ExternalLink, RefreshCw, Video, AlertCircle } from 'lucide-react';

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
  const [playerMode, setPlayerMode] = useState<'native' | 'iframe'>('native');
  const [hasNativeError, setHasNativeError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!fileId) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950 rounded-2xl">
        <Video className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-xs font-semibold text-slate-300">Link do Google Drive não identificado</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
          Verifique se o link compartilhado é do Google Drive e possui permissão pública de visualização.
        </p>
      </div>
    );
  }

  // Google Direct CDN streaming URL (lh3.googleusercontent.com/d/ID)
  // This serves raw video without any Google Drive iframe overlays in the center of the mobile screen!
  const directCdnUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  const embedUrl = getDriveEmbedUrl(fileId);
  const fullDriveViewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

  const handleNativeError = () => {
    // If native stream couldn't load (e.g. very large file requiring Google virus scan screen),
    // automatically fall back to the embedded Google Drive player
    setHasNativeError(true);
    setPlayerMode('iframe');
  };

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden rounded-2xl select-none ${className}`}>
      {playerMode === 'native' && !hasNativeError ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={directCdnUrl}
            controls
            playsInline
            controlsList="nodownload"
            preload="metadata"
            autoPlay={autoPlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={handleNativeError}
            className="w-full h-full object-contain"
          />

          {/* Top Quick Actions Bar (semi-transparent, unobtrusive) */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20 pointer-events-auto">
            <a
              href={fullDriveViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs border border-white/10 flex items-center gap-1 shadow-sm transition-colors"
              title="Abrir no Google Drive oficial"
            >
              <ExternalLink className="w-3 h-3 text-amber-400" />
              <span>Drive Oficial</span>
            </a>

            <button
              type="button"
              onClick={() => setPlayerMode('iframe')}
              className="p-1 rounded-full text-[10px] bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white backdrop-blur-xs border border-white/10 transition-colors"
              title="Alternar para Player Embutido do Google"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* Iframe Fallback Player with Clean Controls & Full View Link */
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-950">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={`Player Google Drive - ${title}`}
          />

          {/* Floating actions at bottom to assist mobile users */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto z-20">
            <a
              href={fullDriveViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Abrir no App do Drive (Tela Cheia)</span>
            </a>

            {!hasNativeError && (
              <button
                type="button"
                onClick={() => setPlayerMode('native')}
                className="px-2.5 py-1.5 rounded-xl bg-black/70 hover:bg-black text-slate-300 text-[11px] font-medium backdrop-blur-md border border-white/10 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Player Direto</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
