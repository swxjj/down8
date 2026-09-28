import asyncio
import logging
import zipfile
from pathlib import Path
from typing import List, Optional
import requests

from app.core.config import settings
from app.core.security import is_safe_url, sanitize_filename
from app.models.schemas import CarouselItem, ZipDownloadRequest
from app.services.extractor import extract_media_info
from app.services.task_manager import task_manager

logger = logging.getLogger(__name__)


def _download_file_sync(url: str, dest_path: Path):
    """Download direct file stream synchronously."""
    if not is_safe_url(url):
        raise ValueError(f"Direct download URL rejected by security policy: {url}")
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }
    with requests.get(url, headers=headers, stream=True, timeout=30) as r:
        r.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=65536):
                if chunk:
                    f.write(chunk)


async def create_zip_archive(task_id: str, request: ZipDownloadRequest):
    """Download carousel media items and bundle them into a zip file."""
    await task_manager.update_task(task_id, status="queued", percent=0.0)

    async with task_manager.semaphore:
        try:
            await task_manager.update_task(task_id, status="downloading", percent=5.0)

            # Extract media info to get carousel items
            media_info = await extract_media_info(request.url)
            items: List[CarouselItem] = media_info.carousel_items

            # If no carousel items were split, treat main media as single item
            if not items:
                items = [
                    CarouselItem(
                        id=media_info.id,
                        media_type="video",
                        url=request.url,
                        thumbnail=media_info.thumbnail,
                        title=media_info.title,
                        ext="mp4",
                    )
                ]

            # Filter selected items if specified
            if request.selected_ids:
                selected_set = set(request.selected_ids)
                items = [it for it in items if it.id in selected_set]

            if not items:
                await task_manager.fail_task(task_id, "No items found to download for ZIP package.")
                return

            task_dir = settings.DOWNLOAD_DIR / task_id
            items_dir = task_dir / "items"
            items_dir.mkdir(parents=True, exist_ok=True)

            total_items = len(items)
            downloaded_files: List[Path] = []

            for idx, item in enumerate(items, start=1):
                raw_name = f"{idx:02d}_{item.title or item.id}.{item.ext or 'bin'}"
                file_name = sanitize_filename(raw_name)
                dest = items_dir / file_name

                # Download item
                try:
                    await asyncio.to_thread(_download_file_sync, item.url, dest)
                    if dest.exists() and dest.stat().st_size > 0:
                        downloaded_files.append(dest)
                except Exception as ex:
                    logger.warning(f"Direct download failed for carousel item {item.id}: {ex}")

                pct = round(5.0 + (idx / total_items) * 75.0, 1)
                await task_manager.update_task(
                    task_id,
                    status="downloading",
                    percent=pct,
                    speed=f"Item {idx}/{total_items}",
                )

            if not downloaded_files:
                await task_manager.fail_task(task_id, "Failed to download any items for the ZIP archive.")
                return

            # Package into ZIP
            await task_manager.update_task(task_id, status="packaging", percent=85.0)

            clean_title = sanitize_filename(media_info.title or "carousel_bundle")
            zip_filename = f"{clean_title}.zip"
            zip_path = task_dir / zip_filename

            def _build_zip():
                with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                    for f in downloaded_files:
                        zipf.write(f, arcname=f.name)

            await asyncio.to_thread(_build_zip)

            zip_size = zip_path.stat().st_size

            await task_manager.update_task(
                task_id,
                file_path=zip_path,
                status="completed",
                percent=100.0,
                filename=zip_filename,
                file_size=zip_size,
                speed=None,
                eta=None,
            )

        except Exception as e:
            logger.error(f"ZIP package task {task_id} failed: {e}", exc_info=True)
            await task_manager.fail_task(task_id, str(e))
