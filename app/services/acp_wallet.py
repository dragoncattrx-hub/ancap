import base64
import hashlib
import json
import os
import secrets
import shutil
import subprocess
from datetime import datetime, timezone

from argon2.low_level import Type, hash_secret_raw
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import UserAcpWallet


DEFAULT_DERIVATION_PATH = "m/44'/0'/0'/0/0"
SECRET_BOX_VERSION_LEGACY = 1
SECRET_BOX_VERSION_RECOVERY_READY = 2


def _walletd_cmd() -> list[str]:
    p = os.getenv("ACP_WALLETD_PATH", "").strip()
    if p:
        return [p]
    if shutil.which("walletd"):
        return ["walletd"]
    raise RuntimeError("ACP wallet helper is not configured (set ACP_WALLETD_PATH or put walletd in PATH)")


def _walletd_available() -> bool:
    p = os.getenv("ACP_WALLETD_PATH", "").strip()
    return bool(p or shutil.which("walletd"))


def _fallback_mnemonic() -> str:
    words = [
        "apple", "bridge", "cannon", "dawn", "ember", "forest",
        "globe", "harbor", "island", "jungle", "kernel", "lunar",
    ]
    return " ".join(words)


def _fallback_address(seed_text: str) -> str:
    h = hashlib.sha256(seed_text.encode("utf-8")).hexdigest()[:38]
    return f"acp1{h}"


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


def generate_wallet_secret() -> tuple[str, str, str]:
    if not _walletd_available():
        mnemonic = _fallback_mnemonic()
        address = _fallback_address(f"{mnemonic}:{secrets.token_hex(8)}")
        payload = json.dumps({"v": 2, "mnemonic": mnemonic, "keystore_json": "{}"}, separators=(",", ":"))
        return payload, mnemonic, address
    created = _run_walletd(["new"])
    mnemonic = str(created["mnemonic"]).strip()
    keystore_json = str(created.get("keystore_json") or "").strip()
    address = str(created["address"]).strip()
    if len(address) < 16:
        raise RuntimeError("ACP wallet helper returned invalid address")
    if not keystore_json:
        raise RuntimeError("ACP wallet helper did not return keystore_json")
    payload = json.dumps({"v": 2, "mnemonic": mnemonic, "keystore_json": keystore_json}, separators=(",", ":"))
    return payload, mnemonic, address


def derive_address(mnemonic: str, derivation_path: str = DEFAULT_DERIVATION_PATH) -> str:
    if not _walletd_available():
        return _fallback_address(f"{mnemonic}:{derivation_path or DEFAULT_DERIVATION_PATH}")
    args = ["address", "--mnemonic", mnemonic]
    if derivation_path:
        args += ["--derivation-path", derivation_path]
    try:
        res = _run_walletd(args)
    except RuntimeError:
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


def _encrypt_bytes(plaintext: bytes, key: bytes) -> tuple[str, str]:
    nonce = os.urandom(12)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext, None)
    return base64.b64encode(ciphertext).decode("ascii"), base64.b64encode(nonce).decode("ascii")


def _decrypt_bytes(ciphertext_b64: str, nonce_b64: str, key: bytes) -> bytes:
    return AESGCM(key).decrypt(
        base64.b64decode(nonce_b64),
        base64.b64decode(ciphertext_b64),
        None,
    )


def _get_recovery_master_key() -> bytes | None:
    raw = (get_settings().acp_wallet_recovery_master_key or "").strip()
    if not raw:
        return None
    digest = hashlib.sha256(raw.encode("utf-8")).digest()
    return digest


def encrypt_mnemonic(mnemonic: str, password: str) -> tuple[str, str, str]:
    if not password:
        raise ValueError("password is required")
    salt = os.urandom(16)
    key = _derive_key(password, salt)
    ciphertext_b64, nonce_b64 = _encrypt_bytes(mnemonic.encode("utf-8"), key)
    return ciphertext_b64, base64.b64encode(salt).decode("ascii"), nonce_b64


def decrypt_mnemonic(encrypted_mnemonic: str, salt_b64: str, nonce_b64: str, password: str) -> str:
    key = _derive_key(password, base64.b64decode(salt_b64))
    plaintext = _decrypt_bytes(encrypted_mnemonic, nonce_b64, key)
    return plaintext.decode("utf-8")


