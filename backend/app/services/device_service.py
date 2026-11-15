import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from fastapi import Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.device import Device


def resolve_device_identifier(request: Request, client_device_id: Optional[str] = None) -> str:
    """Derive a stable device identifier combining client identifier and browser characteristics.
    Does not assume browser fingerprint is 100% uniquely guaranteed.
    """
    if client_device_id and len(client_device_id.strip()) >= 8:
        return client_device_id.strip()

    # Check device cookie
    cookie_device_id = request.cookies.get("device_id")
    if cookie_device_id and len(cookie_device_id.strip()) >= 8:
        return cookie_device_id.strip()

    # Fallback: synthesize fingerprint from User-Agent and Accept headers + entropy
    user_agent = request.headers.get("User-Agent", "Unknown-Agent")
    accept = request.headers.get("Accept-Language", "en")
    raw = f"{user_agent}|{accept}|{secrets.token_hex(8)}"
    return f"dev_{hashlib.sha256(raw.encode()).hexdigest()[:24]}"


async def get_or_register_device(
    db: AsyncSession,
    user_id: int,
    device_identifier: str,
) -> Tuple[Device, bool]:
    """Retrieve existing active device or register a new one.
    Returns: (Device, is_new_device)
    """
    stmt = select(Device).where(
        Device.user_id == user_id,
        Device.device_identifier == device_identifier,
        Device.revoked_at.is_(None),
    )
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if device:
        device.last_seen = now
        await db.commit()
        await db.refresh(device)
        return device, False

    # New device registration
    new_device = Device(
        user_id=user_id,
        device_identifier=device_identifier,
        first_seen=now,
        last_seen=now,
        trusted=False,
        revoked_at=None,
    )
    db.add(new_device)
    await db.commit()
    await db.refresh(new_device)
    return new_device, True


async def get_user_devices(db: AsyncSession, user_id: int) -> List[Device]:
    """List all non-revoked devices registered to a user."""
    stmt = (
        select(Device)
        .where(Device.user_id == user_id, Device.revoked_at.is_(None))
        .order_by(Device.last_seen.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def set_device_trust(db: AsyncSession, user_id: int, device_id: int, trusted: bool) -> Optional[Device]:
    """Toggle trust status on an active user device."""
    stmt = select(Device).where(
        Device.id == device_id,
        Device.user_id == user_id,
        Device.revoked_at.is_(None),
    )
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()
    if device:
        device.trusted = trusted
        await db.commit()
        await db.refresh(device)
    return device


async def revoke_device(db: AsyncSession, user_id: int, device_id: int) -> bool:
    """Revoke a device associated with a user."""
    stmt = select(Device).where(
        Device.id == device_id,
        Device.user_id == user_id,
        Device.revoked_at.is_(None),
    )
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()
    if device:
        device.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        return True
    return False
