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


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str] = Field(None, min_length=1, max_length=80)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    display_name: Optional[str] = None
    created_at: datetime
