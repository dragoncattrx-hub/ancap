"""Wallet ACP locale trees must stay key-aligned across EN/RU/UK/DE (zh-Hant may partial + EN fallback)."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
WALLET_LOCALE = REPO_ROOT / "frontend-app" / "src" / "locales" / "wallet.ts"

LANGS_FULL = ("en", "ru", "uk", "de")


def _flat_keys(block: str) -> set[str]:
    return set(re.findall(r"^\s*(\w+):", block, re.MULTILINE))


def _lang_block(text: str, lang: str) -> str:
    marker = f'"{lang}"' if "-" in lang else lang
    pattern = rf"{re.escape(marker)}:\s*\{{"
    match = re.search(pattern, text)
    if not match:
        return ""
    start = match.end()
    depth = 1
    i = start
    while i < len(text) and depth:
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        i += 1
    return text[start : i - 1]


def test_wallet_acp_locale_key_parity_for_primary_languages() -> None:
    text = WALLET_LOCALE.read_text(encoding="utf-8")
    # Only the walletAcpByLang export (first Record block).
    export = text.split("export const walletSimpleByLang", 1)[0]
    en_keys = _flat_keys(_lang_block(export, "en"))
    assert len(en_keys) > 50, "expected a substantial EN walletAcp tree"

    for lang in LANGS_FULL[1:]:
        lang_keys = _flat_keys(_lang_block(export, lang))
        missing = en_keys - lang_keys
        extra = lang_keys - en_keys
        assert not missing, f"{lang} missing walletAcp keys: {sorted(missing)[:20]}"
        assert not extra, f"{lang} has unexpected walletAcp keys: {sorted(extra)[:20]}"
