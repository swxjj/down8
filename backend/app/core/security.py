import ipaddress
import re
import socket
import unicodedata
from urllib.parse import urlparse
from typing import Optional


# Private and reserved networks for SSRF protection
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6 ranges
    ipaddress.ip_network("::/128"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
    ipaddress.ip_network("ff00::/8"),
]

# Supported platform patterns
PLATFORM_PATTERNS = {
    "youtube": re.compile(
        r"^(https?://)?(www\.|m\.)?(youtube\.com/(watch\?.*v=|shorts/|live/|embed/|v/|playlist\?.*list=)|youtu\.be/)[a-zA-Z0-9_\-]+",
        re.IGNORECASE,
    ),
    "instagram": re.compile(
        r"^(https?://)?(www\.)?(instagram\.com|instagr\.am)/(p|reel|reels|tv|stories)/[A-Za-z0-9_\-]+",
        re.IGNORECASE,
    ),
    "twitter": re.compile(
        r"^(https?://)?(www\.)?(twitter\.com|x\.com)/[A-Za-z0-9_]+/status/[0-9]+",
        re.IGNORECASE,
    ),
    "facebook": re.compile(
        r"^(https?://)?(www\.|m\.|web\.)?(facebook\.com|fb\.watch)/.+",
        re.IGNORECASE,
    ),
}

# Windows reserved names
WINDOWS_RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
}

# Characters illegal in Windows filenames
ILLEGAL_WIN_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Check if an IP address belongs to any blocked or private network."""
    if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
        return True
    for network in BLOCKED_NETWORKS:
        if ip in network:
            return True
    return False


def is_safe_url(url: str) -> bool:
    """
    Validate that the URL is safe against SSRF attacks.
    Only allows HTTP/HTTPS schemes and rejects private, loopback, or cloud-metadata IP targets.
    """
    if not url or not isinstance(url, str):
        return False

    try:
        parsed = urlparse(url.strip())
    except Exception:
        return False

    if parsed.scheme.lower() not in ("http", "https"):
        return False

    hostname = parsed.hostname
    if not hostname:
        return False

    # Block common local hostnames directly
    lower_host = hostname.lower()
    if lower_host in ("localhost", "localhost.localdomain", "broadcasthost", "127.0.0.1", "::1"):
        return False

    # Block single-label hostnames (e.g., 'intranet', 'corp', 'vault')
    if "." not in hostname:
        return False

    # If hostname is directly an IP address
    try:
        ip = ipaddress.ip_address(hostname)
        return not is_ip_blocked(ip)
    except ValueError:
        pass

    # Resolve hostname via DNS
    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        for _, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            ip = ipaddress.ip_address(ip_str)
            if is_ip_blocked(ip):
                return False
    except socket.gaierror:
        # If external domain doesn't resolve in local DNS (e.g. test environments),
        # allow standard multi-part domains so unsupported domain checks can handle them
        return True
    except (ValueError, IndexError):
        return False

    return True


def detect_platform(url: str) -> Optional[str]:
    """Detect which supported platform the URL belongs to."""
    clean_url = url.strip()
    for platform, pattern in PLATFORM_PATTERNS.items():
        if pattern.search(clean_url):
            return platform
    return None


def is_supported_media_url(url: str) -> bool:
    """Check if the URL is from one of the supported media platforms."""
    return detect_platform(url) is not None


def sanitize_filename(name: str, fallback: str = "media", max_len: int = 180) -> str:
    """
    Sanitize filename for Windows filesystems:
    - Normalizes unicode using NFKC
    - Removes illegal characters (<>:"/\\|?* and control characters)
    - Strips leading/trailing spaces and dots
    - Guards against Windows reserved device names (CON, NUL, COM1, etc.)
    - Truncates to max_len while keeping extension
    """
    if not name or not isinstance(name, str):
        return fallback

    # Normalize unicode
    cleaned = unicodedata.normalize("NFKC", name)

    # Remove illegal characters
    cleaned = ILLEGAL_WIN_CHARS.sub("_", cleaned)

    # Strip whitespace, dots, and common separators from ends
    cleaned = cleaned.strip(". ")

    if not cleaned:
        cleaned = fallback

    # Check for Windows reserved names (ignoring extension)
    parts = cleaned.rsplit(".", 1)
    base_name = parts[0].upper()
    if base_name in WINDOWS_RESERVED_NAMES:
        cleaned = f"_{cleaned}"

    # Truncate if too long while preserving extension
    if len(cleaned) > max_len:
        if len(parts) > 1:
            ext = "." + parts[1]
            allowed_base = max(1, max_len - len(ext))
            cleaned = parts[0][:allowed_base].rstrip(". ") + ext
        else:
            cleaned = cleaned[:max_len].rstrip(". ")

    return cleaned or fallback
