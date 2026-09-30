import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import ParticleMorphOrb from './ui/ParticleMorphOrb';
import ChromeBorderButton from './ui/chrome-border-button';
import { triggerBrowserDownload, getDownloadUrl } from '../services/api';

/**
 * DownloadStatusOrb - RewampUI Style Particle-Morph Status Pill
 * 
 * Geometry: Full pill (`rounded-full`) with tight center alignment (`justify-center gap-3.5`).
 * The 3D particle orb and live status text sit cozily side-by-side in the center.
 * No vertical dividers, no inner canvas box borders, completely transparent WebGL canvas.
 * 
 * Lifecycle:
 * - Idle: Full pill ChromeBorderButton with dynamic format label and chromatic outline.
 * - Active: Centered dark pill with 32x32 micro-orb + clean sentence-case telemetry.
 * - Completed: Success pill with settled micro-orb, "Ready to save", and "Save" CTA.
 * - Failed: Pill with error message and retry action.
 */
export default function DownloadStatusOrb({
  label,
  selectedFormat,
  onClick,
  isDownloading,
  activeTask,
  disabled = false,
  onPreview,
  isDark = true,
  className = '',
}) {
  const hasTriggeredDownloadRef = useRef(null);

  const status = activeTask?.status;
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed' || status === 'error';
  const isMuxing = status === 'muxing';
  const isConnecting = status === 'connecting' || status === 'queued' || status === 'pending';
  const isDownloadingActive = isDownloading || (status && !isCompleted && !isFailed && status !== 'idle');
  const isActive = isDownloadingActive && !isCompleted && !isFailed;

  const percent = Math.min(100, Math.max(0, activeTask?.percent ?? activeTask?.progress ?? 0));
  const speed = activeTask?.speed || '';

  // Clean, elegant sentence-case telemetry
  let statusText = 'Parsing stream...';
  if (isCompleted) {
    statusText = 'Ready to save';
  } else if (isMuxing || percent >= 92) {
    statusText = 'Almost there...';
  } else if (status === 'downloading') {
    statusText = speed
      ? `Downloading • ${percent.toFixed(0)}% (${speed})`
      : `Downloading • ${percent.toFixed(0)}%`;
  } else {
    statusText = 'Parsing stream...';
  }

  // Dynamic micro-orb rotation speed mapped to activity
  let orbSpeed = 1.0;
  if (isMuxing) {
    orbSpeed = 2.2;
  } else if (isActive) {
    orbSpeed = 1.0 + (percent / 100) * 1.5;
  } else if (isCompleted) {
    orbSpeed = 0.45;
  }

  // Trigger browser file download automatically once upon completion
  useEffect(() => {
    if (isCompleted && activeTask?.task_id && hasTriggeredDownloadRef.current !== activeTask.task_id) {
      hasTriggeredDownloadRef.current = activeTask.task_id;
      const fileUrl = activeTask.file_url || getDownloadUrl(activeTask.task_id);
      const fileName = activeTask.filename || 'downloaded_media.mp4';
      triggerBrowserDownload(fileUrl, fileName);
    }
  }, [isCompleted, activeTask]);

  const handleSaveFile = () => {
    if (!activeTask?.task_id) return;
    const fileUrl = activeTask.file_url || getDownloadUrl(activeTask.task_id);
    const fileName = activeTask.filename || 'downloaded_media.mp4';
    triggerBrowserDownload(fileUrl, fileName);
  };

  return (
    <div className={`w-full max-w-md mx-auto h-12 relative transition-all duration-300 font-sans ${className}`}>
      <AnimatePresence mode="wait">
        {!isActive && !isCompleted && !isFailed ? (
          /* IDLE STATE: Full pill ChromeBorderButton */
          <motion.div
            key="idle-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-12"
          >
            <ChromeBorderButton
              onClick={onClick}
              disabled={disabled}
              isDark={isDark}
              icon={Download}
              className="w-full h-12"
            >
              {label || `Download Video (${selectedFormat || '1080p'})`}
            </ChromeBorderButton>
          </motion.div>
        ) : isFailed ? (
          /* FAILED STATE: Centered error pill */
          <motion.div
            key="failed-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md mx-auto h-12 px-6 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center gap-3 transition-all duration-300 select-none"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="text-xs text-rose-200 truncate">
              {activeTask?.error || 'Download failed'}
            </span>
            <button
              type="button"
              onClick={onClick}
              className="shrink-0 px-3 py-1 rounded-full bg-zinc-800 text-xs font-medium text-white hover:bg-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </motion.div>
        ) : isCompleted ? (
          /* COMPLETED STATE: Centered success pill with settled micro-orb & Save File CTA */
          <motion.div
            key="completed-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md mx-auto h-12 px-6 rounded-full bg-[#111114]/90 dark:bg-zinc-900/90 border border-emerald-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center justify-center gap-3.5 transition-all duration-300 select-none"
          >
            {/* Clean transparent orb wrapper */}
            <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-transparent overflow-hidden pointer-events-none">
              <ParticleMorphOrb size={32} speed={0.45} />
            </div>

            {/* Status text */}
            <span className="text-sm font-normal text-emerald-300 tracking-normal flex items-center gap-1.5">
              Ready to save
            </span>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={handleSaveFile}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-medium text-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              {onPreview && (
                <button
                  type="button"
                  onClick={() => onPreview(activeTask)}
                  className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          /* ACTIVE STATE: Centered rounded-full pill with cozy micro-orb & sentence-case telemetry */
          <motion.div
            key="active-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md mx-auto h-12 px-6 rounded-full bg-[#111114]/90 dark:bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center justify-center gap-3.5 transition-all duration-300 select-none overflow-hidden"
          >
            {/* Clean transparent orb wrapper: w-8 h-8 shrink-0 flex items-center justify-center bg-transparent */}
            <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-transparent overflow-hidden pointer-events-none">
              <ParticleMorphOrb size={32} speed={orbSpeed} />
            </div>

            {/* Live status text: text-sm font-normal text-zinc-300 tracking-normal flex items-center gap-1.5 */}
            <span className="text-sm font-normal text-zinc-300 tracking-normal flex items-center gap-1.5 truncate">
              {statusText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
