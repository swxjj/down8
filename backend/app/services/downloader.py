"""
Background download execution task integrating with TaskManager and YtDlpService.
"""

import logging
from pathlib import Path
from typing import Any, Dict

from app.models.schemas import DownloadRequest
from app.services.task_manager import task_manager
from app.services.ytdlp_service import ytdlp_service

logger = logging.getLogger(__name__)


async def download_media(task_id: str, request: DownloadRequest):
    """Background task for downloading media using YtDlpService and reporting progress to TaskManager."""
    await task_manager.update_task(task_id, status="queued", percent=0.0)

    async with task_manager.semaphore:
        await task_manager.update_task(task_id, status="downloading", percent=0.0)

        async def progress_listener(payload: Dict[str, Any]):
            status = payload.get("status")
            if status == "downloading":
                speed_text = payload.get("speed") or "Streaming..."
                await task_manager.update_task(
                    task_id,
                    status="downloading",
                    percent=payload.get("percent", 0.0),
                    progress=payload.get("percent", 0.0),
                    speed=speed_text,
                    eta=payload.get("eta") or "Calculating...",
                    filename=payload.get("filename"),
                    file_size=payload.get("total_bytes"),
                )
            elif status == "muxing":
                await task_manager.update_task(
                    task_id,
                    status="muxing",
                    percent=payload.get("percent", 98.0),
                    progress=payload.get("percent", 98.0),
                    speed="Muxing with FFmpeg...",
                    eta="Finishing...",
                )

        try:
            target_file = await ytdlp_service.download_media_async(
                task_id=task_id,
                request=request,
                progress_callback=progress_listener,
            )
            file_size = target_file.stat().st_size
            await task_manager.update_task(
                task_id,
                file_path=target_file,
                status="completed",
                percent=100.0,
                progress=100.0,
                filename=target_file.name,
                file_size=file_size,
                speed="Complete",
                eta="00:00",
            )
        except Exception as e:
            logger.error(f"Download task {task_id} failed: {e}", exc_info=True)
            await task_manager.fail_task(task_id, str(e))
