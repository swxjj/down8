import React from 'react';
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
  if (!isOpen) return null;

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'youtube':
        return <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />;
      case 'instagram':
        return <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />;
      case 'twitter':
        return <TwitterIcon className="w-3 h-3 text-slate-100" />;
      case 'facebook':
        return <FacebookIcon className="w-3.5 h-3.5 text-blue-500" />;
      case 'tiktok':
        return <TikTokIcon className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getMediaTypeIcon = (type, isZip) => {
    if (isZip) return <Archive className="w-4 h-4 text-purple-400" />;
    if (type === 'audio') return <Music className="w-4 h-4 text-pink-400" />;
    return <Film className="w-4 h-4 text-brand-400" />;
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
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-dark-card border-l border-white/10 shadow-2xl flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-dark-surface/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Download History</h3>
                <p className="text-xs text-slate-400">
                  {history.length} {history.length === 1 ? 'recent file' : 'recent files'} stored locally
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Clear all history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body / List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                  <Download className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">No downloads yet</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Media you fetch and download will appear here for instant redownload and browser preview.
                  </p>
                </div>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.task_id || item.timestamp}
                  className="p-3.5 rounded-2xl bg-dark-elevated/60 border border-white/5 hover:border-white/15 transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 mt-0.5">
                        {getMediaTypeIcon(item.media_type, item.isZip)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">
                          {item.title || item.filename || 'Downloaded Media'}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center space-x-1">
                            {getPlatformIcon(item.platform)}
                            <span className="capitalize">{item.platform || 'Web'}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-300 font-semibold">{item.format || '1080p'}</span>
                          {item.file_size && (
                            <>
                              <span>•</span>
                              <span>{item.file_size}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.task_id)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from history"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                    <span>{formatTimestamp(item.timestamp)}</span>

                    <div className="flex items-center space-x-1.5">
                      {!item.isZip && onPreviewItem && (
                        <button
                          type="button"
                          onClick={() => onPreviewItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current text-brand-400" />
                          <span>Preview</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadAgain(item)}
                        className="px-2.5 py-1 rounded-lg bg-brand-600/80 hover:bg-brand-600 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm transition-colors"
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
          <div className="p-4 border-t border-white/10 bg-dark-surface/80 flex items-center justify-between text-xs text-slate-400">
            <span>Encrypted local storage persistence</span>
            <button
              type="button"
              onClick={onClose}
              className="text-brand-400 hover:underline font-medium"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
