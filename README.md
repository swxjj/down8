# down8 - Global Media Downloader

High-performance, modern media downloader for **YouTube**, **Instagram**, **X (Twitter)**, and **Facebook**, built with **Python FastAPI + yt-dlp** and **React + Tailwind CSS**.

---

## 🌟 Key Features

- **Multi-Platform Support**:
  - **YouTube**: Standard videos, Shorts, Playlists, 4K/2K/1080p/720p/480p streams, and audio-only extraction.
  - **Instagram**: Reels, Single Posts, Multi-item Carousels (photos + videos) with "Download All as ZIP".
  - **X (Twitter)**: Single and multi-media tweets, high-bitrate video streams, and animated GIFs (converted to MP4).
  - **Facebook**: Public Watch videos, Reels, and mobile share links (`fb.watch`).
- **Flexible Audio Extraction**:
  - **Universal MP3 (320kbps CBR)** for maximum hardware and player compatibility.
  - **Fast M4A** direct stream extraction without transcoding.
- **Real-Time Progress & Streaming**:
  - Server-Sent Events (SSE) stream download percentage, transfer speed (MB/s), and ETA countdown.
  - Distinct progress states: Queued, Downloading Chunks, Muxing with FFmpeg, Packaging ZIP, and Ready.
- **In-Browser Experience**:
  - Auto-triggers native browser download save dialog upon completion.
  - Instant "Preview in Browser" lightbox video/audio player modal with HTTP Range support.
  - Local session history drawer to easily re-access previous downloads.
- **Security & Storage Protection**:
  - Built-in SSRF protection blocking private IPs, cloud metadata endpoints, and invalid protocols.
  - Windows-safe filename sanitization (stripping illegal chars and reserved device names like `CON`, `NUL`).
  - Automatic background cleanup daemon purging temporary download folders older than 30 minutes.

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** (with FFmpeg in PATH)
- **Node.js 18+** & **npm**

### 1. Launch Everything (Windows)

You can run both backend and frontend concurrently:

```powershell
.\start.ps1
```

Or using the standard commands:

#### Backend
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python run.py
```
> API will run at `http://localhost:8000` (Docs at `http://localhost:8000/docs`).

#### Frontend
```powershell
cd frontend
npm run dev
```
> Web UI will be accessible at `http://localhost:5173`.

---

## 🌐 Deploying to Vercel

The frontend is ready for 1-click deployment on **Vercel**:

1. Import the repository in [Vercel](https://vercel.com/new).
2. Configure **Environment Variables** in Vercel project settings:
   - `VITE_API_BASE_URL`: The public HTTPS URL of your running backend (e.g. deployed on Railway, Render, Fly.io, or VPS).
3. Click **Deploy**. Vercel will build the frontend using `vercel.json` (`cd frontend && npm install && npm run build` -> `frontend/dist`).

> **Note:** If you set the Vercel **Root Directory** to `frontend`, Vercel will automatically detect Vite and deploy cleanly using `frontend/vercel.json`.

---

## 🧪 Testing & Verification

Run the full automated test suite (37 unit, platform extractor, and E2E integration tests):

```powershell
cd backend
.\.venv\Scripts\python -m pytest tests
```

---

## 🏗 Architecture

```
d:/mateo/downloader/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py            # API endpoints (/info, /download, /tasks, /preview)
│   │   ├── core/
│   │   │   ├── config.py            # App settings, TTL, directories
│   │   │   └── security.py          # SSRF prevention, URL validation, filename sanitizer
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic v2 schemas
│   │   ├── services/
│   │   │   ├── extractors/          # Platform-specific extractors (YT, IG, X, FB)
│   │   │   ├── ytdlp_service.py     # Unified yt-dlp service
│   │   │   ├── task_manager.py      # Async task state & SSE pub/sub
│   │   │   ├── zip_service.py       # Multi-item carousel ZIP bundler
│   │   │   └── cleaner.py           # Ephemeral file auto-cleanup worker
│   │   └── main.py                  # FastAPI application & CORS
│   ├── tests/
│   │   ├── test_backend.py
│   │   ├── test_extractors.py
│   │   └── test_e2e_integration.py
│   └── run.py                       # Uvicorn server launcher
├── frontend/
│   ├── src/
│   │   ├── components/              # UI components (UrlInput, MediaPreview, Carousel, etc.)
│   │   ├── services/api.js          # API client & SSE event source
│   │   ├── App.jsx                  # Main application container
│   │   └── index.css                # Dark theme styles & Tailwind CSS
│   └── vite.config.js
├── start.ps1                        # PowerShell one-click launcher
└── README.md
```
