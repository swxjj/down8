"""
Generic fallback extractor for any other standard yt-dlp supported source.
"""

from typing import Any, Dict, List, Optional
from app.models.schemas import CarouselItem, DownloadRequest, FormatOption, MediaInfo
from app.services.extractors.base import BaseExtractor


class GenericExtractor(BaseExtractor):
    """Fallback extractor for non-specialized media platforms."""

    platform_name: str = "generic"

    def can_handle(self, url: str) -> bool:
        """Fallback extractor can handle any valid URL."""
        return True

    def normalize_url(self, url: str) -> str:
        return url.strip()

    def get_ytdl_opts(self, url: str, is_download: bool = False) -> Dict[str, Any]:
        return self.get_base_ytdl_opts()

    def extract_info(self, url: str) -> MediaInfo:
        canonical_url = self.normalize_url(url)
        raw_info = self.execute_ytdl_extraction(canonical_url)

        media_id = str(raw_info.get("id") or "generic_media")
        title = raw_info.get("title") or "Media Download"
        description = raw_info.get("description")
        thumbnail = raw_info.get("thumbnail")
        duration = raw_info.get("duration")
        duration_string = self.format_duration(duration)
        uploader = raw_info.get("uploader") or raw_info.get("channel")

        formats: List[FormatOption] = []
        raw_formats = raw_info.get("formats", [])

        if raw_formats:
            video_formats = [f for f in raw_formats if f.get("vcodec") != "none" or f.get("height")]
            if video_formats:
                best_video = max(video_formats, key=lambda f: f.get("height") or f.get("tbr") or 0)
                h = best_video.get("height") or 720
                res = f"{best_video.get('width', '')}x{h}" if best_video.get("width") else f"{h}p"
                f_size = best_video.get("filesize") or best_video.get("filesize_approx")
                if not f_size and duration:
                    f_size = self.estimate_filesize(duration, tbr=best_video.get("tbr") or 1500)

                formats.append(
                    FormatOption(
                        format_id="best",
                        resolution=res,
                        height=h,
                        ext="mp4",
                        filesize_estimate=f_size,
                        format_note="Best Video (MP4)",
                        has_audio=True,
                        has_video=True,
                        type="video",
                    )
                )

        if duration:
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

        # In case platform is one of the standard Literal types: "youtube", "instagram", "twitter", "facebook"
        # yt-dlp extractor key can be mapped
        extractor_key = str(raw_info.get("extractor_key", "")).lower()
        if "youtube" in extractor_key:
            plat = "youtube"
        elif "instagram" in extractor_key:
            plat = "instagram"
        elif "twitter" in extractor_key or "x" in extractor_key:
            plat = "twitter"
        elif "facebook" in extractor_key:
            plat = "facebook"
        else:
            plat = "youtube"  # Safe default conforming to Literal schema

        return MediaInfo(
            id=media_id,
            url=canonical_url,
            platform=plat,
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

    def get_download_opts(self, request: DownloadRequest, output_template: str) -> Dict[str, Any]:
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
            "format": "bestvideo+bestaudio/best",
            "merge_output_format": "mp4",
        })
        return opts
