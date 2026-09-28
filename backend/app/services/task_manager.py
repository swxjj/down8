import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator, Dict, Optional, Set
from app.core.config import settings
from app.models.schemas import TaskStatus


class TaskManager:
    def __init__(self):
        self._tasks: Dict[str, TaskStatus] = {}
        self._task_files: Dict[str, Path] = {}
        self._task_created_at: Dict[str, datetime] = {}
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()
        self.semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_DOWNLOADS)

    async def create_task(self, initial_status: str = "queued") -> str:
        """Create a new tracked task and return its task_id."""
        task_id = str(uuid.uuid4())
        async with self._lock:
            status = TaskStatus(
                task_id=task_id,
                status=initial_status,
                percent=0.0,
            )
            self._tasks[task_id] = status
            self._task_created_at[task_id] = datetime.now(timezone.utc)
            self._subscribers[task_id] = set()
        return task_id

    async def update_task(self, task_id: str, file_path: Optional[Path] = None, **kwargs) -> Optional[TaskStatus]:
        """Update task properties and notify SSE subscribers."""
        async with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return None

            data = task.model_dump()
            for key, val in kwargs.items():
                if val is not None:
                    data[key] = val

            # Keep percent and progress synchronized
            if "percent" in kwargs and "progress" not in kwargs:
                data["progress"] = kwargs["percent"]
            elif "progress" in kwargs and "percent" not in kwargs:
                data["percent"] = kwargs["progress"]

            updated_task = TaskStatus(**data)
            self._tasks[task_id] = updated_task

            if file_path:
                self._task_files[task_id] = Path(file_path)

            queues = list(self._subscribers.get(task_id, set()))

        # Broadcast outside the global dictionary lock
        payload = updated_task.model_dump()
        for q in queues:
            await q.put(payload)

        return updated_task

    async def fail_task(self, task_id: str, error: str) -> Optional[TaskStatus]:
        """Mark task as failed with an error message and notify subscribers."""
        return await self.update_task(
            task_id,
            status="failed",
            error=str(error),
        )

    def get_task(self, task_id: str) -> Optional[TaskStatus]:
        """Get current TaskStatus object synchronously."""
        return self._tasks.get(task_id)

    def get_task_file(self, task_id: str) -> Optional[Path]:
        """Get path to the downloaded file if it exists."""
        return self._task_files.get(task_id)

    def get_all_task_ids(self) -> list[str]:
        """Return list of all task IDs."""
        return list(self._tasks.keys())

    def get_task_creation_time(self, task_id: str) -> Optional[datetime]:
        """Get creation timestamp of task."""
        return self._task_created_at.get(task_id)

    def remove_task(self, task_id: str) -> None:
        """Remove task metadata from memory."""
        self._tasks.pop(task_id, None)
        self._task_files.pop(task_id, None)
        self._task_created_at.pop(task_id, None)
        self._subscribers.pop(task_id, None)

    async def subscribe(self, task_id: str) -> AsyncIterator[dict]:
        """Subscribe to task updates yielding SSE data dictionaries."""
        async with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return

            queue: asyncio.Queue = asyncio.Queue()
            self._subscribers.setdefault(task_id, set()).add(queue)
            initial_data = task.model_dump()

        # Emit initial current state immediately
        yield initial_data

        if initial_data.get("status") in ("completed", "failed"):
            async with self._lock:
                self._subscribers.get(task_id, set()).discard(queue)
            return

        try:
            while True:
                data = await queue.get()
                yield data
                if data.get("status") in ("completed", "failed"):
                    break
        finally:
            async with self._lock:
                subs = self._subscribers.get(task_id)
                if subs:
                    subs.discard(queue)


# Singleton task manager instance
task_manager = TaskManager()
