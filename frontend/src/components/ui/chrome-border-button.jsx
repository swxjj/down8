import React from 'react';
import { motion } from 'framer-motion';

/**
 * ChromeBorderButton - RewampUI Component
 * Fully rounded white pill button with a thin true-chrome outline:
 * - A rotating conic-gradient ring with polished metal reflection and red specular highlight
 * - Centered moving dark metallic gradient text that shimmers left to right on a loop
 * - Solid white button face in both dark and light modes as specified by RewampUI
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
  icon = null,
  ...props
}) {
  const renderIcon = () => {
    if (!icon) return null;
    const iconClass = active ? 'text-zinc-900' : 'text-zinc-600 dark:text-zinc-400';
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
          ? 'shadow-[0_4px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_0_24px_rgba(255,255,255,0.14)] opacity-100'
          : 'opacity-70 hover:opacity-100'
      } ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
      style={{
        background: active
          ? 'linear-gradient(135deg, #ffffff 0%, #d8d9dc 35%, #f4f4f5 55%, #c9cacd 80%, #ffffff 100%)'
          : 'linear-gradient(135deg, #3f3f46 0%, #27272e 35%, #52525b 55%, #27272e 80%, #3f3f46 100%)',
      }}
    >
      {/* Traveling chrome ring - rotating conic-gradient */}
      <motion.span
        className="absolute -inset-[150%] blur-[2px] pointer-events-none"
        style={{
          background:
            'conic-gradient(from 0deg, #0a0a0a, #ffffff, #8a8a8a, #ffffff, #1c1c1c, #dcdcdc, #e11d2e, #dcdcdc, #1c1c1c, #ffffff, #8a8a8a, #ffffff, #0a0a0a)',
          opacity: active ? 1 : 0.25,
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
            ? 'bg-white text-zinc-900 shadow-sm cursor-pointer'
            : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 cursor-pointer'
        } ${innerClassName}`}
        {...props}
      >
        {renderIcon()}

        <motion.span
          className={`relative z-10 text-[14px] sm:text-[15px] font-semibold tracking-tight select-none flex items-center justify-center ${
            active ? 'bg-clip-text text-transparent' : 'text-zinc-700 dark:text-zinc-300'
          }`}
          style={
            active
              ? {
                  backgroundImage:
                    'linear-gradient(100deg, #2a2a2a 0%, #4a4a4a 20%, #1c1c1c 40%, #5c5c5c 55%, #232323 70%, #4a4a4a 85%, #2a2a2a 100%)',
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
