import React, { useState } from 'react';
import { Video, Music, Download, Zap, CheckCircle2, ShieldCheck, HardDrive } from 'lucide-react';

export default function FormatSelector({ formats, onDownload, isDownloading }) {
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'audio'
  
  // Default video formats if none returned by backend
  const defaultVideoFormats = [
    { format_id: '2160p', resolution: '4K Ultra HD', ext: 'mp4', filesize_estimate: '380 MB', fps: 60, badge: 'Ultra HD', note: 'Highest fidelity for large screens' },
    { format_id: '1080p', resolution: '1080p Full HD', ext: 'mp4', filesize_estimate: '125 MB', fps: 60, badge: 'Recommended', note: 'Optimal balance of quality & size' },
    { format_id: '720p', resolution: '720p HD', ext: 'mp4', filesize_estimate: '65 MB', fps: 30, badge: 'Standard', note: 'Great for mobile and tablets' },
    { format_id: '480p', resolution: '480p SD', ext: 'mp4', filesize_estimate: '32 MB', fps: 30, badge: 'Data Saver', note: 'Fast download with minimal data' },
  ];

  // Default audio formats conforming to specification
  const defaultAudioFormats = [
    { 
      format_id: 'mp3-320', 
      type: 'mp3', 
      label: 'MP3 Universal HQ (320kbps)', 
      quality: '320 kbps CBR',
      ext: 'mp3', 
      filesize_estimate: '9.8 MB', 
      badge: 'Universal', 
      description: 'Studio-grade audio transcoding. Works on all car stereos, iOS, Android, and media players.' 
    },
    { 
      format_id: 'm4a-aac', 
      type: 'm4a', 
      label: 'M4A Fast Direct Stream', 
      quality: 'Original AAC',
      ext: 'm4a', 
      filesize_estimate: '6.5 MB', 
      badge: 'Fastest / Lossless', 
      description: 'Extracted directly from source container without re-encoding. Instant download with zero quality degradation.' 
    },
  ];

  const videoList = (formats?.video && formats.video.length > 0) ? formats.video : defaultVideoFormats;
  const audioList = (formats?.audio && formats.audio.length > 0) ? formats.audio : defaultAudioFormats;

  const [selectedVideo, setSelectedVideo] = useState(videoList[1]?.format_id || videoList[0]?.format_id || '1080p');
  const [selectedAudio, setSelectedAudio] = useState(audioList[0]?.format_id || 'mp3-320');

  const handleDownload = () => {
    if (activeTab === 'video') {
      const selected = videoList.find((v) => v.format_id === selectedVideo) || videoList[0];
      onDownload({
        media_type: 'video',
        format_id: selected.format_id,
        audio_format: null,
      });
    } else {
      const selected = audioList.find((a) => a.format_id === selectedAudio) || audioList[0];
      onDownload({
        media_type: 'audio',
        format_id: selected.format_id,
        audio_format: selected.type,
      });
    }
  };

  const currentSelectedVideo = videoList.find((v) => v.format_id === selectedVideo) || videoList[0];
  const currentSelectedAudio = audioList.find((a) => a.format_id === selectedAudio) || audioList[0];

  return (
    <div className="w-full bg-dark-card/90 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      
      {/* Tab Switch: Video vs Audio */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
        <div>
          <h4 className="text-base font-bold text-white tracking-wide">Select Download Format</h4>
          <p className="text-xs text-slate-400">Choose your desired resolution or extracted audio track</p>
        </div>

        <div className="flex bg-dark-bg p-1 rounded-xl border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-glow-brand'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video (MP4)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'audio'
                ? 'bg-gradient-to-r from-accent-purple to-brand-600 text-white shadow-glow-brand'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Audio (MP3 / M4A)</span>
          </button>
        </div>
      </div>

      {/* Video Options View */}
      {activeTab === 'video' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videoList.map((item) => {
              const isSelected = selectedVideo === item.format_id;
              return (
                <div
                  key={item.format_id}
                  onClick={() => setSelectedVideo(item.format_id)}
                  className={`relative p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-500 shadow-glow-brand ring-1 ring-brand-500/40'
                      : 'bg-dark-elevated/50 border-white/5 hover:border-white/20 hover:bg-dark-elevated'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{item.resolution}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            item.badge === 'Ultra HD' 
                              ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30'
                              : item.badge === 'Recommended'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700/50 text-slate-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{item.note || 'High Definition video stream'}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-600"></div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1 font-mono">
                      <span className="uppercase text-slate-500 font-semibold">{item.ext || 'mp4'}</span>
                      {item.fps && <span className="text-slate-400">• {item.fps}fps</span>}
                    </span>
                    <span className="flex items-center space-x-1 text-slate-300 font-semibold">
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      <span>{item.filesize_estimate || 'Direct Stream'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audio Options View */}
      {activeTab === 'audio' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {audioList.map((item) => {
              const isSelected = selectedAudio === item.format_id;
              return (
                <div
                  key={item.format_id}
                  onClick={() => setSelectedAudio(item.format_id)}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-accent-purple/10 border-accent-purple shadow-glow-brand ring-1 ring-accent-purple/40'
                      : 'bg-dark-elevated/50 border-white/5 hover:border-white/20 hover:bg-dark-elevated'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-violet/20 text-accent-violet border border-accent-violet/30 uppercase tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="ml-2">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-purple flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-600"></div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-[11px] text-slate-400">
                    <span className="font-mono text-slate-300 font-semibold">{item.quality}</span>
                    <span className="flex items-center space-x-1 text-slate-300 font-semibold">
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      <span>{item.filesize_estimate || '~8 MB'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-3 flex items-center space-x-2 text-xs text-brand-300">
            <Zap className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              <strong>Audiophile note:</strong> Universal MP3 transcode runs at 320kbps CBR for optimal hardware compatibility, while M4A preserves pure AAC original stream.
            </span>
          </div>
        </div>
      )}

      {/* Main Download CTA Button */}
      <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Lossless processing with automatic FFmpeg post-processing</span>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2.5 transition-all duration-300 shadow-xl ${
            isDownloading
              ? 'bg-dark-elevated text-slate-500 cursor-not-allowed border border-white/5'
              : activeTab === 'video'
              ? 'bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-violet hover:from-brand-500 hover:to-accent-purple text-white shadow-glow-brand active:scale-95'
              : 'bg-gradient-to-r from-accent-purple via-indigo-600 to-emerald-600 hover:from-accent-fuchsia hover:to-emerald-500 text-white shadow-glow-emerald active:scale-95'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>
            {activeTab === 'video'
              ? `Download Video (${currentSelectedVideo?.resolution || 'MP4'})`
              : `Download Audio (${currentSelectedAudio?.type.toUpperCase() || 'MP3'})`}
          </span>
        </button>
      </div>

    </div>
  );
}
