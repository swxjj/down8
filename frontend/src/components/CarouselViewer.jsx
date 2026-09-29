import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Archive, 
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
    <div className="w-full bg-[#16161a] border border-[#27272e] text-[#ededed] rounded-[16px] p-5 space-y-4 font-sans shadow-sm">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#27272e]">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-[15px] font-medium text-[#ededed]">Multi-Asset Album</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#1c1c22] text-[#a1a1aa] border border-[#27272e] tabular-nums">
              {items.length} items
            </span>
          </div>
          <p className="text-[12px] text-[#71717a] mt-0.5">
            Download individual assets or bundle all selected media into a ZIP archive
          </p>
        </div>

        {/* View mode toggle & Select all */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="bg-[#1c1c22] hover:bg-[#27272e] border border-[#27272e] text-[#a1a1aa] hover:text-[#ededed] flex items-center space-x-1.5 py-1 px-2.5 text-[12px] rounded-[6px] transition-colors"
          >
            {selectedIds.length === items.length ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-white" />
                <span>Deselect all</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-[#71717a]" />
                <span>Select all ({selectedIds.length}/{items.length})</span>
              </>
            )}
          </button>

          <div className="flex bg-[#0e0e11] p-0.5 rounded-[6px] border border-[#27272e]">
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              className={`p-1.5 rounded-[4px] transition-colors ${
                viewMode === 'carousel' ? 'bg-[#27272e] text-[#ededed]' : 'text-[#71717a] hover:text-[#ededed]'
              }`}
              title="Slider view"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[4px] transition-colors ${
                viewMode === 'grid' ? 'bg-[#27272e] text-[#ededed]' : 'text-[#71717a] hover:text-[#ededed]'
              }`}
              title="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ZIP Download Action Box */}
      <div className="bg-[#1c1c22] border border-[#27272e] rounded-[12px] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-md bg-[#16161a] text-[#ededed] border border-[#27272e] flex items-center justify-center flex-shrink-0">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[14px] font-medium text-[#ededed]">
              Bundle Archive
            </h4>
            <p className="text-[12px] text-[#a1a1aa]">
              Packages {selectedIds.length} assets with original resolution in a single ZIP.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadAllZip}
          disabled={selectedIds.length === 0 || isDownloading}
          className={`w-full sm:w-auto px-5 py-2 rounded-[999px] text-[13px] font-medium flex items-center justify-center space-x-1.5 transition-all active:scale-95 ${
            selectedIds.length === 0 || isDownloading
              ? 'bg-[#27272e] text-[#71717a] cursor-not-allowed active:scale-100'
              : 'bg-[#ededed] hover:bg-white text-[#0e0e11] shadow-sm'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Download {selectedIds.length} Items (ZIP)</span>
        </button>
      </div>

      {/* View Mode 1: Carousel Slider */}
      {viewMode === 'carousel' && (
        <div className="space-y-3">
          <div className="relative rounded-[12px] overflow-hidden bg-[#0e0e11] border border-[#27272e] aspect-video sm:aspect-[16/10] flex items-center justify-center group">
            
            {/* Slide media preview */}
            {currentItem.type === 'video' ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                <img
                  src={currentItem.thumbnail || currentItem.url}
                  alt={currentItem.title || `Item ${currentIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-[#16161a]/90 text-[#ededed] border border-[#27272e] flex items-center justify-center shadow-md">
                    <VideoIcon className="w-5 h-5 ml-0.5" />
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
            <div className="absolute top-3 left-3 flex items-center space-x-1.5">
              <span className="px-2 py-0.5 rounded-full bg-[#16161a]/90 border border-[#27272e] text-[11px] font-medium text-[#ededed] shadow-sm">
                {currentItem.type === 'video' ? 'Video' : 'Photo'}
              </span>

              <span className="px-2 py-0.5 rounded-full bg-[#16161a]/90 border border-[#27272e] text-[11px] font-mono text-[#a1a1aa] tabular-nums shadow-sm">
                {currentIndex + 1} / {items.length}
              </span>
            </div>

            {/* Item selection checkbox */}
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => toggleSelect(currentItem.id || currentItem.index)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-[6px] text-[12px] transition-all border ${
                  selectedIds.includes(currentItem.id || currentItem.index)
                    ? 'bg-[#202026] border-white/80 text-white ring-1 ring-white/20'
                    : 'bg-[#16161a]/90 border-[#27272e] text-[#a1a1aa] hover:text-[#ededed]'
                }`}
              >
                {selectedIds.includes(currentItem.id || currentItem.index) ? (
                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[#71717a]" />
                )}
                <span>{selectedIds.includes(currentItem.id || currentItem.index) ? 'Selected' : 'Select'}</span>
              </button>
            </div>

            {/* Navigation Arrows */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#16161a]/90 hover:bg-[#27272e] text-[#ededed] border border-[#27272e] flex items-center justify-center transition-all shadow-sm"
              title="Previous item"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#16161a]/90 hover:bg-[#27272e] text-[#ededed] border border-[#27272e] flex items-center justify-center transition-all shadow-sm"
              title="Next item"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 inset-x-0 bg-[#16161a]/95 border-t border-[#27272e] p-3 flex items-center justify-between">
              <div className="text-[12px] text-[#a1a1aa] truncate mr-2">
                <span className="font-medium text-[#ededed]">{currentItem.title || `Asset #${currentIndex + 1}`}</span>
                {currentItem.filesize && <span className="ml-2 font-mono tabular-nums text-[#71717a]">• {currentItem.filesize}</span>}
              </div>

              <button
                type="button"
                onClick={() => onDownloadItem(currentItem, currentIndex)}
                disabled={isDownloading}
                className="bg-[#1c1c22] hover:bg-[#27272e] border border-[#27272e] text-[#a1a1aa] hover:text-[#ededed] py-1 px-3 text-[12px] rounded-full flex items-center space-x-1.5 transition-colors flex-shrink-0"
              >
                <Download className="w-3 h-3" />
                <span>Save Slide</span>
              </button>
            </div>

          </div>

          {/* Thumbnail pagination strip */}
          <div className="flex items-center justify-center space-x-1.5 overflow-x-auto py-1">
            {items.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 rounded-[6px] overflow-hidden border transition-all flex-shrink-0 ${
                  currentIndex === idx
                    ? 'border-white ring-2 ring-white/20 opacity-100'
                    : 'border-[#27272e] opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={item.thumbnail || item.url}
                  alt={`Thumb ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Mode 2: Grid Overview */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {items.map((item, idx) => {
            const isSelected = selectedIds.includes(item.id || item.index);
            return (
              <div
                key={item.id || idx}
                className={`relative rounded-[10px] overflow-hidden border transition-all bg-[#1c1c22] flex flex-col justify-between ${
                  isSelected ? 'border-white/80 ring-1 ring-white/20' : 'border-[#27272e]'
                }`}
              >
                <div className="relative aspect-square bg-[#0e0e11]">
                  <img
                    src={item.thumbnail || item.url}
                    alt={item.title || `Item ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSelect(item.id || item.index)}
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-[#16161a]/90 border border-[#27272e]"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[#71717a]" />
                    )}
                  </button>
                </div>

                <div className="p-2 space-y-1.5">
                  <p className="text-[12px] font-medium text-[#ededed] truncate">{item.title || `Item #${idx + 1}`}</p>
                  <button
                    type="button"
                    onClick={() => onDownloadItem(item, idx)}
                    disabled={isDownloading}
                    className="w-full bg-[#16161a] hover:bg-[#27272e] border border-[#27272e] text-[#a1a1aa] hover:text-[#ededed] py-1 text-[11px] rounded-[6px] flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save</span>
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
