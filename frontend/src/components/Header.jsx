import React from 'react';

export default function Header({ onOpenHistory }) {
  return (
    <header className="w-full border-b border-[#27272e] bg-[#0e0e11]/90 backdrop-blur-sm sticky top-0 z-40 text-[#ededed] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
        <span className="text-[17px] font-semibold tracking-tight text-[#ededed] select-none">
          down8
        </span>

        {/* Text-only History with interactive hover underline (no buttons, no numbers) */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="text-[14px] font-medium text-[#a1a1aa] hover:text-[#ededed] transition-colors relative py-1 group focus:outline-none bg-transparent border-0 cursor-pointer"
        >
          <span>History</span>
          <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#ededed] transition-all duration-200 group-hover:w-full" />
        </button>
      </div>
    </header>
  );
}
