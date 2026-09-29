import asyncio
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import (
    detect_platform,
    is_safe_url,
    is_supported_media_url,
    sanitize_filename,
)
from app.main import app
from app.models.schemas import FormatOption, MediaInfo, TaskStatus
from app.services.task_manager import task_manager


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_config():
    assert settings.PORT == 8000
    assert settings.FILE_TTL_MINUTES == 30
    assert settings.MAX_CONCURRENT_DOWNLOADS == 5
    assert Path(settings.DOWNLOAD_DIR).exists()


def test_security_ssrf():
    # Blocked local and private IPs
    assert is_safe_url("http://localhost:8000") is False
    assert is_safe_url("http://127.0.0.1:8000") is False
    assert is_safe_url("http://10.0.0.1") is False
    assert is_safe_url("http://172.16.0.1") is False
    assert is_safe_url("http://192.168.1.1") is False
    assert is_safe_url("http://169.254.169.254/latest/meta-data") is False
    assert is_safe_url("file:///etc/passwd") is False
    assert is_safe_url("ftp://127.0.0.1") is False
    assert is_safe_url("") is False

    # Allowed public domains
    assert is_safe_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ") is True
    assert is_safe_url("https://www.instagram.com/reel/C123456/") is True


def test_security_platform_detection():
    # YouTube
    yt_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert detect_platform(yt_url) == "youtube"
    assert is_supported_media_url(yt_url) is True

    yt_short = "https://youtube.com/shorts/abcdef12345"
    assert detect_platform(yt_short) == "youtube"

    yt_shortened = "https://youtu.be/dQw4w9WgXcQ"
    assert detect_platform(yt_shortened) == "youtube"

    # Instagram
    ig_url = "https://www.instagram.com/p/ABC123xyz/"
    assert detect_platform(ig_url) == "instagram"
    assert is_supported_media_url(ig_url) is True

    ig_reel = "https://instagram.com/reel/C123456789"
    assert detect_platform(ig_reel) == "instagram"

    # Twitter / X
    tw_url = "https://twitter.com/user/status/1234567890123456789"
    assert detect_platform(tw_url) == "twitter"
    assert is_supported_media_url(tw_url) is True

    x_url = "https://x.com/user/status/1234567890123456789"
    assert detect_platform(x_url) == "twitter"

    # Facebook
    fb_url = "https://www.facebook.com/watch/?v=123456789"
    assert detect_platform(fb_url) == "facebook"
    assert is_supported_media_url(fb_url) is True

    # Unsupported
    assert detect_platform("https://example.com/test") is None
    assert is_supported_media_url("https://example.com/test") is False


def test_filename_sanitization():
    # Illegal chars: <>:"/\|?*
    assert sanitize_filename('video<1>:test"name/with\\slash|pipe?question*star.mp4') == "video_1__test_name_with_slash_pipe_question_star.mp4"
    # Windows reserved name CON, NUL
    assert sanitize_filename("CON.mp4") == "_CON.mp4"
    assert sanitize_filename("aux.mp3") == "_aux.mp3"
    # Trailing dots/spaces
    assert sanitize_filename("  test video...  ") == "test video"
    # Empty string fallback
    assert sanitize_filename("") == "media"


def test_schemas():
    fmt = FormatOption(
        format_id="137",
        resolution="1080p",
        height=1080,
        ext="mp4",
        filesize_estimate=1048576,
        type="video",
    )
    assert fmt.resolution == "1080p"
    assert fmt.has_audio is True

    info = MediaInfo(
        id="video123",
        url="https://youtube.com/watch?v=123",
        platform="youtube",
        title="Test Title",
        formats=[fmt],
    )
    assert info.title == "Test Title"
    assert len(info.formats) == 1

    status = TaskStatus(
        task_id="abc-123",
        status="downloading",
        percent=45.5,
    )
    assert status.status == "downloading"
    assert status.percent == 45.5


@pytest.mark.anyio
async def test_task_manager():
    task_id = await task_manager.create_task()
    assert task_id in task_manager.get_all_task_ids()

    task = task_manager.get_task(task_id)
    assert task is not None
    assert task.status == "queued"

    await task_manager.update_task(task_id, status="downloading", percent=50.0)
    task = task_manager.get_task(task_id)
    assert task.status == "downloading"
    assert task.percent == 50.0

    await task_manager.fail_task(task_id, "Test error")
    task = task_manager.get_task(task_id)
    assert task.status == "failed"
    assert task.error == "Test error"


def test_api_health(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "uptime_seconds" in data
    assert "ffmpeg_available" in data
    assert data["version"] == settings.VERSION


def test_api_info_security_rejections(client: TestClient):
    # SSRF rejection
    response = client.post("/api/info", json={"url": "http://127.0.0.1:8000"})
    assert response.status_code == 400
    assert "SSRF" in response.json()["detail"]

    # Unsupported domain
    response = client.post("/api/info", json={"url": "https://example.com/not-media"})
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"].lower()


def test_api_tasks_not_found(client: TestClient):
    response = client.get("/api/tasks/non-existent-uuid")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_api_download_file_with_unicode_filename(client: TestClient, tmp_path):
    # Create a mock completed task with unicode / emoji filename
    dummy_file = tmp_path / "test_emoji_video.mp4"
    dummy_file.write_bytes(b"dummy mp4 content bytes")

    task_id = await task_manager.create_task()
    await task_manager.update_task(
        task_id,
        status="completed",
        file_path=dummy_file,
        filename="🔴 ESTO ES UNA LOCURA (100% Gratis).mp4",
        percent=100.0,
    )

    resp = client.get(f"/api/tasks/{task_id}/file")
    assert resp.status_code == 200
    assert resp.content == b"dummy mp4 content bytes"
    assert "attachment" in resp.headers["content-disposition"]
