import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* ══ Label input ══════════════════════════════════════════
   A field whose label is its placeholder until you are in it.
   On focus the label lifts into the top edge with a small hop
   running along its letters, the outline darkens in place, and
   the top line parts under the label from its middle outward.

   ── ONE THING MOVES ─────────────────────────────────────
   It used to DRAW its outline out of the notch, both ways
   round the field — and that was the field performing, which
   is too much for a thing you focus forty times a day. Now the
   outline is always whole; focus only changes its ink and
   opens the gap. The label is the event, and the line makes
   room for it.

   The gap is two short paths across the notch, each from the
   middle to one side, retracted from the middle outward by a
   negative dash offset. */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const H = 52;
/* the lifted label's size, against its resting one */
const S = 0.78;
/* the stroke sits half a stroke inside the box so none of it
   is clipped by the svg's own edge */
const IN = 0.75;

export function LabelInput({
  field = "paste link",
  /* the field's corner, px — at half the height it is a pill */
  corner = 14,
  width = 420,
  value,
  onChange,
  onKeyDown,
  onPaste,
  placeholder,
  autoFocus = false,
}) {
  const W = width;
  const r = clamp(corner, 0, H / 2);
  const secret = field === "Password";
  const label = secret ? "Password" : (field || "paste link");
  const id = `lbi-${useId().replace(/:/g, "")}`;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(value ?? "");
  const currentValue = isControlled ? (value ?? "") : internalValue;

  const [focus, setFocus] = useState(false);
  const [show, setShow] = useState(false);
  const [flip, setFlip] = useState(0);
  const input = useRef(null);

  /* the notch is the label's own width, so it is measured.
     Default to 84px for "paste link" to guarantee the notch opens
     wide enough even before webfonts calculate their bounding box */
  const lab = useRef(null);
  const [lw, setLw] = useState(84);

  useLayoutEffect(() => {
    const measure = () => {
      if (lab.current) {
        const measured = lab.current.offsetWidth || lab.current.getBoundingClientRect().width;
        if (measured > 0) {
          setLw(Math.max(measured, 80));
        }
      }
    };
    measure();
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
  }, [label]);

  /* a different kind of field starts empty — an email left in
     a password box would be shown in the clear */
  const [prevField, setPrevField] = useState(field);
  if (prevField !== field) {
    setPrevField(field);
    if (!isControlled) {
      setInternalValue("");
    }
    setShow(false);
  }

  const up = focus || (currentValue && currentValue.length > 0);

  /* ── where the label sits, and the gap it leaves ─────────
     Never inside the corner's curve: the notch has to open on
     the straight part of the top edge, so a rounder field
     starts its label further in. Add generous margin so the line
     never intersects the phrase. */
  const lx = Math.max(20, r + 6);
  const x0 = Math.max(r, lx - 4);
  const x1 = lx + lw * S + 12;
  const a = r - IN;
  const R = W - IN;
  const B = H - IN;
  const mid = W / 2;

  /* the gap, as two halves from its middle to each side */
  const nm = (x0 + x1) / 2;
  const gapL = `M${nm},${IN} L${x0},${IN}`;
  const gapR = `M${nm},${IN} L${x1},${IN}`;

  /* right: from the notch, clockwise, to the bottom middle */
  const right = r > 0
    ? `M${x1},${IN} L${W - r},${IN} A${a},${a} 0 0 1 ${R},${r} L${R},${H - r} A${a},${a} 0 0 1 ${W - r},${B} L${mid},${B}`
    : `M${x1},${IN} L${R},${IN} L${R},${B} L${mid},${B}`;

  /* left: from the notch, counter-clockwise to the corner arc and down to bottom middle */
  const left = r > 0
    ? `M${x0},${IN} L${r},${IN} A${a},${a} 0 0 0 ${IN},${r} L${IN},${H - r} A${a},${a} 0 0 0 ${r},${B} L${mid},${B}`
    : `M${x0},${IN} L${IN},${IN} L${IN},${B} L${mid},${B}`;

  const reveal = () => {
    setShow((s) => !s);
    setFlip((f) => f + 1);
  };

  const handleChange = (e) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div
      className="lbi"
      data-up={up}
      data-focus={focus}
      data-filled={currentValue.length > 0}
    >
      <div
        className="lbi-box transition-colors border-black/10 dark:border-white/15 focus-within:border-black/25 dark:focus-within:border-white/30"
        style={{ width: W, height: H, borderRadius: r, "--lbi-x": `${lx}px` }}
      >
        <svg className="lbi-ring" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <path d={right} />
          <path d={left} />
          <path className="lbi-gap" d={gapL} pathLength={1} />
          <path className="lbi-gap" d={gapR} pathLength={1} />
        </svg>

        <label
          className={`lbi-label transition-all ${
            up
              ? "bg-zinc-200/80 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 font-mono text-[11px]"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
          htmlFor={id}
          ref={lab}
        >
          {[...label].map((ch, i) => (
            <span key={i} style={{ "--i": i }}>{ch}</span>
          ))}
        </label>

        <input
          ref={input}
          id={id}
          className="lbi-field text-zinc-900 placeholder:text-zinc-500 dark:text-white dark:placeholder:text-zinc-500"
          data-flip={flip % 2}
          type={secret && !show ? "password" : secret ? "text" : field === "Email" ? "email" : "text"}
          value={currentValue}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={up ? placeholder : undefined}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          style={{ paddingRight: secret ? 48 : lx }}
        />

        {secret && (
          <button
            className="lbi-eye"
            type="button"
            data-show={show}
            /* keep focus in the field: the eye is a toggle on
               what you are typing, not somewhere to go */
            onPointerDown={(e) => e.preventDefault()}
            onClick={reveal}
            aria-label={show ? "Hide password" : "Show password"}
          >
            <Eye size={16} strokeWidth={2} aria-hidden="true" />
            <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export default LabelInput;
