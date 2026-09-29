import React from 'react';
import AnimatedBackground from './core/animated-background';

const FEATURES = [
  {
    id: 'feature-1',
    title: 'Ultra HD Video',
    description: 'Extract MP4 streams up to 4K 60fps with original clarity.',
  },
  {
    id: 'feature-2',
    title: 'Hi-Fi Audio',
    description: 'Convert music and podcasts into clean 320kbps MP3s.',
  },
  {
    id: 'feature-3',
    title: 'Multi-Platform',
    description: 'Native support for YouTube, Instagram, X/Twitter, and Facebook.',
  },
  {
    id: 'feature-4',
    title: 'Direct Remuxing',
    description: 'Server-side FFmpeg processing with zero client overhead.',
  },
  {
    id: 'feature-5',
    title: 'No Ads or Clutter',
    description: 'Clean extraction without redirects, popups, or trackers.',
  },
  {
    id: 'feature-6',
    title: 'High-Speed Pipeline',
    description: 'Chunked streaming with real-time transfer telemetry.',
  },
];

export default function FeaturesGrid() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <AnimatedBackground
          className="rounded-xl bg-zinc-800/40 border border-white/10"
          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
          enableHover={true}
        >
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              data-id={feature.id}
              className="rounded-xl p-5 border border-white/[0.06] bg-[#121215]/60 hover:border-white/10 transition-colors"
            >
              <h3 className="text-sm font-semibold text-zinc-100">
                {feature.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </AnimatedBackground>
      </div>
    </section>
  );
}
