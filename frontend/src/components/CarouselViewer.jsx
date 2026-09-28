import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Archive, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Grid, 
  Layers, 
  CheckSquare, 
  Square 
} from 'lucide-react';

export default function CarouselViewer({ 
  items = [], 
  onDownloadItem, 
  onDownloadZip, 
  isDownloading 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' | 'grid'
  const [selectedIds, setSelectedIds] = useState(items.map((it) => it.id || it.index));

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((it) => it.id || it.index));
    }
  };

  const handleDownloadAllZip = () => {
    onDownloadZip({
      selected_ids: selectedIds,
    });
  };

  return (
    <div className="w-full bg-dark-card/90 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-6">
      
      {/* Header bar with Mode Toggles and Selection Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white">Multi-Media Carousel Post</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
              {items.length} items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse and download individual media assets or package everything into a high-speed ZIP
          </p>
        </div>

        {/* View mode toggle & Select all */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 border border-white/10 transition-colors"
          >
            {selectedIds.length === items.length ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>Select All ({selectedIds.length}/{items.length})</span>
              </>
            )}
          </button>

          <div className="flex bg-dark-bg p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'carousel' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-slate-400 hover:text-white'
              }`}
              title="Carousel Slider View"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid Overview"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Prominent ZIP Download Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900/60 via-dark-elevated to-indigo-950/60 border border-brand-500/30 p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-violet flex items-center justify-center shadow-glow-brand flex-shrink-0">
            <Archive className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm sm:text-base font-extrabold text-white">
                Download Selected as ZIP Archive
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                1-Click Bundle
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Packages all {selectedIds.length} chosen photos and videos with original filenames and zero loss.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadAllZip}
          disabled={selectedIds.length === 0 || isDownloading}
          className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 shadow-xl flex-shrink-0 ${
            selectedIds.length === 0 || isDownloading
              ? 'bg-dark-card text-slate-500 cursor-not-allowed border border-white/5'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 hover:from-emerald-500 hover:to-brand-500 text-white shadow-glow-emerald active:scale-95'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Download {selectedIds.length} Items as ZIP</span>
        </button>
      </div>

      {/* View Mode 1: Carousel Slider */}
      {viewMode === 'carousel' && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-dark-bg/90 border border-white/10 aspect-video sm:aspect-[16/10] flex items-center justify-center group">
            
            {/* Slide media preview */}
            {currentItem.type === 'video' ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                <img
                  src={currentItem.thumbnail || currentItem.url}
                  alt={currentItem.title || `Item ${currentIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-glow-brand backdrop-blur-sm">
                    <VideoIcon className="w-7 h-7 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={currentItem.url || currentItem.thumbnail}
                alt={currentItem.title || `Item ${currentIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}

            {/* Slide badges overlay */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <span className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md ${
                currentItem.type === 'video'
                  ? 'bg-purple-600/80 text-white border border-purple-400/40'
                  : 'bg-emerald-600/80 text-white border border-emerald-400/40'
              }`}>
                {currentItem.type === 'video' ? <VideoIcon className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                <span>{currentItem.type === 'video' ? 'Video' : 'Photo'}</span>
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-dark-bg/80 text-slate-300 border border-white/10 backdrop-blur-md">
                Slide {currentIndex + 1} of {items.length}
              </span>
            </div>

            {/* Individual Item selection toggle */}
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => toggleSelect(currentItem.id || currentItem.index)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all ${
                  selectedIds.includes(currentItem.id || currentItem.index)
                    ? 'bg-brand-600 text-white shadow-glow-brand border border-brand-400'
                    : 'bg-dark-bg/80 text-slate-300 border border-white/10 hover:bg-dark-bg'
                }`}
              >
                {selectedIds.includes(currentItem.id || currentItem.index) ? (
                  <CheckSquare className="w-4 h-4 text-white" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>{selectedIds.includes(currentItem.id || currentItem.index) ? 'Selected for ZIP' : 'Select'}</span>
              </button>
            </div>

            {/* Carousel Navigation Arrows */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dark-card/80 hover:bg-dark-card text-white border border-white/10 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xl backdrop-blur-md"
              title="Previous item"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dark-card/80 hover:bg-dark-card text-white border border-white/10 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xl backdrop-blur-md"
              title="Next item"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent p-4 flex items-center justify-between">
              <div className="text-xs text-slate-300 truncate mr-2">
                <span className="font-semibold text-white">{currentItem.title || `Media Asset #${currentIndex + 1}`}</span>
                {currentItem.resolution && <span className="ml-2 text-slate-400 font-mono">({currentItem.resolution})</span>}
                {currentItem.filesize && <span className="ml-2 text-slate-400 font-mono">• {currentItem.filesize}</span>}
              </div>

              {/* Direct individual item download button */}
              <button
                type="button"
                onClick={() => onDownloadItem(currentItem, currentIndex)}
                disabled={isDownloading}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-glow-brand active:scale-95 transition-all flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download This {currentItem.type === 'video' ? 'Video' : 'Photo'}</span>
              </button>
            </div>

          </div>

          {/* Pagination thumbnail strip */}
          <div className="flex items-center justify-center space-x-2 overflow-x-auto py-2">
            {items.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                  currentIndex === idx
                    ? 'border-brand-500 shadow-glow-brand scale-105 ring-2 ring-brand-500/50'
                    : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                }`}
              >
                <img
                  src={item.thumbnail || item.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/70 text-[9px] text-white">
                  {item.type === 'video' ? 'VID' : 'IMG'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Mode 2: Grid Overview */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, idx) => {
            const isSelected = selectedIds.includes(item.id || item.index);
            return (
              <div
                key={item.id || idx}
                className={`relative rounded-xl overflow-hidden border transition-all duration-200 bg-dark-elevated flex flex-col justify-between ${
                  isSelected ? 'border-brand-500 ring-1 ring-brand-500/40 shadow-glow-brand' : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Media Image / Thumbnail */}
                <div className="relative aspect-square bg-dark-bg">
                  <img
                    src={item.thumbnail || item.url}
                    alt={item.title || `Item ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg">
                        <VideoIcon className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Badges on card */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.type === 'video' ? 'bg-purple-600/90 text-white' : 'bg-emerald-600/90 text-white'
                    }`}>
                      {item.type === 'video' ? 'VIDEO' : 'PHOTO'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSelect(item.id || item.index)}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-dark-bg/80 text-white hover:bg-dark-bg transition-colors backdrop-blur-md"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Details & Actions */}
                <div className="p-3 space-y-2">
                  <div className="text-xs">
                    <p className="font-semibold text-white truncate">{item.title || `Item #${idx + 1}`}</p>
                    <p className="text-[11px] text-slate-400">{item.resolution || item.filesize || 'High Resolution'}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDownloadItem(item, idx)}
                    disabled={isDownloading}
                    className="w-full py-2 rounded-lg bg-white/5 hover:bg-brand-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
