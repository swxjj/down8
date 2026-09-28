import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Trash2, Undo2 } from "lucide-react";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hold = (e) => e.stopPropagation();

/* ══ 4 · confirm in place ═════════════════════════════════
   The button becomes its own dialog. Nothing opens over the
   page, nothing shifts around it, and the choice stays under
   the cursor that asked for it — a modal moves your attention
   somewhere else to answer a question you just asked here.

   Undo lives in the same footprint too, on a timer, so the
   destructive path never needs a toast either. */

/* 22 is half of the 44px shell — the pill it already is */
const SAY_CORNER = 22;

export function InlineConfirm({
  corner = SAY_CORNER,
  idleText = "Delete",
  doneText = "Deleted",
  undoText = "Undo",
  onCommit,
  onUndo,
  idleIcon,
  doneIcon,
  width = 260,
  idleWidth = 112,
  doneWidth = 206,
  grace = 4000,
  compact = false,
  disabled = false,
  className = "",
  style = {},
}) {
  const [phase, setPhase] = useState("idle");
  const timer = useRef(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const commit = async (e) => {
    if (disabled) return;
    if (onCommit) {
      const res = await onCommit(e);
      if (res === false) return;
    }
    setPhase("done");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase("idle"), grace);
  };

  const undo = (e) => {
    window.clearTimeout(timer.current);
    setPhase("idle");
    if (onUndo) {
      onUndo(e);
    }
  };

  /* out with a little give, back in firmly */
  const done = phase === "done";
  const SAY_W = width;
  const SAY_IDLE = idleWidth;
  const SAY_DONE = doneWidth;
  const w = done ? SAY_DONE : SAY_IDLE;
  const left = (SAY_W - w) / 2;
  const spring = done
    ? { type: "spring", stiffness: 420, damping: 20, mass: 0.9 }
    : { type: "spring", stiffness: 460, damping: 30, mass: 0.9 };
  const r = clamp(corner, 0, SAY_CORNER);

  const renderIcon = (icon, fallback) => {
    if (icon === null) return null;
    if (icon !== undefined) {
      if (React.isValidElement(icon)) return icon;
      if (typeof icon === "function" || (typeof icon === "object" && icon.$$typeof)) {
        const IconComponent = icon;
        return <IconComponent size={15} strokeWidth={2} />;
      }
      return icon;
    }
    return fallback;
  };

  const fallbackIdle = idleText === "Delete" ? <Trash2 size={15} strokeWidth={2} /> : null;
  const effectiveIdleIcon = renderIcon(idleIcon, fallbackIdle);

  const fallbackDone = <Check size={14} strokeWidth={2} />;
  const effectiveDoneIcon = renderIcon(doneIcon, fallbackDone);

  return (
    <div
      className={`say-well ${compact ? "compact" : ""} ${className}`.trim()}
      data-phase={phase}
      data-disabled={disabled}
      style={{
        width: SAY_W,
        "--say-r": `${r}px`,
        "--font-ui": "'Montserrat', sans-serif",
        "--ink": "#ededed",
        "--ink-rgb": "237, 237, 237",
        "--ink-3": "#a1a1aa",
        "--fill-on": "#ededed",
        "--fill-slab": "#1c1c22",
        "--pane": "#16161a",
        "--pane-edge": "#2e2e38",
        "--pick": "#ededed",
        "--pick-rgb": "237, 237, 237",
        "--shadow-rgb": "0, 0, 0",
        ...style,
      }}
    >
      <motion.span className="say-body" initial={false} animate={{ left, width: w }} transition={spring} />

      <AnimatePresence initial={false}>
        {!done && (
          <motion.button
            key="idle"
            className="say-face"
            style={{
              left,
              width: w,
              opacity: disabled ? 0.45 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            disabled={disabled}
            initial={{ opacity: 0 }}
            animate={{ opacity: disabled ? 0.45 : 1, transition: { duration: 0.18, delay: 0.08 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            onClick={commit}
            onPointerDown={hold}
          >
            {effectiveIdleIcon}
            {idleText}
          </motion.button>
        )}

        {done && (
          <motion.div
            key="done"
            className="say-merged"
            style={{ left, width: w }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
          >
            <span
              className="say-done"
              style={!undoText ? { width: "100%", justifyContent: "center" } : {}}
            >
              {effectiveDoneIcon}
              {doneText}
            </span>
            {undoText && (
              <button className="say-undo" onClick={undo} onPointerDown={hold}>
                <Undo2 size={13} strokeWidth={2} />
                {undoText}
              </button>
            )}
            <i className="say-fuse" style={{ animationDuration: `${grace}ms` }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { InlineConfirm as Confirm };
export default InlineConfirm;
