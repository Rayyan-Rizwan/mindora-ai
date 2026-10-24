import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navigation = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#professionals", label: "Professionals" },
  { href: "#safety", label: "Safety" },
];

export default function Navbar() {
  return (
    <header className="absolute left-0 right-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex min-h-24 items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5"
            aria-label="Mindora home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-base font-bold text-white shadow-soft">
              M
            </span>
            <span className="text-lg font-bold tracking-tight text-ink-900">
              Mindora
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            

            <ThemeToggle />

            <Link
              to="/login"
              className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900 sm:block"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="whitespace-nowrap rounded-full bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800 sm:px-6 sm:py-3"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
