import React, { useState, useEffect } from 'react';
import { Download, Film, Music, Check } from 'lucide-react';
import AnimatedBackground from './core/animated-background';

export default function FormatSelector({ formats, onDownload, isDownloading }) {
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
    ? videoFormats.map((v) => ({
        format_id: v.format_id,
        label: v.height ? `${v.height}p` : (v.resolution || v.format_id),
        resolution: v.resolution || v.format_id,
        filesize: v.filesize_estimate,
        height: v.height,
      }))
    : defaultVideoFormats;

  // Map audio formats cleanly
  const audioList = audioFormats.length > 0
    ? audioFormats.map((a) => ({
        format_id: a.format_id,
        label: a.format_note?.includes('320') || a.format_id?.includes('320') ? 'MP3 320kbps' : (a.format_note || a.format_id?.toUpperCase() || 'Audio'),
        type: a.ext || (a.format_id?.includes('m4a') ? 'm4a' : 'mp3'),
        note: a.format_note || (a.ext === 'm4a' ? 'Original AAC' : 'Universal MP3'),
      }))
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
      
      {/* Symmetrical Twin Primary Type Selector: Video vs Audio (Pure Monochrome) */}
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Media format choice">
        <AnimatedBackground
          value={selectedType}
          onValueChange={(val) => val && setSelectedType(val)}
          className="rounded-[12px] bg-[#22222a]"
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
            className="px-4 py-3 rounded-[12px] border border-[#27272e] cursor-pointer transition-colors duration-150 flex items-center justify-between bg-[#16161a] text-[#ededed] hover:border-[#3f3f46] select-none"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-[#0e0e11] border border-[#27272e] flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-[#ededed]" />
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-[#ededed]">Video</h4>
                <p className="text-[11px] text-[#71717a]">MP4 Container</p>
              </div>
            </div>

            <div className="w-4 h-4 rounded-full flex items-center justify-center">
              {selectedType === 'video' ? (
                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-black">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#27272e]" />
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
            className="px-4 py-3 rounded-[12px] border border-[#27272e] cursor-pointer transition-colors duration-150 flex items-center justify-between bg-[#16161a] text-[#ededed] hover:border-[#3f3f46] select-none"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-[#0e0e11] border border-[#27272e] flex items-center justify-center">
                <Music className="w-3.5 h-3.5 text-[#ededed]" />
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-[#ededed]">Audio</h4>
                <p className="text-[11px] text-[#71717a]">Audio Track</p>
              </div>
            </div>

            <div className="w-4 h-4 rounded-full flex items-center justify-center">
              {selectedType === 'audio' ? (
                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-black">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#27272e]" />
              )}
            </div>
          </div>
        </AnimatedBackground>
      </div>

      {/* Selectable Qualities Sub-Section */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">
          {selectedType === 'video' ? 'Select Resolution' : 'Select Audio Format'}
        </span>

        {/* Video Qualities (e.g. 1080p, 720p, 480p, etc.) */}
        {selectedType === 'video' && (
          <div className="grid grid-cols-4 gap-2">
            <AnimatedBackground
              value={selectedVideoId}
              onValueChange={(val) => val && setSelectedVideoId(val)}
              className="rounded-[8px] bg-white"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              enableHover={false}
            >
              {videoList.slice(0, 4).map((item) => {
                const isSelected = selectedVideoId === item.format_id;
                return (
                  <button
                    key={item.format_id}
                    data-id={item.format_id}
                    type="button"
                    onClick={() => setSelectedVideoId(item.format_id)}
                    className={`h-9 px-2 rounded-[8px] text-[13px] font-medium border border-[#27272e] transition-colors duration-150 flex items-center justify-center truncate select-none bg-[#121216] ${
                      isSelected
                        ? 'text-black font-semibold'
                        : 'text-[#a1a1aa] hover:text-[#ededed] hover:border-[#3f3f46]'
                    }`}
                    title={item.resolution}
                  >
                    {item.label}
                  </button>
                );
              })}
            </AnimatedBackground>
          </div>
        )}

        {/* Audio Qualities (e.g. MP3 320kbps, M4A Original) */}
        {selectedType === 'audio' && (
          <div className="grid grid-cols-2 gap-2">
            <AnimatedBackground
              value={selectedAudioId}
              onValueChange={(val) => val && setSelectedAudioId(val)}
              className="rounded-[8px] bg-white"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              enableHover={false}
            >
              {audioList.map((item) => {
                const isSelected = selectedAudioId === item.format_id;
                return (
                  <button
                    key={item.format_id}
                    data-id={item.format_id}
                    type="button"
                    onClick={() => setSelectedAudioId(item.format_id)}
                    className={`h-9 px-3 rounded-[8px] text-[13px] font-medium border border-[#27272e] transition-colors duration-150 flex items-center justify-center truncate select-none bg-[#121216] ${
                      isSelected
                        ? 'text-black font-semibold'
                        : 'text-[#a1a1aa] hover:text-[#ededed] hover:border-[#3f3f46]'
                    }`}
                    title={item.note}
                  >
                    {item.label}
                  </button>
                );
              })}
            </AnimatedBackground>
          </div>
        )}
      </div>

      {/* Primary Download CTA */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className={`w-full h-11 rounded-full text-[14px] font-medium flex items-center justify-center space-x-2 transition-all duration-150 select-none active:scale-[0.98] ${
          isDownloading
            ? 'bg-[#27272e] text-[#71717a] cursor-not-allowed'
            : 'bg-[#ededed] hover:bg-white text-[#0e0e11] shadow-sm'
        }`}
      >
        <Download className="w-4 h-4" />
        <span>
          {selectedType === 'video' 
            ? `Download Video (${currentSelectedVideo?.label || '1080p'})` 
            : `Download Audio (${currentSelectedAudio?.label || 'MP3'})`}
        </span>
      </button>

    </div>
  );
}
