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
 * Clean, casual lowercase phrases formatted in Montserrat font:
 * - "parsing..."
 * - "downloading..."
 * - "finishing..."
 * - "almost there..."
 * - "ready"
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

  // Map SSE status states directly to requested clean, casual lowercase phrases
  let statusPhrase = 'parsing...';
  if (isCompleted) {
    statusPhrase = 'ready';
  } else if (isMuxing || percent >= 95) {
    statusPhrase = 'almost there...';
  } else if (percent >= 85) {
    statusPhrase = 'finishing...';
  } else if (status === 'downloading') {
    statusPhrase = 'downloading...';
  } else if (isConnecting || status === 'queued' || status === 'pending') {
    statusPhrase = 'parsing...';
  } else {
    statusPhrase = 'parsing...';
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
            <span className="font-['Montserrat',sans-serif] lowercase text-xs tracking-wide text-rose-200 truncate select-none">
              {activeTask?.error?.toLowerCase() || 'failed'}
            </span>
            <button
              type="button"
              onClick={onClick}
              className="shrink-0 px-3 py-1 rounded-full bg-zinc-800 text-xs font-['Montserrat',sans-serif] lowercase font-medium text-white hover:bg-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>retry</span>
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
            <span className="font-['Montserrat',sans-serif] lowercase text-xs tracking-wide text-emerald-300 select-none">
              {statusPhrase}
            </span>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={handleSaveFile}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-['Montserrat',sans-serif] lowercase text-xs font-medium transition-transform active:scale-95 flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>save</span>
              </button>
              {onPreview && (
                <button
                  type="button"
                  onClick={() => onPreview(activeTask)}
                  className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-['Montserrat',sans-serif] lowercase text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>preview</span>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          /* ACTIVE STATE: Centered rounded-full pill with cozy micro-orb & clean casual lowercase status text */
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

            {/* Live status text: font-['Montserrat',sans-serif] lowercase text-xs tracking-wide text-zinc-300 select-none */}
            <span className="font-['Montserrat',sans-serif] lowercase text-xs tracking-wide text-zinc-300 select-none">
              {statusPhrase}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
