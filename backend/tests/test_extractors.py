"""
Unit and integration tests for Platform Extractors and YtDlpService.
Tests URL normalization, platform recognition, error classification,
format categorization, size estimation, and download hooks.
"""

from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

from app.core.security import sanitize_filename
from app.models.schemas import DownloadRequest, MediaInfo
from app.services.extractors import (
    BaseMediaError,
    BotChallengeError,
    FacebookExtractor,
    GenericExtractor,
    InstagramExtractor,
    MediaNotFoundError,
    PrivateMediaError,
    RateLimitError,
    TwitterExtractor,
    YouTubeExtractor,
    classify_ytdlp_error,
    get_extractor,
)
from app.services.ytdlp_service import (
    YtDlpService,
    _format_eta,
    _format_speed,
    ytdlp_service,
)


# ===========================================================================
# 1. URL Recognition and Platform Dispatching
# ===========================================================================

def test_platform_recognition_youtube():
    yt = YouTubeExtractor()
    assert yt.can_handle("https://www.youtube.com/watch?v=dQw4w9WgXcQ") is True
    assert yt.can_handle("https://youtu.be/dQw4w9WgXcQ") is True
    assert yt.can_handle("https://youtube.com/shorts/abcdef12345?feature=share") is True
    assert yt.can_handle("https://www.youtube.com/live/abcdef12345") is True
    assert yt.can_handle("https://m.youtube.com/watch?v=dQw4w9WgXcQ") is True
    assert yt.can_handle("https://instagram.com/p/12345") is False


def test_platform_recognition_instagram():
    ig = InstagramExtractor()
    assert ig.can_handle("https://www.instagram.com/p/C1234567890/") is True
    assert ig.can_handle("https://instagram.com/reel/C9876543210/?igsh=abcdef") is True
    assert ig.can_handle("https://www.instagram.com/reels/C9876543210/") is True
    assert ig.can_handle("https://instagr.am/p/ABC123xyz") is True
    assert ig.can_handle("https://youtube.com/watch?v=123") is False


def test_platform_recognition_twitter():
    tw = TwitterExtractor()
    assert tw.can_handle("https://twitter.com/jack/status/20") is True
    assert tw.can_handle("https://x.com/elonmusk/status/1789012345678901234?s=20") is True
    assert tw.can_handle("https://www.x.com/user/status/12345") is True
    assert tw.can_handle("https://facebook.com/watch?v=123") is False


def test_platform_recognition_facebook():
    fb = FacebookExtractor()
    assert fb.can_handle("https://www.facebook.com/watch/?v=123456789") is True
    assert fb.can_handle("https://fb.watch/abcdef123/") is True
    assert fb.can_handle("https://m.facebook.com/reel/1234567890") is True
    assert fb.can_handle("https://web.facebook.com/user/videos/123456789") is True
    assert fb.can_handle("https://twitter.com/user/status/123") is False


def test_get_extractor_dispatcher():
    assert isinstance(get_extractor("https://www.youtube.com/watch?v=abc"), YouTubeExtractor)
    assert isinstance(get_extractor("https://instagram.com/reel/xyz/"), InstagramExtractor)
    assert isinstance(get_extractor("https://x.com/user/status/999"), TwitterExtractor)
    assert isinstance(get_extractor("https://fb.watch/short/"), FacebookExtractor)
    assert isinstance(get_extractor("https://tiktok.com/@user/video/123"), GenericExtractor)


# ===========================================================================
# 2. URL Normalization
# ===========================================================================

def test_youtube_url_normalization():
    yt = YouTubeExtractor()
    # Strips extra parameters
    norm1 = yt.normalize_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share&si=abc")
    assert norm1 == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    # Converts shorts to canonical watch URL
    norm2 = yt.normalize_url("https://youtube.com/shorts/dQw4w9WgXcQ?si=tracking123")
    assert norm2 == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    # Converts youtu.be to canonical watch URL
    norm3 = yt.normalize_url("https://youtu.be/dQw4w9WgXcQ?t=10s")
    assert norm3 == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


def test_instagram_url_normalization():
    ig = InstagramExtractor()
    # Strips tracking parameters
    norm1 = ig.normalize_url("https://www.instagram.com/reel/C123456/?igsh=tracking_token_123&utm_source=ig_web")
    assert norm1 == "https://www.instagram.com/reel/C123456/"

    norm2 = ig.normalize_url("https://www.instagram.com/p/ABC_xyz/?utm_medium=copy_link")
    assert norm2 == "https://www.instagram.com/p/ABC_xyz/"


