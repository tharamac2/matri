"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("super_admin", "moderator", "viewer", name="adminrole"), nullable=False, server_default="viewer"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("last_login", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "members",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("gender", sa.Enum("male", "female", name="gender"), nullable=False),
        sa.Column("dob", sa.Date(), nullable=True),
        sa.Column("religion", sa.String(60), nullable=True),
        sa.Column("caste", sa.String(60), nullable=True),
        sa.Column("city", sa.String(80), nullable=True),
        sa.Column("state", sa.String(80), nullable=True),
        sa.Column("status", sa.Enum("active", "inactive", "banned", "pending", name="memberstatus"), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("last_active", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("height_cm", sa.Integer(), nullable=True),
        sa.Column("education", sa.String(120), nullable=True),
        sa.Column("profession", sa.String(120), nullable=True),
        sa.Column("income_lpa", sa.Numeric(10, 2), nullable=True),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("photo_status", sa.Enum("pending", "approved", "rejected", name="photostatus"), nullable=False, server_default="pending"),
        sa.Column("partner_prefs", sa.JSON(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "matches",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("receiver_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.Enum("pending", "accepted", "rejected", "expired", name="matchstatus"), nullable=False, server_default="pending"),
        sa.Column("sent_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("responded_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "subscription_plans",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("features", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("subscription_plans.id"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", sa.Enum("active", "expired", "cancelled", name="subscriptionstatus"), nullable=False, server_default="active"),
        sa.Column("auto_renew", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subscription_id", sa.Integer(), sa.ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("gateway", sa.String(60), nullable=False),
        sa.Column("txn_id", sa.String(120), nullable=False, unique=True),
        sa.Column("status", sa.Enum("success", "failed", "refunded", name="paymentstatus"), nullable=False, server_default="success"),
        sa.Column("paid_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("reporter_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reported_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("pending", "reviewed", "resolved", "dismissed", name="reportstatus"), nullable=False, server_default="pending"),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("admin_users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("device", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("admin_id", sa.Integer(), sa.ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("resource_type", sa.String(80), nullable=False),
        sa.Column("resource_id", sa.Integer(), nullable=True),
        sa.Column("old_value", sa.JSON(), nullable=True),
        sa.Column("new_value", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("activity_logs")
    op.drop_table("reports")
    op.drop_table("payments")
    op.drop_table("subscriptions")
    op.drop_table("subscription_plans")
    op.drop_table("matches")
    op.drop_table("profiles")
    op.drop_table("members")
    op.drop_table("admin_users")

    sa.Enum(name="adminrole").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="gender").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="memberstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="photostatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="matchstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="subscriptionstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="paymentstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="reportstatus").drop(op.get_bind(), checkfirst=True)
