---
name: down8
description: High-performance, desktop-grade web media downloader for social platforms
colors:
  primary: "#ededed"
  primary-hover: "#ffffff"
  accent-sky: "#38bdf8"
  canvas-dark: "#0e0e11"
  paper-dark: "#16161a"
  border-dark: "#27272e"
  border-hover: "#3f3f46"
  ink-light: "#ededed"
  muted-gray: "#a1a1aa"
  subtle-gray: "#71717a"
  teal-deep: "#016a71"
  teal-glow: "#00d1b2"
typography:
  display:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Montserrat, Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas-dark}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  button-ghost:
    backgroundColor: "{colors.paper-dark}"
    textColor: "{colors.muted-gray}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  input-search:
    backgroundColor: "{colors.paper-dark}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card-media:
    backgroundColor: "{colors.paper-dark}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: down8

## Overview

**Creative North Star: "The Precision Archival Instrument"**

down8 is engineered as a high-density, desktop-grade utility that treats media extraction with the mechanical precision of an audio workstation or developer terminal. The aesthetic replaces ad-heavy web downloader clichés with dark tactile surfaces, restrained borders, crisp geometric typography, and monospace telemetry.

Visual hierarchy is anchored by clear state changes: URL input with animated mechanical feedback, clean format configuration cards, real-time download telemetry with live speed and ETA readouts, and instant in-browser delivery.

**Key Characteristics:**
- Dark obsidian and charcoal surfaces (#0e0e11 / #16161a) with subtle perimeter definition (#27272e).
- Dual theme support: Coral Glow for light mode and Dark Arc Bands for dark mode.
- Tactile, mechanical micro-interactions with pill morphing and responsive state changes.
- Monospace readouts (JetBrains Mono) for numerical data, bitrates, file sizes, and speeds.

## Colors

The palette is anchored in deep dark neutrals with stark high-contrast typography and subtle precision accents.

### Primary
- **High-Contrast Ink** (#ededed): Primary textual labels, active icons, and high-emphasis action button surfaces.
- **Pure White Hover** (#ffffff): Interactive button states and focused highlights.

### Secondary
- **Sky Accent** (#38bdf8): Active format selection borders, progress status pulses, and dynamic telemetry indicators.
- **Deep Teal** (#016a71): Brand accent and focused input ring definitions.

### Neutral
- **Obsidian Canvas** (#0e0e11): Deep background foundation.
- **Charcoal Paper** (#16161a): Elevated card surfaces, input containers, and drawer panels.
- **Hairline Border** (#27272e): 1px subtle divider lines and card borders.
- **Muted Graphite** (#a1a1aa): Secondary metadata, timestamps, and inactive controls.
- **Ash Subtle** (#71717a): Tertiary helper copy, empty state labels, and subtle badges.

### Named Rules
**The Rarity Rule.** High-saturation accents (Sky and Teal) are applied to ≤10% of any viewport. The resting surface remains strictly neutral and distraction-free.

## Typography

**Display Font:** Montserrat (fallback: Inter, sans-serif)  
**Body Font:** Montserrat (fallback: Inter, sans-serif)  
**Label/Mono Font:** JetBrains Mono (fallback: Consolas, monospace)  

**Character:** Montserrat provides geometric clarity and authorial confidence without feeling corporate, while JetBrains Mono gives live transfer metrics genuine engineering weight.

### Hierarchy
- **Display** (600, clamp(2rem, 5vw, 3rem), 1.1): Hero title ("download any media from the web").
- **Headline** (500, 1.5rem, 1.25): Modal titles and primary section dividers.
- **Title** (500, 1.125rem, 1.3): Media item card titles and drawer headers.
- **Body** (400, 0.875rem, 1.5): Descriptions, tooltips, and helper copy.
- **Label** (500, 0.75rem, normal): Telemetry metrics (speed, ETA, resolution badges, codecs).

## Layout

A centered single-column workstation layout bounded to `max-w-5xl` (1024px) with responsive horizontal padding (px-4 to px-6). The header aligns flush with the central content grid. Components stack vertically with consistent 24px (`space-y-6`) and 32px rhythms.

## Elevation & Depth

Surfaces rely primarily on tonal layering rather than heavy drop shadows. Depth is established through 1px border contrast (`#27272e`), backdrop blurs (`backdrop-blur-md`), and subtle inner highlights.

### Shadow Vocabulary
- **Paper Surface** (`box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 1px #27272e`): Resting cards and containers.
- **Focus Glow** (`box-shadow: 0 0 0 1.5px #016a71, 0 2px 12px -2px rgba(1, 106, 113, 0.25)`): Active search/URL input bar.

## Shapes

- **Base Radius:** 16px (`rounded-2xl` or `rounded-[16px]`) for primary surface cards and media preview containers.
- **Input Radius:** 12px-14px for inputs and field wrappers.
- **Pill Radius:** 9999px (`rounded-full`) for format switchers, action buttons, and status badges.
- **Ghost Button Radius:** 6px-8px (`rounded-md` / `rounded-lg`) for secondary toolbar actions.

## Components

### Buttons
- **Primary Pill Action:** Full white/light `#ededed` pill, `#0e0e11` text, 9999px radius, padding 10px 24px. Active scale down (0.96).
- **Tactile Confirm Button (Amicro / Bencho):** Morphing pill with transition between idle ("Paste" / "Load") and done states.
- **Ghost Action:** Charcoal `#1c1c22` surface, border `#27272e`, muted `#a1a1aa` text with hover transition to `#ededed`.

### Inputs
- **URL Search Bar:** Frosted `#16161a` or backdrop blur with external label, inner action triggers, and glowing focus ring.

### Cards
- **Media Preview:** Thumbnail container with duration badge, metadata rows, and integrated format pill switcher.

## Do's and Don'ts

### Do:
- **Do** preserve monospace numbers (`font-mono tabular-nums`) for speeds, percentages, ETAs, and bitrates.
- **Do** maintain 1px hairline borders (`#27272e`) between dark surfaces to preserve contrast.
- **Do** provide immediate tactile feedback on user input and copy actions.

### Don't:
- **Don't** add generic gradients, oversaturated purple/cyan glows, or decorative floating blobs.
- **Don't** introduce multi-second layout shifts when media metadata is loaded.
- **Don't** hide format resolution details, file size estimations, or codec information from power users.
