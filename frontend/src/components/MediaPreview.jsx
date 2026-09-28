import React, { useState } from 'react';
import { 
  Clock, 
  User, 
  Eye, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  Share2, 
  CheckCircle 
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon, TwitterIcon, FacebookIcon, TikTokIcon } from './PlatformIcons';
import FormatSelector from './FormatSelector';
import CarouselViewer from './CarouselViewer';

export default function MediaPreview({ 
  mediaInfo, 
  onDownload, 
  onDownloadItem, 
  onDownloadZip, 
  isDownloading 
}) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!mediaInfo) return null;

  const {
    title,
    uploader,
    uploader_id,
    platform,
    duration_formatted,
    thumbnail,
    description,
    view_count,
    upload_date,
    is_carousel,
    carousel_items,
    formats,
    url
  } = mediaInfo;

  const handleShare = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'youtube':
        return <YoutubeIcon className="w-4 h-4 text-red-500" />;
      case 'instagram':
        return <InstagramIcon className="w-4 h-4 text-pink-500" />;
      case 'twitter':
        return <TwitterIcon className="w-3.5 h-3.5 text-slate-100" />;
      case 'facebook':
        return <FacebookIcon className="w-4 h-4 text-blue-500" />;
      case 'tiktok':
        return <TikTokIcon className="w-4 h-4 text-teal-400" />;
      default:
        return <Globe className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Main Metadata Card */}
      <div className="bg-dark-card border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Thumbnail / Poster Container */}
          <div className="relative md:w-80 flex-shrink-0 group">
            <div className="relative aspect-video md:aspect-[16/10] rounded-xl overflow-hidden bg-dark-bg border border-white/10 shadow-lg">
              <img
                src={thumbnail}
                alt={title || 'Media thumbnail'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

              {/* Duration Badge */}
              {duration_formatted && (
                <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-1 px-2.5 py-1 rounded-md bg-black/85 text-white text-xs font-mono font-bold backdrop-blur-md border border-white/10">
                  <Clock className="w-3 h-3 text-brand-400" />
                  <span>{duration_formatted}</span>
                </div>
              )}

              {/* Platform Badge */}
              <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-dark-bg/90 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 shadow">
                {getPlatformIcon()}
                <span className="capitalize">{platform || 'Video'}</span>
              </div>
            </div>
          </div>

          {/* Media Info Column */}
          <div className="flex-1 flex flex-col justify-between space-y-4 min-w-0">
            <div>
              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2 hover:line-clamp-none transition-all">
                {title || 'Media Title Unavailable'}
              </h2>

              {/* Author / Metadata Row */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-slate-300">
                <div className="flex items-center space-x-1.5 font-medium text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                  <User className="w-3.5 h-3.5 text-brand-400" />
                  <span>{uploader || uploader_id || 'Content Creator'}</span>
                </div>

                {view_count && (
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>{view_count} views</span>
                  </div>
                )}

                {upload_date && (
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{upload_date}</span>
                  </div>
                )}
              </div>

              {/* Description with Expand / Collapse */}
              {description && (
                <div className="mt-4 text-xs text-slate-300/90 leading-relaxed bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <p className={descriptionExpanded ? '' : 'line-clamp-2'}>
                    {description}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="mt-1.5 text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center space-x-1 text-[11px]"
                  >
                    <span>{descriptionExpanded ? 'Show less' : 'Show more'}</span>
                    {descriptionExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Share Link Action */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Direct stream links verified & active</span>
              </span>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
                title="Copy source URL"
              >
                {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* If Multi-item / Carousel Post (Instagram / Twitter): Display Carousel Viewer */}
      {is_carousel && carousel_items && carousel_items.length > 0 && (
        <CarouselViewer
          items={carousel_items}
          onDownloadItem={onDownloadItem}
          onDownloadZip={onDownloadZip}
          isDownloading={isDownloading}
        />
      )}

      {/* Format Selector Component */}
      <FormatSelector
        formats={formats}
        onDownload={onDownload}
        isDownloading={isDownloading}
      />

    </div>
  );
}
