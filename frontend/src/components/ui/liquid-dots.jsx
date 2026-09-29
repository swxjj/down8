import React from 'react';
import { motion } from 'framer-motion';

/**
 * LiquidDots - Tactile fluid loading indicator featuring two organically oscillating dots.
 * 
 * Props:
 * - theme: "dark" | "light" (defaults to "dark")
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
  const isDark = theme === 'dark';

  // Liquid dot styling based on active theme
  const dot1Color = isDark 
    ? 'bg-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.45)]' 
    : 'bg-zinc-900 shadow-[0_0_8px_rgba(0,0,0,0.25)]';
  
  const dot2Color = isDark 
    ? 'bg-zinc-300 shadow-[0_0_8px_rgba(255,255,255,0.3)]' 
    : 'bg-zinc-700 shadow-[0_0_6px_rgba(0,0,0,0.2)]';

  // Spring transition for the traveling phase
  const travelSpring = {
    type: 'spring',
    stiffness: 260,
    damping: 20,
  };

  return (
    <div className={`relative flex items-center justify-center w-12 h-6 pointer-events-none select-none ${className}`}>
      {/* SVG Gooey / Liquid Filter (hidden, referenced via CSS filter) */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="liquid-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
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
        {/* Dot 1: Upper / Primary Dot */}
        <motion.span
          className={`absolute w-3 h-3 rounded-full ${dot1Color}`}
          animate={
            isTraveling
              ? {
                  x: travelTarget.x,
                  y: travelTarget.y1,
                  scale: [1, 1.4, 0.4],
                  opacity: [1, 1, 0],
                }
              : {
                  x: [-8, 8, -8],
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
                  duration: 1.15,
                  ease: 'easeInOut',
                }
          }
        />

        {/* Dot 2: Lower / Secondary Dot */}
        <motion.span
          className={`absolute w-2.5 h-2.5 rounded-full ${dot2Color}`}
          animate={
            isTraveling
              ? {
                  x: travelTarget.x,
                  y: travelTarget.y2,
                  scale: [1, 1.4, 0.4],
                  opacity: [1, 1, 0],
                }
              : {
                  x: [8, -8, 8],
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
                  duration: 1.15,
                  ease: 'easeInOut',
                }
          }
        />
      </div>
    </div>
  );
}

export default LiquidDots;
