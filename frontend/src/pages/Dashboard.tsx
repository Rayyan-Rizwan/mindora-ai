import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/services/api";

type MoodHistoryItem = {
  date: string;
  score: number;
};

type MoodSummary = {
  period: {
    start_date: string;
    end_date: string;
  };

  statistics: {
    average_mood: number | null;
    highest_mood: number | null;
    lowest_mood: number | null;
    total_check_ins: number;
  };

  trends: {
    current_7_day_average: number | null;
    previous_7_day_average: number | null;
    weekly_change: number | null;
    overall_average: number | null;
    current_streak: number;
    missing_days_last_7_days: number;
  };

  moods: MoodHistoryItem[];
};

type Period = "daily" | "weekly" | "monthly";

export default function Dashboard() {
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [moodSummary, setMoodSummary] =
    useState<MoodSummary | null>(null);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [period, setPeriod] = useState<Period>("daily");

  const loadTodayMood = async () => {
    try {
      const response = await api.get("/mood/today");

      if (response.data) {
        setMoodScore(response.data.mood_score);
        setNote(response.data.note || "");
      }
    } catch (error) {
      console.error("Could not load today's mood:", error);
    }
  };

  const loadMoodSummary = async () => {
    setSummaryLoading(true);

    try {
      const response = await api.get<MoodSummary>(
        "/mood/summary"
      );

      setMoodSummary(response.data);
    } catch (error) {
      console.error("Could not load mood summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadTodayMood();
    loadMoodSummary();
  }, []);

  const getMoodInfo = (score: number) => {
    if (score <= 2) {
      return { emoji: "😞", label: "Very low" };
    }

    if (score <= 4) {
      return { emoji: "😔", label: "Low" };
    }

    if (score <= 6) {
      return { emoji: "😐", label: "Okay" };
    }

    if (score <= 8) {
      return { emoji: "🙂", label: "Good" };
    }

    return { emoji: "😄", label: "Great" };
  };

  const getMoodMessage = (score: number) => {
    if (score <= 3) {
      return "It seems like today feels a little difficult. Take a moment for yourself and be kind to yourself.";
    }

    if (score <= 6) {
      return "Thanks for checking in. Keep taking care of yourself today.";
    }

    return "Glad to see you're feeling good today. Keep taking care of yourself!";
  };

  const saveMood = async () => {
    if (moodScore === null) return;

    setLoading(true);
    setMessage("");

    try {
      await api.post("/mood", {
        mood_score: moodScore,
        note: note.trim() || null,
      });

      setMessage(getMoodMessage(moodScore));

      await loadMoodSummary();
    } catch (error) {
      console.error("Mood save error:", error);
      setMessage("Could not save your mood.");
    } finally {
      setLoading(false);
    }
  };

  const moodInfo =
    moodScore !== null
      ? getMoodInfo(moodScore)
      : null;

  /*
   * Get today's date as YYYY-MM-DD using the user's local timezone.
   */
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /*
   * Get the date that is a certain number of days before today.
   */
  const getDateDaysAgo = (daysAgo: number) => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);

    return getLocalDateString(date);
  };

  const todayString = getLocalDateString(new Date());

  let startDateString = todayString;

  if (period === "weekly") {
    startDateString = getDateDaysAgo(6);
  }

  if (period === "monthly") {
    startDateString = getDateDaysAgo(29);
  }

  /*
   * Filter by calendar date.
   *
   * Daily   = today only
   * Weekly  = today + previous 6 days
   * Monthly = today + previous 29 days
   */
  const filteredMoods =
    moodSummary?.moods.filter((mood) => {
      return (
        mood.date >= startDateString &&
        mood.date <= todayString
      );
    }) || [];

  const chartData = filteredMoods.map((mood) => ({
    date: new Date(
      `${mood.date}T00:00:00`
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: mood.score,
  }));

  const scores = filteredMoods.map(
    (mood) => mood.score
  );

  const average =
    scores.length > 0
      ? (
          scores.reduce(
            (sum, score) => sum + score,
            0
          ) / scores.length
        ).toFixed(1)
      : "-";

  const highest =
    scores.length > 0
      ? Math.max(...scores)
      : "-";

  const lowest =
    scores.length > 0
      ? Math.min(...scores)
      : "-";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">

      {/* Daily Mood */}
      <section>
        <h1 className="text-3xl font-bold mb-2">
          How are you feeling today?
        </h1>

        <p className="text-gray-600 mb-8">
          Move the slider to choose your mood.
        </p>

        {moodInfo && moodScore !== null && (
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">
              {moodInfo.emoji}
            </div>

            <p className="text-2xl font-bold">
              {moodScore}/10
            </p>

            <p className="text-gray-600">
              {moodInfo.label}
            </p>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between text-3xl mb-3">
            <span>😞</span>
            <span>😄</span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            value={moodScore ?? 5}
            onChange={(e) => {
              setMoodScore(Number(e.target.value));
              setMessage("");
            }}
            className="w-full cursor-pointer"
          />

          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's on your mind? (optional)"
          maxLength={500}
          className="w-full border rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="button"
          onClick={saveMood}
          disabled={loading || moodScore === null}
          className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Mood"}
        </button>

        {message && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 border">
            <p className="text-sm text-gray-700">
              {message}
            </p>
          </div>
        )}
      </section>

      {/* Mood Tracking */}
      <section className="border rounded-xl p-6">

        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Mood Tracking
          </h2>

          <p className="text-gray-600 mt-1">
            Review your mood history.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {(["daily", "weekly", "monthly"] as Period[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  period === item
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Average
            </p>

            <p className="text-2xl font-bold mt-1">
              {average}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Highest
            </p>

            <p className="text-2xl font-bold mt-1">
              {highest}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Lowest
            </p>

            <p className="text-2xl font-bold mt-1">
              {lowest}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Check-ins
            </p>

            <p className="text-2xl font-bold mt-1">
              {scores.length}
            </p>
          </div>

        </div>

        {/* Chart */}
        {summaryLoading ? (
          <p className="text-gray-500">
            Loading mood history...
          </p>
        ) : chartData.length === 0 ? (
          <p className="text-gray-500">
            No mood history available for this period.
          </p>
        ) : (
          <div className="w-full h-[320px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis
                  domain={[1, 10]}
                  ticks={[
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    10,
                  ]}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>

          </div>
        )}

      </section>

      {/* Mood Trends */}
      {moodSummary?.trends && (
        <section className="border rounded-xl p-6">

          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              Mood Trends
            </h2>

            <p className="text-gray-600 mt-1">
              See how your mood has been changing over time.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {/* Current 7-Day Average */}
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                7-Day Average
              </p>

              <p className="text-2xl font-bold mt-1">
                {moodSummary.trends.current_7_day_average ??
                  "-"}
              </p>
            </div>

            {/* Previous 7-Day Average */}
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Previous 7-Day Average
              </p>

              <p className="text-2xl font-bold mt-1">
                {moodSummary.trends.previous_7_day_average ??
                  "-"}
              </p>
            </div>

            {/* Weekly Change */}
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Weekly Change
              </p>

              <p className="text-2xl font-bold mt-1">
                {moodSummary.trends.weekly_change !== null
                  ? `${
                      moodSummary.trends.weekly_change > 0
                        ? "+"
                        : ""
                    }${moodSummary.trends.weekly_change}`
                  : "-"}
              </p>
            </div>

            {/* Overall Average */}
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Overall Average
              </p>

              <p className="text-2xl font-bold mt-1">
                {moodSummary.trends.overall_average ??
                  "-"}
              </p>
            </div>

            {/* Current Streak */}
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Current Streak
              </p>

              <p className="text-2xl font-bold mt-1">
                {moodSummary.trends.current_streak}{" "}
                {moodSummary.trends.current_streak === 1
                  ? "day"
                  : "days"}
              </p>
            </div>

            {/* Missing Days */}
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Missing Days
              </p>

              <p className="text-2xl font-bold mt-1">
                {moodSummary.trends.missing_days_last_7_days}
              </p>
            </div>

          </div>

        </section>
      )}

    </div>
  );
}