#!/usr/bin/env python3
"""ANCAP MCP server — exposes commerce tools to AI agents via stdio MCP."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

API_BASE = os.getenv("ANCAP_API_BASE", "https://ancap.cloud/api/v1").rstrip("/")
API_KEY = os.getenv("ANCAP_API_KEY", "")


def _request(method: str, path: str, payload: dict | None = None) -> dict:  # noqa: PLR0912
    if not API_KEY:
        raise RuntimeError("ANCAP_API_KEY is required")
    url = f"{API_BASE}{path}"
    data = None
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "Authorization": f"Bearer {API_KEY}" if API_KEY.startswith("ey") else "",
    }
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc


TOOLS = {
    "ancap.token_snapshot": {
        "description": "Run a free token snapshot workflow preview",
        "handler": lambda args: _request("POST", "/workflow-store/runs", {
            "workflow_slug": "token-risk-report",
            "payment_currency": "ACP",
            "unlock_full_result": False,
            "inputs": args,
        }),
    },
    "ancap.create_risk_report": {
        "description": "Create a paid token risk report workflow run",
        "handler": lambda args: _request("POST", "/workflow-store/runs", {
            "workflow_slug": "token-risk-report-pro",
            "payment_currency": "ACP",
            "unlock_full_result": True,
            "inputs": args,
        }),
    },
    "ancap.create_payment_link": {
        "description": "Create an ANCAP Pay payment link",
        "handler": lambda args: _request("POST", "/pay/payment-links", args),
    },
    "ancap.create_invoice": {
        "description": "Create a merchant invoice with optional payment link",
        "handler": lambda args: _request("POST", "/pay/invoices", args),
    },
    "ancap.check_payment_status": {
        "description": "Get public payment link status by code",
        "handler": lambda args: _request("GET", f"/pay/{args['code']}"),
    },
    "ancap.create_claim_code": {
        "description": "Lock ACP balance into a claim code",
        "handler": lambda args: _request("POST", "/claim-codes/create", args),
    },
    "ancap.redeem_claim_code": {
        "description": "Redeem a claim code to wallet credits",
        "handler": lambda args: _request("POST", "/claim-codes/redeem", args),
    },
    "ancap.quote_smart_pay": {
        "description": "Parse a payment QR / URI for manual confirmation",
        "handler": lambda args: _request("POST", "/payment-scanner/parse", args),
    },
    "ancap.run_workflow": {
        "description": "Run any workflow by slug",
        "handler": lambda args: _request("POST", "/workflow-store/runs", args),
    },
}


def _handle_message(message: dict) -> dict | None:
    method = message.get("method")
    msg_id = message.get("id")
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "ancap-mcp", "version": "0.1.0"},
            },
        }
    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "tools": [
                    {"name": name, "description": meta["description"], "inputSchema": {"type": "object"}}
                    for name, meta in TOOLS.items()
                ]
            },
        }
    if method == "tools/call":
        params = message.get("params") or {}
        name = params.get("name")
        arguments = params.get("arguments") or {}
        if name not in TOOLS:
            return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32601, "message": f"Unknown tool: {name}"}}
        try:
            result = TOOLS[name]["handler"](arguments)
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]},
            }
        except Exception as exc:
            return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32000, "message": str(exc)}}
    if method == "notifications/initialized":
        return None
    if msg_id is not None:
        return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32601, "message": f"Unsupported method: {method}"}}
    return None


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        message = json.loads(line)
        response = _handle_message(message)
        if response is not None:
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
