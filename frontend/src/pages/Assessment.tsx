import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Alert, Button, Card } from "@/components/ui";

interface AssessmentOption {
  label: string;
  value: number;
}

interface AssessmentQuestion {
  code: string;
  question: string;
  options: AssessmentOption[];
}

interface AssessmentData {
  assessment_id: string;
  assessment_type: string;
  status: string;
  questions: AssessmentQuestion[];
}

interface AssessmentResult {
  assessment_id: string;
  total_score: number;
  severity_level: string;
  interpretation: string;
  result_data: {
    who5?: {
      raw_score: number;
      percentage_score: number;
      level: string;
    };
    gad7?: {
      total_score: number;
      severity_level: string;
    };
    mood?: {
      score: number;
      percentage: number;
      level: string;
    };
    stress?: {
      score: number;
      percentage: number;
      level: string;
    };
    safety?: {
      risk_flag: boolean;
    };
    overall?: {
      level: string;
    };
  };
}

interface ResultRowProps {
  label: string;
  value: string | number;
}

function ResultRow({ label, value }: ResultRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-sm font-semibold capitalize text-ink-900">
        {value}
      </span>
    </div>
  );
}

export default function Assessment() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // The wellness assessment is a patient-facing screening. Professionals and
  // admins have no assessment of their own, so the start action is hidden
  // for them (the backend also rejects non-user roles on start/submit).
  const isBlockedRole =
    isAuthenticated && user !== null && user.role !== "user";

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);

  const [answers, setAnswers] = useState<Record<string, number>>({});

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [result, setResult] = useState<AssessmentResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  // Guards against a double submission firing the create-result request twice
  // before React has re-rendered the disabled button.
  const submitInFlight = useRef(false);

  // Authenticated users belong in the app shell, not the marketing home page.
  const exitTarget = isAuthenticated ? "/dashboard" : "/";

  /*
   * Leave the assessment without logging the user out. Any in-progress
   * answers are held only in memory (the backend stores nothing until
   * submit), so we confirm before discarding them.
   */
  const exitAssessment = () => {
    const hasAnswers = Object.keys(answers).length > 0;

    if (
      hasAnswers &&
      !window.confirm(
        "Leave the assessment? Your in-progress answers will not be saved."
      )
    ) {
      return;
    }

    navigate(exitTarget);
  };

  // ---------------------------------------------------------
  // Start assessment
  // ---------------------------------------------------------

  const startAssessment = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login before starting the assessment.");
        return;
      }

      const response = await api.post("/assessment/start", {});

      setAssessment(response.data);
      setAnswers({});
      setCurrentQuestion(0);
      setResult(null);
    } catch (err) {
      console.error(err);

      setError("Unable to start the assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Select answer
  // ---------------------------------------------------------

  const selectAnswer = (value: number) => {
    if (!assessment) return;

    const question = assessment.questions[currentQuestion];

    setAnswers((previous) => ({
      ...previous,
      [question.code]: value,
    }));

    setError("");
  };

  // ---------------------------------------------------------
  // Next question
  // ---------------------------------------------------------

  const nextQuestion = () => {
    if (!assessment) return;

    const question = assessment.questions[currentQuestion];

    if (answers[question.code] === undefined) {
      setError("Please select an answer before continuing.");
      return;
    }

    setError("");

    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    }
  };

  // ---------------------------------------------------------
  // Previous question
  // ---------------------------------------------------------

  const previousQuestion = () => {
    setError("");

    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
    }
  };

  // ---------------------------------------------------------
  // Submit assessment
  // ---------------------------------------------------------

  const submitAssessment = async () => {
    if (!assessment) return;

    // Ignore repeat clicks while a submission is already in flight.
    if (submitInFlight.current) return;

    const unanswered = assessment.questions.filter(
      (question) => answers[question.code] === undefined
    );

    if (unanswered.length > 0) {
      setError("Please answer all questions before submitting.");
      return;
    }

    try {
      submitInFlight.current = true;
      setSubmitting(true);
      setError("");

      const payload = {
        answers: assessment.questions.map((question) => ({
          question_code: question.code,
          answer_value: answers[question.code],
        })),
      };

      const response = await api.post(
        `/assessment/${assessment.assessment_id}/submit`,
        payload
      );

      setResult(response.data);
    } catch (err) {
      console.error(err);

      setError("Unable to submit the assessment. Please try again.");
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // Result screen
  // ---------------------------------------------------------

  if (result) {
    const safetyRisk = result.result_data?.safety?.risk_flag === true;

    return (
      <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-32 h-[500px] w-[500px] rounded-full bg-brand-200 opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-line-strong opacity-60 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          <Card className="p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Assessment complete
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink-900">
              Your mental wellness results
            </h1>

            <p className="mt-3 text-sm leading-6 text-ink-500">
              These results are screening indications and are not a medical
              diagnosis.
            </p>

            {/* Overall */}
            <div className="mt-8 rounded-3xl bg-brand-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                Overall screening
              </p>

              <p className="mt-1 text-xl font-semibold capitalize text-ink-900">
                {result.result_data?.overall?.level || result.severity_level}
              </p>
            </div>

            {/* WHO-5 */}
            {result.result_data?.who5 && (
              <div className="mt-4 rounded-3xl border border-line p-5">
                <h2 className="mb-2 text-base font-semibold text-ink-900">
                  Wellbeing
                </h2>

                <ResultRow
                  label="Score"
                  value={`${result.result_data.who5.raw_score}/25`}
                />
                <ResultRow
                  label="Percentage"
                  value={`${result.result_data.who5.percentage_score}%`}
                />
                <ResultRow
                  label="Indication"
                  value={result.result_data.who5.level.replace("_", " ")}
                />
              </div>
            )}

            {/* GAD-7 */}
            {result.result_data?.gad7 && (
              <div className="mt-4 rounded-3xl border border-line p-5">
                <h2 className="mb-2 text-base font-semibold text-ink-900">
                  Anxiety screening
                </h2>

                <ResultRow
                  label="Score"
                  value={`${result.result_data.gad7.total_score}/21`}
                />
                <ResultRow
                  label="Indication"
                  value={result.result_data.gad7.severity_level}
                />
              </div>
            )}

            {/* Mood */}
            {result.result_data?.mood && (
              <div className="mt-4 rounded-3xl border border-line p-5">
                <h2 className="mb-2 text-base font-semibold text-ink-900">
                  Mood
                </h2>

                <ResultRow
                  label="Indication"
                  value={result.result_data.mood.level}
                />
              </div>
            )}

            {/* Stress */}
            {result.result_data?.stress && (
              <div className="mt-4 rounded-3xl border border-line p-5">
                <h2 className="mb-2 text-base font-semibold text-ink-900">
                  Stress
                </h2>

                <ResultRow
                  label="Indication"
                  value={result.result_data.stress.level}
                />
              </div>
            )}

            {/* Safety */}
            {safetyRisk && (
              <Alert tone="danger" title="Safety support" className="mt-6">
                Your response indicates that additional safety support may be
                needed. Please reach out to a trusted person, qualified mental
                health professional, or local emergency or crisis service.
              </Alert>
            )}

            {/* Interpretation */}
            <div className="mt-6 rounded-3xl bg-mist p-5">
              <p className="text-sm leading-6 text-ink-700">
                {result.interpretation}
              </p>
            </div>

            {/* Start conversation */}
            {!safetyRisk ? (
              <div className="mt-8">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => navigate("/chat")}
                >
                  Start a conversation →
                </Button>

                <p className="mt-3 text-center text-xs text-ink-400">
                  Continue your wellness journey with your AI companion.
                </p>
              </div>
            ) : (
              <p className="mt-8 text-center text-sm text-ink-500">
                Because your response indicates a safety concern, please
                prioritize support from a trusted person or qualified
                professional.
              </p>
            )}

            <div className="mt-6 flex justify-center">
              <Button variant="ghost" onClick={() => navigate(exitTarget)}>
                {isAuthenticated ? "Back to dashboard" : "Back to home"}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // Assessment questions
  // ---------------------------------------------------------

  if (assessment) {
    const question = assessment.questions[currentQuestion];

    const selectedAnswer = answers[question.code];

    const progress =
      ((currentQuestion + 1) / assessment.questions.length) * 100;

    const isLastQuestion =
      currentQuestion === assessment.questions.length - 1;

    return (
      <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-32 h-[500px] w-[500px] rounded-full bg-brand-200 opacity-60 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Mental wellness assessment
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-3xl">
              Understanding how you have been feeling
            </h1>

            <p className="mt-2 text-sm leading-6 text-ink-500">
              Answer each question based on how you have been feeling recently.
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-sm text-ink-500">
              <span>
                Question {currentQuestion + 1} of{" "}
                {assessment.questions.length}
              </span>

              <span>{Math.round(progress)}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-line-strong">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-medium text-ink-900 sm:text-xl">
              {question.question}
            </h2>

            <div className="mt-6 space-y-3">
              {question.options.map((option) => {
                const selected = selectedAnswer === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectAnswer(option.value)}
                    aria-pressed={selected}
                    className={
                      "w-full rounded-2xl border px-5 py-4 text-left text-sm transition-all " +
                      (selected
                        ? "border-brand-500 bg-brand-50 font-medium text-brand-700 ring-2 ring-brand-500/20"
                        : "border-line text-ink-700 hover:border-line-strong hover:bg-mist")
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {error && (
              <Alert tone="danger" className="mt-5">
                {error}
              </Alert>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={exitAssessment}>
                  Exit
                </Button>

                <Button
                  variant="secondary"
                  onClick={previousQuestion}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
              </div>

              {!isLastQuestion ? (
                <Button onClick={nextQuestion}>Next</Button>
              ) : (
                <Button
                  onClick={submitAssessment}
                  loading={submitting}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit assessment"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // Assessment introduction screen
  // ---------------------------------------------------------

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full bg-brand-200 opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-line-strong opacity-60 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-70 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          to={exitTarget}
          className="text-sm font-semibold text-ink-700 transition-colors hover:text-ink-900"
        >
          {isAuthenticated ? "← Back to dashboard" : "← Back to home"}
        </Link>

        <Card className="mt-8 p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
            Mental wellness
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink-900">
            Initial mental wellness assessment
          </h1>

          <p className="mt-4 text-sm leading-6 text-ink-500">
            This short assessment helps you reflect on your current wellbeing,
            anxiety, mood, stress, and safety. Your responses can also help
            personalize your future conversations with the AI companion.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-3xl bg-mist p-4">
              <p className="text-2xl font-semibold text-ink-900">15</p>
              <p className="text-sm text-ink-500">Questions</p>
            </div>

            <div className="rounded-3xl bg-mist p-4">
              <p className="text-2xl font-semibold text-ink-900">~5</p>
              <p className="text-sm text-ink-500">Minutes</p>
            </div>
          </div>

          <Alert tone="brand" className="mt-8">
            There are no right or wrong answers. Choose the option that best
            reflects your experience. This assessment is for screening and
            self-reflection, not diagnosis.
          </Alert>

          {error && (
            <Alert tone="danger" className="mt-4">
              {error}
            </Alert>
          )}

          {isBlockedRole ? (
            <Alert tone="brand" className="mt-6">
              The wellness assessment is available to patient accounts only.
              {user?.role === "professional"
                ? " You can support patients through your professional dashboard."
                : " You can review platform assessment activity in the admin analytics."}
            </Alert>
          ) : (
            <Button
              fullWidth
              size="lg"
              onClick={startAssessment}
              loading={loading}
              disabled={loading}
              className="mt-6"
            >
              {loading ? "Starting..." : "Start assessment"}
            </Button>
          )}
        </Card>
      </div>
    </main>
  );
}
