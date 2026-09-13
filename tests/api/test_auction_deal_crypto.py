"""Auction-deal X-Wing draft-10 envelope round-trip."""

from app.services.auction_deal_crypto import (
    CIPHER_ID,
    decrypt_deal,
    encrypt_deal,
    vault_public_meta,
)
from app.services.auction_deal_seal import seal_auction_deal


def test_auction_deal_xwing_roundtrip():
    env, chash, cipher_id = encrypt_deal(
        {"vertical": "tech", "amount_acp": "58000", "lot_id": "tech-stardust-weather-control-global"}
    )
    assert cipher_id == CIPHER_ID
    assert chash.startswith("sha256:")
    opened = decrypt_deal(envelope_b64=env)
    assert opened["amount_acp"] == "58000"
    meta = vault_public_meta()
    assert "X-Wing" in meta["kem"]


def test_seal_auction_deal_vertical_context():
    env, chash, cipher_id = seal_auction_deal(
        vertical="tech",
        bid_id="b1",
        lot_id="lot1",
        bidder_user_id="u1",
        amount_acp="1000.00000000",
        note="secret note",
        contract_hash="abc",
        tx_hash="0xdead",
    )
    assert cipher_id.startswith("xwing-draft10")
    from app.services.auction_deal_crypto import decrypt_deal

    opened = decrypt_deal(envelope_b64=env, context=b"ACP/auction-deal/tech/v1")
    assert opened["note"] == "secret note"
    assert opened["tx_hash"] == "0xdead"
    assert chash.startswith("sha256:")
