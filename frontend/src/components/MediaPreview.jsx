import React, { useState } from 'react';
import { Film } from 'lucide-react';
import { motion } from 'framer-motion';
import FormatSelector from './FormatSelector';
import CarouselViewer from './CarouselViewer';

const block1Variants = {
  initial: { scale: 0.1, opacity: 0, y: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};

const block2Variants = {
  initial: { scale: 0.1, opacity: 0, y: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20, delay: 0.08 },
  },
};

export default function MediaPreview({ 
  mediaInfo, 
  onDownload, 
  onDownloadItem, 
  onDownloadZip, 
  isDownloading,
  activeTask,
  onPreview,
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

  // Multi-item Carousel (Instagram / X) split into Two Distinct Cards
  if (is_carousel && carousel_items && carousel_items.length > 0) {
    return (
      <div className="w-full space-y-3 font-sans">
        {/* Block 1 (Header Card): Thumbnail, Title, Platform & Items Count */}
        <motion.div
          variants={block1Variants}
          initial="initial"
          animate="animate"
          style={{ transformOrigin: 'top left' }}
          className="w-full bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md border border-black/10 dark:border-white/[0.08] rounded-2xl p-4 shadow-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-3.5"
        >
          <div className="w-14 h-11 rounded-xl overflow-hidden bg-black/5 dark:bg-zinc-950 border border-black/10 dark:border-white/10 flex-shrink-0 flex items-center justify-center">
            {thumbnail && !imageError ? (
              <img
                src={thumbnail}
                alt=""
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <Film className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 truncate" title={title}>
              {title || 'Carousel Collection'}
            </h3>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 capitalize">
              {platform || 'Social'} • {carousel_items.length} items
            </p>
          </div>
        </motion.div>

        {/* Block 2 (Controls Card): Multi-slide carousel viewer & ZIP packaging */}
        <motion.div
          variants={block2Variants}
          initial="initial"
          animate="animate"
          style={{ transformOrigin: 'top left' }}
          className="w-full bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md border border-black/10 dark:border-white/[0.08] rounded-2xl p-4 shadow-sm text-zinc-900 dark:text-zinc-100"
        >
          <CarouselViewer
            items={carousel_items}
            onDownloadItem={onDownloadItem}
            onDownloadZip={onDownloadZip}
            isDownloading={isDownloading}
          />
        </motion.div>
      </div>
    );
  }

  // Single video or audio stream split into Two Distinct Frosted Glass Cards
  return (
    <div className="w-full space-y-3 font-sans">
      
      {/* Block 1 (Header Card): Thumbnail, Title, Platform Badge, and Duration */}
      <motion.div
        variants={block1Variants}
        initial="initial"
        animate="animate"
        style={{ transformOrigin: 'top left' }}
        className="w-full bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md border border-black/10 dark:border-white/[0.08] rounded-2xl p-4 shadow-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-3.5"
      >
        <div className="w-14 h-11 rounded-xl overflow-hidden bg-black/5 dark:bg-zinc-950 border border-black/10 dark:border-white/10 flex-shrink-0 flex items-center justify-center">
          {thumbnail && !imageError ? (
            <img
              src={thumbnail}
              alt=""
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <Film className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 truncate" title={title}>
            {title || 'Media Stream'}
          </h3>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center space-x-2">
            {duration_formatted && <span>{duration_formatted}</span>}
            {duration_formatted && platform && <span>•</span>}
            <span className="capitalize">{platform || 'Direct stream'}</span>
          </p>
        </div>
      </motion.div>

      {/* Block 2 (Controls Card): Format Toggle, Resolution Pills, and Download Button */}
      <motion.div
        variants={block2Variants}
        initial="initial"
        animate="animate"
        style={{ transformOrigin: 'top left' }}
        className="w-full bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md border border-black/10 dark:border-white/[0.08] rounded-2xl p-4 shadow-sm text-zinc-900 dark:text-zinc-100"
      >
        <FormatSelector
          formats={formats}
          onDownload={onDownload}
          isDownloading={isDownloading}
          activeTask={activeTask}
          embedded
        />

        {activeTask?.status === 'completed' && onPreview && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => onPreview(activeTask)}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center space-x-1 cursor-pointer bg-transparent border-0"
            >
              <span>Preview in browser</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}
      </motion.div>

    </div>
  );
}
