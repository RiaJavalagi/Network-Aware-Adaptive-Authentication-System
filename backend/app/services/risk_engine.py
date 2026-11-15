from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional


@dataclass
class RiskFactor:
    """Represents a single evaluated security signal contributing to overall risk."""
    name: str
    contribution: int
    explanation: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "contribution": self.contribution,
            "explanation": self.explanation,
        }


@dataclass
class RiskAssessmentResult:
    """The complete explainable assessment output for an authentication attempt."""
    risk_score: int
    risk_level: str
    factors: List[RiskFactor] = field(default_factory=list)
    decision: str = "ALLOW"
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "factors": [f.to_dict() for f in self.factors],
            "decision": self.decision,
            "timestamp": self.timestamp.isoformat(),
        }


class RiskEngine:
    """Explainable Multi-Signal Risk Engine.
    Evaluates connection metadata, device recognition, and behavioral historical signals.
    """

    # Configurable Signal Weights
    WEIGHT_NEW_DEVICE: int = 25
    WEIGHT_NEW_IP: int = 15
    WEIGHT_NEW_SUBNET: int = 10
    WEIGHT_EXCESSIVE_FREQ: int = 25
    WEIGHT_FAILED_PASSWORDS: int = 30
    WEIGHT_UNUSUAL_TIME: int = 10

    # Risk Thresholds
    THRESHOLD_LOW_MAX: int = 20
    THRESHOLD_MEDIUM_MAX: int = 50

    def evaluate(
        self,
        is_new_device: bool,
        is_device_trusted: bool,
        is_new_ip: bool,
        is_new_subnet: bool,
        recent_request_count: int,
        failed_attempts_count: int,
        current_time: Optional[datetime] = None,
        totp_enabled: bool = False,
    ) -> RiskAssessmentResult:
        """Calculate explainable risk score and security action."""
        if current_time is None:
            current_time = datetime.now(timezone.utc)

        raw_score = 0
        factors: List[RiskFactor] = []

        # 1. Device Evaluation
        if is_new_device:
            raw_score += self.WEIGHT_NEW_DEVICE
            factors.append(
                RiskFactor(
                    name="New Device",
                    contribution=self.WEIGHT_NEW_DEVICE,
                    explanation="Login initiated from an unrecognized client device identifier",
                )
            )
        elif not is_device_trusted:
            # Device recognized but not marked as trusted: minor factor
            raw_score += 5
            factors.append(
                RiskFactor(
                    name="Untrusted Device",
                    contribution=5,
                    explanation="Recognized device has not been explicitly approved as trusted",
                )
            )

        # 2. Network IP & Subnet Correlation
        # Avoid double-counting: if subnet is new, IP is naturally new.
        if is_new_subnet:
            # New subnet entails both new subnet and new IP
            combined_contribution = self.WEIGHT_NEW_SUBNET + self.WEIGHT_NEW_IP
            raw_score += combined_contribution
            factors.append(
                RiskFactor(
                    name="New Network Subnet & IP",
                    contribution=combined_contribution,
                    explanation="Connection originates from a previously unseen IP subnet and network block",
                )
            )
        elif is_new_ip:
            # Subnet is known, but IP within subnet is new
            raw_score += self.WEIGHT_NEW_IP
            factors.append(
                RiskFactor(
                    name="New IP Address in Known Subnet",
                    contribution=self.WEIGHT_NEW_IP,
                    explanation="New host IP address, though within an established familiar subnet",
                )
            )

        # 3. Request Frequency / Velocity Analysis
        if recent_request_count >= 10:
            raw_score += self.WEIGHT_EXCESSIVE_FREQ
            factors.append(
                RiskFactor(
                    name="Excessive Request Frequency",
                    contribution=self.WEIGHT_EXCESSIVE_FREQ,
                    explanation=f"Rapid request burst detected ({recent_request_count} requests in 60 seconds)",
                )
            )
        elif recent_request_count >= 5:
            mod_freq = 15
            raw_score += mod_freq
            factors.append(
                RiskFactor(
                    name="Elevated Request Velocity",
                    contribution=mod_freq,
                    explanation=f"Higher than normal login frequency ({recent_request_count} requests in 60 seconds)",
                )
            )

        # 4. Authentication Failure History
        if failed_attempts_count >= 3:
            raw_score += self.WEIGHT_FAILED_PASSWORDS
            factors.append(
                RiskFactor(
                    name="Repeated Credential Failures",
                    contribution=self.WEIGHT_FAILED_PASSWORDS,
                    explanation=f"Multiple recent authentication failures recorded ({failed_attempts_count} failures in window)",
                )
            )
        elif failed_attempts_count > 0:
            mod_fail = 10 * failed_attempts_count
            raw_score += mod_fail
            factors.append(
                RiskFactor(
                    name="Recent Failed Attempts",
                    contribution=mod_fail,
                    explanation=f"{failed_attempts_count} recent failed password attempts observed",
                )
            )

        # 5. Temporal Anomaly (e.g. 02:00 to 05:00 UTC)
        hour = current_time.hour
        if 2 <= hour <= 4:
            raw_score += self.WEIGHT_UNUSUAL_TIME
            factors.append(
                RiskFactor(
                    name="Off-Hours Login Attempt",
                    contribution=self.WEIGHT_UNUSUAL_TIME,
                    explanation=f"Login attempt at unusual local time ({hour:02d}:00 UTC)",
                )
            )

        # Clamp score strictly between 0 and 100
        clamped_score = max(0, min(100, raw_score))

        # Categorize Risk
        if clamped_score <= self.THRESHOLD_LOW_MAX:
            risk_level = "LOW"
            # Low risk: allow if user policy permits
            decision = "ALLOW"
        elif clamped_score <= self.THRESHOLD_MEDIUM_MAX:
            risk_level = "MEDIUM"
            decision = "CHALLENGE_TOTP"
        else:
            risk_level = "HIGH"
            # High risk: if excessive requests or repeated failures, apply RESTRICT_AND_VERIFY or DENY
            if recent_request_count >= 15 or failed_attempts_count >= 5:
                decision = "DENY"
            else:
                decision = "RESTRICT_AND_VERIFY"

        # Mandatory MFA Invariant: Never bypass mandatory MFA if user enabled it
        if totp_enabled and decision == "ALLOW":
            decision = "CHALLENGE_TOTP"

        return RiskAssessmentResult(
            risk_score=clamped_score,
            risk_level=risk_level,
            factors=factors,
            decision=decision,
            timestamp=current_time,
        )


# Singleton instance
risk_engine = RiskEngine()
