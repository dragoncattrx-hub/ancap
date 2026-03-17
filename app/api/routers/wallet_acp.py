import json
import os
import subprocess
from pathlib import Path
import shutil

from fastapi import APIRouter, Header, HTTPException

from app.config import get_settings
from app.schemas import AcpBalanceResponse, AcpDepositAddressResponse, AcpWithdrawRequest, AcpWithdrawResponse


router = APIRouter(prefix="/wallet/acp", tags=["Wallet (ACP)"])


def _walletd_cmd() -> list[str]:
    """
    Uses a dedicated helper binary implemented in ACP-crypto/acp-wallet/src/bin/walletd.rs.
    For production set ACP_WALLETD_PATH to the compiled binary path.
    """
    p = os.getenv("ACP_WALLETD_PATH", "").strip()
    if p:
        return [p]
    # Fallback to PATH lookup to simplify container deployments where walletd is mounted into /usr/local/bin.
    if shutil.which("walletd"):
        return ["walletd"]
    raise HTTPException(
        status_code=503,
        detail="ACP wallet helper is not configured (set ACP_WALLETD_PATH or make 'walletd' available in PATH)",
    )


def _run_walletd(args: list[str], timeout_s: int = 90) -> dict:
    try:
        r = subprocess.run(
            _walletd_cmd() + args,
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout_s,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="ACP wallet helper timed out")

    out = (r.stdout or "").strip()
    try:
        payload = json.loads(out) if out else {}
    except Exception:
        raise HTTPException(status_code=502, detail=f"ACP wallet helper returned non-JSON output: {out[:200]}")

    if r.returncode != 0 or not payload.get("ok"):
        err = payload.get("error") or (r.stderr or "").strip() or "unknown"
        raise HTTPException(status_code=502, detail=f"ACP wallet helper failed: {err}")
    return payload["result"]


def _hot_mnemonic_path() -> Path:
    p = os.getenv("ACP_HOT_MNEMONIC_FILE", "/run/secrets/acp_hot_mnemonic.txt")
    return Path(p)


def _load_or_create_hot_mnemonic() -> str:
    env = os.getenv("ACP_HOT_MNEMONIC", "").strip()
    if env:
        return env
    p = _hot_mnemonic_path()
    if p.exists():
        return p.read_text(encoding="utf-8").strip()
    p.parent.mkdir(parents=True, exist_ok=True)
    created = _run_walletd(["new"])
    mnemonic = str(created["mnemonic"]).strip()
    p.write_text(mnemonic + "\n", encoding="utf-8")
    return mnemonic


@router.post("/deposit_address", response_model=AcpDepositAddressResponse)
def get_deposit_address():
    mnemonic = _load_or_create_hot_mnemonic()
    addr = _run_walletd(["address", "--mnemonic", mnemonic])["address"]
    return AcpDepositAddressResponse(address=addr)


@router.get("/hot/balance", response_model=AcpBalanceResponse)
def hot_balance():
    settings = get_settings()
    mnemonic = _load_or_create_hot_mnemonic()
    addr = _run_walletd(["address", "--mnemonic", mnemonic])["address"]
    res = _run_walletd(["balance", "--rpc", settings.acp_rpc_url, "--address", addr], timeout_s=180)
    return AcpBalanceResponse(**res)


@router.post("/withdraw", response_model=AcpWithdrawResponse)
def withdraw(body: AcpWithdrawRequest, x_wallet_secret: str | None = Header(default=None)):
    expected = os.getenv("ACP_WALLET_OPERATOR_SECRET", "").strip()
    if expected and (x_wallet_secret or "").strip() != expected:
        raise HTTPException(status_code=403, detail="Forbidden")

    settings = get_settings()
    mnemonic = _load_or_create_hot_mnemonic()

    res = _run_walletd(
        [
            "transfer",
            "--rpc",
            settings.acp_rpc_url,
            "--mnemonic",
            mnemonic,
            "--to",
            body.to_address,
            "--amount-acp",
            body.amount_acp,
        ],
        timeout_s=180,
    )
    return AcpWithdrawResponse(**res)

