import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<
    "verifying" | "success" | "error"
  >("verifying");

  const [message, setMessage] = useState("");

  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get("/auth/verify-email", {
          params: {
            token,
          },
        });

        setStatus("success");
        setMessage(response.data.message);
      } catch (error: any) {
        setStatus("error");

        setMessage(
          error?.response?.data?.detail ||
            "This verification link is invalid or has expired."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#faf9ff] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600" />

            <h1 className="text-2xl font-semibold text-gray-900">
              Verifying your email
            </h1>

            <p className="mt-3 text-gray-500">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Email verified
            </h1>

            <p className="mt-3 text-gray-500">
              {message}
            </p>

            <Link
              to="/login"
              className="mt-6 inline-block rounded-xl bg-purple-600 px-6 py-3 text-white transition hover:bg-purple-700"
            >
              Continue to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
              !
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Verification failed
            </h1>

            <p className="mt-3 text-gray-500">
              {message}
            </p>

            <Link
              to="/login"
              className="mt-6 inline-block rounded-xl bg-purple-600 px-6 py-3 text-white transition hover:bg-purple-700"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
