import React from 'react';
import { motion } from 'framer-motion';

/**
 * LiquidDots - Tactile fluid loading indicator featuring two organically oscillating dots.
 * 
 * Props:
 * - theme: "dark" | "light" (defaults to "dark", which renders dark liquid ink dots for light/white buttons)
 * - className: additional wrapper classes
 * - isTraveling: boolean, when true triggers the exit travel animation towards the preview area
 * - travelTarget: { x: number, y1: number, y2: number } target relative pixel coordinates
 */
export function LiquidDots({
  theme = 'dark',
  className = '',
  isTraveling = false,
  travelTarget = { x: 380, y1: -20, y2: 120 },
}) {
  // Theme dark = dark ink dots (for white/light button container)
  // Theme light = light luminous dots (for dark button container)
  const isDarkDots = theme === 'dark';

  const dot1Color = isDarkDots 
    ? 'bg-zinc-900 shadow-[0_0_6px_rgba(0,0,0,0.3)]' 
    : 'bg-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.45)]';
  
  const dot2Color = isDarkDots 
    ? 'bg-zinc-700 shadow-[0_0_5px_rgba(0,0,0,0.2)]' 
    : 'bg-zinc-300 shadow-[0_0_8px_rgba(255,255,255,0.3)]';

  // Spring transition for the traveling phase
  const travelSpring = {
    type: 'spring',
    stiffness: 260,
    damping: 20,
  };

  return (
    <div className={`relative flex items-center justify-center w-10 h-5 pointer-events-none select-none ${className}`}>
      {/* SVG Gooey / Liquid Filter (hidden, referenced via CSS filter) */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="liquid-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -6"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div 
        className="relative flex items-center justify-center w-full h-full"
        style={{ filter: isTraveling ? 'none' : 'url(#liquid-filter)' }}
      >
        {/* Dot 1: Primary Liquid Dot */}
        <motion.span
          className={`absolute w-2.5 h-2.5 rounded-full ${dot1Color}`}
          animate={
            isTraveling
              ? {
                  x: travelTarget.x,
                  y: travelTarget.y1,
                  scale: [1, 1.4, 0.4],
                  opacity: [1, 1, 0],
                }
              : {
                  x: [-6, 6, -6],
                  scaleX: [1, 1.25, 0.85, 1],
                  scaleY: [1, 0.85, 1.25, 1],
                  opacity: 1,
                }
          }
          transition={
            isTraveling
              ? {
                  ...travelSpring,
                  opacity: { duration: 0.38, times: [0, 0.7, 1] },
                }
              : {
                  repeat: Infinity,
                  duration: 1.1,
                  ease: 'easeInOut',
                }
          }
        />

        {/* Dot 2: Secondary Liquid Dot */}
        <motion.span
          className={`absolute w-2 h-2 rounded-full ${dot2Color}`}
          animate={
            isTraveling
              ? {
                  x: travelTarget.x,
                  y: travelTarget.y2,
                  scale: [1, 1.4, 0.4],
                  opacity: [1, 1, 0],
                }
              : {
                  x: [6, -6, 6],
                  scaleX: [1, 0.85, 1.25, 1],
                  scaleY: [1, 1.25, 0.85, 1],
                  opacity: 1,
                }
          }
          transition={
            isTraveling
              ? {
                  ...travelSpring,
                  delay: 0.04,
                  opacity: { duration: 0.42, times: [0, 0.7, 1], delay: 0.04 },
                }
              : {
                  repeat: Infinity,
                  duration: 1.1,
                  ease: 'easeInOut',
                }
          }
        />
      </div>
    </div>
  );
}

export default LiquidDots;
