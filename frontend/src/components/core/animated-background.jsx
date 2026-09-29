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
  value,
  onValueChange,
  className,
  transition,
  enableHover = false,
}) {
  const isControlled = value !== undefined;
  const [internalActiveId, setInternalActiveId] = useState(defaultValue ?? null);
  const activeId = isControlled ? value : internalActiveId;
  const uniqueId = useId();

  const handleSetActiveId = (id) => {
    if (!isControlled) {
      setInternalActiveId(id);
    }
    if (onValueChange) {
      onValueChange(id);
    }
  };

  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternalActiveId((prev) => (prev !== defaultValue ? defaultValue : prev));
    }
  }, [isControlled, defaultValue]);

  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) {
      return child;
    }

    const id = child.props['data-id'];

    const interactionProps = enableHover
      ? {
          onMouseEnter: (e) => {
            handleSetActiveId(id);
            child.props.onMouseEnter?.(e);
          },
          onMouseLeave: (e) => {
            handleSetActiveId(null);
            child.props.onMouseLeave?.(e);
          },
        }
      : {
          onClick: (e) => {
            handleSetActiveId(id);
            child.props.onClick?.(e);
          },
        };

    const hasActive = activeId === id;

    return cloneElement(
      child,
      {
        key: child.key ?? index,
        className: `${child.props.className ? child.props.className + ' ' : ''}relative`,
        'data-checked': hasActive ? 'true' : 'false',
        'aria-selected': hasActive,
        ...interactionProps,
      },
      <>
        <AnimatePresence initial={false}>
          {hasActive && (
            <motion.div
              layoutId={`background-${uniqueId}`}
              className={`absolute inset-0 pointer-events-none ${className || ''}`}
              transition={transition}
              initial={{ opacity: (isControlled ? value : defaultValue) ? 1 : 0 }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
            />
          )}
        </AnimatePresence>
        {Children.map(child.props.children, (innerChild) => {
          if (!isValidElement(innerChild)) {
            return <span className="relative z-10">{innerChild}</span>;
          }
          return cloneElement(innerChild, {
            className: `${innerChild.props.className ? innerChild.props.className + ' ' : ''}relative z-10`,
          });
        })}
      </>
    );
  });
}

export default AnimatedBackground;
