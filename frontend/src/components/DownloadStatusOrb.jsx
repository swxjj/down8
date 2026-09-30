import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, AlertCircle, RefreshCw, Eye, Sparkles } from 'lucide-react';
import ParticleMorphOrb from './ui/ParticleMorphOrb';
import { triggerBrowserDownload, getDownloadUrl } from '../services/api';

/**
 * DownloadStatusOrb - Interactive Particle-Morph Download & Status Container
 * 
 * States:
 * - Idle: Tactile cosmic button with glowing particle accent and specular edge
 * - Active: Transforms into live 3D ParticleMorphOrb with dynamic streaming copy & progress telemetry
 * - Completed: Orb settles into calm harmonic wave, displays "Ready!" and provides "Save File" + "Preview"
 */
export default function DownloadStatusOrb({
  label,
  selectedFormat,
  onClick,
  isDownloading,
  activeTask,
  disabled = false,
  onPreview,
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

  // Dynamic status copy based on SSE telemetry
  let statusText = 'Parsing media stream...';
  if (isCompleted) {
    statusText = 'Ready!';
  } else if (isMuxing) {
    statusText = 'Muxing audio & video streams...';
  } else if (percent >= 90) {
    statusText = 'Almost there...';
  } else if (status === 'downloading') {
    statusText = speed
      ? `Downloading chunks • ${percent.toFixed(0)}% (${speed})`
      : `Downloading chunks • ${percent.toFixed(0)}%`;
  } else if (isConnecting) {
    statusText = 'Parsing media stream...';
  }

  // Dynamic orb animation speed mapped to download activity
  let orbSpeed = 1.0;
  if (isMuxing) {
    orbSpeed = 2.2;
  } else if (isActive) {
    orbSpeed = 1.0 + (percent / 100) * 1.5;
  } else if (isCompleted) {
    orbSpeed = 0.55;
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
    <div className={`w-full overflow-hidden transition-all duration-300 font-sans ${className}`}>
      <AnimatePresence mode="wait">
        {!isActive && !isCompleted && !isFailed ? (
          /* IDLE STATE: Tactile cosmic action button matching particle aesthetic */
          <motion.div
            key="idle-button"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <motion.button
              type="button"
              onClick={onClick}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.008 } : {}}
              whileTap={!disabled ? { scale: 0.985 } : {}}
              className={`relative w-full h-11 rounded-xl text-[13px] tracking-tight overflow-hidden select-none outline-none focus:outline-none transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer group ${
                disabled
                  ? 'bg-zinc-900/50 border border-white/5 text-zinc-500 cursor-not-allowed opacity-50'
                  : 'bg-zinc-900/90 hover:bg-zinc-850 text-white border border-white/15 hover:border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_4px_20px_rgba(0,0,0,0.35)]'
              }`}
            >
              {/* Glowing Particle Accent Dot */}
              <span className="relative flex h-2.5 w-2.5 items-center justify-center flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              </span>

              <span className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
                {label || `Download (${selectedFormat || 'Video'})`}
              </span>

              <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors ml-1" />
            </motion.button>
          </motion.div>
        ) : isFailed ? (
          /* FAILED STATE: Clear diagnosis with retry button */
          <motion.div
            key="failed-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-center"
          >
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <p className="text-xs font-mono text-rose-200">
              {activeTask?.error || 'Download failed'}
            </p>
            <button
              type="button"
              onClick={onClick}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-xs font-medium text-white hover:bg-zinc-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Download</span>
            </button>
          </motion.div>
        ) : (
          /* ACTIVE DOWNLOAD & COMPLETED STATES: ParticleMorphOrb Container */
          <motion.div
            key="orb-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex flex-col items-center justify-center p-3 text-center space-y-3"
          >
            {/* Interactive 3D Particle Morph Orb */}
            <div className="relative flex items-center justify-center">
              <ParticleMorphOrb
                size={120}
                speed={orbSpeed}
                className="mx-auto drop-shadow-[0_0_24px_rgba(255,255,255,0.18)]"
              />
            </div>

            {/* Dynamic Status Copy */}
            <div className="space-y-1">
              <p className="text-[13px] font-mono tracking-tight text-white/95 font-medium">
                {statusText}
              </p>
              {activeTask?.eta && isActive && (
                <p className="text-[11px] font-mono text-zinc-400">
                  ETA: {activeTask.eta}
                </p>
              )}
            </div>

            {/* Smooth Progress Bar (active during download chunks) */}
            {isActive && (
              <div className="w-full max-w-[260px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#38bdf8] via-[#2dd4bf] to-[#f43f5e] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            )}

            {/* Completed Action Controls */}
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-2.5 pt-1"
              >
                <button
                  type="button"
                  onClick={handleSaveFile}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs shadow-sm active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save File</span>
                </button>

                {onPreview && (
                  <button
                    type="button"
                    onClick={() => onPreview(activeTask)}
                    className="px-4 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 hover:text-white font-medium text-xs border border-white/10 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
