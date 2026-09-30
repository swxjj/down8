import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * ChromeBorderButton - RewampUI Inspired Component
 * Fully rounded pill button with a thin true-chrome rotating conic-gradient outline,
 * subtle metallic reflection, and shimmering metallic text.
 */
export function ChromeBorderButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  innerClassName = '',
  active = true,
  id,
  isDark: isDarkProp,
  icon: Icon = null,
  ...props
}) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (typeof isDarkProp === 'boolean') {
      setIsDarkMode(isDarkProp);
      return;
    }
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [isDarkProp]);

  const isLight = !isDarkMode;

  return (
    <div
      className={`relative rounded-full p-[1.5px] overflow-hidden transition-all duration-300 ${
        active
          ? 'shadow-[0_4px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_0_24px_rgba(255,255,255,0.12)]'
          : 'opacity-75 hover:opacity-100'
      } ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
      style={{
        background: isDarkMode
          ? active
            ? 'linear-gradient(135deg, #ffffff 0%, #71717a 35%, #ffffff 55%, #52525b 80%, #ffffff 100%)'
            : 'linear-gradient(135deg, #3f3f46 0%, #27272e 35%, #52525b 55%, #27272e 80%, #3f3f46 100%)'
          : active
            ? 'linear-gradient(135deg, #ffffff 0%, #d8d9dc 35%, #f4f4f5 55%, #c9cacd 80%, #ffffff 100%)'
            : 'linear-gradient(135deg, #e4e4e7 0%, #d4d4d8 35%, #f4f4f5 55%, #d4d4d8 80%, #e4e4e7 100%)',
      }}
    >
      {/* Traveling chrome ring - only peeks through the thin border gap */}
      <motion.span
        className="absolute -inset-[150%] blur-[2px] pointer-events-none"
        style={{
          background:
            'conic-gradient(from 0deg, #0a0a0a, #ffffff, #8a8a8a, #ffffff, #1c1c1c, #dcdcdc, #e11d2e, #dcdcdc, #1c1c1c, #ffffff, #8a8a8a, #ffffff, #0a0a0a)',
          opacity: active ? 1 : 0.35,
        }}
        animate={disabled ? { rotate: 0 } : { rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      <button
        id={id}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`relative z-10 w-full h-full flex items-center justify-center rounded-full select-none transition-all duration-200 active:scale-[0.98] ${
          active
            ? isLight
              ? 'bg-white shadow-sm cursor-pointer'
              : 'bg-zinc-900 shadow-sm cursor-pointer'
            : isLight
              ? 'bg-white/70 hover:bg-white cursor-pointer'
              : 'bg-zinc-900/60 hover:bg-zinc-800 cursor-pointer'
        } ${innerClassName}`}
        {...props}
      >
        {Icon && (
          <span
            className={`mr-2 flex items-center transition-colors duration-200 ${
              active
                ? isLight
                  ? 'text-zinc-900'
                  : 'text-zinc-100'
                : isLight
                  ? 'text-zinc-500'
                  : 'text-zinc-400'
            }`}
          >
            {typeof Icon === 'function' ? <Icon className="w-4 h-4" /> : Icon}
          </span>
        )}

        <motion.span
          className="relative z-10 text-[14px] sm:text-[15px] font-semibold tracking-tight bg-clip-text text-transparent select-none flex items-center justify-center"
          style={{
            backgroundImage: isDarkMode
              ? active
                ? 'linear-gradient(100deg, #ffffff 0%, #a1a1aa 20%, #ffffff 40%, #71717a 55%, #e4e4e7 70%, #a1a1aa 85%, #ffffff 100%)'
                : 'linear-gradient(100deg, #a1a1aa 0%, #71717a 20%, #a1a1aa 40%, #52525b 55%, #71717a 70%, #52525b 85%, #a1a1aa 100%)'
              : active
                ? 'linear-gradient(100deg, #18181b 0%, #52525b 20%, #18181b 40%, #71717a 55%, #27272a 70%, #52525b 85%, #18181b 100%)'
                : 'linear-gradient(100deg, #52525b 0%, #71717a 20%, #52525b 40%, #a1a1aa 55%, #52525b 70%, #71717a 85%, #52525b 100%)',
            backgroundSize: '250% 100%',
          }}
          animate={disabled ? {} : { backgroundPosition: ['0% 50%', '250% 50%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        >
          {children}
        </motion.span>
      </button>
    </div>
  );
}

export default ChromeBorderButton;
