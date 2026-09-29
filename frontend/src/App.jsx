import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import MediaPreview from './components/MediaPreview';
import ProgressCard from './components/ProgressCard';
import PreviewModal from './components/PreviewModal';
import HistoryDrawer from './components/HistoryDrawer';
import ErrorAlert from './components/ErrorAlert';
import TextEffect from './components/core/text-effect';
import DarkArcBandsBackground from './components/background-gradient/dark-arc-bands-background';
import CoralGlowBackground from './components/background-gradient/coral-glow-background';
import { 
  fetchMediaInfo, 
  startDownload, 
  startZipDownload, 
  subscribeToTaskEvents 
} from './services/api';

const STORAGE_KEY = 'down8_download_history';

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
  
  // Theme state (isDark defaults to true)
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return true;
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch (e) {
        console.warn('Failed to persist theme', e);
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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
        ? 'MP3 320kbps' 
        : 'MP4 Best Quality',
      media_type: options.media_type,
      status: 'connecting',
      status_text: 'Resolving media stream...',
      progress: 5,
      percent: 5,
      speed: 'Connecting...',
      eta: 'Calculating...',
      filename: `${mediaInfo.title || 'media'}.${options.media_type === 'audio' ? 'mp3' : 'mp4'}`,
      options,
    };

    setActiveTask(initialTask);

    try {
      const result = await startDownload({
        url: mediaInfo.url || currentUrl,
        format_id: options.format_id || 'best',
        media_type: options.media_type || 'video',
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
      format_id: 'best',
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
      title: `${mediaInfo.title || 'Collection'} (ZIP)`,
      platform: mediaInfo.platform,
      format: `ZIP (${selected_ids.length} items)`,
      media_type: 'zip',
      isZip: true,
      status: 'connecting',
      status_text: 'Preparing archive manifest...',
      progress: 8,
      percent: 8,
      speed: 'Preparing...',
      eta: '00:10',
      filename: `${(mediaInfo.title || 'Media_Collection').replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`,
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
    <div className="relative isolate h-screen w-screen overflow-hidden bg-transparent text-neutral-900 dark:text-[#ededed] flex flex-col justify-between selection:bg-[#27272a] selection:text-white font-sans transition-colors duration-500">
      
      {/* Persistent Fixed Dual Theme Backgrounds with Smooth Cross-fading */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}>
          <DarkArcBandsBackground className="w-full h-full min-h-screen" />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-0' : 'opacity-100'}`}>
          <CoralGlowBackground className="w-full h-full min-h-screen" />
        </div>
      </div>

      {/* Navigation Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Split-Screen Workbench - Positioned higher up, Locked to Viewport */}
      <main className="flex-1 flex items-start justify-center max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 lg:pt-12 w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-start">
          
          {/* Left Side: Title + Input Bar + Buttons (Clean vertical stack, no gaps) */}
          <div className="lg:col-span-6 flex flex-col space-y-5">
            <div className="text-center lg:text-left">
              <TextEffect
                per="char"
                preset="fade"
                as="h1"
                className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-[#ededed] leading-tight"
              >
                download any media from the web
              </TextEffect>
            </div>

            {/* Input Bar & Symmetrical Twin Buttons (Paste & Load) */}
            <UrlInput
              onFetch={handleFetchMedia}
              isLoading={isLoadingInfo}
              currentUrl={currentUrl}
            />

            {/* Error Alert (if any) */}
            {error && (
              <div className="w-full max-w-[440px] mx-auto lg:mx-0">
                <ErrorAlert
                  error={error}
                  onDismiss={() => setError(null)}
                  onRetry={() => handleFetchMedia(currentUrl)}
                />
              </div>
            )}
          </div>

          {/* Right Side: Options & Preview */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            
            {/* Active Download Progress Card (Bencho Step-Player) */}
            {activeTask && (
              <ProgressCard
                task={activeTask}
                onPreview={handleOpenPreview}
                onDismiss={() => setActiveTask(null)}
                onRetry={() => handleStartDownload(activeTask.options || {})}
              />
            )}

            {/* Loaded Media Preview & Formats */}
            {mediaInfo && !activeTask && (
              <MediaPreview
                mediaInfo={mediaInfo}
                onDownload={handleStartDownload}
                onDownloadItem={handleDownloadItem}
                onDownloadZip={handleDownloadZip}
                isDownloading={isDownloading}
              />
            )}

            {/* Empty State: Symmetrically matches the Left Column */}
            {!mediaInfo && !activeTask && (
              <div className="w-full min-h-[220px] rounded-[16px] border border-dashed border-[#27272e] p-8 flex flex-col items-center justify-center text-center space-y-2 bg-[#16161a]/25">
                <p className="text-[15px] font-medium text-[#71717a]">
                  preview will appear here
                </p>
                <p className="text-[12px] text-[#52525b] max-w-xs leading-relaxed">
                  Paste a link on the left to select audio or video and download.
                </p>
              </div>
            )}

          </div>

        </div>
      </main>

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

      {/* Clean minimal spacer */}
      <footer className="py-2 relative z-10" />

    </div>
  );
}
