import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import ParticleMorphOrb from './ui/ParticleMorphOrb';
import ChromeBorderButton from './ui/chrome-border-button';
import { triggerBrowserDownload, getDownloadUrl } from '../services/api';

const PHRASES = [
  'parsing...',
  'downloading...',
  'almost there...',
  'encoding...',
  'just a sec...',
  'finishing...',
  'cooking...',
];

/**
 * DownloadStatusOrb - RewampUI Style Particle-Morph Status Pill
 * 
 * - Full pill (`rounded-full`) with tight center alignment.
 * - Active State: 32x32 micro-orb + rapid randomized phrase transitions in Montserrat (1.3s interval).
 * - Completed State: Smoothly morphs into "Save File" (Primary) and "Preview" (Secondary) buttons.
 * - ZERO automatic downloads or popups upon completion; file download triggers ONLY on "Save File" click.
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
  const status = activeTask?.status;
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed' || status === 'error';
  const isMuxing = status === 'muxing';
  const isDownloadingActive = isDownloading || (status && !isCompleted && !isFailed && status !== 'idle');
  const isActive = isDownloadingActive && !isCompleted && !isFailed;

  const [currentPhrase, setCurrentPhrase] = useState(PHRASES[0]);

  // Randomized rapid phrase transitions (every ~1.3s) without repeating immediate previous
  useEffect(() => {
    if (!isActive) return;

    setCurrentPhrase(PHRASES[0]);

    const interval = setInterval(() => {
      setCurrentPhrase((prev) => {
        const remaining = PHRASES.filter((p) => p !== prev);
        return remaining[Math.floor(Math.random() * remaining.length)];
      });
    }, 1300);

    return () => clearInterval(interval);
  }, [isActive]);

  // Dynamic micro-orb rotation speed
  let orbSpeed = 1.0;
  if (isMuxing) {
    orbSpeed = 2.2;
  } else if (isActive) {
    orbSpeed = 1.6;
  } else if (isCompleted) {
    orbSpeed = 0.45;
  }

  // Explicit user-driven save action (ZERO automatic download)
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
          /* FAILED STATE: Centered error pill with retry */
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
              {activeTask?.error?.toLowerCase() || 'download failed'}
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
          /* COMPLETED STATE: Morphs smoothly into "Save File" (Primary) and "Preview" (Secondary) */
          <motion.div
            key="completed-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md mx-auto h-12 flex items-center justify-center gap-3 select-none"
          >
            {/* Primary Action: Save File */}
            <button
              type="button"
              onClick={handleSaveFile}
              className="bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-['Montserrat',sans-serif] text-xs font-semibold px-5 py-2.5 rounded-full hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
            </button>

            {/* Secondary Action: Preview */}
            {onPreview && (
              <button
                type="button"
                onClick={() => onPreview(activeTask)}
                className="bg-black/5 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 font-['Montserrat',sans-serif] text-xs font-medium px-4 py-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}
          </motion.div>
        ) : (
          /* ACTIVE STATE: Centered rounded-full pill with micro-orb & rapid randomized phrase transitions */
          <motion.div
            key="active-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md mx-auto h-12 px-6 rounded-full bg-[#111114]/90 dark:bg-zinc-900/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center justify-center gap-3.5 transition-all duration-300 select-none overflow-hidden"
          >
            {/* Clean transparent orb wrapper */}
            <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-transparent overflow-hidden pointer-events-none">
              <ParticleMorphOrb size={32} speed={orbSpeed} />
            </div>

            {/* Rapid randomized phrase transitions */}
            <AnimatePresence mode="wait">
              <motion.span
                key={currentPhrase}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="font-['Montserrat',sans-serif] text-sm font-medium tracking-wide text-white dark:text-zinc-100 lowercase select-none"
              >
                {currentPhrase}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
