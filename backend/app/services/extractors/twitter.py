"""
X (Twitter) specialized extractor supporting video bitrates, animated GIFs, and multi-media tweets.
"""

import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from app.models.schemas import CarouselItem, DownloadRequest, FormatOption, MediaInfo
from app.services.extractors.base import BaseExtractor


class TwitterExtractor(BaseExtractor):
    """
    Extractor for X / Twitter posts, videos, GIFs, and multi-photo tweets.
    """

    platform_name: str = "twitter"

    URL_PATTERN = re.compile(
        r"^(https?://)?(www\.)?(twitter\.com|x\.com)/(?P<user>[A-Za-z0-9_]+)/status/(?P<id>[0-9]+)",
        re.IGNORECASE,
    )

    def can_handle(self, url: str) -> bool:
        """Check if URL matches Twitter/X status patterns."""
        if not url:
            return False
        return bool(self.URL_PATTERN.search(url.strip()))

    def normalize_url(self, url: str) -> str:
        """
        Normalize X/Twitter URL to canonical https://x.com/{user}/status/{id},
        stripping tracking query parameters.
        """
        clean_url = url.strip()
        match = self.URL_PATTERN.search(clean_url)
        if match:
            user = match.group("user")
            tweet_id = match.group("id")
            return f"https://x.com/{user}/status/{tweet_id}"

        parsed = urlparse(clean_url)
        return f"{parsed.scheme or 'https'}://{parsed.netloc}{parsed.path}"

    def get_ytdl_opts(self, url: str, is_download: bool = False) -> Dict[str, Any]:
        """Twitter-specific yt-dlp options."""
        opts = self.get_base_ytdl_opts()
        opts.update({
            "http_headers": {
                "User-Agent": self.DEFAULT_USER_AGENT,
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://x.com/",
            },
        })
        return opts

    def extract_info(self, url: str) -> MediaInfo:
        """
        Extract tweet metadata, video streams by bitrate, GIFs, and multi-photo attachments.
        """
        canonical_url = self.normalize_url(url)
        raw_info = self.execute_ytdl_extraction(canonical_url)

        tweet_id = raw_info.get("id") or "tweet"
        title = raw_info.get("description") or raw_info.get("title") or "X Post"
        title_snippet = title[:120].strip() if title else "X Media"
        description = raw_info.get("description") or raw_info.get("title")
        thumbnail = raw_info.get("thumbnail")
        duration = raw_info.get("duration")
        duration_string = self.format_duration(duration)
        uploader = raw_info.get("uploader") or raw_info.get("channel") or raw_info.get("uploader_id")

        carousel_items: List[CarouselItem] = []
        formats: List[FormatOption] = []

        # Check for multi-media tweet (entries / attachments)
        entries = raw_info.get("entries")
        if entries and isinstance(entries, list):
            for idx, entry in enumerate(entries):
                if not entry:
                    continue
                item_id = str(entry.get("id") or f"{tweet_id}_{idx + 1}")
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
                        title=entry.get("title") or f"Attachment {idx + 1}",
                        ext=ext,
                    )
                )

        # Parse video streams and bitrates
        raw_formats = raw_info.get("formats", [])
        if raw_formats:
            video_formats = [
                f for f in raw_formats
                if f.get("vcodec") != "none" or (f.get("height") and f.get("height") > 0)
            ]

            # Detect animated GIF (Twitter serves GIFs as looping MP4 without audio)
            is_gif = any(
                f.get("acodec") == "none" and not f.get("asr") for f in video_formats
            ) and (duration is not None and duration <= 15.0)

            # Deduplicate and sort video formats by height / bitrate descending
            seen_heights = set()
            sorted_formats = sorted(
                video_formats,
                key=lambda f: (f.get("height") or 0, f.get("tbr") or f.get("vbr") or 0),
                reverse=True,
            )

            for f in sorted_formats:
                h = f.get("height")
                if not h:
                    continue
                if h in seen_heights:
                    continue
                seen_heights.add(h)

                f_size = f.get("filesize") or f.get("filesize_approx")
                if not f_size and duration:
                    f_size = self.estimate_filesize(duration, tbr=f.get("tbr") or f.get("vbr"))

                res = f"{f.get('width', '')}x{h}" if f.get("width") else f"{h}p"
                tbr_val = f.get("tbr") or f.get("vbr")
                bitrate_note = f" ({int(tbr_val)} kbps)" if tbr_val else ""
                note = f"Animated GIF (MP4)" if is_gif else f"{h}p HD{bitrate_note}"

                has_audio = f.get("acodec") != "none" and f.get("acodec") is not None

                formats.append(
                    FormatOption(
                        format_id=str(f.get("format_id") or f"{h}p"),
                        resolution=res,
                        height=h,
                        ext="mp4",
                        filesize_estimate=f_size,
                        format_note=note,
                        has_audio=has_audio,
                        has_video=True,
                        type="video",
                    )
                )

            # Ensure at least a 'best' option exists if video formats were found
            if formats and formats[0].format_id != "best":
                # First one is the highest quality
                formats[0].format_id = "best"
                if not is_gif:
                    formats[0].format_note = f"Best Quality ({formats[0].height}p)"

        elif not carousel_items and raw_info.get("url"):
            # Single photo tweet
            carousel_items.append(
                CarouselItem(
                    id=str(tweet_id),
                    media_type="image",
                    url=raw_info.get("url"),
                    thumbnail=thumbnail or raw_info.get("url"),
                    title=title_snippet,
                    ext="jpg",
                )
            )

        # Audio-only extraction if video has an audio track
        has_any_audio = any(f.has_audio for f in formats)
        if has_any_audio and duration:
            mp3_est = int((320.0 * 1000.0 / 8.0) * duration)
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
            id=str(tweet_id),
            url=canonical_url,
            platform="twitter",
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
        """Download options for X/Twitter media."""
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

        # Choose highest bitrate variant or requested format
        if request.format_id == "best":
            opts.update({
                "format": "bestvideo+bestaudio/best",
                "merge_output_format": "mp4",
            })
        else:
            opts.update({
                "format": f"{request.format_id}+bestaudio/best",
                "merge_output_format": "mp4",
            })

        return opts
