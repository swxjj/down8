import React from 'react';
import ThemeToggle from './ui/ThemeToggle';

export default function Header({ isDark, toggleTheme }) {
  return (
    <header className="w-full bg-transparent dark:bg-transparent backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06] sticky top-0 z-40 text-neutral-900 dark:text-[#ededed] font-sans transition-colors duration-500">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="text-[17px] font-semibold tracking-tight text-neutral-900 dark:text-[#ededed] select-none">
          down8
        </span>

        <div className="flex items-center gap-3">
          {/* MorphButton Theme Toggle */}
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
        </div>
      </div>
    </header>
  );
}
