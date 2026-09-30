import React, { useState, useEffect } from 'react';
import { Download, Film, Music, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadStatusOrb from './DownloadStatusOrb';
import ChromeBorderButton from './ui/chrome-border-button';

function formatBytes(bytes) {
  if (!bytes) return null;
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(num) || num <= 0) return typeof bytes === 'string' ? bytes : null;
  if (typeof bytes === 'string' && (bytes.includes('MB') || bytes.includes('KB') || bytes.includes('GB') || bytes.includes('B'))) return bytes;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function FormatSelector({ formats, onDownload, isDownloading, activeTask, isDark = true, onPreview }) {
  const [selectedType, setSelectedType] = useState(null); // null | 'video' | 'audio'

  const defaultVideoFormats = [
    { format_id: 'best', label: '1080p', resolution: '1080p Full HD', height: 1080 },
    { format_id: '720p', label: '720p', resolution: '720p HD', height: 720 },
    { format_id: '480p', label: '480p', resolution: '480p SD', height: 480 },
  ];

  const defaultAudioFormats = [
    { format_id: 'mp3-320', label: 'MP3 320kbps', type: 'mp3', note: 'High Quality CBR' },
    { format_id: 'm4a', label: 'M4A Original', type: 'm4a', note: 'AAC Passthrough' },
  ];

  // Parse formats safely whether it's a flat array or pre-grouped object
  const rawList = Array.isArray(formats) 
    ? formats 
    : (formats?.video ? [...formats.video, ...(formats.audio || [])] : []);

  const videoFormats = rawList.filter((f) => f.type === 'video');
  const audioFormats = rawList.filter((f) => f.type === 'audio');

  // Map video formats cleanly
  const videoList = videoFormats.length > 0 
    ? videoFormats.map((v) => {
        let cleanLabel = v.height ? `${v.height}p` : (v.resolution || v.format_id);
        if (/^\d+$/.test(cleanLabel)) {
          cleanLabel = `${cleanLabel}p`;
        }
        return {
          format_id: v.format_id,
          label: cleanLabel,
          resolution: v.resolution || v.format_id,
          filesize: v.filesize_estimate,
          height: v.height,
        };
      })
    : defaultVideoFormats;

  // Map audio formats cleanly
  const audioList = audioFormats.length > 0
    ? audioFormats.map((a) => {
        let cleanLabel = 'MP3 320kbps';
        if (a.format_note?.includes('320') || a.format_id?.includes('320')) {
          cleanLabel = 'MP3 320kbps';
        } else if (a.ext === 'm4a' || a.format_id?.includes('m4a')) {
          cleanLabel = 'M4A Original';
        } else if (a.format_note) {
          cleanLabel = a.format_note;
        }
        return {
          format_id: a.format_id,
          label: cleanLabel,
          type: a.ext || (a.format_id?.includes('m4a') ? 'm4a' : 'mp3'),
          note: a.format_note || (a.ext === 'm4a' ? 'Original AAC' : 'Universal MP3'),
          filesize: a.filesize_estimate,
        };
      })
    : defaultAudioFormats;

  const [selectedVideoId, setSelectedVideoId] = useState(videoList[0]?.format_id || 'best');
  const [selectedAudioId, setSelectedAudioId] = useState(audioList[0]?.format_id || 'mp3-320');

  // Sync selected format IDs and reset selection when formats change
  useEffect(() => {
    setSelectedType(null);
    if (videoList.length > 0) {
      const preferred = videoList.find((v) => v.format_id === '1080p' || v.height === 1080) || videoList[0];
      setSelectedVideoId(preferred.format_id);
    }
    if (audioList.length > 0) {
      setSelectedAudioId(audioList[0].format_id);
    }
  }, [formats]);

  const currentSelectedVideo = videoList.find((v) => v.format_id === selectedVideoId) || videoList[0];
  const currentSelectedAudio = audioList.find((a) => a.format_id === selectedAudioId) || audioList[0];

  const handleDownload = () => {
    if (selectedType === 'video') {
      onDownload({
        media_type: 'video',
        format_id: currentSelectedVideo?.format_id || 'best',
        audio_format: null,
      });
    } else {
      onDownload({
        media_type: 'audio',
        format_id: currentSelectedAudio?.format_id || 'mp3-320',
        audio_format: currentSelectedAudio?.type || 'mp3',
      });
    }
  };

  return (
    <div className="w-full space-y-4 font-sans">
      
      {/* Symmetrical Twin Chrome Border Buttons: Video & Audio */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <ChromeBorderButton
          active={selectedType === 'video'}
          onClick={() => setSelectedType('video')}
          icon={Film}
          isDark={isDark}
          className="w-full h-11"
        >
          Video
        </ChromeBorderButton>

        <ChromeBorderButton
          active={selectedType === 'audio'}
          onClick={() => setSelectedType('audio')}
          icon={Music}
          isDark={isDark}
          className="w-full h-11"
        >
          Audio
        </ChromeBorderButton>
      </div>

      {/* Progressive Disclosure: Resolution Pills and Download Button */}
      <AnimatePresence mode="wait">
        {selectedType && (
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="space-y-4 pt-1"
          >
            {/* Selectable Qualities Sub-Section */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {selectedType === 'video' ? 'Select Resolution' : 'Select Audio Format'}
              </span>

              {/* Video Qualities (e.g. 4K, 1440p, 1080p, 720p, 480p, 360p) */}
              {selectedType === 'video' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {videoList.map((item) => {
                    const isSelected = selectedVideoId === item.format_id;
                    const formattedSize = formatBytes(item.filesize);
                    return (
                      <button
                        key={item.format_id}
                        type="button"
                        onClick={() => setSelectedVideoId(item.format_id)}
                        className={`transition-all duration-150 flex flex-col items-center justify-center select-none text-xs rounded-xl py-2 px-3 ${
                          isSelected
                            ? 'bg-zinc-800/90 border border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.06)] font-medium'
                            : 'bg-zinc-900/70 border border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200 backdrop-blur-sm'
                        }`}
                        title={item.resolution}
                      >
                        <span className="font-semibold">{item.label}</span>
                        {formattedSize && (
                          <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {formattedSize}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Audio Qualities (e.g. MP3 320kbps, M4A Original) */}
              {selectedType === 'audio' && (
                <div className="grid grid-cols-2 gap-2">
                  {audioList.map((item) => {
                    const isSelected = selectedAudioId === item.format_id;
                    const formattedSize = formatBytes(item.filesize);
                    return (
                      <button
                        key={item.format_id}
                        type="button"
                        onClick={() => setSelectedAudioId(item.format_id)}
                        className={`transition-all duration-150 flex items-center justify-center space-x-2 select-none text-xs rounded-xl py-2 px-3 ${
                          isSelected
                            ? 'bg-zinc-800/90 border border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.06)] font-medium'
                            : 'bg-zinc-900/70 border border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200 backdrop-blur-sm'
                        }`}
                        title={item.note}
                      >
                        <span className="font-semibold">{item.label}</span>
                        {formattedSize && (
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            • {formattedSize}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Primary Download Status Container: ParticleMorphOrb */}
            <DownloadStatusOrb
              label={
                selectedType === 'video' 
                  ? `Download Video (${currentSelectedVideo?.label || '1080p'})` 
                  : `Download Audio (${currentSelectedAudio?.label || 'MP3'})`
              }
              selectedFormat={
                selectedType === 'video' 
                  ? currentSelectedVideo?.label || '1080p' 
                  : currentSelectedAudio?.label || 'MP3'
              }
              onClick={handleDownload}
              isDownloading={isDownloading}
              activeTask={activeTask}
              onPreview={onPreview}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
