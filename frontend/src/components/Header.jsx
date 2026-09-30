import React from 'react';
import ThemeToggle from './ui/ThemeToggle';

export default function Header({ onOpenHistory, isDark, toggleTheme }) {
  return (
    <header className="w-full bg-transparent dark:bg-transparent backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06] sticky top-0 z-40 text-neutral-900 dark:text-[#ededed] font-sans transition-colors duration-500">

      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="text-[17px] font-semibold tracking-tight text-neutral-900 dark:text-[#ededed] select-none">
          down8
        </span>

        <div className="flex items-center gap-3">
          {/* Text-only History with Montserrat font */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="font-['Montserrat',sans-serif] text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer relative py-1 group focus:outline-none bg-transparent border-0"
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
