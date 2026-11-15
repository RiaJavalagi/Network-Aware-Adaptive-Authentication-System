from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base


class LoginAttempt(Base):
    """Historical record of an authentication attempt with associated network and risk attributes."""

    __tablename__ = "login_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    source_ip: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    subnet: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    device_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("devices.id", ondelete="SET NULL"), nullable=True, index=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )
    password_success: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    otp_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    otp_success: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    risk_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # LOW, MEDIUM, HIGH
    decision: Mapped[str] = mapped_column(String(50), nullable=False)  # ALLOW, CHALLENGE_TOTP, RESTRICT_AND_VERIFY, DENY

    # Relationships
    user = relationship("User", back_populates="login_attempts")
    device = relationship("Device", back_populates="login_attempts")
    risk_assessment = relationship("RiskAssessment", back_populates="login_attempt", uselist=False)

    def __repr__(self) -> str:
        return f"<LoginAttempt(id={self.id}, user_id={self.user_id}, ip='{self.source_ip}', score={self.risk_score}, decision='{self.decision}')>"
