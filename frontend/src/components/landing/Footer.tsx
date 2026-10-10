import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#faf9ff]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

        {/* Top */}
        <div className="grid gap-12 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center rounded-xl bg-[#8b7cf6] px-3 py-2 text-sm font-bold text-white"
            >
              Mindora
            </Link>

            <p className="mt-5 max-w-md text-sm leading-6 text-[#777381]">
              A supportive AI mental wellness platform designed to help you
              understand your emotions, reflect on your wellbeing, and connect
              with professional support.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-[#25222e]">
              Platform
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              <a
                href="#features"
                className="text-sm text-[#777381] transition-colors hover:text-[#17151f]"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="text-sm text-[#777381] transition-colors hover:text-[#17151f]"
              >
                How It Works
              </a>

              <a
                href="#professionals"
                className="text-sm text-[#777381] transition-colors hover:text-[#17151f]"
              >
                Professionals
              </a>

              <a
                href="#safety"
                className="text-sm text-[#777381] transition-colors hover:text-[#17151f]"
              >
                Safety
              </a>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-[#25222e]">
              Account
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/login"
                className="text-sm text-[#777381] transition-colors hover:text-[#17151f]"
              >
                Log in
              </Link>

              <Link
                to="/login"
                className="text-sm text-[#777381] transition-colors hover:text-[#17151f]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 h-px bg-[#e7e3ef]" />

        {/* Bottom */}
        <div className="flex flex-col gap-4 text-sm text-[#918c9d] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Mindora. All rights reserved.
          </p>

          <p>
            Designed for a calmer, healthier digital experience.
          </p>
        </div>

      </div>
    </footer>
  );
}