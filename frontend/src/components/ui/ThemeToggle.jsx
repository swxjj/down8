import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ isDark, toggleTheme }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer select-none outline-none focus:outline-none"
      aria-label="Toggle theme"
    >
      <div className="w-4 h-4 relative flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Moon className="w-4 h-4 text-zinc-200" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ opacity: 0, scale: 0.6, rotate: 45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: -45 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Sun className="w-4 h-4 text-zinc-700" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}

export default ThemeToggle;
