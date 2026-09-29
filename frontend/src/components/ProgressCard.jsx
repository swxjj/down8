import React, { useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  Download, 
  Play, 
  RefreshCw 
} from 'lucide-react';
import { triggerBrowserDownload, getDownloadUrl } from '../services/api';

function formatBytes(bytes) {
  if (!bytes) return null;
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(num) || num <= 0) return typeof bytes === 'string' ? bytes : null;
  if (typeof bytes === 'string' && (bytes.includes('MB') || bytes.includes('KB') || bytes.includes('GB') || bytes.includes('B'))) return bytes;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

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
      
      // Automatic browser file download save trigger
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
    status_text = 'Initializing...',
    filename,
    file_size,
    error,
    isZip = false,
    eta = '',
  } = task;

  const displayProgress = Math.round(task.percent ?? task.progress ?? 0);
  const displaySpeed = (() => {
    if (task.speed && task.speed !== '0 MB/s') return task.speed;
    if (status === 'muxing') return 'Muxing streams...';
    if (status === 'packaging') return 'Packaging ZIP...';
    if (status === 'downloading') return 'Transferring...';
    return task.speed || '';
  })();

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed' || status === 'error';

  const formattedSize = formatBytes(file_size);
  const cleanFormat = (() => {
    if (task.format) {
      if (/^\d+$/.test(task.format)) return `${task.format}p`;
      return task.format;
    }
    if (task.media_type === 'audio') return 'MP3';
    return isZip ? 'ZIP' : 'MP4';
  })();

  // Technical Stepper Stages
  const steps = [
    { key: 'resolve', label: 'Resolve' },
    { key: 'download', label: 'Download' },
    { key: 'process', label: isZip ? 'Archive' : 'Process' },
    { key: 'ready', label: 'Ready' },
  ];

  const getActiveStepIndex = () => {
    if (isCompleted) return 3;
    if (status === 'muxing' || status === 'packaging') return 2;
    if (status === 'downloading') return 1;
    return 0; // connecting / queued
  };

  const activeStepIndex = getActiveStepIndex();

  const handleDownloadFile = () => {
    const fileUrl = task.file_url || getDownloadUrl(task_id);
    const downloadName = filename || (isZip ? 'carousel_bundle.zip' : 'media.mp4');
    triggerBrowserDownload(fileUrl, downloadName);
  };

  return (
    <div 
      role="region" 
      aria-label="Download Progress"
      className="w-full max-w-[760px] mx-auto bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md border border-black/10 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 rounded-2xl p-5 shadow-sm space-y-4 font-sans"
    >
      
      {/* Top Header: Title and Telemetry Badges */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {title || filename || 'Media Stream'}
          </h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
              {status_text}
            </span>
            {cleanFormat && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5 uppercase">
                {cleanFormat}
              </span>
            )}
            {formattedSize && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5">
                {formattedSize}
              </span>
            )}
          </div>
        </div>

        {/* Speed & ETA readout */}
        {!isCompleted && !isFailed && (
          <div className="text-right flex-shrink-0 text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
            {displaySpeed && <div className="text-zinc-900 dark:text-zinc-100 font-semibold">{displaySpeed}</div>}
            {eta && eta !== '--:--' && <div className="text-zinc-500 dark:text-zinc-500">ETA {eta}</div>}
          </div>
        )}
      </div>

      {/* Sleek Technical Stepper */}
      <div className="pt-2 pb-1 space-y-2.5">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, idx) => {
            const isDone = idx < activeStepIndex || isCompleted;
            const isCurrent = idx === activeStepIndex && !isCompleted;
            return (
              <div key={step.key} className="flex flex-col space-y-1.5">
                <div 
                  className={`h-[2px] w-full rounded-full transition-all duration-300 ${
                    isDone 
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                      : isCurrent 
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' 
                        : 'bg-black/10 dark:bg-zinc-800'
                  }`} 
                />
                <span 
                  className={`text-[10px] font-mono tracking-wider uppercase select-none ${
                    isDone || isCurrent 
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold' 
                      : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Slim Progress Track */}
        <div 
          role="progressbar" 
          aria-valuenow={displayProgress} 
          aria-valuemin="0" 
          aria-valuemax="100"
          className="relative w-full h-1.5 bg-black/10 dark:bg-zinc-800 rounded-full overflow-hidden"
        >
          <div 
            className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${Math.min(100, Math.max(isFailed ? 0 : 5, displayProgress))}%` }}
          />
        </div>

        {/* Percentage Readout */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>{isCompleted ? 'Finished' : isFailed ? 'Failed' : `${displayProgress}% completed`}</span>
          {displayProgress > 0 && <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-semibold">{displayProgress}%</span>}
        </div>
      </div>

      {/* Error state if failed */}
      {isFailed && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-[12px] text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error || 'The download could not be completed.'}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 py-1 px-2.5 text-[11px] font-medium rounded-lg flex items-center space-x-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-black/5 dark:border-white/5">
        {!isCompleted && !isFailed && (
          <button
            type="button"
            onClick={onDismiss}
            className="bg-black/5 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-zinc-800 px-4 py-2 text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
        )}

        {isCompleted && (
          <>
            {!isZip && onPreview && (
              <button
                type="button"
                onClick={() => onPreview(task)}
                className="bg-black/5 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-zinc-800 px-4 py-2 text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Preview</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadFile}
              className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 px-4 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:opacity-95 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="bg-black/5 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-zinc-800 px-4 py-2 text-xs rounded-xl transition-all cursor-pointer"
              title="Close card"
            >
              Done
            </button>
          </>
        )}
      </div>

    </div>
  );
}
