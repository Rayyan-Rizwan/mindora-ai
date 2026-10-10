import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="absolute left-0 right-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <nav className="grid min-h-24 w-full grid-cols-[1fr_auto_1fr] items-center">

          {/* Left Spacer */}
          <div />

          {/* Navigation */}
          <div className="hidden md:flex items-center justify-center">
            <div className="flex items-center gap-10">
              <a
                href="#features"
                className="whitespace-nowrap text-sm font-medium text-[#686473] transition-colors hover:text-[#17151f]"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="whitespace-nowrap text-sm font-medium text-[#686473] transition-colors hover:text-[#17151f]"
              >
                How It Works
              </a>

              <a
                href="#professionals"
                className="whitespace-nowrap text-sm font-medium text-[#686473] transition-colors hover:text-[#17151f]"
              >
                Professionals
              </a>

              <a
                href="#safety"
                className="whitespace-nowrap text-sm font-medium text-[#686473] transition-colors hover:text-[#17151f]"
              >
                Safety
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              to="/login"
              className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium text-[#383541] transition-colors hover:text-[#17151f] sm:block"
            >
              Log in
            </Link>

            <Link
              to="/login"
              className="whitespace-nowrap rounded-full bg-[#17151f] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#292631]"
            >
              Get Started
            </Link>
          </div>

        </nav>
      </div>
    </header>
  );
}