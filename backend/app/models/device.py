from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base


class Device(Base):
    """Registered device entity associated with a user account."""

    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    device_identifier: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    first_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    trusted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="devices")
    login_attempts = relationship("LoginAttempt", back_populates="device")

    __table_args__ = (
        Index("ix_devices_user_identifier", "user_id", "device_identifier"),
    )

    def __repr__(self) -> str:
        return f"<Device(id={self.id}, user_id={self.user_id}, identifier='{self.device_identifier[:12]}...', trusted={self.trusted})>"
