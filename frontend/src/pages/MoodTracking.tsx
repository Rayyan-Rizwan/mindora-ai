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
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Spinner,
  Tabs,
  Textarea,
} from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";

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

interface StatTileProps {
  label: string;
  value: string | number;
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-3xl border border-line bg-mist/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
        {value}
      </p>
    </div>
  );
}

export default function MoodTracking() {
  const { theme } = useTheme();
  const chartGrid = theme === "dark" ? "#4A3D46" : "#E7DCD4";
  const chartAxis = theme === "dark" ? "#AEA0A2" : "#716963";
  const chartBrand = theme === "dark" ? "#D6A0A5" : "#B77980";
  const chartTooltipBg = theme === "dark" ? "#2D272E" : "#FFFFFF";

  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [moodSummary, setMoodSummary] = useState<MoodSummary | null>(null);

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
      const response = await api.get<MoodSummary>("/mood/summary");

      setMoodSummary(response.data);
    } catch (error) {
      console.error("Could not load mood summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    void loadTodayMood();
    void loadMoodSummary();
  }, []);

  const getMoodInfo = (score: number) => {
    if (score <= 2) return { emoji: "😞", label: "Very low" };
    if (score <= 4) return { emoji: "😔", label: "Low" };
    if (score <= 6) return { emoji: "😐", label: "Okay" };
    if (score <= 8) return { emoji: "🙂", label: "Good" };
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

  const moodInfo = moodScore !== null ? getMoodInfo(moodScore) : null;

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

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

  const filteredMoods =
    moodSummary?.moods.filter((mood) => {
      return mood.date >= startDateString && mood.date <= todayString;
    }) || [];

  const chartData = filteredMoods.map((mood) => ({
    date: new Date(`${mood.date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: mood.score,
  }));

  const scores = filteredMoods.map((mood) => mood.score);

  const average =
    scores.length > 0
      ? (
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        ).toFixed(1)
      : "-";

  const highest = scores.length > 0 ? Math.max(...scores) : "-";

  const lowest = scores.length > 0 ? Math.min(...scores) : "-";

  const messageTone = message.startsWith("Could not") ? "danger" : "success";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Wellbeing"
        title="How are you feeling today?"
        description="Move the slider to choose your mood. Your check-ins help you notice patterns over time."
      />

      {/* Daily Mood */}
      <Card className="p-6 sm:p-8">
        {moodInfo && moodScore !== null && (
          <div className="mb-8 text-center">
            <div className="text-6xl" aria-hidden="true">
              {moodInfo.emoji}
            </div>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
              {moodScore}
              <span className="text-lg text-ink-400">/10</span>
            </p>

            <p className="mt-1 text-sm font-medium text-brand-600">
              {moodInfo.label}
            </p>
          </div>
        )}

        <div className="mb-8">
          <div className="mb-3 flex justify-between text-3xl" aria-hidden="true">
            <span>😞</span>
            <span>😄</span>
          </div>

          <input
            id="mood-score"
            type="range"
            min="1"
            max="10"
            value={moodScore ?? 5}
            aria-label="Mood score from 1 to 10"
            onChange={(e) => {
              setMoodScore(Number(e.target.value));
              setMessage("");
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-line-strong accent-brand-500"
          />

          <div className="mt-2 flex justify-between text-sm text-ink-400">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's on your mind? (optional)"
          maxLength={500}
          aria-label="Mood note"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button
            onClick={saveMood}
            disabled={loading || moodScore === null}
            loading={loading}
            size="lg"
          >
            {loading ? "Saving..." : "Save mood"}
          </Button>

          {message && (
            <Alert tone={messageTone} className="flex-1">
              {message}
            </Alert>
          )}
        </div>
      </Card>

      {/* Mood Tracking */}
      <Card>
        <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Mood tracking</CardTitle>
            <CardDescription>Review your mood history.</CardDescription>
          </div>

          <Tabs
            ariaLabel="Mood history period"
            value={period}
            onChange={(value) => setPeriod(value as Period)}
            items={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile label="Average" value={average} />
            <StatTile label="Highest" value={highest} />
            <StatTile label="Lowest" value={lowest} />
            <StatTile label="Check-ins" value={scores.length} />
          </div>

          {summaryLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-500">
              <Spinner className="text-brand-500" />
              Loading mood history...
            </div>
          ) : chartData.length === 0 ? (
            <EmptyState
              title="No mood history yet"
              description="Save a mood check-in to start seeing your history here."
              icon="📈"
            />
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />

                  <XAxis dataKey="date" stroke={chartAxis} fontSize={12} />

                  <YAxis
                    domain={[1, 10]}
                    ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                    stroke={chartAxis}
                    fontSize={12}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: `1px solid ${chartGrid}`,
                      backgroundColor: chartTooltipBg,
                      boxShadow: "0 12px 32px -16px rgba(143,81,91,0.22)",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={chartBrand}
                    strokeWidth={3}
                    dot={{ r: 5, fill: chartBrand }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mood Trends */}
      {moodSummary?.trends && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Mood trends</CardTitle>
              <CardDescription>
                See how your mood has been changing over time.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <StatTile
                label="7-day average"
                value={moodSummary.trends.current_7_day_average ?? "-"}
              />
              <StatTile
                label="Previous 7-day"
                value={moodSummary.trends.previous_7_day_average ?? "-"}
              />
              <StatTile
                label="Weekly change"
                value={
                  moodSummary.trends.weekly_change !== null
                    ? `${
                        moodSummary.trends.weekly_change > 0 ? "+" : ""
                      }${moodSummary.trends.weekly_change}`
                    : "-"
                }
              />
              <StatTile
                label="Overall average"
                value={moodSummary.trends.overall_average ?? "-"}
              />
              <StatTile
                label="Current streak"
                value={`${moodSummary.trends.current_streak} ${
                  moodSummary.trends.current_streak === 1 ? "day" : "days"
                }`}
              />
              <StatTile
                label="Missing days"
                value={moodSummary.trends.missing_days_last_7_days}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
