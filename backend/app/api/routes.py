import asyncio
import json
import mimetypes
import shutil
import time
from typing import AsyncIterator
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse

from app.core.config import settings
from app.core.security import is_safe_url, is_supported_media_url
from app.models.schemas import (
    DownloadInitResponse,
    DownloadRequest,
    HealthResponse,
    MediaInfo,
    TaskStatus,
    UrlRequest,
    ZipDownloadRequest,
)
from app.services.downloader import download_media
from app.services.extractor import extract_media_info
from app.services.task_manager import task_manager
from app.services.zip_service import create_zip_archive

router = APIRouter(prefix="/api", tags=["Media Downloader"])
START_TIME = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint providing status, uptime, and ffmpeg availability."""
    ffmpeg_found = shutil.which("ffmpeg") is not None
    uptime = round(time.time() - START_TIME, 2)
    return HealthResponse(
        status="ok",
        uptime_seconds=uptime,
        ffmpeg_available=ffmpeg_found,
        version=settings.VERSION,
    )


@router.post("/info", response_model=MediaInfo)
async def get_info(request: UrlRequest):
    """Inspect and extract metadata, formats, and carousel items from a supported media URL."""
    url = request.url.strip()

    if not is_safe_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is rejected due to security/SSRF policies (private IP or invalid scheme).",
        )

    if not is_supported_media_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is not supported. Supported platforms: YouTube, Instagram, X (Twitter), Facebook.",
        )

    try:
        return await extract_media_info(url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract media information: {str(e)}",
        )


@router.post("/download", response_model=DownloadInitResponse)
async def start_download(request: DownloadRequest):
    """Start asynchronous media download task."""
    url = request.url.strip()

    if not is_safe_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is rejected due to security/SSRF policies.",
        )

    if not is_supported_media_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is not supported.",
        )

    task_id = await task_manager.create_task()
    asyncio.create_task(download_media(task_id, request))

    return DownloadInitResponse(
        task_id=task_id,
        stream_url=f"/api/tasks/{task_id}/events",
        status_url=f"/api/tasks/{task_id}",
    )


@router.post("/download-zip", response_model=DownloadInitResponse)
async def start_download_zip(request: ZipDownloadRequest):
    """Start asynchronous ZIP bundling task for multi-item posts or carousels."""
    url = request.url.strip()

    if not is_safe_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is rejected due to security/SSRF policies.",
        )

    if not is_supported_media_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is not supported.",
        )

    task_id = await task_manager.create_task()
    asyncio.create_task(create_zip_archive(task_id, request))

    return DownloadInitResponse(
        task_id=task_id,
        stream_url=f"/api/tasks/{task_id}/events",
        status_url=f"/api/tasks/{task_id}",
    )


@router.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """Retrieve current task execution status."""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found.",
        )
    return task


@router.get("/tasks/{task_id}/events")
async def get_task_events(task_id: str, request: Request):
    """Server-Sent Events (SSE) endpoint streaming real-time download and packaging progress."""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found.",
        )

    async def event_generator() -> AsyncIterator[dict]:
        async for update in task_manager.subscribe(task_id):
            if await request.is_disconnected():
                break
            if "progress" not in update:
                update["progress"] = update.get("percent", 0.0)
            yield {
                "event": "message",
                "data": json.dumps(update),
            }

    return EventSourceResponse(event_generator())


@router.get("/tasks/{task_id}/file")
async def download_file(task_id: str):
    """Download the completed media file as an attachment."""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found.",
        )

    if task.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is in status '{task.status}', file not ready yet.",
        )

    file_path = task_manager.get_task_file(task_id)
    if not file_path or not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server disk.",
        )

    mime_type, _ = mimetypes.guess_type(file_path.name)
    mime_type = mime_type or "application/octet-stream"

    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        filename=task.filename or file_path.name,
        headers={"Content-Disposition": f'attachment; filename="{task.filename or file_path.name}"'},
    )


@router.get("/tasks/{task_id}/preview")
async def preview_media(task_id: str):
    """Stream media file inline for in-browser playback (supports HTTP Range headers)."""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found.",
        )

    if task.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is not yet completed (current status: {task.status}).",
        )

    file_path = task_manager.get_task_file(task_id)
    if not file_path or not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file does not exist on disk.",
        )

    mime_type, _ = mimetypes.guess_type(file_path.name)
    mime_type = mime_type or "video/mp4"

    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        headers={"Content-Disposition": f'inline; filename="{task.filename or file_path.name}"'},
    )