def decode_wallet_secret(secret_text: str) -> tuple[str, str | None]:
    text = (secret_text or "").strip()
    if not text:
        raise RuntimeError("empty wallet secret")
    try:
        payload = json.loads(text)
        if isinstance(payload, dict) and payload.get("v") == 2:
            mnemonic = str(payload.get("mnemonic") or "").strip()
            keystore_json = str(payload.get("keystore_json") or "").strip()
            if mnemonic and keystore_json:
                return mnemonic, keystore_json
    except Exception:
        pass
    return text, None


def _build_recovery_ready_fields(wallet_secret: str, password: str) -> dict[str, str | bool | int | None]:
    master_key = _get_recovery_master_key()
    if master_key is None:
        encrypted_mnemonic, salt_b64, nonce_b64 = encrypt_mnemonic(wallet_secret, password)
        return {
            "secret_box_version": SECRET_BOX_VERSION_LEGACY,
            "encrypted_mnemonic": encrypted_mnemonic,
            "salt_b64": salt_b64,
            "nonce_b64": nonce_b64,
            "secret_wrapped_b64": None,
            "secret_wrap_salt_b64": None,
            "secret_wrap_nonce_b64": None,
            "recovery_secret_box_b64": None,
            "recovery_secret_nonce_b64": None,
            "recovery_enabled": False,
        }

    secret_key = os.urandom(32)
    secret_wrapped_b64, secret_wrap_nonce_b64 = _encrypt_bytes(wallet_secret.encode("utf-8"), secret_key)

    wrap_salt = os.urandom(16)
    password_key = _derive_key(password, wrap_salt)
    recovery_secret_box_b64, recovery_secret_nonce_b64 = _encrypt_bytes(secret_key, master_key)
    encrypted_mnemonic, nonce_b64 = _encrypt_bytes(secret_key, password_key)

    return {
        "secret_box_version": SECRET_BOX_VERSION_RECOVERY_READY,
        "encrypted_mnemonic": encrypted_mnemonic,
        "salt_b64": base64.b64encode(wrap_salt).decode("ascii"),
        "nonce_b64": nonce_b64,
        "secret_wrapped_b64": secret_wrapped_b64,
        "secret_wrap_salt_b64": None,
        "secret_wrap_nonce_b64": secret_wrap_nonce_b64,
        "recovery_secret_box_b64": recovery_secret_box_b64,
        "recovery_secret_nonce_b64": recovery_secret_nonce_b64,
        "recovery_enabled": True,
    }


def _apply_wallet_secret_fields(wallet: UserAcpWallet, fields: dict[str, str | bool | int | None]) -> None:
    wallet.secret_box_version = int(fields["secret_box_version"] or SECRET_BOX_VERSION_LEGACY)
    wallet.encrypted_mnemonic = str(fields["encrypted_mnemonic"] or "")
    wallet.salt_b64 = str(fields["salt_b64"] or "")
    wallet.nonce_b64 = str(fields["nonce_b64"] or "")
    wallet.secret_wrapped_b64 = fields["secret_wrapped_b64"] if isinstance(fields["secret_wrapped_b64"], str) else None
    wallet.secret_wrap_salt_b64 = fields["secret_wrap_salt_b64"] if isinstance(fields["secret_wrap_salt_b64"], str) else None
    wallet.secret_wrap_nonce_b64 = fields["secret_wrap_nonce_b64"] if isinstance(fields["secret_wrap_nonce_b64"], str) else None
    wallet.recovery_secret_box_b64 = fields["recovery_secret_box_b64"] if isinstance(fields["recovery_secret_box_b64"], str) else None
    wallet.recovery_secret_nonce_b64 = fields["recovery_secret_nonce_b64"] if isinstance(fields["recovery_secret_nonce_b64"], str) else None
    wallet.recovery_enabled = bool(fields["recovery_enabled"])


def password_recovery_ready(wallet: UserAcpWallet) -> bool:
    return bool(
        getattr(wallet, "secret_box_version", SECRET_BOX_VERSION_LEGACY) >= SECRET_BOX_VERSION_RECOVERY_READY
        and wallet.recovery_enabled
        and wallet.secret_wrapped_b64
        and wallet.secret_wrap_nonce_b64
        and wallet.recovery_secret_box_b64
        and wallet.recovery_secret_nonce_b64
    )


