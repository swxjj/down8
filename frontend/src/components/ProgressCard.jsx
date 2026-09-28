import React, { useEffect, useRef } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Play, 
  X, 
  Cpu, 
  Sparkles,
  Archive,
  ArrowDownToLine,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerBrowserDownload, getDownloadUrl } from '../services/api';

export default function ProgressCard({ 
  task, 
  onPreview, 
  onDismiss, 
  onRetry 
}) {
  const hasTriggeredCompleteRef = useRef(false);

  useEffect(() => {
    if (task && task.status === 'completed' && !hasTriggeredCompleteRef.current) {
      hasTriggeredCompleteRef.current = true;
      
      // 1. Subtle confetti celebration
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#6366f1', '#8b5cf6', '#10b981', '#06b6d4'],
          disableForReducedMotion: true,
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }

      // 2. Automatic browser file download save dialog trigger
      if (task.task_id && !task.hasSaved) {
        const fileUrl = task.file_url || getDownloadUrl(task.task_id);
        const fileName = task.filename || 'downloaded_media.mp4';
        triggerBrowserDownload(fileUrl, fileName);
      }
    }
  }, [task]);

  if (!task) return null;

  const {
    task_id,
    title,
    status = 'connecting',
    status_text = 'Initializing connection...',
    filename,
    file_size,
    error,
    isZip = false,
    eta = '--:--',
  } = task;

  const displayProgress = task.percent ?? task.progress ?? 0;
  const displaySpeed = (() => {
    if (task.speed && task.speed !== '0 MB/s') return task.speed;
    if (status === 'muxing') return 'Muxing streams...';
    if (status === 'packaging') return 'Packaging ZIP...';
    if (status === 'downloading') return 'Streaming chunks...';
    if (status === 'connecting' || status === 'queued') return 'Connecting...';
    return task.speed || '0 MB/s';
  })();

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed' || status === 'error';

  // Dynamic Status Badge and Icon
  const renderStatusPill = () => {
    switch (status) {
      case 'connecting':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Connecting to Engine</span>
          </span>
        );
      case 'downloading':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20">
            <ArrowDownToLine className="w-3 h-3 animate-bounce" />
            <span>Downloading Chunks</span>
          </span>
        );
      case 'muxing':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse">
            <Cpu className="w-3 h-3" />
            <span>Muxing Video + Audio with FFmpeg</span>
          </span>
        );
      case 'packaging':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 animate-pulse">
            <Archive className="w-3 h-3" />
            <span>Packaging ZIP Archive</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-glow-emerald">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready for Offline Playback</span>
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3 h-3" />
            <span>Task Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            <span>{status_text}</span>
          </span>
        );
    }
  };

  const handleManualRedownload = () => {
    const fileUrl = task.file_url || getDownloadUrl(task_id);
    const fileName = filename || 'downloaded_media.mp4';
    triggerBrowserDownload(fileUrl, fileName);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in slide-in-from-top-4 duration-300">
      <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 sm:p-6 shadow-2xl transition-all duration-300 ${
        isCompleted
          ? 'bg-gradient-to-b from-dark-card to-dark-elevated border-emerald-500/30 shadow-glow-card'
          : isFailed
          ? 'bg-dark-card border-red-500/30'
          : 'bg-dark-card border-brand-500/30 shadow-glow-card'
      }`}>
        
        {/* Subtle Ambient Glow */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-20 ${
          isCompleted ? 'bg-emerald-500' : isFailed ? 'bg-red-500' : 'bg-brand-600'
        }`}></div>

        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {renderStatusPill()}
              <span className="text-[11px] font-mono text-slate-400">ID: {task_id?.slice(-8) || 'current'}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-xl mt-1">
              {title || filename || 'Media Processing Stream'}
            </h3>
            <p className="text-xs text-slate-400">
              {status_text}
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss status"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Progress Bar */}
        <div className="mt-5 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-sm">{Math.min(100, Math.round(displayProgress * 10) / 10)}%</span>
              {!isCompleted && !isFailed && (
                <span className="text-slate-400 font-sans">
                  • Speed: <strong className="text-brand-300 font-mono">{displaySpeed}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3 text-slate-400">
              {!isCompleted && !isFailed && (
                <span>ETA: <strong className="text-white font-mono">{eta}</strong></span>
              )}
              {file_size && (
                <span>Size: <strong className="text-slate-300 font-mono">{file_size}</strong></span>
              )}
            </div>
          </div>

          {/* Progress bar container */}
          <div className="w-full h-3 rounded-full bg-dark-bg/90 border border-white/5 overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out relative ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-glow-emerald'
                  : isFailed
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-brand-600 via-indigo-500 to-accent-violet shadow-glow-brand'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, displayProgress))}%` }}
            >
              {/* Shimmer animation bar */}
              {!isCompleted && !isFailed && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls for Complete or Error States */}
        {isCompleted && (
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10 animate-in fade-in duration-300">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>File download triggered automatically. Check your browser download shelf!</span>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto">
              {/* Preview in Browser button */}
              {!isZip && (
                <button
                  type="button"
                  onClick={() => onPreview(task)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center space-x-2 border border-white/10 transition-all hover:scale-105 active:scale-95 shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-brand-300" />
                  <span>Preview in Browser</span>
                </button>
              )}

              {/* Direct Save Again button */}
              <button
                type="button"
                onClick={handleManualRedownload}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-glow-emerald transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save File Again</span>
              </button>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
            <div className="text-xs text-red-400 flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error || 'An error occurred during extraction.'}</span>
            </div>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-red-500/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
