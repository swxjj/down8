import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import ParticleMorphOrb from './ui/ParticleMorphOrb';
import ChromeBorderButton from './ui/chrome-border-button';
import { triggerBrowserDownload, getDownloadUrl } from '../services/api';

/**
 * DownloadStatusOrb - Micro-Visualizer Download Button
 * 
 * Embeds a 36x36 3D WebGL particle-morph orb strictly INSIDE the h-11 button footprint.
 * 
 * States:
 * 1. Idle: ChromeBorderButton with dynamic format label and chromatic outline.
 * 2. Active: Sunken dark capsule (h-11) containing the floating micro-orb on the left,
 *    subtle gradient progress track fill behind, and 4-phase uppercase monospace status copy.
 * 3. Completed: Success capsule with settled micro-orb, "Ready • Saved" badge, and "Save File" CTA.
 * 4. Failed: Error capsule with failure description and retry button.
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

  // 4 Status Phases according to system telemetry
  let statusText = 'Parsing media stream...';
  if (isCompleted) {
    statusText = 'Ready • Saving...';
  } else if (isMuxing || percent >= 92) {
    statusText = 'Almost there • Muxing...';
  } else if (status === 'downloading') {
    statusText = speed
      ? `Downloading • ${percent.toFixed(0)}% (${speed})`
      : `Downloading • ${percent.toFixed(0)}%`;
  } else {
    statusText = 'Parsing media stream...';
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
    <div className={`w-full h-11 relative overflow-hidden transition-all duration-300 font-sans ${className}`}>
      <AnimatePresence mode="wait">
        {!isActive && !isCompleted && !isFailed ? (
          /* IDLE STATE: ChromeBorderButton matching the cosmic background */
          <motion.div
            key="idle-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-11"
          >
            <ChromeBorderButton
              onClick={onClick}
              disabled={disabled}
              isDark={isDark}
              icon={Download}
              className="w-full h-11"
            >
              {label || `Download Video (${selectedFormat || '1080p'})`}
            </ChromeBorderButton>
          </motion.div>
        ) : isFailed ? (
          /* FAILED STATE: Sunken dark error capsule */
          <motion.div
            key="failed-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative w-full h-11 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 flex items-center justify-between overflow-hidden shadow-inner select-none"
          >
            <div className="flex items-center space-x-2 text-rose-300 min-w-0 pr-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="text-xs font-mono truncate">
                {activeTask?.error || 'Download failed'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClick}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-medium text-white hover:bg-zinc-700 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </motion.div>
        ) : isCompleted ? (
          /* COMPLETED STATE: Morphs to success capsule with settled micro-orb & Save File CTA */
          <motion.div
            key="completed-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative w-full h-11 bg-zinc-950/80 border border-emerald-500/30 rounded-xl px-3 flex items-center justify-between overflow-hidden shadow-inner select-none"
          >
            <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />

            {/* Left: Settled micro-orb */}
            <div className="relative z-10 w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <ParticleMorphOrb size={36} speed={0.45} />
            </div>

            {/* Center: Monospace status */}
            <div className="relative z-10 min-w-0 flex-1 px-2">
              <span className="font-mono text-xs tracking-wider uppercase text-emerald-400 font-medium truncate block">
                Ready • Saved
              </span>
            </div>

            {/* Right: Actions */}
            <div className="relative z-10 flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={handleSaveFile}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs transition-transform active:scale-95 flex items-center space-x-1 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              {onPreview && (
                <button
                  type="button"
                  onClick={() => onPreview(activeTask)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 hover:text-white text-xs border border-white/10 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          /* ACTIVE STATE: Sunken dark capsule with micro-orb & 4-phase monospace telemetry */
          <motion.div
            key="active-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative w-full h-11 bg-zinc-950/80 border border-white/10 rounded-xl px-3 flex items-center justify-between overflow-hidden shadow-inner select-none"
          >
            {/* Subtle background progress track fill */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-500/15 via-teal-500/20 to-rose-500/15 border-r border-white/15 pointer-events-none"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />

            {/* Left: Mini floating micro-orb */}
            <div className="relative z-10 w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <ParticleMorphOrb size={36} speed={orbSpeed} />
            </div>

            {/* Center/Right: Monospace uppercase status text */}
            <div className="relative z-10 min-w-0 flex-1 flex items-center justify-end pl-2">
              <motion.span
                key={statusText}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-xs tracking-wider uppercase text-zinc-300 tabular-nums truncate text-right"
              >
                {statusText}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
