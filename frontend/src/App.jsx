import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import MediaPreview from './components/MediaPreview';
import ProgressCard from './components/ProgressCard';
import PreviewModal from './components/PreviewModal';
import HistoryDrawer from './components/HistoryDrawer';
import ErrorAlert from './components/ErrorAlert';
import { 
  fetchMediaInfo, 
  startDownload, 
  startZipDownload, 
  subscribeToTaskEvents 
} from './services/api';
import { 
  Sparkles, 
  Music, 
  Archive, 
  Film 
} from 'lucide-react';

const STORAGE_KEY = 'omnimedia_download_history';

export default function App() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [error, setError] = useState(null);
  
  // Download task state
  const [activeTask, setActiveTask] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // History state with lazy initializer to eliminate cascading render warnings
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // In-browser Preview Modal state
  const [previewTask, setPreviewTask] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Unsubscribe ref for SSE
  const sseUnsubscribeRef = useRef(null);

  // Save history to localStorage
  const saveToHistory = (item) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.task_id !== item.task_id);
      const updated = [item, ...filtered].slice(0, 50); // keep last 50
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist history', e);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear history', e);
    }
  };

  const removeHistoryItem = (taskId) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.task_id !== taskId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to remove history item', e);
      }
      return updated;
    });
  };

  // Clean up any active SSE listener
  const cleanupSse = () => {
    if (sseUnsubscribeRef.current) {
      sseUnsubscribeRef.current();
      sseUnsubscribeRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupSse();
  }, []);

  // Handle URL fetch
  const handleFetchMedia = async (urlToFetch) => {
    if (!urlToFetch) return;
    setError(null);
    setIsLoadingInfo(true);
    setCurrentUrl(urlToFetch);

    try {
      const data = await fetchMediaInfo(urlToFetch);
      setMediaInfo(data);
    } catch (err) {
      console.error('Fetch media failed:', err);
      setError(err);
      setMediaInfo(null);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  // Handle start download (Single Media or Audio)
  const handleStartDownload = async (options) => {
    if (!mediaInfo) return;
    setError(null);
    setIsDownloading(true);
    cleanupSse();

    const initialTask = {
      task_id: 'pending-' + Date.now(),
      title: mediaInfo.title,
      platform: mediaInfo.platform,
      format: options.media_type === 'audio' 
        ? (options.audio_format?.toUpperCase() || 'MP3 320kbps') 
        : (options.format_id || '1080p MP4'),
      media_type: options.media_type,
      status: 'connecting',
      status_text: 'Initiating download stream...',
      progress: 5,
      percent: 5,
      speed: 'Connecting...',
      eta: 'Calculating...',
      filename: `${mediaInfo.title || 'media'}.${options.media_type === 'audio' ? (options.audio_format || 'mp3') : 'mp4'}`,
      options,
    };

    setActiveTask(initialTask);

    try {
      const result = await startDownload({
        url: mediaInfo.url || currentUrl,
        format_id: options.format_id,
        media_type: options.media_type,
        audio_format: options.audio_format,
        item_index: options.item_index,
      });

      const actualTaskId = result.task_id;
      setActiveTask((prev) => ({
        ...prev,
        task_id: actualTaskId,
      }));

      // Subscribe to real-time events via SSE
      sseUnsubscribeRef.current = subscribeToTaskEvents(
        actualTaskId,
        (progressData) => {
          setActiveTask((prev) => ({
            ...prev,
            ...progressData,
            progress: progressData.percent ?? progressData.progress ?? prev.progress,
            percent: progressData.percent ?? progressData.progress ?? prev.percent,
            speed: progressData.speed || prev.speed,
            eta: progressData.eta || prev.eta,
          }));
        },
        (completeData) => {
          setIsDownloading(false);
          const finishedTask = {
            ...initialTask,
            task_id: actualTaskId,
            ...completeData,
            status: 'completed',
            progress: 100,
            timestamp: Date.now(),
          };
          setActiveTask(finishedTask);
          saveToHistory(finishedTask);
        },
        (errorMsg) => {
          setIsDownloading(false);
          setActiveTask((prev) => ({
            ...prev,
            status: 'failed',
            error: errorMsg,
          }));
        }
      );
    } catch (err) {
      setIsDownloading(false);
      setError(err);
      setActiveTask((prev) => ({
        ...prev,
        status: 'failed',
        error: err.message || 'Download request failed',
      }));
    }
  };

  // Handle individual item download in carousel
  const handleDownloadItem = (item, index) => {
    handleStartDownload({
      media_type: item.type === 'video' ? 'video' : 'photo',
      format_id: 'original',
      item_index: index,
    });
  };

  // Handle ZIP package download for carousels
  const handleDownloadZip = async ({ selected_ids }) => {
    if (!mediaInfo) return;
    setError(null);
    setIsDownloading(true);
    cleanupSse();

    const initialTask = {
      task_id: 'pending-zip-' + Date.now(),
      title: `${mediaInfo.title || 'Carousel Collection'} (ZIP Bundle)`,
      platform: mediaInfo.platform,
      format: `ZIP (${selected_ids.length} items)`,
      media_type: 'zip',
      isZip: true,
      status: 'connecting',
      status_text: 'Preparing carousel package manifest...',
      progress: 8,
      percent: 8,
      speed: 'Preparing...',
      eta: '00:10',
      filename: `${(mediaInfo.title || 'Carousel_Media').replace(/[^a-zA-Z0-9_-]/g, '_')}_Bundle.zip`,
      options: { selected_ids, isZip: true },
    };

    setActiveTask(initialTask);

    try {
      const result = await startZipDownload({
        url: mediaInfo.url || currentUrl,
        selected_ids,
      });

      const actualTaskId = result.task_id;
      setActiveTask((prev) => ({
        ...prev,
        task_id: actualTaskId,
      }));

      sseUnsubscribeRef.current = subscribeToTaskEvents(
        actualTaskId,
        (progressData) => {
          setActiveTask((prev) => ({
            ...prev,
            ...progressData,
            progress: progressData.percent ?? progressData.progress ?? prev.progress,
            percent: progressData.percent ?? progressData.progress ?? prev.percent,
            speed: progressData.speed || prev.speed,
            eta: progressData.eta || prev.eta,
          }));
        },
        (completeData) => {
          setIsDownloading(false);
          const finishedTask = {
            ...initialTask,
            task_id: actualTaskId,
            ...completeData,
            status: 'completed',
            progress: 100,
            timestamp: Date.now(),
          };
          setActiveTask(finishedTask);
          saveToHistory(finishedTask);
        },
        (errorMsg) => {
          setIsDownloading(false);
          setActiveTask((prev) => ({
            ...prev,
            status: 'failed',
            error: errorMsg,
          }));
        }
      );
    } catch (err) {
      setIsDownloading(false);
      setError(err);
      setActiveTask((prev) => ({
        ...prev,
        status: 'failed',
        error: err.message || 'ZIP packaging request failed',
      }));
    }
  };

  // Open In-Browser Preview Modal
  const handleOpenPreview = (taskToPreview) => {
    setPreviewTask(taskToPreview);
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white relative">
      
      {/* Background Visual Effects & Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-brand-600/15 via-accent-violet/10 to-transparent blur-3xl opacity-70"></div>
        <div className="absolute -top-32 right-10 w-96 h-96 bg-accent-emerald/10 blur-3xl rounded-full"></div>
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-brand-500/10 blur-3xl rounded-full"></div>
        <div className="absolute inset-0 bg-subtle-grid opacity-20"></div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Navigation Header */}
        <Header 
          historyCount={history.length}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-8 flex-1">
          
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-3xl mx-auto pt-2 pb-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Next-Gen High-Fidelity Downloader</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Download <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-accent-violet to-accent-emerald">4K Video, High-Res Audio</span> & Carousels
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Ultra-fast extraction for YouTube, Instagram, X/Twitter, and Facebook. Download full 4K 60fps streams, 320kbps MP3s, and batch Instagram carousels in 1-click ZIP archives.
            </p>
          </div>

          {/* Search / URL Input Component */}
          <UrlInput
            onFetch={handleFetchMedia}
            isLoading={isLoadingInfo}
            currentUrl={currentUrl}
          />

          {/* Error Alert (if any) */}
          {error && (
            <ErrorAlert
              error={error}
              onDismiss={() => setError(null)}
              onRetry={() => handleFetchMedia(currentUrl)}
            />
          )}

          {/* Active Download Progress Card */}
          {activeTask && (
            <ProgressCard
              task={activeTask}
              onPreview={handleOpenPreview}
              onDismiss={() => setActiveTask(null)}
              onRetry={() => handleStartDownload(activeTask.options || {})}
            />
          )}

          {/* Media Preview & Formats */}
          {mediaInfo && (
            <MediaPreview
              mediaInfo={mediaInfo}
              onDownload={handleStartDownload}
              onDownloadItem={handleDownloadItem}
              onDownloadZip={handleDownloadZip}
              isDownloading={isDownloading}
            />
          )}

          {/* Default Feature Cards (shown when not viewing media) */}
          {!mediaInfo && !isLoadingInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 animate-in fade-in duration-500">
              
              {/* Feature 1 */}
              <div className="p-5 rounded-2xl bg-dark-card/60 border border-white/5 hover:border-brand-500/30 transition-all hover:bg-dark-card space-y-3 group shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Film className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">4K Ultra HD & 60 FPS</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct adaptive DASH & HLS stream acquisition with automatic FFmpeg post-processing for crisp playback.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-5 rounded-2xl bg-dark-card/60 border border-white/5 hover:border-accent-purple/30 transition-all hover:bg-dark-card space-y-3 group shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Music className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Dual Audio Engine</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Universal MP3 at maximum 320kbps fidelity, plus lightning-fast native M4A/AAC without transcoding.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-5 rounded-2xl bg-dark-card/60 border border-white/5 hover:border-accent-emerald/30 transition-all hover:bg-dark-card space-y-3 group shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Archive className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Carousel 1-Click ZIPs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive multi-slide viewer with individual asset downloads and seamless 1-click ZIP archiving.
                </p>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Global In-Browser Media Preview Modal */}
      <PreviewModal
        task={previewTask}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={clearHistory}
        onRemoveItem={removeHistoryItem}
        onPreviewItem={(item) => handleOpenPreview(item)}
      />

      {/* Modern Footer */}
      <footer className="border-t border-white/5 bg-dark-surface/40 backdrop-blur-md py-6 text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400 font-medium">OmniMedia Downloader • Engine v2.0 (React + FastAPI)</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Public Media Only</span>
            <span>•</span>
            <span>No Account Required</span>
            <span>•</span>
            <span>SSRF Sandboxed</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
