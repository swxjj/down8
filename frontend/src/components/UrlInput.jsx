import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidDots from './ui/liquid-dots';

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

          {/* Symmetrical Morphing Load Button -> LiquidDots */}
          <div className="w-full flex justify-end">
            <motion.button
              id="load-button"
              layout
              type="submit"
              disabled={!url.trim() || isLoading || isTraveling}
              animate={{
                width: isLoading || isTraveling ? 76 : '100%',
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className={`h-11 rounded-full text-[14px] font-medium transition-colors duration-200 flex items-center justify-center select-none active:scale-[0.98] relative overflow-visible ${
                isLoading || isTraveling
                  ? 'bg-white/50 dark:bg-zinc-800/80 border border-black/10 dark:border-white/10 backdrop-blur-sm pointer-events-none cursor-default shadow-xs'
                  : !url.trim()
                    ? 'bg-black/5 dark:bg-[#27272e] text-zinc-400 dark:text-[#71717a] border border-black/5 dark:border-transparent cursor-not-allowed'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-[#ededed] dark:hover:bg-white dark:text-[#0e0e11] shadow-sm cursor-pointer'
              }`}
            >
              <AnimatePresence mode="wait">
                {!isLoading && !isTraveling ? (
                  <motion.span
                    key="idle-load"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="truncate"
                  >
                    Load
                  </motion.span>
                ) : (
                  <motion.div
                    key="liquid-loader"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center justify-center pointer-events-none"
                  >
                    <LiquidDots
                      theme={isDark ? 'dark' : 'light'}
                      isTraveling={isTraveling}
                      travelTarget={travelTarget}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
}
