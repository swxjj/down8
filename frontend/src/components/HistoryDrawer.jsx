import React from 'react';
import { 
  X, 
  Trash2, 
  Download, 
  Film, 
  Music, 
  Archive, 
  Play, 
  Globe 
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon, TwitterIcon, FacebookIcon, TikTokIcon } from './PlatformIcons';
import { triggerBrowserDownload, getDownloadUrl } from '../services/api';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from './ui/drawer';

function formatBytes(bytes) {
  if (!bytes) return null;
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(num) || num <= 0) return typeof bytes === 'string' ? bytes : null;
  if (typeof bytes === 'string' && (bytes.includes('MB') || bytes.includes('KB') || bytes.includes('GB') || bytes.includes('B'))) return bytes;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatCleanBadge(fmt) {
  if (!fmt) return '1080p';
  if (/^\d+$/.test(fmt)) return `${fmt}p`;
  return fmt;
}

export default function HistoryDrawer({ 
  isOpen, 
  onClose, 
  history = [], 
  onClearHistory, 
  onRemoveItem,
  onPreviewItem 
}) {
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'youtube':
        return <YoutubeIcon className="w-3.5 h-3.5" variant="monochrome" />;
      case 'instagram':
        return <InstagramIcon className="w-3.5 h-3.5" variant="monochrome" />;
      case 'twitter':
        return <TwitterIcon className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" variant="monochrome" />;
      case 'facebook':
        return <FacebookIcon className="w-3.5 h-3.5" variant="monochrome" />;
      case 'tiktok':
        return <TikTokIcon className="w-3.5 h-3.5" variant="monochrome" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />;
    }
  };

  const getMediaTypeIcon = (type, isZip) => {
    if (isZip) return <Archive className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />;
    if (type === 'audio') return <Music className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />;
    return <Film className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />;
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
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-black/10 dark:border-white/10 max-h-[85vh] font-sans">
        <div className="mx-auto w-full max-w-2xl px-6 pb-6 pt-2 flex flex-col h-full overflow-hidden">
          
          <DrawerHeader className="px-0 py-3 flex flex-row items-center justify-between border-b border-black/5 dark:border-white/5">
            <div>
              <DrawerTitle className="font-['Montserrat',sans-serif] text-base font-semibold text-zinc-900 dark:text-zinc-100">
                History
              </DrawerTitle>
              <DrawerDescription className="font-mono text-xs text-zinc-500">
                {history.length} items saved locally
              </DrawerDescription>
            </div>

            <div className="flex items-center space-x-2">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
              <DrawerClose asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2.5 pr-1 max-h-[60vh]">
            {history.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-zinc-900 border border-black/5 dark:border-white/5 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">No downloads yet</h4>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xs leading-relaxed">
                    Media you download will appear here for fast re-downloading.
                  </p>
                </div>
              </div>
            ) : (
              history.map((item) => {
                const formattedSize = formatBytes(item.file_size);
                const cleanBadge = formatCleanBadge(item.format);

                return (
                  <div
                    key={item.task_id || item.timestamp}
                    className="rounded-xl p-3.5 bg-black/[0.02] dark:bg-zinc-900/40 border border-black/5 dark:border-white/[0.06] hover:border-black/10 dark:hover:border-white/10 transition-colors space-y-2.5 group shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-black/5 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 flex-shrink-0 mt-0.5">
                          {getMediaTypeIcon(item.media_type, item.isZip)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {item.title || item.filename || 'Media file'}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] flex-wrap">
                            <span className="flex items-center space-x-1 text-zinc-600 dark:text-zinc-400">
                              {getPlatformIcon(item.platform)}
                              <span className="capitalize">{item.platform || 'Direct'}</span>
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                              {cleanBadge}
                            </span>
                            {formattedSize && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                {formattedSize}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.task_id)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-[11px]">
                      <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 tabular-nums">
                        {formatTimestamp(item.timestamp)}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        {!item.isZip && onPreviewItem && (
                          <button
                            type="button"
                            onClick={() => onPreviewItem(item)}
                            className="bg-black/5 dark:bg-zinc-800/60 hover:bg-black/10 dark:hover:bg-zinc-800 border border-black/5 dark:border-white/5 text-zinc-700 dark:text-zinc-300 h-7 px-3 text-xs rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current text-zinc-500 dark:text-zinc-400" />
                            <span>Preview</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDownloadAgain(item)}
                          className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold h-7 px-3 text-xs rounded-lg flex items-center space-x-1.5 hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}
