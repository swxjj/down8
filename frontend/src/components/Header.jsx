import React from 'react';
import { DownloadCloud, History, Activity } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, TwitterIcon, FacebookIcon } from './PlatformIcons';

export default function Header({ historyCount = 0, onOpenHistory }) {
  const platforms = [
    { name: 'YouTube', icon: YoutubeIcon, color: 'text-red-500', badge: 'Active' },
    { name: 'Instagram', icon: InstagramIcon, color: 'text-pink-400', badge: 'Active' },
    { name: 'X / Twitter', icon: TwitterIcon, color: 'text-slate-100', badge: 'Active' },
    { name: 'Facebook', icon: FacebookIcon, color: 'text-blue-500', badge: 'Active' },
  ];

  return (
    <header className="w-full border-b border-white/5 bg-dark-surface/60 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-accent-violet to-accent-emerald p-0.5 shadow-glow-brand group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-dark-bg/90 rounded-[14px] flex items-center justify-center">
                <DownloadCloud className="w-6 h-6 text-brand-300 group-hover:text-white transition-colors" />
              </div>
            </div>
            {/* Ambient subtle ping */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-brand-300">
                OmniMedia
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Global High-Fidelity Media Downloader
            </p>
          </div>
        </div>

        {/* Live Platform Status Badges */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-3 bg-dark-card/60 border border-white/5 rounded-full px-3 py-1.5 shadow-inner">
          <div className="flex items-center space-x-1.5 pr-2 border-r border-white/10 text-xs font-medium text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Engines</span>
          </div>

          {platforms.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
                title={`${p.name} Engine: Operational (4K/HQ Supported)`}
              >
                <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                <span className="text-xs text-slate-300 font-medium">{p.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow-emerald"></span>
              </div>
            );
          })}
        </div>

        {/* Action Controls: History & Quick Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-dark-card hover:bg-dark-elevated text-slate-300 hover:text-white border border-white/10 hover:border-brand-500/40 shadow-sm transition-all duration-200 group active:scale-95"
            title="View Download History"
          >
            <History className="w-4 h-4 text-slate-400 group-hover:text-brand-300 transition-colors" />
            <span className="text-xs font-semibold hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold leading-none text-white bg-brand-600 rounded-full shadow-glow-brand">
                {historyCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
