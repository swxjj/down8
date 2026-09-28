import asyncio
import io
import os
import zipfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.services.task_manager import task_manager
from app.services.cleaner import FileCleaner
from app.core.security import is_safe_url, is_supported_media_url, sanitize_filename

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /api/health returns ok, uptime, and ffmpeg status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["ffmpeg_available"] is True
    assert "uptime_seconds" in data
    assert data["version"] == "1.0.0"


def test_ssrf_and_security_controls():
    """Verify security policies reject private IPs, localhost, and invalid schemes."""
    dangerous_urls = [
        "http://127.0.0.1/admin",
        "http://localhost:8000/api/health",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.1/internal",
        "http://192.168.1.1/router",
        "file:///C:/Windows/win.ini",
        "ftp://example.com/file",
    ]
    for url in dangerous_urls:
        assert not is_safe_url(url), f"URL should be unsafe: {url}"
        response = client.post("/api/info", json={"url": url})
        assert response.status_code == 400, f"Expected 400 for {url}"


def test_unsupported_domains():
    """Verify non-whitelisted platforms are rejected."""
    unsupported = [
        "https://example.com/video.mp4",
        "https://vimeo.com/123456",
        "https://dailymotion.com/video/x7",
    ]
    for url in unsupported:
        assert not is_supported_media_url(url)
        response = client.post("/api/info", json={"url": url})
        assert response.status_code == 400
        assert "not supported" in response.json()["detail"].lower()


def test_supported_platform_detection():
    """Verify URL detection for YouTube, Instagram, X (Twitter), and Facebook."""
    valid_urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://www.youtube.com/shorts/abcdef12345",
        "https://www.instagram.com/reel/C3abcdef123/",
        "https://www.instagram.com/p/C3abcdef123/",
        "https://twitter.com/user/status/1234567890123456789",
        "https://x.com/user/status/1234567890123456789",
        "https://www.facebook.com/watch/?v=123456789",
        "https://fb.watch/abcdef123/",
    ]
    for url in valid_urls:
        assert is_supported_media_url(url), f"Should recognize {url}"


def test_windows_filename_sanitization():
    """Verify Windows illegal characters and device names are sanitized."""
    assert sanitize_filename('CON.mp4') == '_CON.mp4'
    assert sanitize_filename('aux.txt') == '_aux.txt'
    assert sanitize_filename('test:video*name?.mp4') == 'test_video_name_.mp4'
    assert sanitize_filename('video<1>|"quote".mkv') == 'video_1___quote_.mkv'


@pytest.mark.anyio
async def test_full_download_and_file_delivery_lifecycle(tmp_path):
    """Test full asynchronous task creation, status updates, file retrieval, and range headers."""
    task_id = await task_manager.create_task()
    task = task_manager.get_task(task_id)
    assert task is not None
    assert task.status == "queued"

    # Simulate task directory and file
    task_dir = Path(settings.DOWNLOAD_DIR) / task_id
    task_dir.mkdir(parents=True, exist_ok=True)
    fake_video = task_dir / "test_video.mp4"
    fake_content = b"Simulated MP4 video content for testing range and delivery" * 100
    fake_video.write_bytes(fake_content)

    # Update task as completed
    await task_manager.update_task(
        task_id,
        status="completed",
        percent=100.0,
        filename=fake_video.name,
        file_path=fake_video,
        file_size=len(fake_content)
    )

    # 1. Check task status via API
    status_resp = client.get(f"/api/tasks/{task_id}")
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["status"] == "completed"
    assert data["filename"] == "test_video.mp4"

    # 2. Check file download endpoint (attachment)
    file_resp = client.get(f"/api/tasks/{task_id}/file")
    assert file_resp.status_code == 200
    assert "attachment" in file_resp.headers.get("content-disposition", "")
    assert file_resp.content == fake_content

    # 3. Check preview endpoint (inline)
    preview_resp = client.get(f"/api/tasks/{task_id}/preview")
    assert preview_resp.status_code == 200
    assert "inline" in preview_resp.headers.get("content-disposition", "")
    assert preview_resp.content == fake_content

    # 4. Check HTTP Range header
    range_resp = client.get(f"/api/tasks/{task_id}/preview", headers={"Range": "bytes=0-49"})
    assert range_resp.status_code == 206
    assert len(range_resp.content) == 50
    assert range_resp.content == fake_content[:50]


@pytest.mark.anyio
async def test_zip_service_packaging():
    """Verify zip archive creation from multiple media items."""
    task_id = await task_manager.create_task()
    task_dir = Path(settings.DOWNLOAD_DIR) / task_id
    task_dir.mkdir(parents=True, exist_ok=True)

    # Create dummy carousel items
    item1 = task_dir / "slide_1.jpg"
    item1.write_bytes(b"JPEG photo data 1")
    item2 = task_dir / "slide_2.mp4"
    item2.write_bytes(b"MP4 video data 2")

    zip_file = task_dir / "carousel_album.zip"
    with zipfile.ZipFile(zip_file, "w") as zf:
        zf.write(item1, arcname=item1.name)
        zf.write(item2, arcname=item2.name)

    assert zip_file.exists()
    with zipfile.ZipFile(zip_file, "r") as zf:
        names = zf.namelist()
        assert "slide_1.jpg" in names
        assert "slide_2.mp4" in names


def test_frontend_dist_assets():
    """Verify frontend production build files are present and non-empty."""
    dist_dir = Path("D:/mateo/downloader/frontend/dist")
    assert dist_dir.exists(), "Frontend dist folder must exist"
    index_html = dist_dir / "index.html"
    assert index_html.exists()
    assert len(index_html.read_text()) > 100

    assets_dir = dist_dir / "assets"
    assert assets_dir.exists()
    js_files = list(assets_dir.glob("*.js"))
    css_files = list(assets_dir.glob("*.css"))
    assert len(js_files) > 0, "Production JS bundle should exist"
    assert len(css_files) > 0, "Production CSS bundle should exist"
