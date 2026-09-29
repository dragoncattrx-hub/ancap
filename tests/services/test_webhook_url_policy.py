import ipaddress

from app.services.webhook_url_policy import UnsafeWebhookUrl, validate_webhook_url


def test_rejects_loopback_and_metadata_hosts():
    for url in (
        "http://127.0.0.1/hook",
        "http://localhost/hook",
        "http://169.254.169.254/latest/meta-data",
        "http://[::1]/hooks",
    ):
        try:
            validate_webhook_url(url, resolve_dns=False)
            raise AssertionError(f"expected rejection for {url}")
        except UnsafeWebhookUrl:
            pass


def test_accepts_public_https_without_dns_when_asked():
    out = validate_webhook_url("https://hooks.example.com/path", resolve_dns=False)
    assert out.url.startswith("https://hooks.example.com/")
    assert out.hostname == "hooks.example.com"
    assert out.pinned_ip is None
    assert out.pinned_request_url() == out.url


def test_rejects_ipv4_mapped_cgnat():
    mapped = ipaddress.IPv6Address("::ffff:100.64.0.1")
    assert mapped.ipv4_mapped is not None
    try:
        validate_webhook_url("http://[::ffff:100.64.0.1]/hook", resolve_dns=False)
        raise AssertionError("expected rejection for IPv4-mapped CGNAT")
    except UnsafeWebhookUrl:
        pass


def test_pinned_request_url_uses_literal_ip():
    target = validate_webhook_url("https://93.184.216.34/callback?x=1", resolve_dns=False)
    assert target.pinned_ip == "93.184.216.34"
    pinned = target.pinned_request_url()
    assert "93.184.216.34" in pinned
    assert pinned.startswith("https://")
    assert "callback?x=1" in pinned
