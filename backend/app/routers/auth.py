import secrets
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import get_settings
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.login_attempt import LoginAttempt
from backend.app.models.risk_assessment import RiskAssessment
from backend.app.models.security_event import SecurityEvent
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    LoginResponse,
    MessageResponse,
)
from backend.app.services.password_service import (
    hash_password,
    verify_password,
    validate_password_strength,
)
from backend.app.services.session_service import (
    create_user_session,
    revoke_session_token,
    get_current_user,
)
from backend.app.services.network_monitor import (
    extract_client_ip,
    calculate_subnet,
    log_network_event,
    get_user_known_ips,
    get_user_known_subnets,
    count_recent_ip_requests,
    count_recent_failed_logins,
)
from backend.app.services.device_service import (
    resolve_device_identifier,
    get_or_register_device,
)
from backend.app.services.risk_engine import risk_engine
from backend.app.services.rate_limit_service import rate_limit_service
from backend.app.services.totp_service import verify_totp_code

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Register a new user account with Argon2id password hashing and policy enforcement."""
    # Validate password strength
    is_valid, msg = validate_password_strength(payload.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Check for duplicate username or email
    stmt = select(User).where(or_(User.username == payload.username, User.email == payload.email))
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        if existing.username == payload.username:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    # Hash password with Argon2id
    pwd_hash = hash_password(payload.password)

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=pwd_hash,
        totp_enabled=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Log security audit event
    sec_event = SecurityEvent(
        user_id=user.id,
        event_type="USER_REGISTERED",
        severity="INFO",
        description=f"User account '{user.username}' successfully registered",
    )
    db.add(sec_event)
    await db.commit()

    return user


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: UserLoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user with adaptive risk scoring, network intelligence, and TOTP challenge evaluation."""
    client_ip = extract_client_ip(request, payload.simulated_ip)
    subnet = calculate_subnet(client_ip)

    # 1. IP Rate Limiting Check
    is_allowed, remaining = await rate_limit_service.check_ip_rate_limit(client_ip)
    if not is_allowed:
        await log_network_event(
            db, client_ip, "RATE_LIMITED", "/api/auth/login", "POST", 429, "HIGH"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication requests from this IP. Please wait before retrying.",
        )

    # 2. Look up user by email or username
    stmt = select(User).where(
        or_(User.username == payload.username_or_email, User.email == payload.username_or_email)
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    device_id_str = resolve_device_identifier(request, payload.device_identifier)

    # 3. Check Credentials
    password_valid = False
    if user:
        password_valid = verify_password(payload.password, user.password_hash)

    if not user or not password_valid:
        # Authentication failed
        await rate_limit_service.record_login_failure(client_ip)
        if user:
            await rate_limit_service.record_login_failure(f"user:{user.id}")

        # Record failed login attempt
        failed_attempt = LoginAttempt(
            user_id=user.id if user else None,
            source_ip=client_ip,
            subnet=subnet,
            device_id=None,
            password_success=False,
            otp_required=False,
            risk_score=40,
            risk_level="MEDIUM",
            decision="DENY",
        )
        db.add(failed_attempt)

        # Log network event
        await log_network_event(
            db, client_ip, "AUTH_FAILURE", "/api/auth/login", "POST", 401, "MEDIUM"
        )
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    # 4. Device Recognition
    device, is_new_device = await get_or_register_device(db, user.id, device_id_str)
    # Set device cookie if not present
    response.set_cookie(
        key="device_id",
        value=device.device_identifier,
        httponly=True,
        samesite="lax",
        max_age=31536000,
    )

    # 5. Network & History Signals
    known_ips = await get_user_known_ips(db, user.id)
    known_subnets = await get_user_known_subnets(db, user.id)
    is_new_ip = client_ip not in known_ips if known_ips else True
    is_new_subnet = subnet not in known_subnets if known_subnets else True

    recent_requests = await count_recent_ip_requests(db, client_ip, window_seconds=60)
    recent_failures = await count_recent_failed_logins(db, user.id, client_ip, window_seconds=300)

    # 6. Risk Engine Evaluation
    assessment = risk_engine.evaluate(
        is_new_device=is_new_device,
        is_device_trusted=device.trusted,
        is_new_ip=is_new_ip,
        is_new_subnet=is_new_subnet,
        recent_request_count=recent_requests,
        failed_attempts_count=recent_failures,
        totp_enabled=user.totp_enabled,
    )

    # 7. Record Login Attempt & Risk Assessment
    login_attempt = LoginAttempt(
        user_id=user.id,
        source_ip=client_ip,
        subnet=subnet,
        device_id=device.id,
        password_success=True,
        otp_required=(assessment.decision in ["CHALLENGE_TOTP", "RESTRICT_AND_VERIFY"] or user.totp_enabled),
        otp_success=None,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        decision=assessment.decision,
    )
    db.add(login_attempt)
    await db.commit()
    await db.refresh(login_attempt)

    risk_record = RiskAssessment(
        user_id=user.id,
        login_attempt_id=login_attempt.id,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        contributing_factors=[f.to_dict() for f in assessment.factors],
        decision=assessment.decision,
    )
    db.add(risk_record)

    # Log Network Event
    await log_network_event(
        db,
        client_ip,
        f"AUTH_DECISION_{assessment.decision}",
        "/api/auth/login",
        "POST",
        200 if assessment.decision != "DENY" else 403,
        "INFO" if assessment.risk_level == "LOW" else "MEDIUM" if assessment.risk_level == "MEDIUM" else "HIGH",
    )
    await db.commit()

    # 8. Act on Policy Decision
    if assessment.decision == "DENY":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authentication restricted due to critical risk policy violation.",
        )

    # If TOTP verification is required (adaptive risk OR mandatory account setting)
    if assessment.decision in ["CHALLENGE_TOTP", "RESTRICT_AND_VERIFY"] or user.totp_enabled:
        challenge_token = secrets.token_urlsafe(32)
        await rate_limit_service.store_challenge_state(
            challenge_token=challenge_token,
            data={
                "user_id": user.id,
                "login_attempt_id": login_attempt.id,
                "source_ip": client_ip,
                "device_id": device.id,
                "risk_score": assessment.risk_score,
                "risk_level": assessment.risk_level,
                "attempts": 0,
            },
            ttl_seconds=300,
        )

        return LoginResponse(
            status=assessment.decision,
            decision=assessment.decision,
            risk_score=assessment.risk_score,
            risk_level=assessment.risk_level,
            requires_totp=True,
            challenge_token=challenge_token,
            message="Second-factor verification required based on risk assessment.",
            assessment=assessment.to_dict(),
        )

    # Low Risk & No Mandatory MFA: Issue Session Directly
    await rate_limit_service.clear_login_failures(client_ip)
    await rate_limit_service.clear_login_failures(f"user:{user.id}")

    session, raw_token = await create_user_session(db, user.id)
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="lax",
        max_age=settings.SESSION_MAX_AGE_SECONDS,
    )

    return LoginResponse(
        status="ALLOW",
        decision="ALLOW",
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        requires_totp=False,
        user=UserResponse.model_validate(user),
        message="Authentication successful.",
        assessment=assessment.to_dict(),
    )


