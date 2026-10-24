import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full bg-brand-200 opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-line-strong opacity-60 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <p className="text-7xl font-bold tracking-tight text-brand-300">404</p>

        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-ink-900">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-ink-500">
          The page you are looking for does not exist or may have moved.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800"
        >
          Back to home →
        </Link>
      </div>
    </main>
  );
}
