import React, { useState } from 'react';
import { Film } from 'lucide-react';
import FormatSelector from './FormatSelector';
import CarouselViewer from './CarouselViewer';

export default function MediaPreview({ 
  mediaInfo, 
  onDownload, 
  onDownloadItem, 
  onDownloadZip, 
  isDownloading 
}) {
  const [imageError, setImageError] = useState(false);

  if (!mediaInfo) return null;

  const {
    title,
    platform,
    duration_formatted,
    thumbnail,
    is_carousel,
    carousel_items,
    formats,
  } = mediaInfo;

  // If this is a multi-item carousel (Instagram/X)
  if (is_carousel && carousel_items && carousel_items.length > 0) {
    return (
      <div className="w-full space-y-4 font-sans">
        {/* Compact confirmation header */}
        <div className="bg-[#16161a] border border-[#27272e] rounded-[16px] px-4 py-3 flex items-center space-x-3.5">
          <div className="w-14 h-11 rounded-[8px] overflow-hidden bg-[#0e0e11] border border-[#27272e] flex-shrink-0 flex items-center justify-center">
            {thumbnail && !imageError ? (
              <img
                src={thumbnail}
                alt=""
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <Film className="w-4 h-4 text-[#71717a]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-medium text-[#ededed] truncate" title={title}>
              {title || 'Carousel Collection'}
            </h3>
            <p className="text-[12px] text-[#71717a] mt-0.5 capitalize">
              {platform || 'Social'} • {carousel_items.length} items
            </p>
          </div>
        </div>

        <CarouselViewer
          items={carousel_items}
          onDownloadItem={onDownloadItem}
          onDownloadZip={onDownloadZip}
          isDownloading={isDownloading}
        />
      </div>
    );
  }

  // Single video or audio stream: Download options are the primary focus!
  return (
    <div className="w-full bg-[#16161a] border border-[#27272e] text-[#ededed] rounded-[16px] overflow-hidden font-sans shadow-sm">
      
      {/* Compact Top Media Strip - Just enough to confirm the media, zero social clutter */}
      <div className="px-5 py-3.5 bg-[#121216] border-b border-[#27272e] flex items-center space-x-3.5">
        <div className="w-14 h-11 rounded-[8px] overflow-hidden bg-[#0e0e11] border border-[#27272e] flex-shrink-0 flex items-center justify-center">
          {thumbnail && !imageError ? (
            <img
              src={thumbnail}
              alt=""
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <Film className="w-4 h-4 text-[#71717a]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-medium text-[#ededed] truncate" title={title}>
            {title || 'Media Stream'}
          </h3>
          <p className="text-[12px] text-[#71717a] mt-0.5 flex items-center space-x-2">
            {duration_formatted && <span>{duration_formatted}</span>}
            {duration_formatted && platform && <span>•</span>}
            <span className="capitalize">{platform || 'Direct stream'}</span>
          </p>
        </div>
      </div>

      {/* Download Options - Prominent, right at the top, no scrolling required */}
      <div className="p-5">
        <FormatSelector
          formats={formats}
          onDownload={onDownload}
          isDownloading={isDownloading}
          embedded
        />
      </div>

    </div>
  );
}
