from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.security_event import SecurityEvent
from backend.app.services.session_service import get_current_user
from backend.app.services.device_service import (
    get_user_devices,
    set_device_trust,
    revoke_device,
)
from backend.app.schemas.auth import MessageResponse

router = APIRouter(prefix="/api/devices", tags=["Device Management"])


class DeviceResponse(BaseModel):
    id: int
    user_id: int
    device_identifier: str
    first_seen: datetime
    last_seen: datetime
    trusted: bool
    revoked_at: datetime | None

    class Config:
        from_attributes = True


class TrustDeviceRequest(BaseModel):
    device_id: int
    trusted: bool


@router.get("", response_model=List[DeviceResponse])
async def list_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all active devices registered to the current authenticated user."""
    devices = await get_user_devices(db, current_user.id)
    return devices


@router.post("/trust", response_model=DeviceResponse)
async def update_device_trust(
    payload: TrustDeviceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a recognized device as trusted or untrusted."""
    device = await set_device_trust(db, current_user.id, payload.device_id, payload.trusted)
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found.")

    sec_event = SecurityEvent(
        user_id=current_user.id,
        event_type="DEVICE_TRUST_UPDATED",
        severity="INFO",
        description=f"Device {device.id} trust updated to {payload.trusted} by user '{current_user.username}'",
    )
    db.add(sec_event)
    await db.commit()
    return device


@router.delete("/{device_id}", response_model=MessageResponse)
async def remove_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a device. Revoked devices will be treated as unrecognized on subsequent logins."""
    success = await revoke_device(db, current_user.id, device_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found.")

    sec_event = SecurityEvent(
        user_id=current_user.id,
        event_type="DEVICE_REVOKED",
        severity="MEDIUM",
        description=f"Device {device_id} revoked by user '{current_user.username}'",
    )
    db.add(sec_event)
    await db.commit()
    return MessageResponse(message="Device successfully revoked.")
