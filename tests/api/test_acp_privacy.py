from app.services.acp_privacy import (
    PRIVACY_PROFILE,
    encode_acp_address,
    redact_address,
    subaddress_bech32,
    subaddress_hash20,
)


def test_subaddress_index_zero_is_sha_prefix():
    wire = b"test-view-wire-bytes-for-privacy"
    h = subaddress_hash20(wire, 0)
    import hashlib

    assert h == hashlib.sha256(wire).digest()[:20]
    addr = encode_acp_address(h)
    assert addr.startswith("acp1")


def test_subaddresses_unlink_across_indices():
    wire = b"test-view-wire-bytes-for-privacy"
    a1 = subaddress_bech32(wire, 1)
    a2 = subaddress_bech32(wire, 2)
    assert a1 != a2
    assert a1.startswith("acp1")
    assert a2.startswith("acp1")


def test_redact_address():
    r = redact_address("acp1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq")
    assert "…" in r
    assert r.startswith("acp1")
    assert PRIVACY_PROFILE.startswith("unlinkable")
