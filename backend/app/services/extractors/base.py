"""
Base extractor definition and common utilities for platform extractors.
"""

from abc import ABC, abstractmethod
import math
import re
from typing import Any, Dict, List, Optional
import yt_dlp
from yt_dlp.utils import DownloadError, ExtractorError as YtDlpExtractorError

from app.models.schemas import FormatOption, MediaInfo, CarouselItem, DownloadRequest


# ---------------------------------------------------------------------------
# Standardized Error Classification
# ---------------------------------------------------------------------------

class BaseMediaError(Exception):
    """Base class for all media extraction and download errors."""
    def __init__(self, message: str, original_error: Optional[Exception] = None):
        super().__init__(message)
        self.message = message
        self.original_error = original_error


class MediaNotFoundError(BaseMediaError):
    """Raised when the requested media does not exist, was deleted, or is unavailable."""
    pass


class PrivateMediaError(BaseMediaError):
    """Raised when the media is private, requires authentication, or is account-restricted."""
    pass


class RateLimitError(BaseMediaError):
    """Raised when the platform returns HTTP 429 or actively throttles requests."""
    pass


class BotChallengeError(BaseMediaError):
    """Raised when an anti-bot challenge (Cloudflare, CAPTCHA, SABR) is detected."""
    pass


class UnsupportedPlatformError(BaseMediaError):
    """Raised when the URL platform is not supported or recognized."""
    pass


def classify_ytdlp_error(err: Exception) -> BaseMediaError:
    """
    Classify a yt-dlp error or general exception into standardized domain errors.
    """
    if isinstance(err, BaseMediaError):
        return err

    err_str = str(err).lower()

    # Bot / Captcha / SABR challenges
    bot_patterns = [
        "sign in to confirm you're not a bot",
        "confirm you're not a bot",
        "bot verification",
        "captcha",
        "cloudflare",
        "challenge required",
        "sabr",
        "automated queries",
        "suspicious traffic",
        "human verification",
        "robot",
    ]
    if any(p in err_str for p in bot_patterns):
        return BotChallengeError(
            "Anti-bot verification triggered by platform. Please try again later.",
            original_error=err,
        )

    # Rate limiting
    rate_patterns = [
        "429",
        "too many requests",
        "rate limit",
        "temporarily blocked",
        "throttled",
        "please slow down",
        "request limit reached",
    ]
    if any(p in err_str for p in rate_patterns):
        return RateLimitError(
            "Platform rate limit reached (HTTP 429). Please wait before trying again.",
            original_error=err,
        )

    # Private or restricted media
    private_patterns = [
        "private video",
        "this video is private",
        "account is private",
        "this account is private",
        "login required",
        "members-only",
        "requires authentication",
        "not authorized",
        "permission to view",
        "sign in to view",
        "only available to registered",
    ]
    if any(p in err_str for p in private_patterns):
        return PrivateMediaError(
            "The requested media is private, restricted, or requires an authenticated account.",
            original_error=err,
        )

    # Media not found or deleted
    not_found_patterns = [
        "not found",
        "404",
        "video unavailable",
        "unavailable",
        "has been removed",
        "does not exist",
        "deleted",
        "no video formats found",
        "no formats found",
        "page does not exist",
        "unable to extract",
    ]
    if any(p in err_str for p in not_found_patterns):
        return MediaNotFoundError(
            "Media not found or no longer available on the platform.",
            original_error=err,
        )

    return BaseMediaError(f"Extraction failed: {err}", original_error=err)


# ---------------------------------------------------------------------------
# Base Extractor
# ---------------------------------------------------------------------------

class BaseExtractor(ABC):
    """
    Abstract Base Class for modular platform extractors.
    Encapsulates yt-dlp option presets, error classification, and format mappings.
    """

    platform_name: str = "generic"

    # Modern desktop and mobile User-Agents
    DEFAULT_USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    )

    MOBILE_USER_AGENT = (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
    )

    def get_base_ytdl_opts(self) -> Dict[str, Any]:
        """Standard baseline options for yt-dlp."""
        return {
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "socket_timeout": 15,
            "geo_bypass": True,
            "geo_bypass_country": "US",
            "nocheckcertificate": False,
            "extract_flat": False,
            "user_agent": self.DEFAULT_USER_AGENT,
            "http_headers": {
                "User-Agent": self.DEFAULT_USER_AGENT,
                "Accept-Language": "en-US,en;q=0.9",
                "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
            },
        }

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Return True if this extractor can handle the provided URL."""
        pass

    @abstractmethod
    def normalize_url(self, url: str) -> str:
        """Clean and normalize URL (remove tracking parameters, canonicalize path)."""
        pass

    @abstractmethod
    def get_ytdl_opts(self, url: str, is_download: bool = False) -> Dict[str, Any]:
        """Return platform-specific yt-dlp options."""
        pass

    @abstractmethod
    def extract_info(self, url: str) -> MediaInfo:
        """Extract metadata and return a unified MediaInfo object."""
        pass

    @abstractmethod
    def get_download_opts(self, request: DownloadRequest, output_template: str) -> Dict[str, Any]:
        """Return customized yt-dlp options specifically tailored for downloading."""
        pass

    def execute_ytdl_extraction(self, url: str, extra_opts: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute yt-dlp info extraction with standardized error classification.
        """
        opts = self.get_ytdl_opts(url, is_download=False)
        if extra_opts:
            opts.update(extra_opts)

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info:
                    raise MediaNotFoundError("Failed to retrieve media information.")
                return ydl.sanitize_info(info)
        except Exception as e:
            raise classify_ytdlp_error(e) from e

    # -----------------------------------------------------------------------
    # Common format helpers
    # -----------------------------------------------------------------------

    @staticmethod
    def estimate_filesize(
        duration: Optional[float],
        tbr: Optional[float] = None,
        vbr: Optional[float] = None,
        abr: Optional[float] = None,
        filesize: Optional[int] = None,
    ) -> Optional[int]:
        """
        Accurately estimate or return filesize in bytes.
        Sums video + audio bitrates if given separately.
        """
        if filesize and filesize > 0:
            return int(filesize)

        if not duration or duration <= 0:
            return None

        # Determine total bitrate in kbps
        combined_bitrate = 0.0
        if tbr and tbr > 0:
            combined_bitrate = tbr
        else:
            if vbr and vbr > 0:
                combined_bitrate += vbr
            if abr and abr > 0:
                combined_bitrate += abr

        if combined_bitrate > 0:
            # (bitrate in kbps * 1000 / 8) * duration_seconds
            bytes_estimate = (combined_bitrate * 1000.0 / 8.0) * duration
            return int(bytes_estimate)

        return None

    @staticmethod
    def format_bytes(size: Optional[int]) -> Optional[str]:
        """Format bytes to human-readable string (e.g., '14.2 MB')."""
        if size is None or size <= 0:
            return None
        units = ["B", "KB", "MB", "GB", "TB"]
        idx = min(int(math.log(size, 1024)), len(units) - 1)
        scaled = size / (1024 ** idx)
        return f"{scaled:.1f} {units[idx]}"

    @staticmethod
    def format_duration(seconds: Optional[float]) -> Optional[str]:
        """Format duration into MM:SS or HH:MM:SS."""
        if seconds is None or seconds < 0:
            return None
        total_sec = int(round(seconds))
        hours = total_sec // 3600
        minutes = (total_sec % 3600) // 60
        secs = total_sec % 60
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:02d}"
        return f"{minutes:02d}:{secs:02d}"
