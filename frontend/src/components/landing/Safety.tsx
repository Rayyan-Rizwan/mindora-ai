export default function Safety() {
  const safetyPoints = [
    {
      icon: "🔒",
      title: "Private conversations",
      description:
        "Your personal conversations are kept private and are only associated with your account.",
    },
    {
      icon: "🛡",
      title: "Secure account",
      description:
        "Authentication and protected access help keep your account and personal information secure.",
    },
    {
      icon: "♡",
      title: "Non-judgmental support",
      description:
        "Mindora is designed to provide a calm and supportive environment without judgment.",
    },
    {
      icon: "✦",
      title: "Responsible AI",
      description:
        "The AI companion provides general emotional support and does not replace professional mental healthcare.",
    },
  ];

  return (
    <section
      id="safety"
      className="relative overflow-hidden bg-[#17151f] py-24 text-white sm:py-32"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#8878ed] opacity-20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-[#bdb2ff] opacity-10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Heading */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#bdb2ff]">
            Safety & Privacy
          </span>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Your wellbeing deserves
            <span className="text-[#bdb2ff]"> a safe space.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
            We designed Mindora with privacy, responsible AI, and user safety
            at the center of the experience.
          </p>
        </div>

        {/* Safety cards */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {safetyPoints.map((point) => (
            <div
              key={point.title}
              className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8878ed]/15 text-xl text-[#bdb2ff]">
                {point.icon}
              </div>

              <h3 className="mt-7 text-lg font-semibold">
                {point.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        {/* Emergency notice */}
        <div className="mt-8 rounded-[28px] border border-[#bdb2ff]/20 bg-[#8878ed]/10 p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#8878ed]/20 text-xl text-[#bdb2ff]">
              !
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                Need immediate help?
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                Mindora is not an emergency service and cannot replace
                professional or emergency care. If you or someone else is in
                immediate danger, contact your local emergency services or a
                qualified mental health professional.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}