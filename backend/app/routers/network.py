from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.network_event import NetworkEvent
from backend.app.services.session_service import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/api/network", tags=["Network Monitoring"])


class NetworkEventResponse(BaseModel):
    id: int
    source_ip: str
    subnet: str
    event_type: str
    request_path: str
    http_method: str
    status_code: int
    request_timestamp: datetime
    severity: str

    class Config:
        from_attributes = True


class NetworkSummaryResponse(BaseModel):
    total_events: int
    unique_ips: int
    unique_subnets: int
    events_by_severity: Dict[str, int]
    top_subnets: List[Dict[str, Any]]
    top_ips: List[Dict[str, Any]]


@router.get("/events", response_model=List[NetworkEventResponse])
async def list_network_events(
    limit: int = Query(50, ge=1, le=200),
    severity: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve chronologically ordered network traffic and threat events."""
    stmt = select(NetworkEvent)
    if severity:
        stmt = stmt.where(NetworkEvent.severity == severity.upper())
    stmt = stmt.order_by(desc(NetworkEvent.request_timestamp)).limit(limit)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/summary", response_model=NetworkSummaryResponse)
async def get_network_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate statistics for network monitoring dashboards."""
    total_res = await db.execute(select(func.count(NetworkEvent.id)))
    total_events = total_res.scalar() or 0

    unique_ips_res = await db.execute(select(func.count(func.distinct(NetworkEvent.source_ip))))
    unique_ips = unique_ips_res.scalar() or 0

    unique_subnets_res = await db.execute(select(func.count(func.distinct(NetworkEvent.subnet))))
    unique_subnets = unique_subnets_res.scalar() or 0

    # Severity distribution
    sev_stmt = (
        select(NetworkEvent.severity, func.count(NetworkEvent.id))
        .group_by(NetworkEvent.severity)
    )
    sev_res = await db.execute(sev_stmt)
    sev_dict = {row[0]: row[1] for row in sev_res.all()}

    # Top subnets
    sub_stmt = (
        select(NetworkEvent.subnet, func.count(NetworkEvent.id).label("count"))
        .group_by(NetworkEvent.subnet)
        .order_by(desc("count"))
        .limit(5)
    )
    sub_res = await db.execute(sub_stmt)
    top_subnets = [{"subnet": row[0], "count": row[1]} for row in sub_res.all()]

    # Top IPs
    ip_stmt = (
        select(NetworkEvent.source_ip, func.count(NetworkEvent.id).label("count"))
        .group_by(NetworkEvent.source_ip)
        .order_by(desc("count"))
        .limit(5)
    )
    ip_res = await db.execute(ip_stmt)
    top_ips = [{"ip": row[0], "count": row[1]} for row in ip_res.all()]

    return NetworkSummaryResponse(
        total_events=total_events,
        unique_ips=unique_ips,
        unique_subnets=unique_subnets,
        events_by_severity=sev_dict,
        top_subnets=top_subnets,
        top_ips=top_ips,
    )


@router.get("/activity")
async def get_network_activity(
    hours: int = Query(24, ge=1, le=168),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return time-series network activity counts for charting."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    stmt = (
        select(NetworkEvent.request_timestamp, NetworkEvent.severity)
        .where(NetworkEvent.request_timestamp >= since)
        .order_by(NetworkEvent.request_timestamp.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    # Bucket by hour
    buckets: Dict[str, Dict[str, int]] = {}
    for ts, sev in rows:
        hour_key = ts.strftime("%Y-%m-%d %H:00")
        if hour_key not in buckets:
            buckets[hour_key] = {"timestamp": hour_key, "total": 0, "HIGH": 0, "MEDIUM": 0, "INFO": 0}
        buckets[hour_key]["total"] += 1
        if sev in buckets[hour_key]:
            buckets[hour_key][sev] += 1

    return list(buckets.values())
