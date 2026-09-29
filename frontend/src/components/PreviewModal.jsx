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
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Media Preview"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0e0e11]/80 backdrop-blur-[4px] animate-in fade-in duration-150 font-sans"
    >
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#16161a] border border-[#27272e] rounded-[16px] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh] text-[#ededed]">
        
        {/* Modal Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272e] bg-[#16161a]">
          <div className="flex items-center space-x-2.5 min-w-0 pr-4">
            <span className="p-1.5 rounded-[6px] bg-[#1c1c22] text-[#ededed] border border-[#27272e]">
              {isAudio ? <Music className="w-4 h-4" /> : <Film className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <h3 className="text-[14px] font-medium text-[#ededed] truncate">
                {task.title || task.filename || 'Direct Stream Replay'}
              </h3>
              <p className="text-[11px] font-mono text-[#a1a1aa]">
                STREAM PLAYBACK • {isAudio ? 'AUDIO EXTRACT' : 'MP4 CONTAINER'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="bg-[#ededed] hover:bg-white text-[#0e0e11] font-medium flex items-center space-x-1.5 px-4 py-1.5 rounded-[999px] text-[13px] transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save File</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#1c1c22] transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Player Area */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center bg-[#0e0e11] min-h-[300px]">
          {isAudio ? (
            /* Audio Visualizer & Player */
            <div className="w-full max-w-md py-6 flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-[12px] bg-[#16161a] border border-[#27272e] flex items-center justify-center text-[#ededed] shadow-sm">
                <Music className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-[14px] font-medium text-[#ededed] max-w-md truncate">
                  {task.title || task.filename}
                </h4>
                <p className="text-[12px] text-[#a1a1aa] mt-0.5 font-mono tabular-nums">
                  {task.file_size ? `${task.file_size} • ` : ''}320 KBPS / AAC STREAM
                </p>
              </div>

              {/* HTML5 Audio Player */}
              <div className="w-full bg-[#16161a] border border-[#27272e] rounded-[10px] p-2.5 shadow-sm">
                <audio
                  ref={audioRef}
                  src={previewSourceUrl}
                  controls
                  autoPlay
                  className="w-full"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          ) : (
            /* HTML5 Video Player */
            <div className="w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={previewSourceUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[60vh] w-full rounded-[10px] bg-black border border-[#27272e] object-contain shadow-sm"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-[#27272e] bg-[#16161a] flex items-center justify-between text-[11px] font-mono text-[#71717a]">
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>STREAM BUFFER ACTIVE</span>
          </span>

          <span>[ESC] TO EXIT</span>
        </div>

      </div>
    </div>
  );
}
