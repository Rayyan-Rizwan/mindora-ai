export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create your account",
      description:
        "Create a private account and set up your personal wellness profile in just a few steps.",
    },
    {
      number: "02",
      title: "Understand your wellbeing",
      description:
        "Complete a guided assessment to reflect on your emotions, thoughts, and current mental wellbeing.",
    },
    {
      number: "03",
      title: "Talk with your AI companion",
      description:
        "Start a conversation with your AI companion whenever you need a supportive space to talk.",
    },
    {
      number: "04",
      title: "Track your progress",
      description:
        "Use mood tracking and journaling to reflect on your progress and identify emotional patterns.",
    },
    {
      number: "05",
      title: "Connect with a professional",
      description:
        "When you want human support, discover professionals and schedule a consultation.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-canvas py-24 sm:py-32"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-20 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-mist opacity-50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            How It Works
          </span>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-ink-900 sm:text-5xl">
            A simple path toward
            <span className="text-brand-600"> better wellbeing.</span>
          </h2>

          <p className="mt-6 text-base leading-7 text-ink-500 sm:text-lg">
            Start where you are. Mindora gives you the tools to understand
            yourself, build healthy habits, and access support when you need it.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mx-auto mt-20 max-w-4xl">

          {/* Connecting line */}
          <div className="absolute left-[27px] top-8 hidden h-[calc(100%-64px)] w-px bg-line sm:block" />

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="group relative flex gap-6 rounded-[28px] border border-line bg-surface/90 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-xl hover:shadow-brand-500/10 sm:p-7"
              >
                {/* Number */}
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mist text-sm font-semibold text-brand-600 transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white">
                  {step.number}
                </div>

                {/* Content */}
                <div className="pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold tracking-tight text-ink-800">
                      {step.title}
                    </h3>

                    {index === 2 && (
                      <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-brand-600">
                        AI
                      </span>
                    )}
                  </div>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500 sm:text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm text-ink-500">
            Your journey can start with a single conversation.
          </p>
        </div>
      </div>
    </section>
  );
}