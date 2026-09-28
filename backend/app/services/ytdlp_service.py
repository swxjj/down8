"""
yt-dlp Core Service unifying platform extractors, progress tracking,
FFmpeg post-processing, and secure disk persistence.
"""

import asyncio
import logging
from pathlib import Path
import re
from typing import Any, Callable, Dict, Optional
import yt_dlp
from yt_dlp.utils import DownloadError

from app.core.config import settings
from app.core.security import is_safe_url, sanitize_filename
from app.models.schemas import DownloadRequest, MediaInfo
from app.services.extractors import (
    BaseMediaError,
    classify_ytdlp_error,
    get_extractor,
)

logger = logging.getLogger(__name__)


def _format_speed(speed_bytes_sec: Optional[float]) -> Optional[str]:
    """Format download speed into MB/s or KB/s."""
    if speed_bytes_sec is None or speed_bytes_sec <= 0:
        return None
    if speed_bytes_sec >= 1024.0 * 1024.0:
        mb = speed_bytes_sec / (1024.0 * 1024.0)
        return f"{mb:.1f} MB/s"
    kb = speed_bytes_sec / 1024.0
    return f"{kb:.1f} KB/s"


def _format_eta(seconds: Optional[int | float]) -> Optional[str]:
    """Format ETA in MM:SS or HH:MM:SS."""
    if seconds is None or seconds < 0:
        return None
    total_sec = int(round(seconds))
    hrs = total_sec // 3600
    mins = (total_sec % 3600) // 60
    secs = total_sec % 60
    if hrs > 0:
        return f"{hrs:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"


class YtDlpService:
    """
    Central orchestration service for platform media extraction and download.
    Dispatches to specialized extractors and manages yt-dlp execution lifecycle.
    """

    def extract_info(self, url: str) -> MediaInfo:
        """
        Synchronous extraction entrypoint.
        Dispatches to the appropriate platform extractor and maps to MediaInfo.
        """
        clean_url = url.strip()
        if not is_safe_url(clean_url):
            raise BaseMediaError("URL rejected: Private IP, loopback, or invalid protocol scheme.")

        extractor = get_extractor(clean_url)
        try:
            return extractor.extract_info(clean_url)
        except Exception as e:
            classified = classify_ytdlp_error(e)
            logger.error(f"Extraction failed for {clean_url}: {classified.message}")
            raise classified from e

    async def extract_info_async(self, url: str) -> MediaInfo:
        """Asynchronous extraction wrapper running in threadpool."""
        return await asyncio.to_thread(self.extract_info, url)

    def download_media(
        self,
        task_id: str,
        request: DownloadRequest,
        progress_callback: Optional[Callable[[Dict[str, Any]], Any]] = None,
        event_loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> Path:
        """
        Execute media download with progress reporting, FFmpeg post-processing,
        and sanitized disk storage in downloads/{task_id}/{sanitized_title}.{ext}.
        """
        clean_url = request.url.strip()
        if not is_safe_url(clean_url):
            raise BaseMediaError("Download URL rejected: Private IP or invalid protocol.")

        # Ensure task directory exists
        task_dir = settings.DOWNLOAD_DIR / task_id
        task_dir.mkdir(parents=True, exist_ok=True)

        extractor = get_extractor(clean_url)

        # Output template: downloads/{task_id}/%(title).120B.%(ext)s
        out_tmpl = str(task_dir / "%(title).120B.%(ext)s")
        ydl_opts = extractor.get_download_opts(request, out_tmpl)

        def dispatch_progress(payload: Dict[str, Any]):
            """Safely invokes progress callback across sync or async callers."""
            if not progress_callback:
                return

            if asyncio.iscoroutinefunction(progress_callback):
                if event_loop and event_loop.is_running():
                    asyncio.run_coroutine_threadsafe(progress_callback(payload), event_loop)
            else:
                try:
                    progress_callback(payload)
                except Exception as cb_err:
                    logger.debug(f"Progress callback exception: {cb_err}")

        def progress_hook(d: Dict[str, Any]):
            status = d.get("status")
            if status == "downloading":
                downloaded = d.get("downloaded_bytes", 0)
                total = d.get("total_bytes") or d.get("total_bytes_estimate", 0)
                pct = round((downloaded / total * 100.0), 1) if total else 0.0

                speed_val = d.get("speed")
                speed_str = _format_speed(speed_val) or d.get("_speed_str")
                eta_val = d.get("eta")
                eta_str = _format_eta(eta_val) or d.get("_eta_str")

                raw_filename = d.get("filename")
                clean_name = Path(raw_filename).name if raw_filename else None

                dispatch_progress({
                    "task_id": task_id,
                    "status": "downloading",
                    "percent": pct,
                    "speed": speed_str,
                    "eta": eta_str,
                    "downloaded_bytes": downloaded,
                    "total_bytes": total or downloaded,
                    "filename": clean_name,
                })
            elif status == "finished":
                dispatch_progress({
                    "task_id": task_id,
                    "status": "muxing",
                    "percent": 98.0,
                    "speed": None,
                    "eta": None,
                })

        def postprocessor_hook(d: Dict[str, Any]):
            # Emits "muxing" state when FFmpeg post-processing begins
            status = d.get("status")
            if status in ("started", "processing"):
                dispatch_progress({
                    "task_id": task_id,
                    "status": "muxing",
                    "percent": 98.0,
                    "speed": None,
                    "eta": None,
                })

        ydl_opts.setdefault("progress_hooks", []).append(progress_hook)
        ydl_opts.setdefault("postprocessor_hooks", []).append(postprocessor_hook)

        # Run yt-dlp download
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                exit_code = ydl.download([clean_url])
                if exit_code != 0:
                    raise BaseMediaError(f"yt-dlp download failed with exit code {exit_code}")
        except Exception as e:
            classified = classify_ytdlp_error(e)
            logger.error(f"Download failed for task {task_id}: {classified.message}")
            raise classified from e

        # Locate completed file on disk
        candidates = [
            f for f in task_dir.iterdir()
            if f.is_file() and not f.name.endswith(".part") and not f.name.endswith(".ytdl")
        ]
        if not candidates:
            raise BaseMediaError("Download finished but output file not found on disk.")

        # Choose the primary resulting media file
        target_file = max(candidates, key=lambda f: f.stat().st_size)

        # Clean and sanitize filename on disk for OS safety
        sanitized_name = sanitize_filename(target_file.name)
        if sanitized_name != target_file.name:
            sanitized_path = target_file.parent / sanitized_name
            target_file.rename(sanitized_path)
            target_file = sanitized_path

        final_size = target_file.stat().st_size

        # Emit completion update
        dispatch_progress({
            "task_id": task_id,
            "status": "completed",
            "percent": 100.0,
            "filename": target_file.name,
            "file_size": final_size,
            "filepath": str(target_file),
            "speed": None,
            "eta": None,
        })

        return target_file

    async def download_media_async(
        self,
        task_id: str,
        request: DownloadRequest,
        progress_callback: Optional[Callable[[Dict[str, Any]], Any]] = None,
    ) -> Path:
        """Asynchronous download orchestrator passing running loop to hooks."""
        loop = asyncio.get_running_loop()
        return await asyncio.to_thread(
            self.download_media,
            task_id,
            request,
            progress_callback,
            loop,
        )


# Singleton instance
ytdlp_service = YtDlpService()
