from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from backend.app import __version__
from backend.app.config import get_settings
from backend.app.models import Base
from backend.app.schemas.health import HealthResponse
from backend.app.routers import auth, totp, devices, network, risk, security, simulation
from backend.app.routers import evaluation

settings = get_settings()

app = FastAPI(
    title="Network-Aware Adaptive Authentication System",
    description="Adaptive multi-factor authentication with real-time network intelligence, device recognition, and explainable risk analysis.",
    version=__version__,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add defensive HTTP security headers to all responses."""
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Mount API Routers
app.include_router(auth.router)
app.include_router(totp.router)
app.include_router(devices.router)
app.include_router(network.router)
app.include_router(risk.router)
app.include_router(security.router)
app.include_router(simulation.router)
app.include_router(evaluation.router)


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Return health status, environment mode, and connected subsystem status."""
    model_count = len(Base.metadata.tables)
    return HealthResponse(
        status="ok",
        version=__version__,
        environment=settings.ENVIRONMENT,
        services={
            "api": "healthy",
            "database": f"configured ({model_count} models registered)" if settings.DATABASE_URL else "pending",
            "redis": "configured" if settings.REDIS_URL else "pending",
        },
    )


@app.get("/", tags=["Root"])
async def root():
    """Root info endpoint providing API documentation reference."""
    return {
        "service": "Network-Aware Adaptive Authentication System API",
        "version": __version__,
        "docs": "/api/docs",
        "health": "/api/health",
    }
