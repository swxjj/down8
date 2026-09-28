import React, { useState } from 'react';
import { 
  ClipboardPaste, 
  X, 
  Loader2, 
  ArrowRight, 
  Globe, 
  Sparkles 
} from 'lucide-react';
import { detectPlatform } from '../services/api';
import { YoutubeIcon, InstagramIcon, TwitterIcon, FacebookIcon, TikTokIcon } from './PlatformIcons';

export default function UrlInput({ onFetch, isLoading, currentUrl = '' }) {
  const [url, setUrl] = useState(currentUrl);
  const [prevCurrentUrl, setPrevCurrentUrl] = useState(currentUrl);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Sync state with prop change using React recommended pattern
  if (currentUrl !== prevCurrentUrl) {
    setPrevCurrentUrl(currentUrl);
    setUrl(currentUrl);
  }

  // Derive platform directly from url during render
  const platform = detectPlatform(url);

  const handleClear = () => {
    setUrl('');
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
        }
      }
    } catch (err) {
      console.warn('Clipboard read permission denied or unsupported:', err);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!url.trim() || isLoading) return;
    onFetch(url.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const renderPlatformBadge = () => {
    switch (platform) {
      case 'youtube':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">
            <YoutubeIcon className="w-4 h-4 text-red-500" />
            <span>YouTube Detected</span>
          </div>
        );
      case 'instagram':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">
            <InstagramIcon className="w-4 h-4 text-pink-400" />
            <span>Instagram Detected</span>
          </div>
        );
      case 'twitter':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">
            <TwitterIcon className="w-3.5 h-3.5 text-slate-100" />
            <span>X / Twitter Detected</span>
          </div>
        );
      case 'facebook':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">
            <FacebookIcon className="w-4 h-4 text-blue-500" />
            <span>Facebook Detected</span>
          </div>
        );
      case 'tiktok':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">
            <TikTokIcon className="w-4 h-4 text-teal-300" />
            <span>TikTok Detected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 border border-white/5 text-xs font-medium">
            <Globe className="w-3.5 h-3.5" />
            <span>Auto-detect</span>
          </div>
        );
    }
  };

  const sampleLinks = [
    { label: 'YouTube 4K Demo', url: 'https://youtube.com/watch?v=demo-4k', icon: YoutubeIcon, color: 'hover:text-red-400' },
    { label: 'Instagram Carousel Demo', url: 'https://instagram.com/p/demo-carousel', icon: InstagramIcon, color: 'hover:text-pink-400' },
    { label: 'X Video Demo', url: 'https://x.com/demo-status', icon: TwitterIcon, color: 'hover:text-sky-400' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Input Outer Container with Gradient Ring */}
      <div className="relative group">
        {/* Glow backdrop */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-600 via-accent-violet to-accent-emerald rounded-2xl blur-md opacity-35 group-hover:opacity-60 transition duration-500"></div>

        <div className="relative flex flex-col md:flex-row items-center bg-dark-card border border-white/10 rounded-2xl shadow-2xl p-2 sm:p-2.5 backdrop-blur-xl">
          
          {/* Left: Platform Icon / Detection indicator */}
          <div className="hidden sm:flex items-center pl-3 pr-2 py-2">
            {renderPlatformBadge()}
          </div>

          {/* Center: Main Input Bar */}
          <div className="flex-1 w-full flex items-center min-w-0 px-2 sm:px-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste any YouTube, Instagram, X/Twitter, or Facebook link here..."
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base font-normal px-2 py-3 focus:outline-none focus:ring-0 truncate"
              autoFocus
            />

            {/* Quick Action: Clear text */}
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors mr-1"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Quick Action: Paste from Clipboard */}
            <button
              type="button"
              onClick={handlePaste}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                pasteSuccess 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:border-white/20'
              }`}
              title="Paste from clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{pasteSuccess ? 'Pasted!' : 'Paste'}</span>
            </button>
          </div>

          {/* Right: Submit Button */}
          <div className="w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!url.trim() || isLoading}
              className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg ${
                !url.trim() || isLoading
                  ? 'bg-dark-elevated text-slate-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-violet text-white hover:from-brand-500 hover:to-accent-purple active:scale-95 shadow-glow-brand'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Fetching Media...</span>
                </>
              ) : (
                <>
                  <span>Fetch Media</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Demo Quick Chips for Quick Testing & Demonstration */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 gap-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-slate-400 font-medium">Quick Test Samples:</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleLinks.map((sample) => {
              const Icon = sample.icon;
              return (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setUrl(sample.url);
                    onFetch(sample.url);
                  }}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-card/80 hover:bg-dark-elevated border border-white/5 hover:border-white/20 text-slate-300 ${sample.color} transition-all duration-150`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{sample.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden sm:flex items-center text-slate-400 text-[11px]">
          Press <kbd className="mx-1 px-1.5 py-0.5 bg-dark-card rounded border border-white/10 font-mono text-slate-300">Enter</kbd> to fetch
        </div>
      </div>

    </div>
  );
}
