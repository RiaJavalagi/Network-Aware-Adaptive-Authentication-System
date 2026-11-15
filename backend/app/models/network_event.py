from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.database import Base


class NetworkEvent(Base):
    """Network intelligence event logging IP, subnet, request characteristics, and security classification."""

    __tablename__ = "network_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    source_ip: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    subnet: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    request_path: Mapped[str] = mapped_column(String(255), nullable=False)
    http_method: Mapped[str] = mapped_column(String(10), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    request_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )
    severity: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # INFO, LOW, MEDIUM, HIGH, CRITICAL

    def __repr__(self) -> str:
        return f"<NetworkEvent(id={self.id}, ip='{self.source_ip}', type='{self.event_type}', severity='{self.severity}')>"