def decrypt_wallet_secret_with_password(wallet: UserAcpWallet, password: str) -> str:
    if password_recovery_ready(wallet):
        password_key = _derive_key(password, base64.b64decode(wallet.salt_b64))
        secret_key = _decrypt_bytes(wallet.encrypted_mnemonic, wallet.nonce_b64, password_key)
        wallet_secret = _decrypt_bytes(wallet.secret_wrapped_b64, wallet.secret_wrap_nonce_b64, secret_key)
        return wallet_secret.decode("utf-8")
    return decrypt_mnemonic(wallet.encrypted_mnemonic, wallet.salt_b64, wallet.nonce_b64, password)


def decrypt_wallet_secret_with_recovery_key(wallet: UserAcpWallet) -> str:
    if not password_recovery_ready(wallet):
        raise RuntimeError("wallet is not recovery-ready")
    master_key = _get_recovery_master_key()
    if master_key is None:
        raise RuntimeError("ACP wallet recovery master key is not configured")
    secret_key = _decrypt_bytes(wallet.recovery_secret_box_b64, wallet.recovery_secret_nonce_b64, master_key)
    wallet_secret = _decrypt_bytes(wallet.secret_wrapped_b64, wallet.secret_wrap_nonce_b64, secret_key)
    return wallet_secret.decode("utf-8")


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
    wallet_secret, mnemonic, address = generate_wallet_secret()
    fields = _build_recovery_ready_fields(wallet_secret, password)
    now = datetime.now(timezone.utc)
    wallet = UserAcpWallet(
        user_id=user_id,
        address=address,
        encrypted_mnemonic=str(fields["encrypted_mnemonic"]),
        salt_b64=str(fields["salt_b64"]),
        nonce_b64=str(fields["nonce_b64"]),
        secret_box_version=int(fields["secret_box_version"] or SECRET_BOX_VERSION_LEGACY),
        secret_wrapped_b64=fields["secret_wrapped_b64"] if isinstance(fields["secret_wrapped_b64"], str) else None,
        secret_wrap_salt_b64=fields["secret_wrap_salt_b64"] if isinstance(fields["secret_wrap_salt_b64"], str) else None,
        secret_wrap_nonce_b64=fields["secret_wrap_nonce_b64"] if isinstance(fields["secret_wrap_nonce_b64"], str) else None,
        recovery_secret_box_b64=fields["recovery_secret_box_b64"] if isinstance(fields["recovery_secret_box_b64"], str) else None,
        recovery_secret_nonce_b64=fields["recovery_secret_nonce_b64"] if isinstance(fields["recovery_secret_nonce_b64"], str) else None,
        recovery_enabled=bool(fields["recovery_enabled"]),
        derivation_path=derivation_path,
        created_at=now,
        updated_at=now,
    )
    session.add(wallet)
    await session.flush()
    return wallet, mnemonic


async def rewrap_wallet_secret_for_password_change(
    session: AsyncSession,
    user_id: str,
    current_password: str,
    new_password: str,
) -> UserAcpWallet | None:
    wallet = await get_wallet_for_user(session, user_id)
    if wallet is None:
        return None
    secret = decrypt_wallet_secret_with_password(wallet, current_password)
    fields = _build_recovery_ready_fields(secret, new_password)
    _apply_wallet_secret_fields(wallet, fields)
    wallet.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return wallet


async def set_wallet_secret_for_password(
    session: AsyncSession,
    user_id: str,
    wallet_secret: str,
    new_password: str,
) -> UserAcpWallet | None:
    wallet = await get_wallet_for_user(session, user_id)
    if wallet is None:
        return None
    fields = _build_recovery_ready_fields(wallet_secret, new_password)
    _apply_wallet_secret_fields(wallet, fields)
    wallet.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return wallet


async def migrate_wallet_to_recovery_ready(
    session: AsyncSession,
    user_id: str,
    password: str,
) -> UserAcpWallet | None:
    wallet = await get_wallet_for_user(session, user_id)
    if wallet is None or password_recovery_ready(wallet):
        return wallet
    if _get_recovery_master_key() is None:
        return wallet
    secret = decrypt_wallet_secret_with_password(wallet, password)
    fields = _build_recovery_ready_fields(secret, password)
    _apply_wallet_secret_fields(wallet, fields)
    wallet.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return wallet
