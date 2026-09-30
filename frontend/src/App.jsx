import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import MediaPreview from './components/MediaPreview';
import ProgressCard from './components/ProgressCard';
import PreviewModal from './components/PreviewModal';
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

export default function App() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [error, setError] = useState(null);
  
  // Travel animation state for liquid dots
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelTarget, setTravelTarget] = useState({ x: 380, y1: -20, y2: 120 });
  const previewAreaRef = useRef(null);
  
  // Download task state
  const [activeTask, setActiveTask] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
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
    setIsTraveling(false);
    setCurrentUrl(urlToFetch);

    try {
      const data = await fetchMediaInfo(urlToFetch);
      
      // Calculate dynamic travel vector from load-button to right-column preview area
      const btnEl = document.getElementById('load-button');
      const targetEl = previewAreaRef.current || document.getElementById('preview-area');
      if (btnEl && targetEl) {
        const btnRect = btnEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;

        const targetX = targetRect.left + 36;
        const targetY1 = targetRect.top + 36;
        const targetY2 = targetRect.top + 140;

        setTravelTarget({
          x: targetX - btnCenterX,
          y1: targetY1 - btnCenterY,
          y2: targetY2 - btnCenterY,
        });
      }

      // Trigger the travel animation
      setIsTraveling(true);

      // Choreographed arrival: dots travel across screen, then the two cards expand
      setTimeout(() => {
        setMediaInfo(data);
        setIsLoadingInfo(false);
        setIsTraveling(false);
      }, 240);
    } catch (err) {
      console.error('Fetch media failed:', err);
      setError(err);
      setMediaInfo(null);
      setIsLoadingInfo(false);
      setIsTraveling(false);
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
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Split-Screen Workbench - Positioned higher up, Locked to Viewport */}
      <main className="flex-1 flex items-start justify-center max-w-5xl mx-auto px-6 pt-6 sm:pt-10 lg:pt-12 w-full overflow-hidden">
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
              isDark={isDark}
              isTraveling={isTraveling}
              travelTarget={travelTarget}
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
          <div 
            id="preview-area"
            ref={previewAreaRef}
            className="lg:col-span-6 flex flex-col justify-start relative min-h-[160px] w-full"
          >
            <AnimatePresence mode="wait">
              {/* Loaded Media Preview & Formats with integrated particle orb lifecycle */}
              {mediaInfo && !activeTask?.isZip && (
                <MediaPreview
                  key={mediaInfo.id || mediaInfo.url || currentUrl}
                  mediaInfo={mediaInfo}
                  onDownload={handleStartDownload}
                  onDownloadItem={handleDownloadItem}
                  onDownloadZip={handleDownloadZip}
                  isDownloading={isDownloading}
                  activeTask={activeTask}
                  onPreview={handleOpenPreview}
                  isDark={isDark}
                />
              )}

              {/* Active Download Progress Card (for ZIP archive creation or standalone tasks) */}
              {activeTask && (!mediaInfo || activeTask.isZip) && (
                <ProgressCard
                  key={activeTask.task_id}
                  task={activeTask}
                  onPreview={handleOpenPreview}
                  onDismiss={() => setActiveTask(null)}
                  onRetry={() => handleStartDownload(activeTask.options || {})}
                />
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Global In-Browser Media Preview Modal */}
      <PreviewModal
        task={previewTask}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />



      {/* Clean minimal spacer */}
      <footer className="py-2 relative z-10" />

    </div>
  );
}
