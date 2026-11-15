"""initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-11-15 13:40:00.000000+00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("encrypted_totp_secret", sa.String(length=512), nullable=True),
        sa.Column("totp_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 2. devices table
    op.create_table(
        "devices",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("device_identifier", sa.String(length=255), nullable=False),
        sa.Column("first_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("trusted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_devices_id", "devices", ["id"], unique=False)
    op.create_index("ix_devices_user_id", "devices", ["user_id"], unique=False)
    op.create_index("ix_devices_device_identifier", "devices", ["device_identifier"], unique=False)
    op.create_index("ix_devices_user_identifier", "devices", ["user_id", "device_identifier"], unique=False)

    # 3. sessions table
    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("session_token_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sessions_id", "sessions", ["id"], unique=False)
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"], unique=False)
    op.create_index("ix_sessions_session_token_hash", "sessions", ["session_token_hash"], unique=True)
    op.create_index("ix_sessions_expires_at", "sessions", ["expires_at"], unique=False)

    # 4. login_attempts table
    op.create_table(
        "login_attempts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("source_ip", sa.String(length=64), nullable=False),
        sa.Column("subnet", sa.String(length=64), nullable=False),
        sa.Column("device_id", sa.Integer(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("password_success", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("otp_required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("otp_success", sa.Boolean(), nullable=True),
        sa.Column("risk_score", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("risk_level", sa.String(length=20), nullable=False),
        sa.Column("decision", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_login_attempts_id", "login_attempts", ["id"], unique=False)
    op.create_index("ix_login_attempts_user_id", "login_attempts", ["user_id"], unique=False)
    op.create_index("ix_login_attempts_source_ip", "login_attempts", ["source_ip"], unique=False)
    op.create_index("ix_login_attempts_subnet", "login_attempts", ["subnet"], unique=False)
    op.create_index("ix_login_attempts_device_id", "login_attempts", ["device_id"], unique=False)
    op.create_index("ix_login_attempts_timestamp", "login_attempts", ["timestamp"], unique=False)
    op.create_index("ix_login_attempts_risk_level", "login_attempts", ["risk_level"], unique=False)

    # 5. network_events table
    op.create_table(
        "network_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("source_ip", sa.String(length=64), nullable=False),
        sa.Column("subnet", sa.String(length=64), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("request_path", sa.String(length=255), nullable=False),
        sa.Column("http_method", sa.String(length=10), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("request_timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_network_events_id", "network_events", ["id"], unique=False)
    op.create_index("ix_network_events_source_ip", "network_events", ["source_ip"], unique=False)
    op.create_index("ix_network_events_subnet", "network_events", ["subnet"], unique=False)
    op.create_index("ix_network_events_event_type", "network_events", ["event_type"], unique=False)
    op.create_index("ix_network_events_request_timestamp", "network_events", ["request_timestamp"], unique=False)
    op.create_index("ix_network_events_severity", "network_events", ["severity"], unique=False)

    # 6. risk_assessments table
    op.create_table(
        "risk_assessments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("login_attempt_id", sa.Integer(), nullable=True),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("risk_level", sa.String(length=20), nullable=False),
        sa.Column("contributing_factors", sa.JSON(), nullable=False),
        sa.Column("decision", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["login_attempt_id"], ["login_attempts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_risk_assessments_id", "risk_assessments", ["id"], unique=False)
    op.create_index("ix_risk_assessments_user_id", "risk_assessments", ["user_id"], unique=False)
    op.create_index("ix_risk_assessments_login_attempt_id", "risk_assessments", ["login_attempt_id"], unique=False)
    op.create_index("ix_risk_assessments_risk_level", "risk_assessments", ["risk_level"], unique=False)

    # 7. security_events table
    op.create_table(
        "security_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_security_events_id", "security_events", ["id"], unique=False)
    op.create_index("ix_security_events_user_id", "security_events", ["user_id"], unique=False)
    op.create_index("ix_security_events_event_type", "security_events", ["event_type"], unique=False)
    op.create_index("ix_security_events_severity", "security_events", ["severity"], unique=False)


def downgrade() -> None:
    op.drop_table("security_events")
    op.drop_table("risk_assessments")
    op.drop_table("network_events")
    op.drop_table("login_attempts")
    op.drop_table("sessions")
    op.drop_table("devices")
    op.drop_table("users")
