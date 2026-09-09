"""Auction escrow driver — mock + BSC operator anchoring for auction verticals."""
from __future__ import annotations

import hashlib
from decimal import Decimal

from eth_account import Account
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

from app.config import get_settings

ESCROW_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "lotId", "type": "bytes32"},
            {"internalType": "address", "name": "seller", "type": "address"},
            {"internalType": "uint256", "name": "reserveAcp", "type": "uint256"},
            {"internalType": "bytes32", "name": "claimHash", "type": "bytes32"},
            {"internalType": "string", "name": "vertical", "type": "string"},
        ],
        "name": "createLot",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "lotId", "type": "bytes32"},
            {"internalType": "address", "name": "bidder", "type": "address"},
            {"internalType": "uint256", "name": "amountAcp", "type": "uint256"},
            {"internalType": "bytes32", "name": "bidHash", "type": "bytes32"},
        ],
        "name": "recordBid",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "lotId", "type": "bytes32"},
            {"internalType": "address", "name": "winner", "type": "address"},
            {"internalType": "uint256", "name": "amountAcp", "type": "uint256"},
        ],
        "name": "settle",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]


def mock_tx_hash(seed: str) -> str:
    return "0x" + hashlib.sha256(f"auction-escrow:{seed}".encode()).hexdigest()


def lot_id_bytes32(lot_id: str) -> bytes:
    return hashlib.sha256(f"lot:{lot_id}".encode()).digest()


def claim_bytes32(claim_hash: str) -> bytes:
    normalized = claim_hash.lower().removeprefix("0x")
    if len(normalized) == 64:
        try:
            return bytes.fromhex(normalized)
        except ValueError:
            pass
    return hashlib.sha256(claim_hash.encode()).digest()


def acp_to_wei(amount: Decimal) -> int:
    scaled = (amount * Decimal(10**18)).quantize(Decimal("1"))
    return int(scaled)


def _build_web3(rpc_url: str) -> Web3:
    w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 30}))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    return w3


def _operator_key() -> str:
    settings = get_settings()
    pk = (settings.auction_escrow_operator_private_key or "").strip()
    if not pk:
        raise ValueError(
            "AUCTION_ESCROW_OPERATOR_PRIVATE_KEY required for BSC driver "
            "(bridge/passport keys are not allowed)"
        )
    return pk


def anchor_create_lot(
    *,
    lot_id: str,
    seller_address: str,
    reserve_acp: Decimal,
    claim_hash: str,
    vertical: str,
) -> tuple[str, str | None]:
    """Returns (tx_hash, contract_address)."""
    settings = get_settings()
    driver = (settings.auction_escrow_driver or "mock").strip().lower()
    contract = (settings.auction_escrow_contract or "").strip() or None

    if driver == "mock" or not contract:
        return mock_tx_hash(f"create:{vertical}:{lot_id}:{claim_hash}"), contract

    if driver != "bsc":
        raise ValueError(f"Unknown auction escrow driver: {driver}")

    rpc = (settings.auction_escrow_bsc_rpc_url or settings.bridge_bsc_rpc_url or "").strip()
    pk = _operator_key()
    if not rpc:
        raise ValueError("Auction escrow BSC RPC not configured")

    w3 = _build_web3(rpc)
    account = Account.from_key(pk)
    escrow = w3.eth.contract(address=Web3.to_checksum_address(contract), abi=ESCROW_ABI)
    seller = Web3.to_checksum_address(seller_address) if seller_address.startswith("0x") else account.address
    tx = escrow.functions.createLot(
        lot_id_bytes32(lot_id),
        seller,
        acp_to_wei(reserve_acp),
        claim_bytes32(claim_hash),
        vertical,
    ).build_transaction(
        {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gasPrice": w3.eth.gas_price,
            "chainId": w3.eth.chain_id,
        }
    )
    tx["gas"] = w3.eth.estimate_gas(tx)
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return w3.to_hex(tx_hash), contract


def anchor_bid(
    *,
    lot_id: str,
    bidder_address: str,
    amount_acp: Decimal,
    bid_hash: str,
) -> tuple[str, str | None]:
    settings = get_settings()
    driver = (settings.auction_escrow_driver or "mock").strip().lower()
    contract = (settings.auction_escrow_contract or "").strip() or None

    if driver == "mock" or not contract:
        return mock_tx_hash(f"bid:{lot_id}:{bid_hash}:{amount_acp}"), contract

    if driver != "bsc":
        raise ValueError(f"Unknown auction escrow driver: {driver}")

    rpc = (settings.auction_escrow_bsc_rpc_url or settings.bridge_bsc_rpc_url or "").strip()
    pk = _operator_key()
    if not rpc:
        raise ValueError("Auction escrow BSC RPC not configured")

    w3 = _build_web3(rpc)
    account = Account.from_key(pk)
    escrow = w3.eth.contract(address=Web3.to_checksum_address(contract), abi=ESCROW_ABI)
    bidder = Web3.to_checksum_address(bidder_address) if bidder_address.startswith("0x") else account.address
    tx = escrow.functions.recordBid(
        lot_id_bytes32(lot_id),
        bidder,
        acp_to_wei(amount_acp),
        claim_bytes32(bid_hash),
    ).build_transaction(
        {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gasPrice": w3.eth.gas_price,
            "chainId": w3.eth.chain_id,
        }
    )
    tx["gas"] = w3.eth.estimate_gas(tx)
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return w3.to_hex(tx_hash), contract
