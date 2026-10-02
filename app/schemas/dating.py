from datetime import datetime
from pydantic import BaseModel, Field


BLE_SERVICE_UUID = "a11c0001-a11c-4a7e-9c01-444154494e47"
DEVICE_NAME_PREFIX = "ANCAP Dating"


class DatingCatalogPublic(BaseModel):
    title: str = "ANCAP Dating"
    device_name_prefix: str = DEVICE_NAME_PREFIX
    ble_service_uuid: str = BLE_SERVICE_UUID
    max_hop: int = 5
    age_gate: str = "18+"
    docs_url: str = "https://ancap.cloud/docs/mobile/dating"
    legal_url: str = "https://ancap.cloud/legal/dating"
    notes: list[str] = Field(default_factory=list)


class DatingProfileUpsert(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=80)
    bio: str | None = Field(None, max_length=2000)
    age_attested_18: bool
    visibility: str = Field("nearby", pattern="^(nearby|public|hidden)$")
    lat: float | None = None
    lon: float | None = None
    mesh_peer_id: str | None = Field(None, max_length=64)


class DatingProfilePublic(BaseModel):
    id: str
    user_id: str
    display_name: str
    bio: str | None
    age_attested_18: bool
    visibility: str
    lat: float | None = None
    lon: float | None = None
    mesh_peer_id: str | None = None
    updated_at: datetime


class DatingAccessPointCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    description: str | None = Field(None, max_length=2000)
    lat: float
    lon: float


class DatingAccessPointPublic(BaseModel):
    id: str
    title: str
    description: str | None
    lat: float
    lon: float
    ble_service_hint: str
    status: str
    created_at: datetime


class DatingLikeRequest(BaseModel):
    to_user_id: str


class DatingMatchPublic(BaseModel):
    id: str
    peer_user_id: str
    created_at: datetime


class DatingMessageCreate(BaseModel):
    match_id: str
    body: str = Field(..., min_length=1, max_length=4000)


class DatingMessagePublic(BaseModel):
    id: str
    match_id: str
    sender_user_id: str
    body: str
    created_at: datetime


class DatingReportCreate(BaseModel):
    target_user_id: str
    reason: str = Field(..., min_length=3, max_length=2000)
