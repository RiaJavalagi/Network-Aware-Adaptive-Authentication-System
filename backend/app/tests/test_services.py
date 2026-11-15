import pytest
from backend.app.services.password_service import (
    hash_password,
    verify_password,
    validate_password_strength,
)
from backend.app.services.totp_service import (
    generate_totp_secret,
    encrypt_totp_secret,
    decrypt_totp_secret,
    generate_totp_provisioning_uri,
    generate_qr_code_base64,
    verify_totp_code,
)
import pyotp
from backend.app.services.network_monitor import calculate_subnet
from backend.app.services.risk_engine import risk_engine
from backend.app.services.rate_limit_service import rate_limit_service


def test_argon2id_hashing_and_verification():
    """Verify that password is hashable via Argon2id and verifiable."""
    pwd = "CorrectHorseBatteryStaple!99"
    pwd_hash = hash_password(pwd)
    assert pwd_hash.startswith("$argon2id$")
    assert verify_password(pwd, pwd_hash) is True
    assert verify_password("WrongPassword123!", pwd_hash) is False


def test_password_strength_validator():
    """Verify password policy rules enforcement."""
    # Too short
    ok, msg = validate_password_strength("Short1!")
    assert ok is False
    # Missing uppercase
    ok, msg = validate_password_strength("lowercase123!@#")
    assert ok is False
    # Missing special
    ok, msg = validate_password_strength("NoSpecialChar1234")
    assert ok is False
    # Valid
    ok, msg = validate_password_strength("ValidPassword#2026")
    assert ok is True


def test_totp_lifecycle_and_encryption():
    """Verify TOTP secret generation, Fernet encryption at rest, and verification."""
    secret = generate_totp_secret()
    assert len(secret) == 32

    # Encrypt and decrypt
    encrypted = encrypt_totp_secret(secret)
    assert encrypted != secret
    decrypted = decrypt_totp_secret(encrypted)
    assert decrypted == secret

    # Generate current OTP code
    totp = pyotp.TOTP(secret)
    current_code = totp.now()

    # Verify code succeeds
    assert verify_totp_code(encrypted, current_code, user_id=101) is True

    # Replay attack: verifying identical code within same validity window must fail
    assert verify_totp_code(encrypted, current_code, user_id=101) is False

    # Invalid code
    assert verify_totp_code(encrypted, "000000", user_id=101) is False


def test_qr_code_generation():
    """Verify provisioning URI and base64 QR generation."""
    secret = generate_totp_secret()
    uri = generate_totp_provisioning_uri("alice", secret, "AdaptiveAuth")
    assert uri.startswith("otpauth://totp/AdaptiveAuth:alice?")
    qr_b64 = generate_qr_code_base64(uri)
    assert qr_b64.startswith("data:image/png;base64,")


def test_subnet_calculation():
    """Verify IPv4 /24 and IPv6 /64 CIDR canonical subnet calculation."""
    assert calculate_subnet("192.168.1.50") == "192.168.1.0/24"
    assert calculate_subnet("10.0.4.120") == "10.0.4.0/24"
    assert calculate_subnet("2001:db8:85a3:8d3:1319:8a2e:370:7348") == "2001:db8:85a3:8d3::/64"


def test_risk_engine_scoring_and_explanations():
    """Verify multi-signal risk calculation, factor breakdowns, and policy thresholds."""
    # Baseline normal login
    res_low = risk_engine.evaluate(
        is_new_device=False,
        is_device_trusted=True,
        is_new_ip=False,
        is_new_subnet=False,
        recent_request_count=1,
        failed_attempts_count=0,
    )
    assert res_low.risk_score <= 20
    assert res_low.risk_level == "LOW"
    assert res_low.decision == "ALLOW"

    # New device + new subnet (Medium / High)
    res_med = risk_engine.evaluate(
        is_new_device=True,
        is_device_trusted=False,
        is_new_ip=True,
        is_new_subnet=True,
        recent_request_count=1,
        failed_attempts_count=0,
    )
    # New device (25) + New Subnet & IP (25) = 50
    assert res_med.risk_score == 50
    assert res_med.risk_level == "MEDIUM"
    assert res_med.decision == "CHALLENGE_TOTP"
    assert len(res_med.factors) >= 2

    # High frequency brute force burst (High / Deny)
    res_high = risk_engine.evaluate(
        is_new_device=True,
        is_device_trusted=False,
        is_new_ip=True,
        is_new_subnet=True,
        recent_request_count=16,
        failed_attempts_count=5,
    )
    assert res_high.risk_score >= 51
    assert res_high.risk_level == "HIGH"
    assert res_high.decision == "DENY"


@pytest.mark.asyncio
async def test_rate_limiter_and_challenge_store():
    """Verify rate limiter sliding window and ephemeral challenge token persistence."""
    ip = "198.51.100.99"
    # Should allow 5 requests
    for _ in range(5):
        allowed, remaining = await rate_limit_service.check_ip_rate_limit(ip, max_requests=5, window_seconds=10)
    # 6th request should be rejected
    allowed, remaining = await rate_limit_service.check_ip_rate_limit(ip, max_requests=5, window_seconds=10)
    assert allowed is False

    # Ephemeral challenge storage
    token = "test_challenge_token_abc"
    await rate_limit_service.store_challenge_state(token, {"user_id": 42}, ttl_seconds=60)
    data = await rate_limit_service.get_and_consume_challenge_state(token)
    assert data is not None
    assert data["user_id"] == 42
    # Consuming again returns None (single-use)
    assert await rate_limit_service.get_and_consume_challenge_state(token) is None
