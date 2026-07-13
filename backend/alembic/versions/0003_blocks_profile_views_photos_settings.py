"""blocks, profile_views, profile photos/settings

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-09 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "blocks",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("blocker_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("blocked_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("blocker_id", "blocked_id", name="uq_blocks_blocker_blocked"),
    )

    op.create_table(
        "profile_views",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("viewer_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("viewed_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("viewed_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.add_column("profiles", sa.Column("photos", sa.JSON(), nullable=True))
    op.add_column("profiles", sa.Column("settings", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("profiles", "settings")
    op.drop_column("profiles", "photos")
    op.drop_table("profile_views")
    op.drop_table("blocks")
