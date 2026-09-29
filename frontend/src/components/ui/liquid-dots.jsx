import React from 'react';
import { motion } from 'framer-motion';

/**
 * LiquidDots - Two full-sized white circular liquid dots (~34-36px diameter)
 * that fluidly interact with metaball/gooey physics directly on the page background,
 * and launch across the screen to reveal the media preview blocks.
 *
 * Props:
 * - theme: "dark" | "light" (in dark mode: solid white/light, in light mode: deep zinc)
 * - isTraveling: boolean, triggers the cross-screen flight animation
 * - travelTarget: { x: number, y1: number, y2: number } target relative pixel coordinates
 */
export function LiquidDots({
  theme = 'dark',
  isTraveling = false,
  travelTarget = { x: 380, y1: -20, y2: 120 },
}) {
  const isDark = theme === 'dark';

  // In dark mode: matching the solid white material of the Load button
  // In light mode: deep zinc/charcoal matching the light mode ink
  const dotColor = isDark
    ? 'bg-white shadow-[0_0_16px_rgba(255,255,255,0.45)]'
    : 'bg-zinc-900 shadow-[0_0_12px_rgba(0,0,0,0.25)]';

  // Spring transition for the cross-screen travel phase
  const travelSpring = {
    type: 'spring',
    stiffness: 260,
    damping: 20,
  };

  return (
    <div className="relative flex items-center justify-center w-36 h-11 pointer-events-none select-none overflow-visible">
      {/* SVG Gooey / Metaball Filter */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="liquid-metaball-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Metaball container (filter active only when stationary in place) */}
      <div
        className="relative flex items-center justify-center w-full h-full overflow-visible"
        style={{ filter: isTraveling ? 'none' : 'url(#liquid-metaball-filter)' }}
      >
        {/* Dot 1: Large Primary Liquid Dot (~35px diameter) */}
        <motion.span
          className={`absolute w-[35px] h-[35px] rounded-full ${dotColor}`}
          animate={
            isTraveling
              ? {
                  x: travelTarget.x,
                  y: travelTarget.y1,
                  scale: [1, 1.25, 0.5],
                  opacity: [1, 1, 0],
                }
              : {
                  x: [-14, 14, -14],
                  scaleX: [1, 1.2, 0.88, 1],
                  scaleY: [1, 0.88, 1.2, 1],
                  opacity: 1,
                }
          }
          transition={
            isTraveling
              ? {
                  ...travelSpring,
                  opacity: { duration: 0.38, times: [0, 0.75, 1] },
                }
              : {
                  repeat: Infinity,
                  duration: 1.25,
                  ease: 'easeInOut',
                }
          }
        />

        {/* Dot 2: Large Secondary Liquid Dot (~35px diameter) */}
        <motion.span
          className={`absolute w-[35px] h-[35px] rounded-full ${dotColor}`}
          animate={
            isTraveling
              ? {
                  x: travelTarget.x,
                  y: travelTarget.y2,
                  scale: [1, 1.25, 0.5],
                  opacity: [1, 1, 0],
                }
              : {
                  x: [14, -14, 14],
                  scaleX: [1, 0.88, 1.2, 1],
                  scaleY: [1, 1.2, 0.88, 1],
                  opacity: 1,
                }
          }
          transition={
            isTraveling
              ? {
                  ...travelSpring,
                  delay: 0.04,
                  opacity: { duration: 0.42, times: [0, 0.75, 1], delay: 0.04 },
                }
              : {
                  repeat: Infinity,
                  duration: 1.25,
                  ease: 'easeInOut',
                }
          }
        />
      </div>
    </div>
  );
}

export default LiquidDots;
