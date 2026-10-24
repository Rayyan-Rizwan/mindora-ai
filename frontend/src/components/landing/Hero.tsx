import { Link } from "react-router-dom";

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m4.5 10.5 3.3 3.3 7.7-8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-canvas">
      {/* Background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-20 h-[420px] w-[420px] rounded-full bg-brand-200 opacity-60 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-brand-100 opacity-70 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface opacity-80 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          {/* Left content */}
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2 text-xs font-semibold text-ink-600 shadow-sm backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              AI-powered mental wellness, built around you
            </div>

            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-ink-900 sm:text-5xl md:text-6xl xl:text-7xl">
              A calmer mind
              <br />
              starts with{" "}
              <span className="text-brand-500">a conversation.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-ink-500 sm:text-lg">
              A safe and supportive space to understand your emotions, reflect
              on your wellbeing, and take meaningful steps toward feeling
              better.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:bg-ink-800"
              >
                Start your journey
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path
                    d="M4 10h11M11 6l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              <Link
                to="/chat"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface/70 px-7 py-4 text-sm font-semibold text-ink-700 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:bg-surface"
              >
                Talk to AI Companion
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-500">
              <span className="flex items-center gap-2">
                <span className="text-brand-500">
                  <CheckIcon />
                </span>
                Private &amp; secure
              </span>

              <span className="flex items-center gap-2">
                <span className="text-brand-500">
                  <CheckIcon />
                </span>
                Available anytime
              </span>

              <span className="flex items-center gap-2">
                <span className="text-brand-500">
                  <CheckIcon />
                </span>
                Non-judgmental support
              </span>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative flex min-h-[360px] items-center justify-center sm:min-h-[480px] lg:min-h-[620px]">
            <div className="relative h-[300px] w-[250px] sm:h-[420px] sm:w-[350px] lg:h-[470px] lg:w-[390px]">
              <div className="absolute inset-0 rounded-[48%_52%_45%_55%/55%_44%_56%_45%] bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 shadow-2xl shadow-brand-500/20" />

              <div className="absolute left-[15%] top-[13%] h-[70%] w-[70%] rounded-full bg-white/10 blur-3xl" />

              {/* AI companion card */}
              <div className="absolute -left-2 top-8 rounded-2xl border border-line bg-surface/90 p-4 shadow-xl shadow-black/5 backdrop-blur-md sm:-left-10 sm:top-16">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 4.5c-3.6 0-6.2 2.3-6.5 5.6-.1 1.4.3 2.6 1 3.6-.2 1.1-.7 2.2-1.5 3.1 1.6.2 3-.3 4-1.1.9.3 1.9.5 3 .5 3.6 0 6.4-2.4 6.5-5.8.1-3.4-2.8-5.9-6.5-5.9Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      AI Companion
                    </p>
                    <p className="text-sm font-semibold text-ink-800">
                      Here to listen
                    </p>
                  </div>
                </div>
              </div>

              {/* Mood card */}
              <div className="absolute -right-1 bottom-14 rounded-2xl border border-line bg-surface/90 p-4 shadow-xl shadow-black/5 backdrop-blur-md sm:-right-8 sm:bottom-20">
                <p className="text-xs font-medium text-ink-400">Today's mood</p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="10"
                        cy="10"
                        r="7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M7 11.5c.7.9 1.7 1.4 3 1.4s2.3-.5 3-1.4M7.2 7.7h.1M12.7 7.7h.1"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>

                  <span className="text-sm font-semibold text-ink-800">
                    Feeling positive
                  </span>
                </div>
              </div>

              {/* Small support badge */}
              <div className="absolute -bottom-4 left-6 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface/90 text-brand-500 shadow-lg backdrop-blur-md sm:left-10">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-canvas to-transparent" />
    </section>
  );
}
