from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.security_event import SecurityEvent
from backend.app.services.session_service import get_current_user
from backend.app.services.totp_service import (
    generate_totp_secret,
    generate_totp_provisioning_uri,
    generate_qr_code_base64,
    encrypt_totp_secret,
    verify_totp_code,
)
from backend.app.services.password_service import verify_password
from backend.app.schemas.auth import MessageResponse

router = APIRouter(prefix="/api/totp", tags=["Two-Factor Authentication"])


class TotpSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    qr_code_base64: str
    message: str


class TotpConfirmRequest(BaseModel):
    secret: str = Field(..., min_length=16)
    otp_code: str = Field(..., min_length=6, max_length=6)


class TotpDisableRequest(BaseModel):
    password: str = Field(..., min_length=1)


@router.post("/setup", response_model=TotpSetupResponse)
async def setup_totp(current_user: User = Depends(get_current_user)):
    """Initialize TOTP configuration for the user, generating base32 secret and QR code."""
    secret = generate_totp_secret()
    provisioning_uri = generate_totp_provisioning_uri(current_user.username, secret)
    qr_base64 = generate_qr_code_base64(provisioning_uri)

    return TotpSetupResponse(
        secret=secret,
        provisioning_uri=provisioning_uri,
        qr_code_base64=qr_base64,
        message="Scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator).",
    )


@router.post("/confirm", response_model=MessageResponse)
async def confirm_totp(
    payload: TotpConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify initial enrollment OTP code, encrypt secret at rest, and activate TOTP."""
    # Temporarily encrypt the candidate secret to test validation
    encrypted_candidate = encrypt_totp_secret(payload.secret)
    is_valid = verify_totp_code(encrypted_candidate, payload.otp_code, current_user.id)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation code. Please verify the 6-digit code in your authenticator app.",
        )

    # Persist encrypted secret and enable TOTP
    current_user.encrypted_totp_secret = encrypted_candidate
    current_user.totp_enabled = True

    # Audit event
    sec_event = SecurityEvent(
        user_id=current_user.id,
        event_type="TOTP_ENABLED",
        severity="INFO",
        description=f"User '{current_user.username}' successfully enrolled and enabled TOTP two-factor authentication.",
    )
    db.add(sec_event)
    await db.commit()

    return MessageResponse(message="Two-factor authentication successfully enabled.")


@router.post("/disable", response_model=MessageResponse)
async def disable_totp(
    payload: TotpDisableRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disable TOTP two-factor authentication after verifying current password."""
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Password is required to disable two-factor authentication.",
        )

    current_user.totp_enabled = False
    current_user.encrypted_totp_secret = None

    sec_event = SecurityEvent(
        user_id=current_user.id,
        event_type="TOTP_DISABLED",
        severity="HIGH",
        description=f"User '{current_user.username}' disabled TOTP two-factor authentication.",
    )
    db.add(sec_event)
    await db.commit()

    return MessageResponse(message="Two-factor authentication has been disabled.")
