import ipaddress
import logging
from datetime import datetime, timezone, timedelta
from typing import Tuple, List, Optional
from fastapi import Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import get_settings
from backend.app.models.network_event import NetworkEvent
from backend.app.models.login_attempt import LoginAttempt

logger = logging.getLogger(__name__)
settings = get_settings()


def extract_client_ip(request: Request, simulated_ip: Optional[str] = None) -> str:
    """Extract client IP respecting trusted reverse proxy configuration.
    Arbitrary client headers are never trusted unless direct client is in TRUSTED_PROXIES.
    """
    if simulated_ip and settings.ENABLE_SIMULATION_MODE:
        try:
            ipaddress.ip_address(simulated_ip)
            return simulated_ip
        except ValueError:
            pass

    client_host = request.client.host if request.client else "127.0.0.1"
    trusted_list = settings.trusted_proxies_list

    # If direct connection is from a trusted proxy, inspect X-Forwarded-For
    if client_host in trusted_list:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # First IP in chain is original client
            parts = [p.strip() for p in forwarded_for.split(",")]
            if parts:
                candidate = parts[0]
                try:
                    ipaddress.ip_address(candidate)
                    return candidate
                except ValueError:
                    pass

    return client_host


def calculate_subnet(ip_str: str) -> str:
    """Calculate the canonical CIDR network subnet.
    - IPv4: /24 subnet (e.g. 192.168.1.0/24)
    - IPv6: /64 subnet (e.g. 2001:db8::/64)
    """
    try:
        ip_obj = ipaddress.ip_address(ip_str)
        if ip_obj.version == 4:
            net = ipaddress.ip_network(f"{ip_str}/24", strict=False)
            return str(net)
        else:
            net = ipaddress.ip_network(f"{ip_str}/64", strict=False)
            return str(net)
    except Exception:
        return f"{ip_str}/32"


async def log_network_event(
    db: AsyncSession,
    source_ip: str,
    event_type: str,
    request_path: str,
    http_method: str,
    status_code: int,
    severity: str = "INFO",
) -> NetworkEvent:
    """Record ingress network event in persistent audit log."""
    subnet = calculate_subnet(source_ip)
    event = NetworkEvent(
        source_ip=source_ip,
        subnet=subnet,
        event_type=event_type,
        request_path=request_path,
        http_method=http_method,
        status_code=status_code,
        request_timestamp=datetime.now(timezone.utc),
        severity=severity,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def get_user_known_ips(db: AsyncSession, user_id: int) -> List[str]:
    """Retrieve historical unique IP addresses for a user from successful logins."""
    stmt = (
        select(LoginAttempt.source_ip)
        .where(
            LoginAttempt.user_id == user_id,
            LoginAttempt.password_success.is_(True),
        )
        .distinct()
    )
    result = await db.execute(stmt)
    return [row[0] for row in result.all()]


async def get_user_known_subnets(db: AsyncSession, user_id: int) -> List[str]:
    """Retrieve historical unique subnets for a user from successful logins."""
    stmt = (
        select(LoginAttempt.subnet)
        .where(
            LoginAttempt.user_id == user_id,
            LoginAttempt.password_success.is_(True),
        )
        .distinct()
    )
    result = await db.execute(stmt)
    return [row[0] for row in result.all()]


async def count_recent_ip_requests(
    db: AsyncSession,
    source_ip: str,
    window_seconds: int = 60,
) -> int:
    """Count number of authentication requests originating from this IP in the given time window."""
    since = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
    stmt = (
        select(func.count(LoginAttempt.id))
        .where(
            LoginAttempt.source_ip == source_ip,
            LoginAttempt.timestamp >= since,
        )
    )
    result = await db.execute(stmt)
    return result.scalar() or 0


async def count_recent_failed_logins(
    db: AsyncSession,
    user_id: Optional[int],
    source_ip: str,
    window_seconds: int = 300,
) -> int:
    """Count consecutive or recent failed login attempts for this user or IP in the last window."""
    since = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
    conditions = [
        LoginAttempt.password_success.is_(False),
        LoginAttempt.timestamp >= since,
    ]
    if user_id:
        conditions.append(LoginAttempt.user_id == user_id)
    else:
        conditions.append(LoginAttempt.source_ip == source_ip)

    stmt = select(func.count(LoginAttempt.id)).where(*conditions)
    result = await db.execute(stmt)
    return result.scalar() or 0
