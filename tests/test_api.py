import base64
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_login_unauthorized_without_credentials():
    response = client.get("/api/login")
    assert response.status_code == 401
    assert "WWW-Authenticate" in response.headers


def test_api_login_unauthorized_with_wrong_password():
    auth = base64.b64encode(b"admin:incorrect-password").decode()
    response = client.get("/api/login", headers={"Authorization": f"Basic {auth}"})
    assert response.status_code == 401


def test_api_login_authorized_with_valid_credentials():
    username = settings.dashboard_username or "admin"
    password = settings.dashboard_password
    if not password:
        # If no password configured in test environment, set a temporary one
        settings.dashboard_password = "test-secret-password"
        password = settings.dashboard_password

    auth = base64.b64encode(f"{username}:{password}".encode()).decode()
    response = client.get("/api/login", headers={"Authorization": f"Basic {auth}"})
    assert response.status_code == 200
    assert response.json() == {"ok": True}
