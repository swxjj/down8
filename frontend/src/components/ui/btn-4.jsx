import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, Loader2, ArrowDown, RefreshCw, AlertCircle } from 'lucide-react';
import { triggerBrowserDownload, getDownloadUrl } from '../../services/api';

/**
 * btn-4: Micro-transition download lifecycle button
 * States:
 *  - Idle: Download icon + label
 *  - Downloading: Progress bar fill + percent + speed/muxing status
 *  - Completed: Emerald checkmark + auto-trigger file download
 */
export function Btn4({
  label,
  selectedFormat,
  onClick,
  isDownloading,
  activeTask,
  disabled = false,
  className = '',
}) {
  const hasTriggeredDownloadRef = useRef(null);

  const status = activeTask?.status;
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed' || status === 'error';
  const isMuxing = status === 'muxing';
  const isConnecting = status === 'connecting' || status === 'queued' || status === 'pending';
  const isActive = isDownloading || (status && !isCompleted && !isFailed);

  const percent = Math.min(100, Math.max(0, activeTask?.percent ?? activeTask?.progress ?? 0));
  const displaySpeed = activeTask?.speed || '';

  // Trigger browser file download once when task completes
  useEffect(() => {
    if (isCompleted && activeTask?.task_id && hasTriggeredDownloadRef.current !== activeTask.task_id) {
      hasTriggeredDownloadRef.current = activeTask.task_id;
      const fileUrl = activeTask.file_url || getDownloadUrl(activeTask.task_id);
      const fileName = activeTask.filename || 'downloaded_media.mp4';
      triggerBrowserDownload(fileUrl, fileName);
    }
  }, [isCompleted, activeTask]);

  const handleClick = (e) => {
    if (disabled || isActive) return;
    if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <motion.button
      type="button"
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || isActive}
      whileHover={!isActive && !disabled ? { scale: 1.005 } : {}}
      whileTap={!isActive && !disabled ? { y: 1 } : {}}
      className={`relative w-full py-2.5 h-10 rounded-xl text-xs font-semibold tracking-tight overflow-hidden select-none outline-none focus:outline-none transition-all duration-200 flex items-center justify-center gap-2 ${className} ${
        isCompleted
          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default'
          : isFailed
          ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 cursor-pointer'
          : isActive
          ? 'bg-black/5 dark:bg-zinc-800/60 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100 cursor-wait'
          : disabled
          ? 'bg-black/10 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-transparent cursor-not-allowed'
          : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm hover:opacity-95 active:translate-y-[1px] cursor-pointer'
      }`}
    >
      {/* Animated progress bar fill during active download */}
      {isActive && (
        <motion.div
          className="absolute inset-y-0 left-0 bg-black/10 dark:bg-white/10 pointer-events-none rounded-xl"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      )}

      {/* Button content morphing between states */}
      <div className="relative z-10 flex items-center justify-center space-x-2 px-4 w-full">
        <AnimatePresence mode="popLayout" initial={false}>
          {isCompleted ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="flex items-center space-x-2"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-semibold">Downloaded!</span>
            </motion.div>
          ) : isFailed ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="flex items-center space-x-1.5"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Failed. Click to retry</span>
            </motion.div>
          ) : isMuxing ? (
            <motion.div
              key="muxing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center space-x-2 font-mono text-xs"
            >
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-600 dark:text-zinc-300" />
              <span>Muxing video & audio...</span>
            </motion.div>
          ) : isConnecting ? (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center space-x-2"
            >
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600 dark:text-zinc-300" />
              <span>Connecting stream...</span>
            </motion.div>
          ) : isActive ? (
            <motion.div
              key="downloading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center space-x-2 font-mono text-[13px]"
            >
              <ArrowDown className="w-4 h-4 animate-bounce text-zinc-700 dark:text-zinc-300" />
              <span className="font-semibold tabular-nums">{percent.toFixed(0)}%</span>
              {displaySpeed && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">({displaySpeed})</span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{label || `Download (${selectedFormat || 'Video'})`}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export default Btn4;
