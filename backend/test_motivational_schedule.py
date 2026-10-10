
from datetime import datetime, time
from zoneinfo import ZoneInfo

from run_reminders import (
    MOTIVATIONAL_START,
    MOTIVATIONAL_END,
    PAKISTAN_TIMEZONE,
)

timezone = PAKISTAN_TIMEZONE

test_times = [
    ("8:59 AM", datetime(2026, 10, 9, 8, 59)),
    ("9:00 AM", datetime(2026, 10, 9, 9, 0)),
    ("10:00 AM", datetime(2026, 10, 9, 10, 0)),
    ("11:00 AM", datetime(2026, 10, 9, 11, 0)),
]

for label, test_time in test_times:
    current_time = test_time.time()
    allowed = MOTIVATIONAL_START <= current_time < MOTIVATIONAL_END
    print(f"{label}: {'ALLOWED' if allowed else 'SKIPPED'}")

print("Timezone:", timezone)
