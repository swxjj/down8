"""
Media metadata extraction service delegating to YtDlpService.
"""

from app.models.schemas import MediaInfo
from app.services.ytdlp_service import ytdlp_service


async def extract_media_info(url: str) -> MediaInfo:
    """Extract media metadata using unified YtDlpService."""
    return await ytdlp_service.extract_info_async(url)
