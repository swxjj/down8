# Product Context: down8

## Overview
**down8** is a high-performance, desktop-grade web media downloader engineered for fast, clean, and unthrottled media extraction from major social platforms (YouTube, Instagram, X/Twitter, and Facebook). Unlike ad-riddled, spammy online downloaders, down8 delivers a crisp, distraction-free utility with real-time transfer telemetry and in-browser previewing.

## Platform
web

## Target Audience & Situations
- **Content Creators & Editors**: Archiving reference footage, extracting audio tracks (HQ MP3 / M4A) for podcasts or video production.
- **Researchers & Journalists**: Archiving social media posts, threads, and multi-photo/video carousels before they are deleted or altered.
- **Everyday Consumers**: Saving high-resolution videos (4K/1080p) and reels for offline viewing without malware, deceptive popups, or tracking.

## Core Capabilities & Mechanisms
1. **Multi-Platform Ingestion**: Instant URL inspection for YouTube (videos, shorts), Instagram (reels, posts, carousels), X/Twitter (videos, multi-image tweets, GIFs), and Facebook (Watch, reels, `fb.watch`).
2. **Multi-Format Extraction**:
   - **Video**: Intelligent stream muxing with local FFmpeg (4K UHD, 1080p FHD, 720p HD, 480p SD).
   - **Audio**: Universal MP3 (320kbps CBR) with ID3 tags + Fast M4A (native AAC stream without re-encoding).
3. **Carousel & Album Packaging**: Interactive multi-item carousel viewer allowing single slide downloads or a one-click **"Download All as ZIP"** bundle.
4. **Real-Time Telemetry**: Server-Sent Events (SSE) combined with continuous polling fallback streaming live transfer speed (MB/s), ETA countdown, and FFmpeg muxing stages.
5. **Instant In-Browser Delivery**: Automatic browser file save dialog trigger on completion, paired with an inline media preview modal supporting HTTP Range scrubbing.

## Durable Constraints & Principles
- **No Deceptive Dark Patterns**: Zero ads, zero fake download buttons, zero redirects.
- **Public-Only Extraction**: Employs mobile client spoofing and anti-bot headers; avoids credential storage.
- **Security & System Safety**: Strict SSRF guard against loopback and cloud metadata endpoints; Windows-safe filename sanitization; ephemeral download directory with automatic 30-minute garbage collection.
- **Craft Over AI Slop**: High information density, authentic brand assets, tactile mechanical states, monospace data readouts, and purposeful contrast over generic purple neon glows and muddy gradients.

## Stack
- **Backend**: Python 3.11+, FastAPI, yt-dlp, FFmpeg, sse-starlette, Pydantic v2.
- **Frontend**: React 18/19, Vite, Tailwind CSS v3/v4, Lucide React, Canvas Confetti.
