from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.security_event import SecurityEvent
from backend.app.models.login_attempt import LoginAttempt
from backend.app.models.user import User
from backend.app.services.session_service import get_current_user

router = APIRouter(prefix="/api/security", tags=["Security Operations"])


class SecurityEventResponse(BaseModel):
    id: int
    user_id: Optional[int]
    event_type: str
    severity: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class SecurityOverviewResponse(BaseModel):
    total_logins: int
    successful_logins: int
    failed_logins: int
    high_risk_attempts: int
    blocked_requests: int
    totp_challenges: int
    recent_events_count: int


@router.get("/events", response_model=List[SecurityEventResponse])
async def list_security_events(
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve security audit events filtered by severity."""
    stmt = select(SecurityEvent)
    if severity:
        stmt = stmt.where(SecurityEvent.severity == severity.upper())
    stmt = stmt.order_by(desc(SecurityEvent.created_at)).limit(limit)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/overview", response_model=SecurityOverviewResponse)
async def get_security_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate high-level security metrics for executive security dashboard."""
    # Total login attempts
    total_res = await db.execute(select(func.count(LoginAttempt.id)))
    total_logins = total_res.scalar() or 0

    # Successful logins
    success_res = await db.execute(
        select(func.count(LoginAttempt.id)).where(LoginAttempt.password_success.is_(True))
    )
    successful_logins = success_res.scalar() or 0

    # Failed logins
    failed_logins = total_logins - successful_logins

    # High-risk attempts
    high_risk_res = await db.execute(
        select(func.count(LoginAttempt.id)).where(LoginAttempt.risk_level == "HIGH")
    )
    high_risk_attempts = high_risk_res.scalar() or 0

    # Blocked requests (decision == DENY)
    blocked_res = await db.execute(
        select(func.count(LoginAttempt.id)).where(LoginAttempt.decision == "DENY")
    )
    blocked_requests = blocked_res.scalar() or 0

    # TOTP challenges issued
    totp_res = await db.execute(
        select(func.count(LoginAttempt.id)).where(LoginAttempt.otp_required.is_(True))
    )
    totp_challenges = totp_res.scalar() or 0

    # Security events count
    events_res = await db.execute(select(func.count(SecurityEvent.id)))
    recent_events_count = events_res.scalar() or 0

    return SecurityOverviewResponse(
        total_logins=total_logins,
        successful_logins=successful_logins,
        failed_logins=failed_logins,
        high_risk_attempts=high_risk_attempts,
        blocked_requests=blocked_requests,
        totp_challenges=totp_challenges,
        recent_events_count=recent_events_count,
    )
