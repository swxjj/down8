"""
Instagram specialized extractor supporting Reels, Posts, and Multi-item Carousels.
"""

import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from app.models.schemas import CarouselItem, DownloadRequest, FormatOption, MediaInfo
from app.services.extractors.base import BaseExtractor


class InstagramExtractor(BaseExtractor):
    """
    Extractor for Instagram Reels, Posts, and Carousels.
    Includes mobile header masquerading and multi-entry parsing.
    """

    platform_name: str = "instagram"

    URL_PATTERN = re.compile(
        r"^(https?://)?(www\.)?(instagram\.com|instagr\.am)/(?P<type>p|reel|reels|tv)/+(?P<shortcode>[A-Za-z0-9_\-]+)",
        re.IGNORECASE,
    )

    MOBILE_UA = (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1"
    )

    def can_handle(self, url: str) -> bool:
        """Check if URL matches Instagram patterns."""
        if not url:
            return False
        return bool(self.URL_PATTERN.search(url.strip()))

    def normalize_url(self, url: str) -> str:
        """
        Normalize Instagram URL by stripping tracking parameters (?igsh=...)
        and standardizing path format.
        """
        clean_url = url.strip()
        match = self.URL_PATTERN.search(clean_url)
        if match:
            media_type = match.group("type").lower()
            if media_type == "reels":
                media_type = "reel"
            shortcode = match.group("shortcode")
            return f"https://www.instagram.com/{media_type}/{shortcode}/"

        # Fallback to URL without query
        parsed = urlparse(clean_url)
        return f"{parsed.scheme or 'https'}://{parsed.netloc}{parsed.path}"

    def get_ytdl_opts(self, url: str, is_download: bool = False) -> Dict[str, Any]:
        """
        Instagram-specific options with mobile browser headers and referrers.
        """
        opts = self.get_base_ytdl_opts()
        opts.update({
            "user_agent": self.MOBILE_UA,
            "http_headers": {
                "User-Agent": self.MOBILE_UA,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.instagram.com/",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "same-origin",
            },
        })
        return opts

    def extract_info(self, url: str) -> MediaInfo:
        """
        Extract Instagram post/reel metadata, detecting carousels and media entries.
        """
        canonical_url = self.normalize_url(url)
        raw_info = self.execute_ytdl_extraction(canonical_url)

        media_id = raw_info.get("id") or "instagram_media"
        title = raw_info.get("title") or raw_info.get("description") or "Instagram Post"
        # Truncate title if it's a long caption
        title_snippet = title[:100].strip() if title else "Instagram Media"
        description = raw_info.get("description")
        thumbnail = raw_info.get("thumbnail")
        duration = raw_info.get("duration")
        duration_string = self.format_duration(duration)
        uploader = raw_info.get("uploader") or raw_info.get("channel") or raw_info.get("uploader_id")

        carousel_items: List[CarouselItem] = []
        formats: List[FormatOption] = []

        # Check for multi-item carousel (playlist or entries)
        entries = raw_info.get("entries")
        if entries and isinstance(entries, list):
            for idx, entry in enumerate(entries):
                if not entry:
                    continue
                item_id = str(entry.get("id") or f"item_{idx + 1}")
                is_video = bool(
                    entry.get("duration")
                    or (entry.get("vcodec") and entry.get("vcodec") != "none")
                    or entry.get("ext") == "mp4"
                    or any(f.get("vcodec") != "none" for f in entry.get("formats", []))
                )
                media_type = "video" if is_video else "image"
                item_url = entry.get("url") or entry.get("webpage_url") or canonical_url
                item_thumb = entry.get("thumbnail") or (item_url if not is_video else thumbnail)
                ext = "mp4" if is_video else "jpg"

                carousel_items.append(
                    CarouselItem(
                        id=item_id,
                        media_type=media_type,
                        url=item_url,
                        thumbnail=item_thumb,
                        title=entry.get("title") or f"Slide {idx + 1}",
                        ext=ext,
                    )
                )

        # Build formats for video items
        raw_formats = raw_info.get("formats", [])
        if raw_formats:
            video_formats = [
                f for f in raw_formats
                if f.get("vcodec") != "none" or f.get("height")
            ]
            if video_formats:
                best_video = max(
                    video_formats,
                    key=lambda f: (f.get("height") or 0, f.get("tbr") or 0)
                )
                h = best_video.get("height") or 1080
                res = f"{best_video.get('width', 1080)}x{h}" if best_video.get("width") else f"{h}p"
                f_size = best_video.get("filesize") or best_video.get("filesize_approx")
                if not f_size and duration:
                    f_size = self.estimate_filesize(duration, tbr=best_video.get("tbr") or 2500)

                formats.append(
                    FormatOption(
                        format_id="best",
                        resolution=res,
                        height=h,
                        ext="mp4",
                        filesize_estimate=f_size,
                        format_note="Best Quality (MP4)",
                        has_audio=True,
                        has_video=True,
                        type="video",
                    )
                )
        elif not carousel_items and raw_info.get("url"):
            # Single image or direct URL
            ext = raw_info.get("ext", "jpg")
            is_video = ext == "mp4" or bool(raw_info.get("duration"))
            if is_video:
                formats.append(
                    FormatOption(
                        format_id="best",
                        resolution="1080p",
                        height=1080,
                        ext="mp4",
                        filesize_estimate=None,
                        format_note="Best Quality (MP4)",
                        has_audio=True,
                        has_video=True,
                        type="video",
                    )
                )
            else:
                carousel_items.append(
                    CarouselItem(
                        id=str(media_id),
                        media_type="image",
                        url=raw_info.get("url"),
                        thumbnail=thumbnail or raw_info.get("url"),
                        title=title_snippet,
                        ext="jpg",
                    )
                )

        # Audio-only extraction option if video duration is present
        if duration or any(f.type == "video" for f in formats):
            mp3_est = int((320.0 * 1000.0 / 8.0) * duration) if duration else None
            formats.append(
                FormatOption(
                    format_id="mp3-320",
                    resolution=None,
                    height=None,
                    ext="mp3",
                    filesize_estimate=mp3_est,
                    format_note="Audio Extract (MP3 320kbps)",
                    has_audio=True,
                    has_video=False,
                    type="audio",
                )
            )

        return MediaInfo(
            id=str(media_id),
            url=canonical_url,
            platform="instagram",
            title=title_snippet,
            description=description,
            thumbnail=thumbnail,
            duration=duration,
            duration_string=duration_string,
            uploader=uploader,
            is_playlist=bool(carousel_items and len(carousel_items) > 1),
            formats=formats,
            carousel_items=carousel_items,
        )

    def get_download_opts(self, request: DownloadRequest, output_template: str) -> Dict[str, Any]:
        """Download options for Instagram media."""
        opts = self.get_ytdl_opts(request.url, is_download=True)
        opts["outtmpl"] = output_template

        if request.media_type == "audio" or request.format_id in ("mp3-320", "audio"):
            opts.update({
                "format": "bestaudio/best",
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "320",
                    }
                ],
            })
            return opts

        opts.update({
            "format": "best/bestvideo+bestaudio",
            "merge_output_format": "mp4",
            "postprocessors": [
                {
                    "key": "FFmpegVideoRemuxer",
                    "preferedformat": "mp4",
                }
            ],
        })
        return opts
