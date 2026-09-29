import React, { useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  Download, 
  Play, 
  RefreshCw 
} from 'lucide-react';
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

  // Bencho Step-Player Stages
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
      className="w-full max-w-[760px] mx-auto bg-[#16161a] border border-[#27272e] text-[#ededed] rounded-[16px] p-5 shadow-sm space-y-4 font-sans"
    >
      
      {/* Top Header: Title and Telemetry */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[15px] font-medium text-[#ededed] truncate">
            {title || filename || 'Media Stream'}
          </h4>
          <p className="text-[13px] text-[#a1a1aa] mt-0.5">
            {status_text}
            {file_size ? ` • ${file_size}` : ''}
          </p>
        </div>

        {/* Speed & ETA readout */}
        {!isCompleted && !isFailed && (
          <div className="text-right flex-shrink-0 text-[12px] font-mono tabular-nums text-[#a1a1aa]">
            {displaySpeed && <div className="text-[#ededed]">{displaySpeed}</div>}
            {eta && eta !== '--:--' && <div className="text-[#71717a]">ETA {eta}</div>}
          </div>
        )}
      </div>

      {/* Bencho-Inspired Step-Player Bar */}
      <div className="pt-1 pb-2">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, idx) => {
            const isDone = idx < activeStepIndex || isCompleted;
            const isCurrent = idx === activeStepIndex && !isCompleted;
            return (
              <div key={step.key} className="flex items-center space-x-1.5 text-[12px]">
                <div 
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isDone 
                      ? 'bg-[#ededed]' 
                      : isCurrent 
                        ? 'bg-[#ededed] ring-4 ring-white/20' 
                        : 'bg-[#27272e]'
                  }`} 
                />
                <span 
                  className={`${
                    isDone || isCurrent 
                      ? 'text-[#ededed] font-medium' 
                      : 'text-[#71717a]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Continuous Progress Track */}
        <div 
          role="progressbar" 
          aria-valuenow={displayProgress} 
          aria-valuemin="0" 
          aria-valuemax="100"
          className="relative w-full h-1.5 bg-[#27272e] rounded-full overflow-hidden"
        >
          <div 
            className="h-full bg-[#ededed] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(isFailed ? 0 : 5, displayProgress))}%` }}
          />
        </div>

        {/* Percentage Readout */}
        <div className="flex items-center justify-between mt-1.5 text-[12px] text-[#a1a1aa]">
          <span>{isCompleted ? 'Finished' : isFailed ? 'Failed' : `${displayProgress}% completed`}</span>
          {displayProgress > 0 && <span className="font-mono tabular-nums text-[#ededed]">{displayProgress}%</span>}
        </div>
      </div>

      {/* Error state if failed */}
      {isFailed && (
        <div className="bg-[#1c1214] border border-[#5c1d24] rounded-[10px] p-3 text-[13px] text-[#f87171] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ef4444]" />
            <span>{error || 'The download could not be completed.'}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="bg-[#2c161a] hover:bg-[#3d1e23] border border-[#5c1d24] text-[#fca5a5] py-1 px-2.5 text-[12px] rounded-full flex items-center space-x-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#27272e]">
        {!isCompleted && !isFailed && (
          <button
            type="button"
            onClick={onDismiss}
            className="bg-[#1c1c22] hover:bg-[#27272e] border border-[#27272e] text-[#a1a1aa] hover:text-[#ededed] text-[13px] py-1.5 px-4 rounded-full transition-all"
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
                className="bg-[#1c1c22] hover:bg-[#27272e] border border-[#27272e] text-[#a1a1aa] hover:text-[#ededed] text-[13px] py-1.5 px-4 rounded-full flex items-center space-x-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Preview</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadFile}
              className="bg-[#ededed] hover:bg-white text-[#0e0e11] font-medium text-[13px] py-1.5 px-5 rounded-full flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="bg-[#1c1c22] hover:bg-[#27272e] border border-[#27272e] text-[#a1a1aa] hover:text-[#ededed] text-[13px] py-1.5 px-3 rounded-full transition-all"
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
