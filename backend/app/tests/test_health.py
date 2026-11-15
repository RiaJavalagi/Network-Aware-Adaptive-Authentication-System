import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture
def client():
    """Create a FastAPI test client instance."""
    return TestClient(app)


def test_health_check_returns_ok(client):
    """Verify that /api/health returns status 200 and expected payload."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data
    assert data["services"]["api"] == "healthy"


def test_security_headers_present(client):
    """Verify that security headers middleware attaches required headers."""
    response = client.get("/api/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"


def test_root_endpoint(client):
    """Verify that / returns service metadata and links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert data["health"] == "/api/health"
