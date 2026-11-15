import base64
import hashlib
import io
import time
from typing import Optional, Set
import pyotp
import qrcode
from cryptography.fernet import Fernet

from backend.app.config import get_settings

settings = get_settings()


def _get_fernet_cipher() -> Fernet:
    """Initialize Fernet cipher using configured key, ensuring 32 url-safe base64 bytes."""
    raw_key = settings.TOTP_ENCRYPTION_KEY.encode()
    # Ensure key is valid Fernet 32-byte base64 encoded
    try:
        return Fernet(raw_key)
    except Exception:
        # Derive valid 32-byte key using sha256
        derived = base64.urlsafe_b64encode(hashlib.sha256(raw_key).digest())
        return Fernet(derived)


_cipher = _get_fernet_cipher()

# In-memory replay prevention cache for OTPs verified within recent window: set of (user_id, otp_code, time_step)
_used_otp_cache: Set[str] = set()


def encrypt_totp_secret(plain_secret: str) -> str:
    """Encrypt plaintext base32 TOTP secret before storing in the database."""
    return _cipher.encrypt(plain_secret.encode("utf-8")).decode("utf-8")


def decrypt_totp_secret(encrypted_secret: str) -> str:
    """Decrypt encrypted TOTP secret retrieved from database."""
    return _cipher.decrypt(encrypted_secret.encode("utf-8")).decode("utf-8")


def generate_totp_secret() -> str:
    """Generate a standard high-entropy base32 TOTP secret."""
    return pyotp.random_base32()


def generate_totp_provisioning_uri(username: str, secret: str, issuer_name: str = "AdaptiveAuth") -> str:
    """Generate standard otpauth:// URI compatible with Google & Microsoft Authenticator."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=issuer_name)


def generate_qr_code_base64(provisioning_uri: str) -> str:
    """Generate a PNG QR code encoded as a base64 data URI."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(provisioning_uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def verify_totp_code(
    encrypted_secret: str,
    otp_code: str,
    user_id: int,
    valid_window: int = 1,
) -> bool:
    """Verify 6-digit TOTP code with clock-skew window (valid_window=1 allows +-30 seconds).
    Enforces replay prevention within the current validity window.
    """
    if not otp_code or len(otp_code.strip()) != 6:
        return False

    code = otp_code.strip()
    plain_secret = decrypt_totp_secret(encrypted_secret)
    totp = pyotp.TOTP(plain_secret)

    # Current time step (30s interval)
    current_step = int(time.time() // 30)

    # Check clock skew window steps [-valid_window, +valid_window]
    for step_offset in range(-valid_window, valid_window + 1):
        step = current_step + step_offset
        expected_code = totp.at(time.time() + (step_offset * 30))
        if secrets_equal(code, expected_code):
            # Check replay prevention
            replay_key = f"{user_id}:{code}:{step}"
            if replay_key in _used_otp_cache:
                # Replay attack detected
                return False

            # Mark this code and step as consumed
            _used_otp_cache.add(replay_key)
            # Cap cache size to avoid unbounded memory growth
            if len(_used_otp_cache) > 10000:
                _used_otp_cache.clear()
            return True

    return False


def secrets_equal(a: str, b: str) -> bool:
    """Constant-time comparison."""
    import hmac
    return hmac.compare_digest(a, b)
