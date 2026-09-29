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
    # Skip DNS so unit tests stay offline-stable.
    out = validate_webhook_url("https://hooks.example.com/path", resolve_dns=False)
    assert out.startswith("https://hooks.example.com/")
