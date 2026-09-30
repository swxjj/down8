"""
YouTube specialized extractor with anti-bot/SABR countermeasures,
smart resolution tiers, and accurate size estimation.
"""

import re
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from app.models.schemas import CarouselItem, DownloadRequest, FormatOption, MediaInfo
from app.services.extractors.base import BaseExtractor


class YouTubeExtractor(BaseExtractor):
    """
    Extractor for YouTube videos, shorts, and live streams.
    Includes SABR countermeasures and tiered format categorization.
    """

    platform_name: str = "youtube"

    URL_PATTERN = re.compile(
        r"^(https?://)?(www\.|m\.)?(youtube\.com/(watch\?.*v=|shorts/|live/|embed/|v/|playlist\?.*list=)|youtu\.be/)(?P<id>[a-zA-Z0-9_\-]+)",
        re.IGNORECASE,
    )

    SHORTS_PATTERN = re.compile(r"youtube\.com/shorts/(?P<id>[a-zA-Z0-9_\-]+)", re.IGNORECASE)
    YOUTUBE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]{11}$")

    # Standard quality tiers
    QUALITY_TIERS = [
        {"id": "2160p", "label": "4K Ultra HD (2160p)", "height": 2160, "res": "3840x2160"},
        {"id": "1440p", "label": "2K Quad HD (1440p)", "height": 1440, "res": "2560x1440"},
        {"id": "1080p", "label": "Full HD (1080p)", "height": 1080, "res": "1920x1080"},
        {"id": "720p", "label": "HD (720p)", "height": 720, "res": "1280x720"},
        {"id": "480p", "label": "SD (480p)", "height": 480, "res": "854x480"},
        {"id": "360p", "label": "SD (360p)", "height": 360, "res": "640x360"},
    ]

    def can_handle(self, url: str) -> bool:
        """Check if URL matches YouTube patterns."""
        if not url:
            return False
        return bool(self.URL_PATTERN.search(url.strip()))

    def normalize_url(self, url: str) -> str:
        """
        Normalize YouTube URL to canonical form and strip tracking parameters.
        Normalizes shorts to standard watch URLs for maximum extractor stability.
        """
        clean_url = url.strip()

        # Handle youtu.be/<id>
        if "youtu.be/" in clean_url:
            parsed = urlparse(clean_url)
            video_id = parsed.path.lstrip("/").split("/")[0]
            if self.YOUTUBE_ID_PATTERN.match(video_id):
                return f"https://www.youtube.com/watch?v={video_id}"

        # Handle shorts/<id>
        shorts_match = self.SHORTS_PATTERN.search(clean_url)
        if shorts_match:
            video_id = shorts_match.group("id")
            return f"https://www.youtube.com/watch?v={video_id}"

        # Standard youtube.com/watch?v=...
        parsed = urlparse(clean_url)
        query = parse_qs(parsed.query)
        if "v" in query and query["v"]:
            video_id = query["v"][0]
            return f"https://www.youtube.com/watch?v={video_id}"

        return clean_url

    def get_ytdl_opts(self, url: str, is_download: bool = False) -> Dict[str, Any]:
        """
        YouTube-specific options allowing all available resolution tiers (4K, 1440p, 1080p, 720p, 480p, 360p).
        """
        opts = self.get_base_ytdl_opts()
        opts.update({
            "extractor_args": {
                "youtube": {
                    "player_client": ["default"],
                }
            },
            "http_headers": {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "en-US,en;q=0.9",
                "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
            },
        })
        return opts

    def extract_info(self, url: str) -> MediaInfo:
        """
        Extract YouTube video metadata and build categorized formats.
        """
        canonical_url = self.normalize_url(url)
        raw_info = self.execute_ytdl_extraction(canonical_url)

        video_id = raw_info.get("id") or "video"
        title = raw_info.get("title") or "YouTube Video"
        duration = raw_info.get("duration")
        duration_string = self.format_duration(duration) or raw_info.get("duration_string")
        thumbnail = raw_info.get("thumbnail")
        uploader = raw_info.get("uploader") or raw_info.get("channel")
        description = raw_info.get("description")

        formats = self._categorize_formats(raw_info.get("formats", []), duration)

        return MediaInfo(
            id=str(video_id),
            url=canonical_url,
            platform="youtube",
            title=title,
            description=description,
            thumbnail=thumbnail,
            duration=duration,
            duration_string=duration_string,
            uploader=uploader,
            is_playlist=False,
            formats=formats,
            carousel_items=[],
        )

    def _categorize_formats(
        self, raw_formats: List[Dict[str, Any]], duration: Optional[float]
    ) -> List[FormatOption]:
        """
        Group raw formats into high-level user-friendly tiers with accurate size estimations.
        """
        options: List[FormatOption] = []
        if not raw_formats:
            return options

        # Find best audio stream for size combination
        best_audio_size = 0
        best_audio_abr = 128.0
        audio_streams = [
            f for f in raw_formats
            if f.get("vcodec") == "none" and f.get("acodec") != "none"
        ]
        if audio_streams:
            best_audio = max(audio_streams, key=lambda a: a.get("abr") or a.get("tbr") or 0)
            best_audio_abr = float(best_audio.get("abr") or best_audio.get("tbr") or 128.0)
            best_audio_size = (
                best_audio.get("filesize")
                or best_audio.get("filesize_approx")
                or int((best_audio_abr * 1000.0 / 8.0) * (duration or 0))
            )

        # Separate video streams
        video_streams = [
            f for f in raw_formats
            if f.get("vcodec") != "none" and f.get("height") is not None
        ]

        # Group and categorize video tiers
        for tier in self.QUALITY_TIERS:
            target_h = tier["height"]
            matching_videos = [
                v for v in video_streams
                if v.get("height") == target_h or (v.get("height") and abs(v.get("height") - target_h) <= 20)
            ]
            if not matching_videos:
                continue

            # Pick best matching video by bitrate/fps
            best_video = max(matching_videos, key=lambda v: (v.get("tbr") or v.get("vbr") or 0, v.get("fps") or 0))

            v_size = best_video.get("filesize") or best_video.get("filesize_approx")
            v_tbr = best_video.get("tbr") or best_video.get("vbr")

            # Calculate accurate total estimated filesize
            total_size: Optional[int] = None
            if best_video.get("acodec") != "none":
                # Progressive stream has both audio and video
                total_size = self.estimate_filesize(duration, tbr=v_tbr, filesize=v_size)
            else:
                # Video-only DASH stream: sum video size + audio size
                if v_size and best_audio_size:
                    total_size = int(v_size + best_audio_size)
                else:
                    total_size = self.estimate_filesize(
                        duration,
                        vbr=v_tbr,
                        abr=best_audio_abr,
                    )

            options.append(
                FormatOption(
                    format_id=tier["id"],
                    resolution=tier["res"],
                    height=target_h,
                    ext="mp4",
                    filesize_estimate=total_size,
                    format_note=tier["label"],
                    has_audio=True,
                    has_video=True,
                    type="video",
                )
            )

        # Fallback if video streams exist but none matched quality tiers
        if video_streams and not any(opt.type == "video" for opt in options):
            best_v = max(video_streams, key=lambda v: (v.get("height") or 0, v.get("tbr") or 0))
            h = best_v.get("height") or 360
            v_size = best_v.get("filesize") or best_v.get("filesize_approx")
            v_tbr = best_v.get("tbr") or best_v.get("vbr")
            fallback_size = v_size or self.estimate_filesize(duration, tbr=v_tbr)
            options.append(
                FormatOption(
                    format_id=f"{h}p",
                    resolution=f"{best_v.get('width', 'auto')}x{h}",
                    height=h,
                    ext="mp4",
                    filesize_estimate=fallback_size,
                    format_note=f"Video ({h}p)",
                    has_audio=best_v.get("acodec") != "none",
                    has_video=True,
                    type="video",
                )
            )

        # Audio-only options
        # 1. MP3 320kbps
        mp3_est = int((320.0 * 1000.0 / 8.0) * duration) if duration else None
        options.append(
            FormatOption(
                format_id="mp3-320",
                resolution=None,
                height=None,
                ext="mp3",
                filesize_estimate=mp3_est,
                format_note="MP3 320kbps (High Quality Audio)",
                has_audio=True,
                has_video=False,
                type="audio",
            )
        )

        # 2. M4A (Direct Stream AAC)
        m4a_est = best_audio_size if best_audio_size > 0 else (
            int((best_audio_abr * 1000.0 / 8.0) * duration) if duration else None
        )
        options.append(
            FormatOption(
                format_id="m4a",
                resolution=None,
                height=None,
                ext="m4a",
                filesize_estimate=m4a_est,
                format_note="M4A (Direct AAC Stream)",
                has_audio=True,
                has_video=False,
                type="audio",
            )
        )

        return options

    def get_download_opts(self, request: DownloadRequest, output_template: str) -> Dict[str, Any]:
        """
        Generate yt-dlp download options configured for FFmpeg remuxing or audio extraction.
        """
        opts = self.get_ytdl_opts(request.url, is_download=True)
        opts["outtmpl"] = output_template

        # Audio-only download
        if request.media_type == "audio" or request.format_id in ("mp3-320", "m4a", "audio"):
            if request.format_id == "m4a" or request.audio_format == "m4a":
                opts.update({
                    "format": "bestaudio[ext=m4a]/bestaudio/best",
                    "postprocessors": [
                        {
                            "key": "FFmpegExtractAudio",
                            "preferredcodec": "m4a",
                        }
                    ],
                })
            else:
                # Default MP3 320kbps
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

        # Video download by height tier
        height_map = {
            "2160p": 2160,
            "1440p": 1440,
            "1080p": 1080,
            "720p": 720,
            "480p": 480,
            "360p": 360,
        }

        requested_height = height_map.get(request.format_id.lower())
        if requested_height:
            fmt_str = (
                f"bestvideo[height<={requested_height}][ext=mp4]+bestaudio[ext=m4a]/"
                f"bestvideo[height<={requested_height}]+bestaudio/"
                f"best[height<={requested_height}]/best"
            )
        elif request.format_id in ("best", "video"):
            fmt_str = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"
        else:
            fmt_str = request.format_id

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
