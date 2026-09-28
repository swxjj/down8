"""
Modular platform extractors package.
Provides factory dispatching to specialized extractors for YouTube, Instagram, X (Twitter), and Facebook.
"""

from typing import List
from app.services.extractors.base import (
    BaseExtractor,
    BaseMediaError,
    BotChallengeError,
    MediaNotFoundError,
    PrivateMediaError,
    RateLimitError,
    UnsupportedPlatformError,
    classify_ytdlp_error,
)
from app.services.extractors.youtube import YouTubeExtractor
from app.services.extractors.instagram import InstagramExtractor
from app.services.extractors.twitter import TwitterExtractor
from app.services.extractors.facebook import FacebookExtractor
from app.services.extractors.generic import GenericExtractor

# Registry of specialized extractors in evaluation order
EXTRACTOR_REGISTRY: List[BaseExtractor] = [
    YouTubeExtractor(),
    InstagramExtractor(),
    TwitterExtractor(),
    FacebookExtractor(),
]

FALLBACK_EXTRACTOR = GenericExtractor()


def get_extractor(url: str) -> BaseExtractor:
    """
    Select the appropriate extractor for the given URL.
    Returns the first matching specialized extractor or falls back to GenericExtractor.
    """
    if not url:
        return FALLBACK_EXTRACTOR

    clean_url = url.strip()
    for extractor in EXTRACTOR_REGISTRY:
        if extractor.can_handle(clean_url):
            return extractor

    return FALLBACK_EXTRACTOR


__all__ = [
    "BaseExtractor",
    "YouTubeExtractor",
    "InstagramExtractor",
    "TwitterExtractor",
    "FacebookExtractor",
    "GenericExtractor",
    "BaseMediaError",
    "MediaNotFoundError",
    "PrivateMediaError",
    "RateLimitError",
    "BotChallengeError",
    "UnsupportedPlatformError",
    "classify_ytdlp_error",
    "get_extractor",
]
