from datetime import datetime, timezone
from typing import Any, List, Dict
from sqlalchemy import DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base


class RiskAssessment(Base):
    """Explainable risk evaluation record with itemized contributing risk signals."""

    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    login_attempt_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("login_attempts.id", ondelete="CASCADE"), nullable=True, index=True
    )
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # LOW, MEDIUM, HIGH
    contributing_factors: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    decision: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="risk_assessments")
    login_attempt = relationship("LoginAttempt", back_populates="risk_assessment")

    def __repr__(self) -> str:
        return f"<RiskAssessment(id={self.id}, user_id={self.user_id}, score={self.risk_score}, level='{self.risk_level}', decision='{self.decision}')>"
