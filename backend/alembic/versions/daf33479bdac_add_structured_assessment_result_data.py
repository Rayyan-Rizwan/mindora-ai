"""add structured assessment result data

Revision ID: daf33479bdac
Revises: 58a5105e104d
Create Date: 2026-09-26 18:16:05.527652

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "daf33479bdac"
down_revision = "58a5105e104d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "assessment_results",
        sa.Column(
            "result_data",
            sa.JSON(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "assessment_results",
        "result_data",
    )