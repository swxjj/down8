import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Film, 
  Music 
} from 'lucide-react';
import { getPreviewUrl, triggerBrowserDownload, getDownloadUrl } from '../services/api';

export default function PreviewModal({ task, isOpen, onClose }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const isAudio = task.options?.media_type === 'audio' || (task.filename && (task.filename.endsWith('.mp3') || task.filename.endsWith('.m4a')));
  
  // Use preview endpoint or fallback direct URL/mock
  const previewSourceUrl = task.task_id.startsWith('mock-')
    ? (isAudio 
        ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' 
        : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
    : getPreviewUrl(task.task_id);

  const handleDownload = () => {
    const fileUrl = task.file_url || getDownloadUrl(task.task_id);
    const fileName = task.filename || (isAudio ? 'media.mp3' : 'media.mp4');
    triggerBrowserDownload(fileUrl, fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-dark-card border border-white/15 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
        
        {/* Modal Top Navigation Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-dark-surface/80">
          <div className="flex items-center space-x-2.5 min-w-0 pr-4">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/20">
              {isAudio ? <Music className="w-4 h-4" /> : <Film className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {task.title || task.filename || 'In-Browser Media Player'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct Stream Preview • {isAudio ? 'High-Res Audio' : 'H.264 MP4 Stream'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save File</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Player Area */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center bg-dark-bg/95 min-h-[300px]">
          {isAudio ? (
            /* Audio Visualizer & Player */
            <div className="w-full max-w-lg py-8 flex flex-col items-center space-y-6 text-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-accent-purple via-brand-600 to-accent-emerald p-1 shadow-glow-violet animate-pulse-subtle">
                  <div className="w-full h-full bg-dark-card rounded-[22px] flex items-center justify-center">
                    <Music className="w-12 h-12 text-brand-300" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-white max-w-md truncate">
                  {task.title || task.filename}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {task.file_size ? `${task.file_size} • ` : ''}Universal 320kbps MP3 / Native AAC
                </p>
              </div>

              {/* Native HTML5 Audio Player */}
              <div className="w-full bg-dark-card/90 border border-white/10 rounded-2xl p-3 shadow-lg">
                <audio
                  ref={audioRef}
                  src={previewSourceUrl}
                  controls
                  autoPlay
                  className="w-full"
                >
                  Your browser does not support audio element.
                </audio>
              </div>
            </div>
          ) : (
            /* Native HTML5 Video Player */
            <div className="w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={previewSourceUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[60vh] w-full rounded-2xl shadow-2xl bg-black border border-white/5 object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-dark-surface/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Streamed directly from local temporary cache</span>
          </span>

          <span className="font-mono text-[11px] text-slate-500">
            Press ESC to exit
          </span>
        </div>

      </div>
    </div>
  );
}
