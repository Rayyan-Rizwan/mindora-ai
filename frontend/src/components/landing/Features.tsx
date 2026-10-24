export default function Features() {
  const features = [
    {
      number: "01",
      title: "AI Companion",
      description:
        "Talk openly with an AI companion that listens, understands your concerns, and provides supportive guidance.",
      icon: "✦",
    },
    {
      number: "02",
      title: "Mental Wellness Assessment",
      description:
        "Reflect on your thoughts, emotions, and wellbeing through guided assessments designed to understand your current state.",
      icon: "◌",
    },
    {
      number: "03",
      title: "Mood Tracking",
      description:
        "Track your mood over time and discover patterns that can help you better understand your emotional wellbeing.",
      icon: "◌",
    },
    {
      number: "04",
      title: "Professional Support",
      description:
        "Connect with qualified mental health professionals when you need additional guidance or human support.",
      icon: "♡",
    },
    {
      number: "05",
      title: "Voice Dictation",
      description:
        "Speak instead of typing in the AI chat. Dictation runs entirely in your browser using its built-in speech recognition (not available in every browser).",
      icon: "◉",
    },
    {
      number: "06",
      title: "Private & Secure",
      description:
        "Your conversations and personal information are handled with privacy and security in mind.",
      icon: "⌑",
    },
  ];

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-surface py-24 sm:py-32"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-mist opacity-60 blur-3xl" />

      <div className="pointer-events-none absolute -left-40 bottom-20 h-80 w-80 rounded-full bg-mist blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Section heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-line bg-surface-muted px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Features
          </span>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-ink-900 sm:text-5xl">
            Everything you need for a
            <span className="text-brand-600"> healthier mind.</span>
          </h2>

          <p className="mt-6 text-base leading-7 text-ink-500 sm:text-lg">
            Mindora brings AI-powered support, self-reflection, mood tracking,
            and professional care together in one calm and supportive space.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="group relative overflow-hidden rounded-[28px] border border-line bg-surface-muted p-7 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:bg-surface hover:shadow-xl hover:shadow-brand-500/10"
            >
              {/* Number */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.15em] text-ink-400">
                  {feature.number}
                </span>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-xl text-brand-600 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div className="mt-12">
                <h3 className="text-xl font-semibold tracking-tight text-ink-800">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-ink-500">
                  {feature.description}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}