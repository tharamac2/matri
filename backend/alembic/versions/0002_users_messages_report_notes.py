"""users, messages, report resolution notes

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-09 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("phone_number", sa.String(50), nullable=True, unique=True, index=True),
        sa.Column("email", sa.String(255), nullable=True, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("profile_for", sa.String(50), nullable=True),
        sa.Column("gender", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=True, unique=True),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("receiver_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("read_at", sa.DateTime(), nullable=True),
    )

    op.add_column("reports", sa.Column("resolution_note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("reports", "resolution_note")
    op.drop_table("messages")
    op.drop_table("users")