def test_twitter_url_normalization():
    tw = TwitterExtractor()
    norm = tw.normalize_url("https://twitter.com/SpaceX/status/1234567890123456789?s=20&t=abcdef")
    assert norm == "https://x.com/SpaceX/status/1234567890123456789"


def test_facebook_url_normalization():
    fb = FacebookExtractor()
    url = "https://www.facebook.com/watch/?v=123456789&ref=sharing"
    norm = fb.normalize_url(url)
    assert "facebook.com" in norm


# ===========================================================================
# 3. Error Classification
# ===========================================================================

def test_error_classification():
    # Bot challenge
    err1 = Exception("ERROR: Sign in to confirm you're not a bot. This helps protect our community.")
    classified1 = classify_ytdlp_error(err1)
    assert isinstance(classified1, BotChallengeError)

    # Rate limiting
    err2 = Exception("HTTP Error 429: Too Many Requests")
    classified2 = classify_ytdlp_error(err2)
    assert isinstance(classified2, RateLimitError)

    # Private media
    err3 = Exception("ERROR: This video is private. Sign in if you've been granted access.")
    classified3 = classify_ytdlp_error(err3)
    assert isinstance(classified3, PrivateMediaError)

    # Account is private
    err4 = Exception("This account is private. Please follow the account to view their media.")
    classified4 = classify_ytdlp_error(err4)
    assert isinstance(classified4, PrivateMediaError)

    # Media not found / deleted
    err5 = Exception("ERROR: Video unavailable. This video has been removed by the uploader.")
    classified5 = classify_ytdlp_error(err5)
    assert isinstance(classified5, MediaNotFoundError)

    err6 = Exception("HTTP Error 404: Not Found")
    classified6 = classify_ytdlp_error(err6)
    assert isinstance(classified6, MediaNotFoundError)

    # Generic fallback
    err7 = Exception("Some unexpected socket connection reset")
    classified7 = classify_ytdlp_error(err7)
    assert isinstance(classified7, BaseMediaError)


# ===========================================================================
# 4. Anti-bot Options Presets
# ===========================================================================

