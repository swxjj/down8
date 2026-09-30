import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidDots from './ui/liquid-dots';
import ChromeBorderButton from './ui/chrome-border-button';

export default function UrlInput({ 
  onFetch, 
  isLoading, 
  currentUrl = '',
  isDark = true,
  isTraveling = false,
  travelTarget = { x: 380, y1: -20, y2: 120 },
}) {
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
    if (!trimmed || isLoading || isTraveling) return;
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
        {/* Unbroken input container with clean external label */}
        <div className="w-full flex flex-col items-start" style={{ width: inputWidth }}>
          <label className="block text-xs font-mono tracking-wide text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
            paste link
          </label>
          <div className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/30 dark:bg-zinc-900/40 backdrop-blur-sm focus-within:border-black/25 dark:focus-within:border-white/30 transition-colors flex items-center px-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://..."
              autoFocus
              className="w-full h-12 bg-transparent border-0 outline-none text-[15px] text-zinc-900 placeholder:text-zinc-500 dark:text-white dark:placeholder:text-zinc-500 font-sans"
            />
          </div>
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

          {/* Morphing Load Button -> Splits into Two Full-Scale Liquid Dots */}
          <div id="load-button" className="w-full h-11 relative flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!isLoading && !isTraveling ? (
                <motion.div
                  key="chrome-load-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="w-full h-11"
                >
                  <ChromeBorderButton
                    type="submit"
                    disabled={!url.trim()}
                    isDark={isDark}
                    className="w-full h-11"
                  >
                    Load
                  </ChromeBorderButton>
                </motion.div>
              ) : (
                <motion.div
                  key="liquid-loader"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                  className="w-full h-full flex items-center justify-center pointer-events-none overflow-visible"
                >
                  <LiquidDots
                    theme={isDark ? 'dark' : 'light'}
                    isTraveling={isTraveling}
                    travelTarget={travelTarget}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>
    </div>
  );
}
