
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

const API_URL = "http://localhost:8000/api/v1";

export default function Assessment() {
  const navigate = useNavigate();

  const [assessment, setAssessment] =
    useState<AssessmentData | null>(null);

  const [answers, setAnswers] =
    useState<Record<string, number>>({});

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [result, setResult] =
    useState<AssessmentResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // ---------------------------------------------------------
  // Start assessment
  // ---------------------------------------------------------

  const startAssessment = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError(
          "Please login before starting the assessment."
        );
        return;
      }

      const response = await axios.post(
        `${API_URL}/assessment/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAssessment(response.data);
      setAnswers({});
      setCurrentQuestion(0);
      setResult(null);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to start the assessment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Select answer
  // ---------------------------------------------------------

  const selectAnswer = (value: number) => {
    if (!assessment) return;

    const question =
      assessment.questions[currentQuestion];

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

    const question =
      assessment.questions[currentQuestion];

    if (answers[question.code] === undefined) {
      setError(
        "Please select an answer before continuing."
      );
      return;
    }

    setError("");

    if (
      currentQuestion <
      assessment.questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) => previous + 1
      );
    }
  };

  // ---------------------------------------------------------
  // Previous question
  // ---------------------------------------------------------

  const previousQuestion = () => {
    setError("");

    if (currentQuestion > 0) {
      setCurrentQuestion(
        (previous) => previous - 1
      );
    }
  };

  // ---------------------------------------------------------
  // Submit assessment
  // ---------------------------------------------------------

  const submitAssessment = async () => {
    if (!assessment) return;

    const unanswered =
      assessment.questions.filter(
        (question) =>
          answers[question.code] === undefined
      );

    if (unanswered.length > 0) {
      setError(
        "Please answer all questions before submitting."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const token = getToken();

      const payload = {
        answers: assessment.questions.map(
          (question) => ({
            question_code: question.code,
            answer_value: answers[question.code],
          })
        ),
      };

      const response = await axios.post(
        `${API_URL}/assessment/${assessment.assessment_id}/submit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to submit the assessment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // Result screen
  // ---------------------------------------------------------

  if (result) {
    const safetyRisk =
      result.result_data?.safety?.risk_flag === true;

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-3xl mx-auto">

          <div className="bg-white rounded-2xl shadow-sm p-8">

            <p className="text-sm text-gray-500 mb-2">
              Assessment Complete
            </p>

            <h1 className="text-3xl font-semibold text-gray-900 mb-3">
              Your Mental Wellness Results
            </h1>

            <p className="text-gray-600 mb-8">
              These results are screening indications and
              are not a medical diagnosis.
            </p>

            {/* Overall */}

            <div className="bg-blue-50 rounded-xl p-5 mb-6">
              <p className="text-sm text-gray-500 mb-1">
                Overall screening
              </p>

              <p className="text-xl font-semibold text-gray-900 capitalize">
                {result.result_data?.overall?.level ||
                  result.severity_level}
              </p>
            </div>

            {/* WHO-5 */}

            {result.result_data?.who5 && (
              <div className="border rounded-xl p-5 mb-4">
                <h2 className="text-lg font-semibold mb-3">
                  Wellbeing
                </h2>

                <p>
                  Score:{" "}
                  {result.result_data.who5.raw_score}/25
                </p>

                <p>
                  Percentage:{" "}
                  {result.result_data.who5.percentage_score}%
                </p>

                <p className="capitalize mt-1">
                  Indication:{" "}
                  {result.result_data.who5.level.replace(
                    "_",
                    " "
                  )}
                </p>
              </div>
            )}

            {/* GAD-7 */}

            {result.result_data?.gad7 && (
              <div className="border rounded-xl p-5 mb-4">
                <h2 className="text-lg font-semibold mb-3">
                  Anxiety Screening
                </h2>

                <p>
                  Score:{" "}
                  {result.result_data.gad7.total_score}/21
                </p>

                <p className="capitalize">
                  Indication:{" "}
                  {result.result_data.gad7.severity_level}
                </p>
              </div>
            )}

            {/* Mood */}

            {result.result_data?.mood && (
              <div className="border rounded-xl p-5 mb-4">
                <h2 className="text-lg font-semibold mb-3">
                  Mood
                </h2>

                <p className="capitalize">
                  Indication:{" "}
                  {result.result_data.mood.level}
                </p>
              </div>
            )}

            {/* Stress */}

            {result.result_data?.stress && (
              <div className="border rounded-xl p-5 mb-4">
                <h2 className="text-lg font-semibold mb-3">
                  Stress
                </h2>

                <p className="capitalize">
                  Indication:{" "}
                  {result.result_data.stress.level}
                </p>
              </div>
            )}

            {/* Safety */}

            {safetyRisk && (
              <div className="border border-red-200 bg-red-50 rounded-xl p-5 mb-6">
                <h2 className="text-lg font-semibold text-red-700 mb-2">
                  Safety Support
                </h2>

                <p className="text-red-700 leading-relaxed">
                  Your response indicates that additional
                  safety support may be needed. Please reach
                  out to a trusted person, qualified mental
                  health professional, or local emergency
                  or crisis service.
                </p>
              </div>
            )}

            {/* Interpretation */}

            <div className="bg-gray-50 rounded-xl p-5 mt-6">
              <p className="text-gray-700 leading-relaxed">
                {result.interpretation}
              </p>
            </div>

            {/* Start conversation */}

            {!safetyRisk && (
              <div className="mt-8">
                <button
                  onClick={() => navigate("/chat")}
                  className="w-full rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Start a Conversation
                </button>

                <p className="text-center text-xs text-gray-500 mt-3">
                  Continue your wellness journey with your
                  AI psychology companion.
                </p>
              </div>
            )}

            {safetyRisk && (
              <div className="mt-8">
                <p className="text-center text-sm text-gray-600">
                  Because your response indicates a safety
                  concern, please prioritize support from a
                  trusted person or qualified professional.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Assessment questions
  // ---------------------------------------------------------

  if (assessment) {
    const question =
      assessment.questions[currentQuestion];

    const selectedAnswer =
      answers[question.code];

    const progress =
      ((currentQuestion + 1) /
        assessment.questions.length) *
      100;

    const isLastQuestion =
      currentQuestion ===
      assessment.questions.length - 1;

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-3xl mx-auto">

          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">
              Mental Wellness Assessment
            </p>

            <h1 className="text-3xl font-semibold text-gray-900">
              Understanding how you have been feeling
            </h1>

            <p className="text-gray-600 mt-2">
              Answer each question based on how you
              have been feeling recently.
            </p>
          </div>

          {/* Progress */}

          <div className="mb-8">

            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>
                Question {currentQuestion + 1} of{" "}
                {assessment.questions.length}
              </span>

              <span>
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

          </div>

          {/* Question */}

          <div className="bg-white rounded-2xl shadow-sm p-8">

            <h2 className="text-xl font-medium text-gray-900 mb-8">
              {question.question}
            </h2>

            <div className="space-y-3">

              {question.options.map((option) => {

                const selected =
                  selectedAnswer === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      selectAnswer(option.value)
                    }
                    className={`w-full text-left px-5 py-4 rounded-xl border transition ${
                      selected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}

            </div>

            {error && (
              <p className="text-red-500 text-sm mt-5">
                {error}
              </p>
            )}

            <div className="flex justify-between mt-8">

              <button
                onClick={previousQuestion}
                disabled={currentQuestion === 0}
                className="px-5 py-3 rounded-lg border border-gray-200 disabled:opacity-40"
              >
                Previous
              </button>

              {!isLastQuestion ? (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submitAssessment}
                  disabled={submitting}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Assessment"}
                </button>
              )}

            </div>

          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Assessment introduction screen
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">

        <div className="bg-white rounded-2xl shadow-sm p-8">

          <p className="text-sm text-blue-600 font-medium mb-2">
            Mental Wellness
          </p>

          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            Initial Mental Wellness Assessment
          </h1>

          <p className="text-gray-600 leading-relaxed mb-8">
            This short assessment helps you reflect on your
            current wellbeing, anxiety, mood, stress, and
            safety. Your responses can also help personalize
            your future conversations with the AI companion.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-semibold text-gray-900">
                15
              </p>

              <p className="text-sm text-gray-500">
                Questions
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-semibold text-gray-900">
                ~5
              </p>

              <p className="text-sm text-gray-500">
                Minutes
              </p>
            </div>

          </div>

          <div className="bg-blue-50 rounded-xl p-5 mb-8">
            <p className="text-sm text-blue-800 leading-relaxed">
              There are no right or wrong answers. Choose
              the option that best reflects your experience.
              This assessment is for screening and self-reflection,
              not diagnosis.
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">
              {error}
            </p>
          )}

          <button
            onClick={startAssessment}
            disabled={loading}
            className="w-full px-6 py-4 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-50"
          >
            {loading
              ? "Starting..."
              : "Start Assessment"}
          </button>

        </div>
      </div>
    </div>
  );
}

