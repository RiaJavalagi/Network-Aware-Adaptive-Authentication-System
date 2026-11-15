from datetime import datetime, timezone
from typing import Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Schema for system health check response."""

    status: str = Field(default="ok", description="Overall service status")
    version: str = Field(..., description="API Version")
    environment: str = Field(..., description="Active runtime environment")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC server timestamp",
    )
    services: Dict[str, Any] = Field(
        default_factory=dict,
        description="Subsystem connectivity states",
    )