def test_youtube_anti_bot_presets():
    yt = YouTubeExtractor()
    opts = yt.get_ytdl_opts("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert opts["quiet"] is True
    assert opts["no_warnings"] is True
    assert opts["geo_bypass"] is True
    assert "extractor_args" in opts
    yt_args = opts["extractor_args"]["youtube"]
    assert "player_client" in yt_args
    # Confirms multi-client fallback for SABR bypass
    assert "ios" in yt_args["player_client"]
    assert "android" in yt_args["player_client"]
    assert "web" in yt_args["player_client"]


def test_instagram_mobile_headers():
    ig = InstagramExtractor()
    opts = ig.get_ytdl_opts("https://www.instagram.com/reel/123/")
    assert "iPhone" in opts["user_agent"]
    assert opts["http_headers"]["Referer"] == "https://www.instagram.com/"


# ===========================================================================
# 5. Format Categorization & Accurate File Size Estimation
# ===========================================================================

def test_youtube_format_categorization_and_sizes():
    yt = YouTubeExtractor()
    raw_info = {
        "id": "test_id",
        "title": "Sample 4K Video",
        "duration": 120.0,
        "thumbnail": "https://img.youtube.com/vi/test_id/maxresdefault.jpg",
        "uploader": "Test Channel",
        "formats": [
            # 4K DASH video
            {"format_id": "313", "vcodec": "vp9", "acodec": "none", "height": 2160, "width": 3840, "filesize": 100_000_000, "tbr": 18000},
            # 1080p DASH video
            {"format_id": "137", "vcodec": "avc1", "acodec": "none", "height": 1080, "width": 1920, "filesize": 25_000_000, "tbr": 4500},
            # 720p DASH video
            {"format_id": "136", "vcodec": "avc1", "acodec": "none", "height": 720, "width": 1280, "filesize": 12_000_000, "tbr": 2200},
            # 480p DASH video
            {"format_id": "135", "vcodec": "avc1", "acodec": "none", "height": 480, "width": 854, "filesize": 6_000_000, "tbr": 1100},
            # Audio stream (AAC 128k)
            {"format_id": "140", "vcodec": "none", "acodec": "mp4a.40.2", "abr": 128.0, "filesize": 2_000_000},
        ],
    }

    with patch.object(yt, "execute_ytdl_extraction", return_value=raw_info):
        media_info = yt.extract_info("https://www.youtube.com/watch?v=test_id")

    assert media_info.platform == "youtube"
    assert media_info.id == "test_id"
    assert media_info.duration == 120.0
    assert media_info.duration_string == "02:00"

    format_ids = [f.format_id for f in media_info.formats]
    # Check that standard tiers are populated
    assert "2160p" in format_ids
    assert "1080p" in format_ids
    assert "720p" in format_ids
    assert "480p" in format_ids
    assert "mp3-320" in format_ids
    assert "m4a" in format_ids

    # Verify 4K combined file size (100MB video + 2MB audio = 102MB)
    fmt_4k = next(f for f in media_info.formats if f.format_id == "2160p")
    assert fmt_4k.filesize_estimate == 102_000_000

    # Verify MP3 320kbps size estimate: (320 * 1000 / 8) * 120s = 4,800,000 bytes
    fmt_mp3 = next(f for f in media_info.formats if f.format_id == "mp3-320")
    assert fmt_mp3.filesize_estimate == 4_800_000
    assert fmt_mp3.type == "audio"


def test_instagram_carousel_extraction():
    ig = InstagramExtractor()
    raw_info = {
        "id": "carousel_123",
        "title": "A fun day at the park! #fun",
        "entries": [
            {
                "id": "photo_1",
                "title": "Slide 1",
                "url": "https://cdn.instagram.com/photo1.jpg",
                "ext": "jpg",
                "vcodec": "none",
                "acodec": "none",
            },
            {
                "id": "video_2",
                "title": "Slide 2",
                "url": "https://cdn.instagram.com/video2.mp4",
                "ext": "mp4",
                "vcodec": "h264",
                "acodec": "aac",
                "duration": 15.0,
            },
            {
                "id": "photo_3",
                "title": "Slide 3",
                "url": "https://cdn.instagram.com/photo3.jpg",
                "ext": "jpg",
            },
        ],
    }

    with patch.object(ig, "execute_ytdl_extraction", return_value=raw_info):
        media_info = ig.extract_info("https://www.instagram.com/p/carousel_123/")

    assert media_info.platform == "instagram"
    assert media_info.is_playlist is True
    assert len(media_info.carousel_items) == 3

    assert media_info.carousel_items[0].media_type == "image"
    assert media_info.carousel_items[0].id == "photo_1"

    assert media_info.carousel_items[1].media_type == "video"
    assert media_info.carousel_items[1].id == "video_2"

    assert media_info.carousel_items[2].media_type == "image"
    assert media_info.carousel_items[2].id == "photo_3"


def test_twitter_video_bitrates_and_gifs():
    tw = TwitterExtractor()
    raw_info = {
        "id": "1800000000000000000",
        "description": "Check out this animated clip! https://t.co/xyz",
        "duration": 6.5,
        "thumbnail": "https://pbs.twimg.com/media/thumb.jpg",
        "formats": [
            # High bitrate 1080p
            {"format_id": "http-2176", "height": 1080, "width": 1920, "tbr": 2176, "vcodec": "h264", "acodec": "none"},
            # Medium bitrate 720p
            {"format_id": "http-832", "height": 720, "width": 1280, "tbr": 832, "vcodec": "h264", "acodec": "none"},
            # Low bitrate 480p
            {"format_id": "http-256", "height": 480, "width": 854, "tbr": 256, "vcodec": "h264", "acodec": "none"},
        ],
    }

    with patch.object(tw, "execute_ytdl_extraction", return_value=raw_info):
        media_info = tw.extract_info("https://x.com/user/status/1800000000000000000")

    assert media_info.platform == "twitter"
    assert len(media_info.formats) >= 3

    # Best format mapped
    best_fmt = media_info.formats[0]
    assert best_fmt.format_id == "best"
    assert best_fmt.height == 1080

    # Animated GIF detected (short duration + no audio codec)
    assert "Animated GIF" in best_fmt.format_note


def test_facebook_hd_sd_progressive_streams():
    fb = FacebookExtractor()
    raw_info = {
        "id": "fb_12345",
        "title": "Exciting event stream",
        "duration": 60.0,
        "formats": [
            {"format_id": "sd", "height": 480, "width": 854, "tbr": 800, "filesize": 6_000_000},
            {"format_id": "hd", "height": 1080, "width": 1920, "tbr": 3500, "filesize": 26_000_000},
        ],
    }

    with patch.object(fb, "execute_ytdl_extraction", return_value=raw_info):
        media_info = fb.extract_info("https://www.facebook.com/watch/?v=fb_12345")

    assert media_info.platform == "facebook"
    format_ids = [f.format_id for f in media_info.formats]
    assert "hd" in format_ids
    assert "sd" in format_ids
    assert "mp3-320" in format_ids

    hd_fmt = next(f for f in media_info.formats if f.format_id == "hd")
    assert hd_fmt.filesize_estimate == 26_000_000


# ===========================================================================
# 6. Filename Sanitization on Windows
# ===========================================================================

def test_filename_sanitization_rules():
    # Reserved device names
    assert sanitize_filename("CON.mp4") == "_CON.mp4"
    assert sanitize_filename("nul.jpg") == "_nul.jpg"
    assert sanitize_filename("COM1.mp4") == "_COM1.mp4"
    assert sanitize_filename("prn.mp3") == "_prn.mp3"

    # Illegal characters
    assert sanitize_filename('bad:file*name?with"quotes<and>pipes|slash/.mp4') == "bad_file_name_with_quotes_and_pipes_slash_.mp4"

    # Truncation preserving extension
    very_long_title = "A" * 300 + ".mp4"
    sanitized = sanitize_filename(very_long_title, max_len=180)
    assert len(sanitized) <= 180
    assert sanitized.endswith(".mp4")


# ===========================================================================
# 7. Helper Formatters
# ===========================================================================

def test_format_helpers():
    assert _format_speed(3_500_000) == "3.3 MB/s"
    assert _format_speed(250_000) == "244.1 KB/s"
    assert _format_speed(None) is None

    assert _format_eta(45) == "00:45"
    assert _format_eta(125) == "02:05"
    assert _format_eta(3665) == "01:01:05"
    assert _format_eta(None) is None


# ===========================================================================
# 8. YtDlpService Extraction and SSRF Security Rejection
# ===========================================================================

def test_ytdlp_service_ssrf_rejection():
    service = YtDlpService()
    with pytest.raises(BaseMediaError, match="URL rejected"):
        service.extract_info("http://127.0.0.1:8000/media")

    with pytest.raises(BaseMediaError, match="URL rejected"):
        service.extract_info("http://169.254.169.254/latest/meta-data")


def test_ytdlp_service_download_hooks_simulation(tmp_path):
    """
    Verify progress hooks dispatching and 'muxing' state emission.
    """
    service = YtDlpService()
    task_id = "test-task-123"

    progress_events = []

    def on_progress(data):
        progress_events.append(data)

    req = DownloadRequest(
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        format_id="1080p",
        media_type="video",
    )

    # Mock yt_dlp.YoutubeDL execution
    mock_ydl = MagicMock()

    def fake_download(urls):
        # Simulate creating an output file in the task dir
        task_dir = tmp_path / task_id
        task_dir.mkdir(parents=True, exist_ok=True)
        out_file = task_dir / "Test Video [dQw4w9WgXcQ].mp4"
        out_file.write_bytes(b"mock video data " * 100)

        # Trigger progress hooks
        for hook in mock_ydl_instance._progress_hooks:
            hook({
                "status": "downloading",
                "downloaded_bytes": 500,
                "total_bytes": 1000,
                "speed": 1024 * 1024 * 2.5,
                "eta": 30,
                "filename": str(out_file),
            })
            hook({"status": "finished"})

        # Trigger postprocessor hook ("muxing" state)
        for pphook in mock_ydl_instance._postprocessor_hooks:
            pphook({"status": "started"})

        return 0

    mock_ydl_instance = MagicMock()
    mock_ydl_instance.__enter__.return_value = mock_ydl_instance
    mock_ydl_instance.__exit__.return_value = None
    mock_ydl_instance._progress_hooks = []
    mock_ydl_instance._postprocessor_hooks = []
    mock_ydl_instance.download.side_effect = fake_download

    def set_opts(opts):
        mock_ydl_instance._progress_hooks = opts.get("progress_hooks", [])
        mock_ydl_instance._postprocessor_hooks = opts.get("postprocessor_hooks", [])
        return mock_ydl_instance

    mock_ydl.side_effect = set_opts

    with patch("yt_dlp.YoutubeDL", mock_ydl):
        with patch("app.services.ytdlp_service.settings.DOWNLOAD_DIR", tmp_path):
            result_path = service.download_media(task_id, req, progress_callback=on_progress)

    assert result_path.exists()
    assert result_path.name.endswith(".mp4")

    # Verify event states were emitted
    statuses = [p["status"] for p in progress_events]
    assert "downloading" in statuses
    assert "muxing" in statuses
    assert "completed" in statuses

    # Check that downloading event had speed, eta, and percent
    dl_event = next(p for p in progress_events if p["status"] == "downloading")
    assert dl_event["percent"] == 50.0
    assert dl_event["speed"] == "2.5 MB/s"
    assert dl_event["eta"] == "00:30"
