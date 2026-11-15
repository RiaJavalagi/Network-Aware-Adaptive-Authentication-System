import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.user import User

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_db_session():
    """Create test in-memory database and session."""
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()


@pytest_asyncio.fixture
async def async_client(test_db_session: AsyncSession):
    """Create test HTTP client overriding get_db dependency."""
    async def override_get_db():
        yield test_db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_auth_registration_and_login_flow(async_client: AsyncClient):
    """Test full registration, login, and profile retrieval flow."""
    # 1. Register new user
    reg_resp = await async_client.post(
        "/api/auth/register",
        json={
            "username": "sec_researcher",
            "email": "sec@example.com",
            "password": "StrongPassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["username"] == "sec_researcher"
    assert reg_data["email"] == "sec@example.com"
    assert reg_data["totp_enabled"] is False

    # 2. Login with valid credentials
    login_resp = await async_client.post(
        "/api/auth/login",
        json={
            "username_or_email": "sec_researcher",
            "password": "StrongPassword!2026",
        },
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "status" in login_data
    assert "risk_score" in login_data

    # Extract session cookie
    session_cookie = login_resp.cookies.get("auth_session")

    # 3. Access /api/auth/me using session cookie
    if session_cookie:
        me_resp = await async_client.get(
            "/api/auth/me",
            cookies={"auth_session": session_cookie},
        )
        assert me_resp.status_code == 200
        assert me_resp.json()["username"] == "sec_researcher"


@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient):
    """Verify that bad password returns 401 and generic message."""
    # Register user first
    await async_client.post(
        "/api/auth/register",
        json={
            "username": "target_user",
            "email": "target@example.com",
            "password": "CorrectPassword!2026",
        },
    )

    bad_resp = await async_client.post(
        "/api/auth/login",
        json={
            "username_or_email": "target_user",
            "password": "WrongPassword!999",
        },
    )
    assert bad_resp.status_code == 401
    assert "Invalid authentication credentials" in bad_resp.json()["detail"]


from backend.app.services.session_service import create_user_session

@pytest.mark.asyncio
async def test_simulation_run_endpoint(async_client: AsyncClient, test_db_session: AsyncSession):
    """Verify that attack simulation scenarios run and compute explainable scores."""
    # Register user
    reg_res = await async_client.post(
        "/api/auth/register",
        json={
            "username": "admin_analyst",
            "email": "analyst@example.com",
            "password": "AnalystPassword!123",
        },
    )
    user_id = reg_res.json()["id"]

    # Directly issue authenticated session for test
    _, raw_token = await create_user_session(test_db_session, user_id)
    async_client.cookies.set("auth_session", raw_token)

    # Run simulation
    sim_res = await async_client.post(
        "/api/simulation/run",
        json={"scenario": "COMBINED_ATTACK"},
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["scenario"] == "COMBINED_ATTACK"
    assert sim_data["simulated"] is True
    assert sim_data["risk_score"] > 50
    assert len(sim_data["factors"]) > 0
    assert "processing_time_ms" in sim_data
