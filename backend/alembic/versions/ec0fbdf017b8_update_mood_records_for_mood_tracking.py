"""update mood records for mood tracking

Revision ID: ec0fbdf017b8
Revises: daf33479bdac
Create Date: 2026-10-06 22:25:41.496222

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "ec0fbdf017b8"
down_revision = "daf33479bdac"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Update the existing mood_records table for Phase 13.

    Only mood_records is changed here.
    No unrelated UUID/type changes are included.
    """

    with op.batch_alter_table("mood_records") as batch_op:

        # Calendar date of the mood check-in.
        batch_op.add_column(
            sa.Column(
                "mood_date",
                sa.Date(),
                nullable=False
            )
        )

        # Timestamp for the last update to the mood record.
        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False
            )
        )

        # Only allow mood scores from 1 to 10.
        batch_op.create_check_constraint(
            "ck_mood_score_range",
            "mood_score >= 1 AND mood_score <= 10"
        )

        # A user can have only one mood check-in per calendar day.
        batch_op.create_unique_constraint(
            "uq_mood_user_date",
            ["user_id", "mood_date"]
        )


def downgrade() -> None:
    """
    Reverse only the Phase 13 mood tracking changes.
    """

    with op.batch_alter_table("mood_records") as batch_op:

        batch_op.drop_constraint(
            "uq_mood_user_date",
            type_="unique"
        )

        batch_op.drop_constraint(
            "ck_mood_score_range",
            type_="check"
        )

        batch_op.drop_column("updated_at")
        batch_op.drop_column("mood_date")