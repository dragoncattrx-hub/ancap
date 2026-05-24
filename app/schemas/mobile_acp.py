from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MobileDocsLinks(BaseModel):
    bridge: str
    risks: str
    reserve: str
    contracts: str
    wallet_security: str = Field(serialization_alias="walletSecurity")

    model_config = ConfigDict(populate_by_name=True)


class MobileConfigResponse(BaseModel):
    min_app_version: str = Field(serialization_alias="minAppVersion")
    maintenance: bool
    maintenance_message: str | None = Field(default=None, serialization_alias="maintenanceMessage")
    acp_decimals: int = Field(serialization_alias="acpDecimals")
    wacp_decimals: int = Field(serialization_alias="wacpDecimals")
    acp_rpc_status: str = Field(serialization_alias="acpRpcStatus")
    bridge_status: str = Field(serialization_alias="bridgeStatus")
    bridge_enabled: bool = Field(serialization_alias="bridgeEnabled")
    bridge_paused: bool = Field(serialization_alias="bridgePaused")
    bridge_reverse_enabled: bool = Field(serialization_alias="bridgeReverseEnabled")
    wacp_contract: str = Field(serialization_alias="wacpContract")
    bsc_chain_id: int = Field(serialization_alias="bscChainId")
    acp_rpc_url: str = Field(serialization_alias="acpRpcUrl")
    acp_explorer_tx_base: str = Field(serialization_alias="acpExplorerTxBase")
    bsc_explorer_base: str = Field(serialization_alias="bscExplorerBase")
    support_url: str = Field(serialization_alias="supportUrl")
    docs: MobileDocsLinks

    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)


class AcpNetworkStatusResponse(BaseModel):
    chain: str = "acp"
    rpc_status: str = Field(serialization_alias="rpcStatus")
    block_height: int | None = Field(default=None, serialization_alias="blockHeight")
    min_fee_acp: str = Field(serialization_alias="minFeeAcp")

    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)


class MobileAcpBalanceResponse(BaseModel):
    """On-chain balance only (no custodial in_work fields)."""

    address: str
    units: str
    acp: str
    utxo_count: int = 0


class AcpFeeEstimateRequest(BaseModel):
    from_address: str = Field(validation_alias="from")
    to_address: str = Field(validation_alias="to")
    amount_acp: str = Field(validation_alias="amountAcp")

    model_config = ConfigDict(populate_by_name=True)


class AcpFeeEstimateResponse(BaseModel):
    fee_acp: str = Field(serialization_alias="feeAcp")
    fee_units: str = Field(serialization_alias="feeUnits")
    min_fee_acp: str = Field(serialization_alias="minFeeAcp")

    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)


class AcpBroadcastRequest(BaseModel):
    raw_tx: str = Field(validation_alias="rawTx", min_length=16)

    model_config = ConfigDict(populate_by_name=True)


class AcpBroadcastResponse(BaseModel):
    accepted: bool
    txid: str | None = None
    reason: str | None = None


# ── Device registration ────────────────────────────────────────────────────────


class MobileDeviceRegisterRequest(BaseModel):
    device_token: str = Field(min_length=1, max_length=512, description="Push notification token from iOS (APNs) or Android (FCM)")
    platform: Literal["ios", "android"] = Field(description="Device platform")
    app_version: str | None = Field(default=None, max_length=16, description="App version string e.g. 1.0.0")


class MobileDeviceRegisterResponse(BaseModel):
    device_id: str
    registered: bool
    message: str = "Device registered"


class MobileDeviceUnregisterRequest(BaseModel):
    device_token: str = Field(min_length=1, max_length=512)


class MobileDeviceListResponse(BaseModel):
    devices: list[MobileDeviceInfo] = Field(default_factory=list)


class MobileDeviceInfo(BaseModel):
    device_id: str
    platform: str
    app_version: str | None = None
    is_active: bool
    last_seen_at: datetime | None = None
    created_at: datetime