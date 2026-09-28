import React from 'react';

/**
 * Cinema Monitor Codec & Stream Specification Tag
 */
export default function CodecShield({ 
  resolution, 
  fps, 
  codec, 
  bitrate, 
  isAudioOnly = false,
  className = ""
}) {
  return (
    <div className={`inline-flex items-center divide-x divide-white/[0.08] border border-white/[0.08] rounded-[5px] bg-[#0d0d10] font-mono text-[11px] tracking-tight overflow-hidden ${className}`}>
      <span className="px-2 py-0.5 font-bold text-zinc-200 bg-white/[0.04]">
        {isAudioOnly ? 'AUDIO' : (resolution || '1080P')}
      </span>
      {fps && (
        <span className="px-2 py-0.5 text-zinc-400">
          {fps} FPS
        </span>
      )}
      <span className="px-2 py-0.5 text-zinc-300 uppercase">
        {codec || (isAudioOnly ? 'MP3 CBR' : 'MP4 H.264')}
      </span>
      {bitrate && (
        <span className="px-2 py-0.5 text-amber-400 font-medium tabular-nums">
          {bitrate}
        </span>
      )}
    </div>
  );
}
