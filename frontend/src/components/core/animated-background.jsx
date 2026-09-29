import React, {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  useId,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function AnimatedBackground({
  children,
  defaultValue,
  onValueChange,
  className,
  transition,
  enableHover = false,
}) {
  const [activeId, setActiveId] = useState(defaultValue ?? null);
  const uniqueId = useId();

  const handleSetActiveId = (id) => {
    setActiveId(id);
    if (onValueChange) {
      onValueChange(id);
    }
  };

  useEffect(() => {
    if (defaultValue !== undefined) {
      setActiveId((prev) => (prev !== defaultValue ? defaultValue : prev));
    }
  }, [defaultValue]);

  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) {
      return child;
    }

    const id = child.props['data-id'];

    const interactionProps = enableHover
      ? {
          onMouseEnter: () => handleSetActiveId(id),
          onMouseLeave: () => handleSetActiveId(null),
        }
      : {
          onClick: () => handleSetActiveId(id),
        };

    return cloneElement(
      child,
      {
        key: child.key ?? index,
        className: `${child.props.className ? child.props.className + ' ' : ''}relative`,
        'data-checked': activeId === id ? 'true' : 'false',
        'aria-selected': activeId === id,
        ...interactionProps,
      },
      <>
        <AnimatePresence initial={false}>
          {activeId === id && (
            <motion.div
              layoutId={`background-${uniqueId}`}
              className={`absolute inset-0 ${className || ''}`}
              transition={transition}
              initial={{ opacity: defaultValue ? 1 : 0 }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
            />
          )}
        </AnimatePresence>
        <div className="relative z-10">{child.props.children}</div>
      </>
    );
  });
}

export default AnimatedBackground;
