import React, { useState, useEffect } from 'react';
import { Download, Film, Music, Check } from 'lucide-react';
import AnimatedBackground from './core/animated-background';
import Btn4 from './ui/btn-4';

function formatBytes(bytes) {
  if (!bytes) return null;
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(num) || num <= 0) return typeof bytes === 'string' ? bytes : null;
  if (typeof bytes === 'string' && (bytes.includes('MB') || bytes.includes('KB') || bytes.includes('GB') || bytes.includes('B'))) return bytes;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function FormatSelector({ formats, onDownload, isDownloading, activeTask }) {
  const [selectedType, setSelectedType] = useState('video'); // 'video' | 'audio'

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

  // Sync selected format IDs when formats change
  useEffect(() => {
    if (videoList.length > 0) {
      setSelectedVideoId(videoList[0].format_id);
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
      
      {/* Symmetrical Sunken Segment Container: Video vs Audio */}
      <div 
        className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5" 
        role="radiogroup" 
        aria-label="Media format choice"
      >
        <AnimatedBackground
          value={selectedType}
          onValueChange={(val) => val && setSelectedType(val)}
          className="rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-black/10 dark:border-white/10"
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
          enableHover={false}
        >
          {/* Option 1: Video */}
          <div
            data-id="video"
            role="radio"
            aria-checked={selectedType === 'video'}
            tabIndex={0}
            onClick={() => setSelectedType('video')}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setSelectedType('video');
              }
            }}
            className="px-3.5 py-2.5 rounded-lg border-0 outline-none focus:outline-none cursor-pointer transition-colors duration-150 flex items-center justify-between select-none"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
              </div>
              <div>
                <h4 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">Video</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">MP4 Container</p>
              </div>
            </div>

            <div className="w-4 h-4 rounded-full flex items-center justify-center">
              {selectedType === 'video' ? (
                <div className="w-4 h-4 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10" />
              )}
            </div>
          </div>

          {/* Option 2: Audio */}
          <div
            data-id="audio"
            role="radio"
            aria-checked={selectedType === 'audio'}
            tabIndex={0}
            onClick={() => setSelectedType('audio')}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setSelectedType('audio');
              }
            }}
            className="px-3.5 py-2.5 rounded-lg border-0 outline-none focus:outline-none cursor-pointer transition-colors duration-150 flex items-center justify-between select-none"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center">
                <Music className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
              </div>
              <div>
                <h4 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">Audio</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Audio Track</p>
              </div>
            </div>

            <div className="w-4 h-4 rounded-full flex items-center justify-center">
              {selectedType === 'audio' ? (
                <div className="w-4 h-4 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10" />
              )}
            </div>
          </div>
        </AnimatedBackground>
      </div>

      {/* Selectable Qualities Sub-Section */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {selectedType === 'video' ? 'Select Resolution' : 'Select Audio Format'}
        </span>

        {/* Video Qualities (e.g. 1080p, 720p, 480p, etc.) */}
        {selectedType === 'video' && (
          <div className="grid grid-cols-4 gap-2">
            {videoList.slice(0, 4).map((item) => {
              const isSelected = selectedVideoId === item.format_id;
              const formattedSize = formatBytes(item.filesize);
              return (
                <button
                  key={item.format_id}
                  type="button"
                  onClick={() => setSelectedVideoId(item.format_id)}
                  className={`transition-all duration-150 flex flex-col items-center justify-center select-none ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium border border-transparent shadow-sm rounded-xl py-2 px-3 text-xs'
                      : 'bg-black/5 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-black/5 dark:border-white/5 rounded-xl py-2 px-3 text-xs'
                  }`}
                  title={item.resolution}
                >
                  <span className="font-semibold">{item.label}</span>
                  {formattedSize && (
                    <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-500'}`}>
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
                  className={`transition-all duration-150 flex items-center justify-center space-x-2 select-none ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium border border-transparent shadow-sm rounded-xl py-2 px-3 text-xs'
                      : 'bg-black/5 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-black/5 dark:border-white/5 rounded-xl py-2 px-3 text-xs'
                  }`}
                  title={item.note}
                >
                  <span className="font-semibold">{item.label}</span>
                  {formattedSize && (
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-500'}`}>
                      • {formattedSize}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Primary Download CTA: btn-4 from amicro */}
      <Btn4
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
      />

    </div>
  );
}
