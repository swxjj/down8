import React, { useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Download, 
  Clock, 
  Film, 
  Music, 
  Archive, 
  Play, 
  Globe 
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon, TwitterIcon, FacebookIcon, TikTokIcon } from './PlatformIcons';
import { triggerBrowserDownload, getDownloadUrl } from '../services/api';

export default function HistoryDrawer({ 
  isOpen, 
  onClose, 
  history = [], 
  onClearHistory, 
  onRemoveItem,
  onPreviewItem 
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'youtube':
        return <YoutubeIcon className="w-3.5 h-3.5" variant="monochrome" />;
      case 'instagram':
        return <InstagramIcon className="w-3.5 h-3.5" variant="monochrome" />;
      case 'twitter':
        return <TwitterIcon className="w-3.5 h-3.5 text-[#ededed]" variant="monochrome" />;
      case 'facebook':
        return <FacebookIcon className="w-3.5 h-3.5" variant="monochrome" />;
      case 'tiktok':
        return <TikTokIcon className="w-3.5 h-3.5" variant="monochrome" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-[#a1a1aa]" />;
    }
  };

  const getMediaTypeIcon = (type, isZip) => {
    if (isZip) return <Archive className="w-3.5 h-3.5 text-[#ededed]" />;
    if (type === 'audio') return <Music className="w-3.5 h-3.5 text-[#ededed]" />;
    return <Film className="w-3.5 h-3.5 text-[#ededed]" />;
  };

  const handleDownloadAgain = (item) => {
    const fileUrl = item.file_url || getDownloadUrl(item.task_id);
    const fileName = item.filename || 'downloaded-media';
    triggerBrowserDownload(fileUrl, fileName);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Recently';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Dark backdrop */}
      <div 
        className="absolute inset-0 bg-[#0e0e11]/70 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-label="Download History"
          className="w-screen max-w-md bg-[#16161a] border-l border-[#27272e] shadow-2xl flex flex-col justify-between text-[#ededed]"
        >
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-[#27272e] flex items-center justify-between bg-[#16161a]">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-md bg-[#1c1c22] border border-[#27272e] text-[#ededed]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-[#ededed]">History</h3>
                <p className="text-[12px] text-[#a1a1aa] tabular-nums">
                  {history.length} {history.length === 1 ? 'item saved locally' : 'items saved locally'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="p-1.5 rounded-[6px] text-[#a1a1aa] hover:text-[#f87171] hover:bg-[#1c1c22] transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-[6px] text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#1c1c22] transition-colors"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#16161a]">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#1c1c22] border border-[#27272e] flex items-center justify-center text-[#71717a]">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[13px] font-medium text-[#ededed]">No downloads yet</h4>
                  <p className="text-[12px] text-[#71717a] mt-0.5 max-w-xs">
                    Media you download will appear here for fast re-downloading.
                  </p>
                </div>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.task_id || item.timestamp}
                  className="p-3 rounded-[12px] bg-[#1c1c22] border border-[#27272e] hover:border-[#3f3f46] transition-all space-y-2 group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-[#16161a] border border-[#27272e] flex-shrink-0 mt-0.5">
                        {getMediaTypeIcon(item.media_type, item.isZip)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-medium text-[#ededed] truncate">
                          {item.title || item.filename || 'Media file'}
                        </h4>
                        <div className="flex items-center space-x-1.5 mt-0.5 text-[11px] text-[#a1a1aa]">
                          <span className="flex items-center space-x-1">
                            {getPlatformIcon(item.platform)}
                            <span className="capitalize">{item.platform || 'Direct'}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[#ededed]">{item.format || '1080p'}</span>
                          {item.file_size && (
                            <>
                              <span>•</span>
                              <span className="tabular-nums">{item.file_size}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.task_id)}
                      className="text-[#71717a] hover:text-[#ededed] p-1 rounded transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#27272e] text-[11px] text-[#71717a]">
                    <span className="tabular-nums">{formatTimestamp(item.timestamp)}</span>

                    <div className="flex items-center space-x-1.5">
                      {!item.isZip && onPreviewItem && (
                        <button
                          type="button"
                          onClick={() => onPreviewItem(item)}
                          className="bg-[#16161a] hover:bg-[#27272e] border border-[#27272e] text-[#a1a1aa] hover:text-[#ededed] py-1 px-2.5 text-[11px] rounded-full flex items-center space-x-1 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current text-[#a1a1aa]" />
                          <span>Preview</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadAgain(item)}
                        className="bg-[#ededed] hover:bg-white text-[#0e0e11] font-medium py-1 px-3 text-[11px] rounded-full flex items-center space-x-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3.5 border-t border-[#27272e] bg-[#16161a] flex items-center justify-between text-[12px] text-[#71717a]">
            <span>Stored in browser memory</span>
            <button
              type="button"
              onClick={onClose}
              className="text-[#a1a1aa] hover:text-[#ededed] font-medium transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
