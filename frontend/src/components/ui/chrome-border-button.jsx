import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * ChromeBorderButton - RewampUI Inspired Component
 * Fully rounded pill button with chromatic outline matching the background themes:
 * - Dark Mode: Solid white pill face with dark gunmetal shimmer text, surrounded by
 *   the bright arc-bands outline (sky blue, teal, amber, rose, and white specular reflections).
 * - Light Mode (Inverted): Solid dark pill face with bright silver shimmer text, surrounded by
 *   the warm coral-glow outline (vivid coral rose, warm peach, golden yellow, pink, and white reflections).
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
  icon = null,
  ...props
}) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof isDarkProp === 'boolean') return isDarkProp;
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

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

  // Conic gradient colors precisely matching the background themes:
  // Dark mode: celestial arc bands (sky blue #38bdf8, teal #2dd4bf, amber #f59e0b, rose #f43f5e, white specular highlights)
  const darkConic =
    'conic-gradient(from 0deg, #0a0b0e, #38bdf8, #ffffff, #2dd4bf, #0a0b0e, #f59e0b, #ffffff, #f43f5e, #ffffff, #38bdf8, #0a0b0e)';

  // Light mode: warm coral glow (coral rose #fb7185, peach #fdba74, golden yellow #fde68a, pink #fda4af, white specular highlights)
  const lightConic =
    'conic-gradient(from 0deg, #fb7185, #ffffff, #fdba74, #ffffff, #fde68a, #ffffff, #fda4af, #ffffff, #fb7185)';

  const renderIcon = () => {
    if (!icon) return null;
    const iconClass = active
      ? isDarkMode
        ? 'text-zinc-900'
        : 'text-white'
      : isDarkMode
        ? 'text-zinc-400'
        : 'text-zinc-600';

    if (React.isValidElement(icon)) {
      return <span className={`mr-2 flex items-center ${iconClass}`}>{icon}</span>;
    }
    const IconComponent = icon;
    return (
      <span className={`mr-2 flex items-center ${iconClass}`}>
        <IconComponent className="w-4 h-4" />
      </span>
    );
  };

  return (
    <div
      className={`relative rounded-full p-[1.5px] overflow-hidden transition-all duration-300 ${
        active
          ? isDarkMode
            ? 'shadow-[0_0_24px_rgba(56,189,248,0.22),0_0_12px_rgba(244,63,94,0.14)] opacity-100'
            : 'shadow-[0_4px_20px_rgba(251,113,133,0.3),0_0_14px_rgba(253,186,116,0.2)] opacity-100'
          : 'opacity-70 hover:opacity-100'
      } ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
      style={{
        background: active
          ? isDarkMode
            ? 'linear-gradient(135deg, #ffffff 0%, #38bdf8 30%, #2dd4bf 50%, #f43f5e 75%, #ffffff 100%)'
            : 'linear-gradient(135deg, #fb7185 0%, #fdba74 35%, #ffffff 55%, #fda4af 80%, #fb7185 100%)'
          : isDarkMode
            ? 'linear-gradient(135deg, #3f3f46 0%, #27272e 35%, #52525b 55%, #27272e 80%, #3f3f46 100%)'
            : 'linear-gradient(135deg, #e4e4e7 0%, #d4d4d8 35%, #f4f4f5 55%, #d4d4d8 80%, #e4e4e7 100%)',
      }}
    >
      {/* Traveling chromatic ring - rotating conic-gradient */}
      <motion.span
        className="absolute -inset-[150%] blur-[2px] pointer-events-none"
        style={{
          background: isDarkMode ? darkConic : lightConic,
          opacity: active ? 1 : 0.28,
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
            ? isDarkMode
              ? 'bg-white text-zinc-900 shadow-sm cursor-pointer'
              : 'bg-zinc-950 text-white shadow-sm cursor-pointer'
            : isDarkMode
              ? 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer border border-white/5'
              : 'bg-white/80 text-zinc-600 hover:bg-white hover:text-zinc-900 cursor-pointer border border-black/5'
        } ${innerClassName}`}
        {...props}
      >
        {renderIcon()}

        <motion.span
          className={`relative z-10 text-[14px] sm:text-[15px] font-semibold tracking-tight select-none flex items-center justify-center ${
            active
              ? 'bg-clip-text text-transparent'
              : isDarkMode
                ? 'text-zinc-400'
                : 'text-zinc-600'
          }`}
          style={
            active
              ? {
                  backgroundImage: isDarkMode
                    ? 'linear-gradient(100deg, #18181b 0%, #4a4a4a 20%, #18181b 40%, #5c5c5c 55%, #232323 70%, #4a4a4a 85%, #18181b 100%)'
                    : 'linear-gradient(100deg, #ffffff 0%, #a1a1aa 20%, #ffffff 40%, #71717a 55%, #e4e4e7 70%, #a1a1aa 85%, #ffffff 100%)',
                  backgroundSize: '250% 100%',
                }
              : {}
          }
          animate={disabled || !active ? {} : { backgroundPosition: ['0% 50%', '250% 50%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        >
          {children}
        </motion.span>
      </button>
    </div>
  );
}

export default ChromeBorderButton;
