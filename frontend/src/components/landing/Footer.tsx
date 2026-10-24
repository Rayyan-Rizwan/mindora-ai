import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5"
              aria-label="Mindora home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
                M
              </span>
              <span className="text-lg font-bold tracking-tight text-ink-900">
                Mindora
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-6 text-ink-500">
              A supportive AI mental wellness platform designed to help you
              understand your emotions, reflect on your wellbeing, and connect
              with professional support.
            </p>

            
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-ink-800">Platform</h3>

            <div className="mt-5 flex flex-col gap-3">
              <a
                href="#features"
                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                How It Works
              </a>

              <a
                href="#professionals"
                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                Professionals
              </a>

              <a
                href="#safety"
                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                Safety
              </a>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-ink-800">Account</h3>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/login"
                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                Log in
              </Link>

              <Link
                to="/register"
                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>

        <div className="my-12 h-px bg-line" />

        <div className="flex flex-col gap-4 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {new Date().getFullYear()} Mindora. All rights reserved.</p>

          <p>Designed for a calmer, healthier digital experience.</p>
        </div>
      </div>
    </footer>
  );
}
