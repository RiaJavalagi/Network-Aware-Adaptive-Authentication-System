from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Payload for registering a new user account."""

    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_\-]+$")
    email: EmailStr
    password: str = Field(..., min_length=10)


class UserLoginRequest(BaseModel):
    """Payload for user authentication."""

    username_or_email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)
    device_identifier: Optional[str] = Field(default=None, description="Client device fingerprint")
    simulated_ip: Optional[str] = Field(default=None, description="Simulated IP for testing lab only")


class UserResponse(BaseModel):
    """Sanitized user account profile representation."""

    id: int
    username: str
    email: str
    totp_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Response returned upon login attempt containing decision and risk summary."""

    status: str = Field(..., description="ALLOW, CHALLENGE_TOTP, RESTRICT_AND_VERIFY, or DENIED")
    decision: str
    risk_score: int
    risk_level: str
    requires_totp: bool = False
    challenge_token: Optional[str] = None
    user: Optional[UserResponse] = None
    message: str
    assessment: Optional[Dict[str, Any]] = None


class MessageResponse(BaseModel):
    """Generic status and message response."""

    status: str = "ok"
    message: str
