"""
Facebook specialized extractor supporting Facebook Watch, Reels, and fb.watch shortlinks.
"""

import re
from typing import Any, Dict, List, Optional
import requests

from app.core.security import is_safe_url
from app.models.schemas import CarouselItem, DownloadRequest, FormatOption, MediaInfo
from app.services.extractors.base import BaseExtractor


class FacebookExtractor(BaseExtractor):
    """
    Extractor for Facebook Watch, Reels, and public posts.
    Handles fb.watch shortlink expansion and HD/SD progressive streams.
    """

    platform_name: str = "facebook"

    URL_PATTERN = re.compile(
        r"^(https?://)?(www\.|m\.|web\.)?(facebook\.com|fb\.watch)/.+",
        re.IGNORECASE,
    )

    FB_WATCH_SHORTLINK_PATTERN = re.compile(
        r"^(https?://)?(www\.)?fb\.watch/[A-Za-z0-9_\-]+",
        re.IGNORECASE,
    )

    def can_handle(self, url: str) -> bool:
        """Check if URL belongs to Facebook or fb.watch."""
        if not url:
            return False
        return bool(self.URL_PATTERN.search(url.strip()))

    def resolve_shortlink(self, url: str) -> str:
        """
        Follow HTTP redirects for fb.watch shortlinks to find the canonical URL.
        Includes SSRF checks before making outgoing network requests.
        """
        clean_url = url.strip()
        if not self.FB_WATCH_SHORTLINK_PATTERN.search(clean_url):
            return clean_url

        if not is_safe_url(clean_url):
            return clean_url

        try:
            resp = requests.head(
                clean_url,
                allow_redirects=True,
                timeout=5,
                headers={"User-Agent": self.DEFAULT_USER_AGENT},
            )
            final_url = resp.url
            if final_url and is_safe_url(final_url):
                return final_url
        except Exception:
            # Fall back to original url if head request fails
            pass

        return clean_url

    def normalize_url(self, url: str) -> str:
        """
        Normalize Facebook URL by resolving shortlinks and stripping session params.
        """
        resolved = self.resolve_shortlink(url)
        return resolved

    def get_ytdl_opts(self, url: str, is_download: bool = False) -> Dict[str, Any]:
        """Facebook-specific yt-dlp options."""
        opts = self.get_base_ytdl_opts()
        opts.update({
            "http_headers": {
                "User-Agent": self.DEFAULT_USER_AGENT,
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.facebook.com/",
            },
        })
        return opts

    def extract_info(self, url: str) -> MediaInfo:
        """
        Extract Facebook video metadata and structure HD/SD progressive streams.
        """
        canonical_url = self.normalize_url(url)
        raw_info = self.execute_ytdl_extraction(canonical_url)

        video_id = raw_info.get("id") or "fb_video"
        title = raw_info.get("title") or raw_info.get("description") or "Facebook Video"
        title_snippet = title[:120].strip() if title else "Facebook Video"
        description = raw_info.get("description")
        thumbnail = raw_info.get("thumbnail")
        duration = raw_info.get("duration")
        duration_string = self.format_duration(duration)
        uploader = raw_info.get("uploader") or raw_info.get("channel") or raw_info.get("uploader_id")

        formats = self._categorize_fb_formats(raw_info.get("formats", []), duration)

        return MediaInfo(
            id=str(video_id),
            url=canonical_url,
            platform="facebook",
            title=title_snippet,
            description=description,
            thumbnail=thumbnail,
            duration=duration,
            duration_string=duration_string,
            uploader=uploader,
            is_playlist=False,
            formats=formats,
            carousel_items=[],
        )

    def _categorize_fb_formats(
        self, raw_formats: List[Dict[str, Any]], duration: Optional[float]
    ) -> List[FormatOption]:
        """
        Cleanly format HD and SD progressive streams.
        """
        options: List[FormatOption] = []
        if not raw_formats:
            return options

        # Look for explicit 'hd' and 'sd' tags, or heights >= 720 for HD
        hd_stream = None
        sd_stream = None

        for f in raw_formats:
            fmt_id = str(f.get("format_id", "")).lower()
            height = f.get("height") or 0
            if "hd" in fmt_id or height >= 720:
                if not hd_stream or (f.get("tbr") or 0) > (hd_stream.get("tbr") or 0):
                    hd_stream = f
            elif "sd" in fmt_id or 0 < height < 720:
                if not sd_stream or (f.get("tbr") or 0) > (sd_stream.get("tbr") or 0):
                    sd_stream = f

        # If no explicit tags, fallback to highest and lowest quality
        video_formats = [f for f in raw_formats if f.get("vcodec") != "none" or f.get("height")]
        if not hd_stream and video_formats:
            hd_stream = max(video_formats, key=lambda f: f.get("height") or f.get("tbr") or 0)
        if not sd_stream and video_formats and len(video_formats) > 1:
            sd_stream = min(video_formats, key=lambda f: f.get("height") or f.get("tbr") or 0)

        # 1. HD Option
        if hd_stream:
            h = hd_stream.get("height") or 1080
            res = f"{hd_stream.get('width', '')}x{h}" if hd_stream.get("width") else "HD (720p/1080p)"
            hd_size = hd_stream.get("filesize") or hd_stream.get("filesize_approx")
            if not hd_size and duration:
                hd_size = self.estimate_filesize(duration, tbr=hd_stream.get("tbr") or 2500)

            options.append(
                FormatOption(
                    format_id="hd",
                    resolution=res,
                    height=h,
                    ext="mp4",
                    filesize_estimate=hd_size,
                    format_note="High Definition (HD)",
                    has_audio=True,
                    has_video=True,
                    type="video",
                )
            )

        # 2. SD Option
        if sd_stream and sd_stream != hd_stream:
            h = sd_stream.get("height") or 480
            res = f"{sd_stream.get('width', '')}x{h}" if sd_stream.get("width") else "SD (360p/480p)"
            sd_size = sd_stream.get("filesize") or sd_stream.get("filesize_approx")
            if not sd_size and duration:
                sd_size = self.estimate_filesize(duration, tbr=sd_stream.get("tbr") or 800)

            options.append(
                FormatOption(
                    format_id="sd",
                    resolution=res,
                    height=h,
                    ext="mp4",
                    filesize_estimate=sd_size,
                    format_note="Standard Definition (SD)",
                    has_audio=True,
                    has_video=True,
                    type="video",
                )
            )

        # Fallback if neither found but formats exist
        if not options and raw_formats:
            options.append(
                FormatOption(
                    format_id="best",
                    resolution="Best",
                    height=None,
                    ext="mp4",
                    filesize_estimate=None,
                    format_note="Best Available",
                    has_audio=True,
                    has_video=True,
                    type="video",
                )
            )

        # Audio-only Option
        if duration:
            mp3_est = int((320.0 * 1000.0 / 8.0) * duration)
            options.append(
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

        return options

    def get_download_opts(self, request: DownloadRequest, output_template: str) -> Dict[str, Any]:
        """Download options for Facebook media."""
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

        fmt_id = request.format_id.lower()
        if fmt_id == "hd":
            fmt_str = "hd/bestvideo[height>=720]+bestaudio/bestvideo+bestaudio/best"
        elif fmt_id == "sd":
            fmt_str = "sd/bestvideo[height<720]+bestaudio/best[height<720]/best"
        else:
            fmt_str = "bestvideo+bestaudio/best"

        opts.update({
            "format": fmt_str,
            "merge_output_format": "mp4",
            "postprocessors": [
                {
                    "key": "FFmpegVideoRemuxer",
                    "preferedformat": "mp4",
                }
            ],
        })

        return opts
