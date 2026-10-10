from datetime import datetime
from unittest.mock import patch

import run_reminders


def run_test(hour):
    fake_now = datetime(2026, 10, 9, hour, 0)

    with (
        patch.object(run_reminders, "SessionLocal") as session_factory,
        patch.object(
            run_reminders,
            "process_due_reminders",
            return_value={"users_checked": 14, "notifications_created": 0},
        ) as mood_processor,
        patch.object(
            run_reminders,
            "process_motivational_notifications",
            return_value={"users_checked": 14, "notifications_created": 14},
        ) as motivational_processor,
        patch.object(run_reminders, "datetime") as mock_datetime,
    ):
        mock_datetime.now.return_value = fake_now.replace(
            tzinfo=run_reminders.PAKISTAN_TIMEZONE
        )

        db = session_factory.return_value
        run_reminders.main()

        assert mood_processor.called
        assert db.commit.called
        assert db.close.called

        if 9 <= hour < 11:
            assert motivational_processor.called
        else:
            assert not motivational_processor.called

        print(f"{hour:02d}:00 - PASS")


run_test(8)
run_test(9)
run_test(10)
run_test(11)
