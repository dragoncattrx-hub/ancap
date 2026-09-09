"""Digital passport issuance — mock and BSC soulbound minter drivers."""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone
from eth_account import Account
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

from app.config import get_settings
from app.db.models import (
    DigitalPassport,
    DigitalPassportStatusEnum,
    MemberVerificationStatusEnum,
    OrganizationMember,
    UserNfcCredential,
)
from app.services.chain_anchor import anchor_mock

PASSPORT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
            {"internalType": "bytes32", "name": "claimHash", "type": "bytes32"},
            {"internalType": "string", "name": "uri", "type": "string"},
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "revoke",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]


def compute_claim_hash(
    *,
    user_id: uuid.UUID,
    org_id: uuid.UUID | None,
    nfc_uid_hash: str | None,
    verification_status: str,
) -> str:
    payload = f"{user_id}:{org_id or ''}:{nfc_uid_hash or ''}:{verification_status}:v1"
    return "0x" + hashlib.sha256(payload.encode()).hexdigest()


def claim_hash_to_bytes32(claim_hash: str) -> bytes:
    normalized = claim_hash.lower().removeprefix("0x")
    return bytes.fromhex(normalized.zfill(64))


def build_token_uri(passport_id: uuid.UUID) -> str:
    return f"https://api.ancap.cloud/v1/passports/{passport_id}/metadata"


def mock_tx_hash(seed: str) -> str:
    return "0x" + hashlib.sha256(f"digital-passport:{seed}".encode()).hexdigest()


def _build_web3(rpc_url: str) -> Web3:
    w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 30}))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    return w3


async def _next_token_id(session: AsyncSession) -> int:
    q = select(func.coalesce(func.max(DigitalPassport.token_id), 0))
    r = await session.execute(q)
    current = int(r.scalar_one())
    return current + 1


async def _mint_on_chain(
    *,
    wallet_address: str,
    token_id: int,
    claim_hash: str,
    token_uri: str,
) -> tuple[str, str | None]:
    settings = get_settings()
    driver = (settings.digital_passport_driver or "mock").strip().lower()
    contract = (settings.digital_passport_contract or "").strip()

    if driver == "mock" or not contract:
        return mock_tx_hash(f"{wallet_address}:{token_id}:{claim_hash}"), contract or None

    if driver != "bsc":
        raise ValueError(f"Unknown digital passport driver: {driver}")

    rpc = (settings.bridge_bsc_rpc_url or settings.digital_passport_bsc_rpc_url or "").strip()
    pk = (settings.digital_passport_minter_private_key or "").strip()
    if not rpc or not pk:
        raise ValueError(
            "BSC passport minter not configured "
            "(set DIGITAL_PASSPORT_MINTER_PRIVATE_KEY and RPC; bridge key is not allowed)"
        )

    w3 = _build_web3(rpc)
    account = Account.from_key(pk)
    passport = w3.eth.contract(address=Web3.to_checksum_address(contract), abi=PASSPORT_ABI)
    nonce = w3.eth.get_transaction_count(account.address)
    gas_price = w3.eth.gas_price
    tx = passport.functions.mint(
        Web3.to_checksum_address(wallet_address),
        token_id,
        claim_hash_to_bytes32(claim_hash),
        token_uri,
    ).build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "gasPrice": gas_price,
            "chainId": w3.eth.chain_id,
        }
    )
    tx["gas"] = w3.eth.estimate_gas(tx)
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return w3.to_hex(tx_hash), contract


async def _revoke_on_chain(*, token_id: int, tx_seed: str) -> str:
    settings = get_settings()
    driver = (settings.digital_passport_driver or "mock").strip().lower()
    contract = (settings.digital_passport_contract or "").strip()

    if driver == "mock" or not contract:
        return mock_tx_hash(f"revoke:{token_id}:{tx_seed}")

    if driver != "bsc":
        raise ValueError(f"Unknown digital passport driver: {driver}")

    rpc = (settings.bridge_bsc_rpc_url or settings.digital_passport_bsc_rpc_url or "").strip()
    pk = (settings.digital_passport_minter_private_key or "").strip()
    if not rpc or not pk:
        raise ValueError(
            "BSC passport minter not configured "
            "(set DIGITAL_PASSPORT_MINTER_PRIVATE_KEY and RPC; bridge key is not allowed)"
        )

    w3 = _build_web3(rpc)
    account = Account.from_key(pk)
    passport = w3.eth.contract(address=Web3.to_checksum_address(contract), abi=PASSPORT_ABI)
    nonce = w3.eth.get_transaction_count(account.address)
    gas_price = w3.eth.gas_price
    tx = passport.functions.revoke(token_id).build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "gasPrice": gas_price,
            "chainId": w3.eth.chain_id,
        }
    )
    tx["gas"] = w3.eth.estimate_gas(tx)
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return w3.to_hex(tx_hash)


