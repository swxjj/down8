import asyncio
import logging
import shutil
import time
from datetime import datetime, timezone
from pathlib import Path
from app.core.config import settings
from app.services.task_manager import task_manager

logger = logging.getLogger(__name__)


class FileCleaner:
    def __init__(self, check_interval_seconds: int = 300):
        self.check_interval_seconds = check_interval_seconds
        self._running = False
        self._task: asyncio.Task | None = None

    async def start(self):
        """Start cleaner background task."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("FileCleaner background service started.")

    async def stop(self):
        """Stop cleaner background task."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("FileCleaner background service stopped.")

    async def _run_loop(self):
        while self._running:
            try:
                await asyncio.sleep(self.check_interval_seconds)
                await self.cleanup_expired_files()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error during file cleanup cycle: {e}", exc_info=True)

    async def cleanup_expired_files(self):
        """Clean up directories and tasks older than settings.FILE_TTL_MINUTES."""
        download_dir = Path(settings.DOWNLOAD_DIR)
        if not download_dir.exists():
            return

        ttl_seconds = settings.FILE_TTL_MINUTES * 60
        now_ts = time.time()

        # Run disk cleanup in thread pool
        def scan_and_delete():
            deleted_count = 0
            for item in download_dir.iterdir():
                try:
                    if item.is_dir():
                        mtime = item.stat().st_mtime
                        age = now_ts - mtime
                        if age > ttl_seconds:
                            shutil.rmtree(item, ignore_errors=True)
                            deleted_count += 1
                            logger.info(f"Cleaned expired download folder: {item.name}")
                    elif item.is_file():
                        mtime = item.stat().st_mtime
                        if (now_ts - mtime) > ttl_seconds:
                            item.unlink(missing_ok=True)
                            deleted_count += 1
                except Exception as ex:
                    logger.warning(f"Could not remove {item}: {ex}")
            return deleted_count

        deleted = await asyncio.to_thread(scan_and_delete)
        if deleted > 0:
            logger.info(f"Cleaner removed {deleted} expired items.")

        # Clean in-memory task references
        now_utc = datetime.now(timezone.utc)
        for task_id in task_manager.get_all_task_ids():
            created_at = task_manager.get_task_creation_time(task_id)
            if created_at:
                age_seconds = (now_utc - created_at).total_seconds()
                if age_seconds > ttl_seconds:
                    task_manager.remove_task(task_id)


cleaner = FileCleaner()
