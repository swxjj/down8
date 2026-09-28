from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class UrlRequest(BaseModel):
    url: str = Field(..., description="Target media URL to extract or download")


class FormatOption(BaseModel):
    format_id: str
    resolution: Optional[str] = None
    height: Optional[int] = None
    ext: str
    filesize_estimate: Optional[int] = None
    format_note: Optional[str] = None
    has_audio: bool = True
    has_video: bool = True
    type: Literal["video", "audio"] = "video"


class CarouselItem(BaseModel):
    id: str
    media_type: Literal["video", "image"]
    url: str
    thumbnail: Optional[str] = None
    title: Optional[str] = None
    ext: Optional[str] = "jpg"


class MediaInfo(BaseModel):
    id: str
    url: str
    platform: Literal["youtube", "instagram", "twitter", "facebook"]
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    duration: Optional[float] = None
    duration_string: Optional[str] = None
    uploader: Optional[str] = None
    is_playlist: bool = False
    formats: List[FormatOption] = Field(default_factory=list)
    carousel_items: List[CarouselItem] = Field(default_factory=list)


class DownloadRequest(BaseModel):
    url: str
    format_id: str
    media_type: Literal["video", "audio"] = "video"
    audio_format: Optional[str] = "mp3"


class ZipDownloadRequest(BaseModel):
    url: str
    selected_ids: Optional[List[str]] = None


class TaskStatus(BaseModel):
    task_id: str
    status: Literal[
        "pending",
        "queued",
        "downloading",
        "muxing",
        "packaging",
        "completed",
        "failed",
    ]
    percent: float = 0.0
    speed: Optional[str] = None
    eta: Optional[str] = None
    filename: Optional[str] = None
    file_size: Optional[int] = None
    error: Optional[str] = None


class DownloadInitResponse(BaseModel):
    task_id: str
    stream_url: str
    status_url: str


class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    ffmpeg_available: bool
    version: str
