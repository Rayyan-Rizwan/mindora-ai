import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#faf9ff]">
      
      {/* Background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-20 h-[420px] w-[420px] rounded-full bg-[#ddd7ff] opacity-60 blur-3xl" />

        <div className="absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-[#e9e5ff] opacity-70 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-80 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 pb-16 pt-32 lg:px-8">
        <div className="grid w-full items-center gap-16 lg:grid-cols-2">

          {/* Left Content */}
          <div className="max-w-2xl">

            {/* Small badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e4e0f4] bg-white/70 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#8b7cf6]" />

                
            </div>

            {/* Heading */}
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#17151f] sm:text-6xl lg:text-7xl">
              A calmer mind
              <br />
              starts with{" "}
              <span className="text-[#8878ed]">
                a conversation.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#716d7c] sm:text-xl">
              A safe and supportive space to understand your emotions,
              reflect on your wellbeing, and take meaningful steps toward
              feeling better.
            </p>

            {/* Buttons */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#17151f] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:bg-[#292631]"
              >
                Start Your Journey

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                to="/chat"
                className="inline-flex items-center justify-center rounded-full border border-[#ded9ee] bg-white/70 px-7 py-4 text-sm font-semibold text-[#302d39] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white"
              >
                Talk to AI Companion
              </Link>
            </div>

            {/* Trust text */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#817d8c]">
              <span className="flex items-center gap-2">
                <span className="text-[#8b7cf6]">✓</span>
                Private & secure
              </span>

              <span className="flex items-center gap-2">
                <span className="text-[#8b7cf6]">✓</span>
                Available anytime
              </span>

              <span className="flex items-center gap-2">
                <span className="text-[#8b7cf6]">✓</span>
                Non-judgmental support
              </span>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative flex min-h-[500px] items-center justify-center lg:min-h-[620px]">

            {/* Main organic shape */}
            <div className="relative h-[390px] w-[330px] sm:h-[470px] sm:w-[390px]">

              <div className="absolute inset-0 rounded-[48%_52%_45%_55%/55%_44%_56%_45%] bg-gradient-to-br from-[#bdb2ff] via-[#9d8df4] to-[#7564d9] shadow-2xl shadow-[#8b7cf6]/20" />

              {/* Inner glow */}
              <div className="absolute left-[15%] top-[13%] h-[70%] w-[70%] rounded-full bg-white/10 blur-3xl" />

              {/* Floating card - AI */}
              <div className="absolute -left-8 top-16 rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-md sm:-left-16">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eeeaff]">
                    <span className="text-lg">✦</span>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#8a8693]">
                      AI Companion
                    </p>
                    <p className="text-sm font-semibold text-[#25222e]">
                      Here to listen
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating card - Mood */}
              <div className="absolute -right-5 bottom-20 rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-md sm:-right-12">
                <p className="text-xs font-medium text-[#8a8693]">
                  Today's mood
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl">☀</span>

                  <span className="text-sm font-semibold text-[#25222e]">
                    Feeling positive
                  </span>
                </div>
              </div>

              {/* Small floating circle */}
              <div className="absolute -bottom-5 left-10 flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-lg backdrop-blur-md">
                <span className="text-xl text-[#8878ed]">♡</span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#faf9ff] to-transparent" />
    </section>
  );
}