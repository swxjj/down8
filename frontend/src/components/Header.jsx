import React from 'react';
import ThemeToggle from './ui/ThemeToggle';

export default function Header({ onOpenHistory, isDark, toggleTheme }) {
  return (
    <header className="w-full border-b border-black/10 dark:border-[#27272e] bg-white/70 dark:bg-[#0e0e11]/80 backdrop-blur-md sticky top-0 z-40 text-neutral-900 dark:text-[#ededed] font-sans transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
        <span className="text-[17px] font-semibold tracking-tight text-neutral-900 dark:text-[#ededed] select-none">
          down8
        </span>

        <div className="flex items-center gap-3">
          {/* Text-only History with interactive hover underline (no buttons, no numbers) */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="text-[14px] font-medium text-neutral-600 dark:text-[#a1a1aa] hover:text-neutral-900 dark:hover:text-[#ededed] transition-colors relative py-1 group focus:outline-none bg-transparent border-0 cursor-pointer"
          >
            <span>History</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-neutral-900 dark:bg-[#ededed] transition-all duration-200 group-hover:w-full" />
          </button>

          {/* MorphButton Theme Toggle */}
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
        </div>
      </div>
    </header>
  );
}
