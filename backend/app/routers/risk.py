from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.risk_assessment import RiskAssessment
from backend.app.models.user import User
from backend.app.services.session_service import get_current_user

router = APIRouter(prefix="/api/risk", tags=["Risk Analysis"])


class RiskAssessmentSummary(BaseModel):
    id: int
    user_id: Optional[int]
    login_attempt_id: Optional[int]
    risk_score: int
    risk_level: str
    decision: str
    created_at: datetime
    contributing_factors: List[Dict[str, Any]]

    class Config:
        from_attributes = True


@router.get("/history", response_model=List[RiskAssessmentSummary])
async def list_risk_history(
    limit: int = Query(50, ge=1, le=200),
    level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve chronologically ordered risk assessment evaluations."""
    stmt = select(RiskAssessment)
    if level:
        stmt = stmt.where(RiskAssessment.risk_level == level.upper())
    stmt = stmt.order_by(desc(RiskAssessment.created_at)).limit(limit)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/assessment/{assessment_id}", response_model=RiskAssessmentSummary)
async def get_assessment_detail(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full explainability breakdown and contributing factors for a risk evaluation."""
    stmt = select(RiskAssessment).where(RiskAssessment.id == assessment_id)
    result = await db.execute(stmt)
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk assessment record not found.")

    return assessment
