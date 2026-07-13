"""matrimony details (family/lifestyle/horoscope/id-verification), interest message, success stories

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-10 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "members",
        sa.Column(
            "marital_status",
            sa.Enum("never_married", "divorced", "widowed", "awaiting_divorce", name="maritalstatus"),
            nullable=True,
        ),
    )
    op.add_column("members", sa.Column("mother_tongue", sa.String(60), nullable=True))

    op.add_column("profiles", sa.Column("family_details", sa.JSON(), nullable=True))
    op.add_column("profiles", sa.Column("lifestyle", sa.JSON(), nullable=True))
    op.add_column("profiles", sa.Column("physical_attributes", sa.JSON(), nullable=True))
    op.add_column("profiles", sa.Column("horoscope", sa.JSON(), nullable=True))
    op.add_column("profiles", sa.Column("id_document_url", sa.String(500), nullable=True))
    op.add_column(
        "profiles",
        sa.Column(
            "id_verification_status",
            sa.Enum("pending", "approved", "rejected", name="idverificationstatus"),
            nullable=False,
            server_default="pending",
        ),
    )

    op.add_column("matches", sa.Column("message", sa.Text(), nullable=True))

    op.create_table(
        "success_stories",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("member_a_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="SET NULL"), nullable=True),
        sa.Column("member_b_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("story", sa.Text(), nullable=False),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("wedding_date", sa.Date(), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("success_stories")
    op.drop_column("matches", "message")
    op.drop_column("profiles", "id_verification_status")
    op.drop_column("profiles", "id_document_url")
    op.drop_column("profiles", "horoscope")
    op.drop_column("profiles", "physical_attributes")
    op.drop_column("profiles", "lifestyle")
    op.drop_column("profiles", "family_details")
    op.drop_column("members", "mother_tongue")
    op.drop_column("members", "marital_status")

    sa.Enum(name="maritalstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="idverificationstatus").drop(op.get_bind(), checkfirst=True)
