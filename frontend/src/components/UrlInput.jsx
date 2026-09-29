import React, { useState, useRef, useEffect } from 'react';
import LabelInput from './LabelInput';
import { Loader2, Check } from 'lucide-react';

export default function UrlInput({ onFetch, isLoading, currentUrl = '' }) {
  const [url, setUrl] = useState(currentUrl);
  const [prevCurrentUrl, setPrevCurrentUrl] = useState(currentUrl);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const containerRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(420);

  // Sync if currentUrl changes externally (e.g. from history drawer)
  if (currentUrl !== prevCurrentUrl) {
    setPrevCurrentUrl(currentUrl);
    setUrl(currentUrl);
  }

  // Responsive input width: up to 440px, adapted to container
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const available = containerRef.current.clientWidth;
        setInputWidth(Math.min(440, Math.max(280, available - 16)));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrl(text.trim());
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 1500);
        }
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleLoad = () => {
    const trimmed = url.trim();
    if (!trimmed || isLoading) return;
    onFetch(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLoad();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoad();
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center lg:items-start font-sans">
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center lg:items-start space-y-4">
        {/* LabelInput with fixed notch */}
        <div className="w-full flex justify-center lg:justify-start">
          <LabelInput
            field="paste link"
            corner={14}
            width={inputWidth}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://..."
            autoFocus
          />
        </div>

        {/* Symmetrical Twin Buttons (Paste & Load) */}
        <div 
          className="grid grid-cols-2 gap-3"
          style={{ width: inputWidth }}
        >
          {/* Symmetrical Paste Button */}
          <button
            type="button"
            onClick={handlePaste}
            className={`h-11 rounded-full text-[14px] font-medium border transition-all duration-150 flex items-center justify-center space-x-2 select-none active:scale-[0.98] ${
              pasteSuccess
                ? 'bg-[#1c2e26] border-[#2dd4bf]/40 text-[#2dd4bf]'
                : 'bg-white/40 dark:bg-[#16161a] hover:bg-white/60 dark:hover:bg-[#202026] text-zinc-800 dark:text-[#ededed] border-black/10 dark:border-[#27272e] backdrop-blur-sm shadow-sm dark:shadow-none'
            }`}
          >
            {pasteSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Pasted</span>
              </>
            ) : (
              <span>Paste</span>
            )}
          </button>

          {/* Symmetrical Load Button */}
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className={`h-11 rounded-full text-[14px] font-medium transition-all duration-150 flex items-center justify-center space-x-2 select-none active:scale-[0.98] ${
              !url.trim() || isLoading
                ? 'bg-black/5 dark:bg-[#27272e] text-zinc-400 dark:text-[#71717a] border border-black/5 dark:border-transparent cursor-not-allowed'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-[#ededed] dark:hover:bg-white dark:text-[#0e0e11] shadow-sm'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white dark:text-[#0e0e11]" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Load</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
