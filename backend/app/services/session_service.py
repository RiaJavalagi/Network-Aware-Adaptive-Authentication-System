import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import get_settings
from backend.app.database import get_db
from backend.app.models.session import Session
from backend.app.models.user import User

settings = get_settings()


def hash_token(raw_token: str) -> str:
    """Compute SHA-256 hex digest of a raw session token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


async def create_user_session(
    db: AsyncSession,
    user_id: int,
    max_age_seconds: int = 86400,
) -> Tuple[Session, str]:
    """Generate a high-entropy session token, save its SHA-256 hash in the database,
    and return the database record along with the raw unhashed token for cookie delivery.
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=max_age_seconds)

    session = Session(
        user_id=user_id,
        session_token_hash=token_hash,
        created_at=now,
        expires_at=expires_at,
        revoked_at=None,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session, raw_token


async def validate_session(
    db: AsyncSession,
    raw_token: str,
) -> Tuple[Optional[Session], Optional[User]]:
    """Validate a raw session token against stored hashes.
    Checks token existence, non-revocation, and expiration.
    """
    if not raw_token:
        return None, None

    token_hash = hash_token(raw_token)
    stmt = (
        select(Session, User)
        .join(User, Session.user_id == User.id)
        .where(
            Session.session_token_hash == token_hash,
            Session.revoked_at.is_(None),
        )
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        return None, None

    session, user = row
    now = datetime.now(timezone.utc)
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        # Session expired
        return None, None

    return session, user


async def revoke_session_token(db: AsyncSession, raw_token: str) -> bool:
    """Revoke an active session by token hash."""
    if not raw_token:
        return False

    token_hash = hash_token(raw_token)
    result = await db.execute(
        select(Session).where(
            Session.session_token_hash == token_hash,
            Session.revoked_at.is_(None),
        )
    )
    session = result.scalar_one_or_none()
    if session:
        session.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        return True
    return False


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency: Authenticate request using session cookie or Authorization header."""
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not raw_token:
        # Fallback to Authorization: Bearer <token>
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            raw_token = auth_header.split(" ", 1)[1]

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session required",
            headers={"WWW-Authenticate": "Cookie"},
        )

    session, user = await validate_session(db, raw_token)
    if not session or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session is invalid or expired",
            headers={"WWW-Authenticate": "Cookie"},
        )

    return user