class VerifyTotpRequest(BaseModel):
    challenge_token: str
    otp_code: str


@router.post("/verify-totp", response_model=LoginResponse)
async def verify_totp(
    payload: VerifyTotpRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Verify 2FA TOTP challenge during adaptive authentication."""
    challenge_data = await rate_limit_service.get_and_consume_challenge_state(payload.challenge_token)
    if not challenge_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge token is invalid or expired. Please login again.",
        )

    user_id = challenge_data["user_id"]
    login_attempt_id = challenge_data["login_attempt_id"]

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user or not user.encrypted_totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TOTP is not configured for this account.",
        )

    # Verify code
    is_valid = verify_totp_code(user.encrypted_totp_secret, payload.otp_code, user.id)

    # Fetch login attempt record
    attempt_res = await db.execute(select(LoginAttempt).where(LoginAttempt.id == login_attempt_id))
    attempt = attempt_res.scalar_one_or_none()

    if not is_valid:
        if attempt:
            attempt.otp_success = False
            await db.commit()

        # Log security audit
        sec_event = SecurityEvent(
            user_id=user.id,
            event_type="INVALID_OTP_ATTEMPT",
            severity="MEDIUM",
            description=f"Invalid TOTP entered for user '{user.username}'",
        )
        db.add(sec_event)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid two-factor authentication code.",
        )

    # Success: update attempt and create session
    if attempt:
        attempt.otp_success = True
        await db.commit()

    session, raw_token = await create_user_session(db, user.id)
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="lax",
        max_age=settings.SESSION_MAX_AGE_SECONDS,
    )

    return LoginResponse(
        status="ALLOW",
        decision="ALLOW",
        risk_score=challenge_data.get("risk_score", 0),
        risk_level=challenge_data.get("risk_level", "LOW"),
        requires_totp=False,
        user=UserResponse.model_validate(user),
        message="Two-factor verification successful. Session created.",
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Revoke session and clear session cookie."""
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if raw_token:
        await revoke_session_token(db, raw_token)

    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        httponly=True,
        samesite="lax",
    )
    return MessageResponse(message="Successfully logged out.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return profile of currently authenticated user."""
    return current_user
