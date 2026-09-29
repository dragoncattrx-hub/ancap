"""Webhook destination URL policy (SSRF hardening)."""
from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

from app.config import get_settings


class UnsafeWebhookUrl(ValueError):
    """Raised when a webhook URL is not allowed as a server-side fetch target."""


_BLOCKED_HOSTNAMES = frozenset(
    {
        "localhost",
        "localhost.localdomain",
        "metadata.google.internal",
        "metadata",
    }
)


def _is_blocked_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        return True
    # Cloud metadata / CGNAT / IPv6 ULA & link-local (belt-and-suspenders)
    blocked_nets = (
        "169.254.0.0/16",
        "100.64.0.0/10",
        "::1/128",
        "fc00::/7",
        "fe80::/10",
    )
    return any(ip in ipaddress.ip_network(net) for net in blocked_nets)


def validate_webhook_url(url: str, *, resolve_dns: bool = True) -> str:
    """Validate webhook URL for SSRF safety. Returns normalized URL or raises UnsafeWebhookUrl."""
    raw = (url or "").strip()
    if not raw or len(raw) > 2048:
        raise UnsafeWebhookUrl("URL is empty or too long")

    parsed = urlparse(raw)
    scheme = (parsed.scheme or "").lower()
    settings = get_settings()
    env = (settings.environment or "development").strip().lower()
    if env == "production":
        if scheme != "https":
            raise UnsafeWebhookUrl("Production webhooks require https")
    elif scheme not in {"http", "https"}:
        raise UnsafeWebhookUrl("URL must be http or https")

    host = (parsed.hostname or "").strip().lower().rstrip(".")
    if not host:
        raise UnsafeWebhookUrl("URL host is required")
    if host in _BLOCKED_HOSTNAMES or host.endswith(".local") or host.endswith(".internal"):
        raise UnsafeWebhookUrl("URL host is not allowed")
    if parsed.username or parsed.password:
        raise UnsafeWebhookUrl("URL must not include credentials")
    if parsed.port in {22, 25, 465, 587, 3306, 5432, 6379, 11211, 27017}:
        raise UnsafeWebhookUrl("URL port is not allowed")

    try:
        literal_ip = ipaddress.ip_address(host)
    except ValueError:
        literal_ip = None
    if literal_ip is not None and _is_blocked_ip(literal_ip):
        raise UnsafeWebhookUrl("URL resolves to a blocked address")

    if resolve_dns and literal_ip is None:
        try:
            infos = socket.getaddrinfo(
                host,
                parsed.port or (443 if scheme == "https" else 80),
                type=socket.SOCK_STREAM,
            )
        except socket.gaierror as exc:
            raise UnsafeWebhookUrl("URL host could not be resolved") from exc
        if not infos:
            raise UnsafeWebhookUrl("URL host could not be resolved")
        for info in infos:
            sockaddr = info[4]
            if not sockaddr:
                continue
            try:
                resolved = ipaddress.ip_address(sockaddr[0])
            except ValueError:
                continue
            if _is_blocked_ip(resolved):
                raise UnsafeWebhookUrl("URL resolves to a blocked address")

    return raw
