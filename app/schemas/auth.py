from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class AuthLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600
    wallet_backup_mnemonic: Optional[str] = None


class WalletAuthNonceRequest(BaseModel):
    address: str = Field(..., min_length=42, max_length=66)
    chain_id: Optional[int] = None
    domain: Optional[str] = Field(None, min_length=1, max_length=255)
    uri: Optional[str] = Field(None, min_length=1, max_length=500)


class WalletAuthNonceResponse(BaseModel):
    challenge_id: str
    address: str
    chain_id: int
    nonce: str
    message: str
    issued_at: datetime
    expires_at: datetime


class WalletAuthVerifyRequest(BaseModel):
    challenge_id: str = Field(..., min_length=1, max_length=64)
    address: str = Field(..., min_length=42, max_length=66)
    signature: str = Field(..., min_length=10, max_length=2048)


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str] = Field(None, min_length=1, max_length=80)
    referral_code: Optional[str] = Field(None, min_length=3, max_length=64)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    display_name: Optional[str] = None
    created_at: datetime
    wallet_backup_mnemonic: Optional[str] = None