async def issue_passport(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    org_id: uuid.UUID | None,
    wallet_address: str,
    nfc_credential_id: uuid.UUID | None = None,
    member: OrganizationMember | None = None,
) -> DigitalPassport:
    active_q = select(DigitalPassport).where(
        DigitalPassport.user_id == user_id,
        DigitalPassport.org_id == org_id,
        DigitalPassport.status == DigitalPassportStatusEnum.active,
    )
    existing = (await session.execute(active_q)).scalar_one_or_none()
    if existing is not None:
        return existing

    if member is not None and member.verification_status != MemberVerificationStatusEnum.verified:
        raise ValueError("Member must be verified before passport issuance")

    nfc_hash = member.nfc_uid_hash if member else None
    claim_hash = compute_claim_hash(
        user_id=user_id,
        org_id=org_id,
        nfc_uid_hash=nfc_hash,
        verification_status=MemberVerificationStatusEnum.verified.value,
    )

    passport_id = uuid.uuid4()
    token_id = await _next_token_id(session)
    token_uri = build_token_uri(passport_id)
    settings = get_settings()

    tx_hash, contract_address = await _mint_on_chain(
        wallet_address=wallet_address,
        token_id=token_id,
        claim_hash=claim_hash,
        token_uri=token_uri,
    )

    now = datetime.now(timezone.utc)
    rec = DigitalPassport(
        id=passport_id,
        user_id=user_id,
        org_id=org_id,
        wallet_address=wallet_address.lower(),
        token_id=token_id,
        claim_hash=claim_hash,
        chain_id=settings.digital_passport_chain_id,
        contract_address=contract_address,
        tx_hash=tx_hash,
        token_uri=token_uri,
        status=DigitalPassportStatusEnum.active,
        nfc_credential_id=nfc_credential_id,
        issued_at=now,
    )
    session.add(rec)
    await session.flush()

    await anchor_mock(
        session,
        chain_id=settings.digital_passport_chain_id,
        payload_type="digital_passport",
        payload_hash=claim_hash.removeprefix("0x"),
        payload_json={
            "passport_id": str(passport_id),
            "user_id": str(user_id),
            "org_id": str(org_id) if org_id else None,
            "token_id": token_id,
            "tx_hash": tx_hash,
        },
    )
    return rec


async def get_active_passport_for_member(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
) -> DigitalPassport | None:
    q = select(DigitalPassport).where(
        DigitalPassport.user_id == user_id,
        DigitalPassport.org_id == org_id,
        DigitalPassport.status == DigitalPassportStatusEnum.active,
    )
    return (await session.execute(q)).scalar_one_or_none()


async def revoke_passport_for_member(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
) -> DigitalPassport | None:
    passport = await get_active_passport_for_member(session, user_id=user_id, org_id=org_id)
    if passport is None:
        return None
    return await revoke_passport(session, passport)


async def revoke_passport(session: AsyncSession, passport: DigitalPassport) -> DigitalPassport:
    if passport.status == DigitalPassportStatusEnum.revoked:
        return passport

    tx_hash = await _revoke_on_chain(token_id=int(passport.token_id), tx_seed=str(passport.id))
    now = datetime.now(timezone.utc)
    passport.status = DigitalPassportStatusEnum.revoked
    passport.revoked_at = now
    passport.updated_at = now
    passport.tx_hash = tx_hash
    await session.flush()
    return passport


async def resolve_nfc_credential(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    nfc_credential_id: uuid.UUID | None,
) -> UserNfcCredential | None:
    if nfc_credential_id is None:
        return None
    q = select(UserNfcCredential).where(
        UserNfcCredential.id == nfc_credential_id,
        UserNfcCredential.user_id == user_id,
        UserNfcCredential.revoked_at.is_(None),
    )
    return (await session.execute(q)).scalar_one_or_none()


def explorer_url(tx_hash: str | None) -> str | None:
    if not tx_hash:
        return None
    settings = get_settings()
    base = (settings.bsc_explorer_base or "https://bscscan.com").rstrip("/")
    return f"{base}/tx/{tx_hash}"
