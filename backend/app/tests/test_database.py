import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.exc import IntegrityError

from backend.app.database import Base
from backend.app.models import (
    User,
    Device,
    Session,
    LoginAttempt,
    NetworkEvent,
    RiskAssessment,
    SecurityEvent,
)

# Use SQLite in-memory for fast, isolated database testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_session():
    """Create an in-memory database and async session for test execution."""
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async_session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        yield session

    # Drop tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()


@pytest.mark.asyncio
async def test_user_creation_and_query(db_session: AsyncSession):
    """Verify creating and retrieving a user."""
    user = User(
        username="alice",
        email="alice@example.com",
        password_hash="$argon2id$v=19$m=65536,t=3,p=4$somehash",
        totp_enabled=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assert user.id is not None
    assert user.username == "alice"
    assert user.email == "alice@example.com"
    assert user.totp_enabled is False
    assert user.created_at is not None

    # Query user back
    result = await db_session.execute(select(User).where(User.username == "alice"))
    fetched = result.scalar_one_or_none()
    assert fetched is not None
    assert fetched.id == user.id


@pytest.mark.asyncio
async def test_user_unique_constraints(db_session: AsyncSession):
    """Verify unique constraint on username and email."""
    user1 = User(
        username="duplicate_user",
        email="user1@example.com",
        password_hash="hash1",
    )
    db_session.add(user1)
    await db_session.commit()

    # Same username, different email
    user2 = User(
        username="duplicate_user",
        email="user2@example.com",
        password_hash="hash2",
    )
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        await db_session.commit()

    await db_session.rollback()


@pytest.mark.asyncio
async def test_device_association_and_cascade(db_session: AsyncSession):
    """Verify device registration and cascade delete when user is removed."""
    user = User(
        username="bob",
        email="bob@example.com",
        password_hash="hash_bob",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    device = Device(
        user_id=user.id,
        device_identifier="fp_chrome_win_12345",
        trusted=True,
    )
    db_session.add(device)
    await db_session.commit()
    await db_session.refresh(device)

    assert device.id is not None
    assert device.user_id == user.id
    assert device.trusted is True

    # Delete user and verify device is cascaded
    await db_session.delete(user)
    await db_session.commit()

    device_check = await db_session.execute(select(Device).where(Device.id == device.id))
    assert device_check.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_session_token_hashing_and_uniqueness(db_session: AsyncSession):
    """Verify session storage and unique constraint on token hash."""
    user = User(username="charlie", email="charlie@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    now = datetime.now(timezone.utc)
    session1 = Session(
        user_id=user.id,
        session_token_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        expires_at=now + timedelta(hours=24),
    )
    db_session.add(session1)
    await db_session.commit()

    # Attempt to insert identical token hash
    session2 = Session(
        user_id=user.id,
        session_token_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        expires_at=now + timedelta(hours=24),
    )
    db_session.add(session2)
    with pytest.raises(IntegrityError):
        await db_session.commit()

    await db_session.rollback()


@pytest.mark.asyncio
async def test_login_attempt_and_risk_assessment(db_session: AsyncSession):
    """Verify login attempt logging with network attributes and linked risk assessment with JSON factor breakdown."""
    user = User(username="diana", email="diana@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    login_attempt = LoginAttempt(
        user_id=user.id,
        source_ip="198.51.100.42",
        subnet="198.51.100.0/24",
        password_success=True,
        otp_required=True,
        otp_success=None,
        risk_score=55,
        risk_level="HIGH",
        decision="RESTRICT_AND_VERIFY",
    )
    db_session.add(login_attempt)
    await db_session.commit()
    await db_session.refresh(login_attempt)

    factors = [
        {"name": "New device", "contribution": 25, "explanation": "Unrecognized browser identifier"},
        {"name": "Unknown IP", "contribution": 15, "explanation": "IP not seen in previous 30 days"},
        {"name": "Excessive requests", "contribution": 15, "explanation": "8 requests in 60s"},
    ]

    risk_assessment = RiskAssessment(
        user_id=user.id,
        login_attempt_id=login_attempt.id,
        risk_score=55,
        risk_level="HIGH",
        contributing_factors=factors,
        decision="RESTRICT_AND_VERIFY",
    )
    db_session.add(risk_assessment)
    await db_session.commit()
    await db_session.refresh(risk_assessment)

    assert risk_assessment.id is not None
    assert risk_assessment.risk_score == 55
    assert len(risk_assessment.contributing_factors) == 3
    assert risk_assessment.contributing_factors[0]["contribution"] == 25


@pytest.mark.asyncio
async def test_network_and_security_events(db_session: AsyncSession):
    """Verify network traffic events and high-level security audit logs."""
    net_event = NetworkEvent(
        source_ip="203.0.113.19",
        subnet="203.0.113.0/24",
        event_type="NEW_SUBNET",
        request_path="/api/auth/login",
        http_method="POST",
        status_code=401,
        severity="MEDIUM",
    )
    sec_event = SecurityEvent(
        user_id=None,
        event_type="BRUTE_FORCE_BURST",
        severity="HIGH",
        description="Repeated failed authentications originating from 203.0.113.0/24",
    )
    db_session.add_all([net_event, sec_event])
    await db_session.commit()

    assert net_event.id is not None
    assert sec_event.id is not None
    assert net_event.event_type == "NEW_SUBNET"
    assert sec_event.severity == "HIGH"
