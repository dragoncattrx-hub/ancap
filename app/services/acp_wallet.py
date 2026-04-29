import base64
import os
import shutil
import subprocess
from datetime import datetime, timezone

from argon2.low_level import Type, hash_secret_raw
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import UserAcpWallet


DEFAULT_DERIVATION_PATH = "m/44'/0'/0'/0/0"


def _walletd_cmd() -> list[str]:
    p = os.getenv("ACP_WALLETD_PATH", "").strip()
    if p:
        return [p]
    if shutil.which("walletd"):
        return ["walletd"]
    raise RuntimeError("ACP wallet helper is not configured (set ACP_WALLETD_PATH or put walletd in PATH)")


def _run_walletd(args: list[str], timeout_s: int = 90) -> dict:
    try:
        r = subprocess.run(
            _walletd_cmd() + args,
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout_s,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("ACP wallet helper timed out") from exc

    out = (r.stdout or "").strip()
    try:
        import json

        payload = json.loads(out) if out else {}
    except Exception as exc:
        raise RuntimeError(f"ACP wallet helper returned non-JSON output: {out[:200]}") from exc

    if r.returncode != 0 or not payload.get("ok"):
        err = payload.get("error") or (r.stderr or "").strip() or "unknown"
        raise RuntimeError(f"ACP wallet helper failed: {err}")
    return payload["result"]


def generate_mnemonic() -> str:
    created = _run_walletd(["new"])
    mnemonic = str(created["mnemonic"]).strip()
    words = [w for w in mnemonic.split() if w.strip()]
    if len(words) not in (12, 15, 18, 21, 24):
        raise RuntimeError("ACP wallet helper returned invalid mnemonic")
    return " ".join(words)


def derive_address(mnemonic: str, derivation_path: str = DEFAULT_DERIVATION_PATH) -> str:
    args = ["address", "--mnemonic", mnemonic]
    if derivation_path:
        args += ["--derivation-path", derivation_path]
    try:
        res = _run_walletd(args)
    except RuntimeError:
        # Backward compatibility: old walletd builds may not support derivation path.
        res = _run_walletd(["address", "--mnemonic", mnemonic])
    address = str(res["address"]).strip()
    if len(address) < 16:
        raise RuntimeError("ACP wallet helper returned invalid address")
    return address


def _derive_key(password: str, salt: bytes) -> bytes:
    return hash_secret_raw(
        secret=password.encode("utf-8"),
        salt=salt,
        time_cost=3,
        memory_cost=65536,
        parallelism=1,
        hash_len=32,
        type=Type.ID,
    )


def encrypt_mnemonic(mnemonic: str, password: str) -> tuple[str, str, str]:
    if not password:
        raise ValueError("password is required")
    salt = os.urandom(16)
    nonce = os.urandom(12)
    key = _derive_key(password, salt)
    ciphertext = AESGCM(key).encrypt(nonce, mnemonic.encode("utf-8"), None)
    return (
        base64.b64encode(ciphertext).decode("ascii"),
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(nonce).decode("ascii"),
    )


def decrypt_mnemonic(encrypted_mnemonic: str, salt_b64: str, nonce_b64: str, password: str) -> str:
    key = _derive_key(password, base64.b64decode(salt_b64))
    plaintext = AESGCM(key).decrypt(
        base64.b64decode(nonce_b64),
        base64.b64decode(encrypted_mnemonic),
        None,
    )
    return plaintext.decode("utf-8")


async def get_wallet_for_user(session: AsyncSession, user_id: str) -> UserAcpWallet | None:
    q = select(UserAcpWallet).where(UserAcpWallet.user_id == user_id)
    row = await session.execute(q)
    return row.scalar_one_or_none()


async def create_wallet_for_user(
    session: AsyncSession,
    user_id: str,
    password: str,
    derivation_path: str = DEFAULT_DERIVATION_PATH,
) -> tuple[UserAcpWallet, str]:
    mnemonic = generate_mnemonic()
    address = derive_address(mnemonic, derivation_path=derivation_path)
    encrypted_mnemonic, salt_b64, nonce_b64 = encrypt_mnemonic(mnemonic, password)
    now = datetime.now(timezone.utc)
    wallet = UserAcpWallet(
        user_id=user_id,
        address=address,
        encrypted_mnemonic=encrypted_mnemonic,
        salt_b64=salt_b64,
        nonce_b64=nonce_b64,
        derivation_path=derivation_path,
        created_at=now,
        updated_at=now,
    )
    session.add(wallet)
    await session.flush()
    return wallet, mnemonic

