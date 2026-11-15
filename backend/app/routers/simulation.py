import time
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from backend.app.models.user import User
from backend.app.services.session_service import get_current_user
from backend.app.services.risk_engine import risk_engine
from backend.app.services.network_monitor import calculate_subnet

router = APIRouter(prefix="/api/simulation", tags=["Attack Simulation Lab"])


class SimulationRunRequest(BaseModel):
    scenario: str = Field(
        ...,
        description="One of: NORMAL_LOGIN, NEW_IP, NEW_SUBNET, NEW_DEVICE, WRONG_PASSWORD_BURST, EXCESSIVE_FREQUENCY, REPEATED_WRONG_OTP, COMBINED_ATTACK",
    )


class SimulationResultResponse(BaseModel):
    scenario: str
    scenario_title: str
    description: str
    simulated: bool = True
    input_parameters: Dict[str, Any]
    generated_events: List[Dict[str, Any]]
    risk_score: int
    risk_level: str
    decision: str
    factors: List[Dict[str, Any]]
    processing_time_ms: float


@router.post("/run", response_model=SimulationResultResponse)
async def run_attack_scenario(
    payload: SimulationRunRequest,
    current_user: User = Depends(get_current_user),
):
    """Execute a controlled attack simulation scenario and observe live explainable risk scoring."""
    start_time = time.perf_counter()
    scenario = payload.scenario.upper()

    # Pre-configured scenario parameters
    params: Dict[str, Any] = {}
    events: List[Dict[str, Any]] = []

    if scenario == "NORMAL_LOGIN":
        title = "Normal Baseline Login"
        desc = "Authentication from an established device and familiar network subnet."
        params = {
            "source_ip": "192.168.1.15",
            "subnet": calculate_subnet("192.168.1.15"),
            "device_trusted": True,
            "is_new_device": False,
            "is_new_ip": False,
            "is_new_subnet": False,
            "recent_requests": 1,
            "recent_failures": 0,
        }
        events.append({"type": "SIM_CONNECTION", "detail": "Traffic from known subnet 192.168.1.0/24", "severity": "INFO"})

    elif scenario == "NEW_IP":
        title = "Login from New Host IP"
        desc = "Authentication from a new host IP within an already recognized organizational subnet."
        params = {
            "source_ip": "192.168.1.204",
            "subnet": calculate_subnet("192.168.1.204"),
            "device_trusted": True,
            "is_new_device": False,
            "is_new_ip": True,
            "is_new_subnet": False,
            "recent_requests": 2,
            "recent_failures": 0,
        }
        events.append({"type": "SIM_NEW_IP", "detail": "Host 192.168.1.204 not seen previously for this user", "severity": "LOW"})

    elif scenario == "NEW_SUBNET":
        title = "Login from Unfamiliar Network Subnet"
        desc = "Connection routed from a foreign /24 subnet block."
        params = {
            "source_ip": "198.51.100.88",
            "subnet": calculate_subnet("198.51.100.88"),
            "device_trusted": True,
            "is_new_device": False,
            "is_new_ip": True,
            "is_new_subnet": True,
            "recent_requests": 1,
            "recent_failures": 0,
        }
        events.append({"type": "SIM_NEW_SUBNET", "detail": "Ingress from unseen network 198.51.100.0/24", "severity": "MEDIUM"})

    elif scenario == "NEW_DEVICE":
        title = "Unrecognized Client Device Login"
        desc = "Authentication from an unknown device identifier / browser fingerprint."
        params = {
            "source_ip": "192.168.1.15",
            "subnet": calculate_subnet("192.168.1.15"),
            "device_trusted": False,
            "is_new_device": True,
            "is_new_ip": False,
            "is_new_subnet": False,
            "recent_requests": 1,
            "recent_failures": 0,
        }
        events.append({"type": "SIM_NEW_DEVICE", "detail": "New browser device identifier registered", "severity": "MEDIUM"})

    elif scenario == "WRONG_PASSWORD_BURST":
        title = "Credential Stuffing / Password Brute-Force"
        desc = "Four consecutive failed password attempts detected within a short timeframe."
        params = {
            "source_ip": "203.0.113.45",
            "subnet": calculate_subnet("203.0.113.45"),
            "device_trusted": False,
            "is_new_device": True,
            "is_new_ip": True,
            "is_new_subnet": True,
            "recent_requests": 6,
            "recent_failures": 4,
        }
        events.append({"type": "SIM_AUTH_BURST", "detail": "4 consecutive failed password attempts", "severity": "HIGH"})

    elif scenario == "EXCESSIVE_FREQUENCY":
        title = "Excessive Request Frequency Attack"
        desc = "High velocity login traffic burst (18 requests within 60 seconds) simulating automated tooling."
        params = {
            "source_ip": "185.220.101.5",
            "subnet": calculate_subnet("185.220.101.5"),
            "device_trusted": False,
            "is_new_device": True,
            "is_new_ip": True,
            "is_new_subnet": True,
            "recent_requests": 18,
            "recent_failures": 1,
        }
        events.append({"type": "SIM_RATE_SPIKE", "detail": "18 requests in 60s from 185.220.101.5", "severity": "CRITICAL"})

    elif scenario == "REPEATED_WRONG_OTP":
        title = "Repeated Incorrect Two-Factor OTP Codes"
        desc = "Attacker possesses password credentials but fails subsequent OTP challenges."
        params = {
            "source_ip": "198.51.100.12",
            "subnet": calculate_subnet("198.51.100.12"),
            "device_trusted": False,
            "is_new_device": True,
            "is_new_ip": True,
            "is_new_subnet": True,
            "recent_requests": 4,
            "recent_failures": 2,
        }
        events.append({"type": "SIM_OTP_FAILURE", "detail": "3 consecutive failed 6-digit OTP validations", "severity": "HIGH"})

    else:  # COMBINED_ATTACK
        scenario = "COMBINED_ATTACK"
        title = "Combined Multi-Vector Threat Attack"
        desc = "Simultaneous signals: unfamiliar subnet, untrusted new device, rapid request rate, and prior password failures."
        params = {
            "source_ip": "45.33.32.156",
            "subnet": calculate_subnet("45.33.32.156"),
            "device_trusted": False,
            "is_new_device": True,
            "is_new_ip": True,
            "is_new_subnet": True,
            "recent_requests": 12,
            "recent_failures": 3,
        }
        events.append({"type": "SIM_COMBINED_THREAT", "detail": "Multiple correlated anomaly vectors detected simultaneously", "severity": "CRITICAL"})

    # Execute Risk Engine evaluation
    assessment = risk_engine.evaluate(
        is_new_device=params["is_new_device"],
        is_device_trusted=params["device_trusted"],
        is_new_ip=params["is_new_ip"],
        is_new_subnet=params["is_new_subnet"],
        recent_request_count=params["recent_requests"],
        failed_attempts_count=params["recent_failures"],
        totp_enabled=current_user.totp_enabled,
    )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return SimulationResultResponse(
        scenario=scenario,
        scenario_title=title,
        description=desc,
        simulated=True,
        input_parameters=params,
        generated_events=events,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        decision=assessment.decision,
        factors=[f.to_dict() for f in assessment.factors],
        processing_time_ms=elapsed_ms,
    )
