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
      icon: "⌁",
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
      title: "Voice Conversations",
      description:
        "Use voice interaction for a more natural and comfortable way to communicate with your AI companion.",
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
      className="relative overflow-hidden bg-white py-24 sm:py-32"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-[#eeeaff] opacity-60 blur-3xl" />

      <div className="pointer-events-none absolute -left-40 bottom-20 h-80 w-80 rounded-full bg-[#f5f2ff] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Section heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-[#e5e0f5] bg-[#faf9ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8878ed]">
            Features
          </span>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-[#17151f] sm:text-5xl">
            Everything you need for a
            <span className="text-[#8878ed]"> healthier mind.</span>
          </h2>

          <p className="mt-6 text-base leading-7 text-[#716d7c] sm:text-lg">
            Mindora brings AI-powered support, self-reflection, mood tracking,
            and professional care together in one calm and supportive space.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="group relative overflow-hidden rounded-[28px] border border-[#ebe7f4] bg-[#faf9ff] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#dcd5f4] hover:bg-white hover:shadow-xl hover:shadow-[#8b7cf6]/10"
            >
              {/* Number */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.15em] text-[#aaa5b5]">
                  {feature.number}
                </span>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl text-[#8878ed] shadow-sm transition-transform duration-300 group-hover:scale-105">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div className="mt-12">
                <h3 className="text-xl font-semibold tracking-tight text-[#25222e]">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#777381]">
                  {feature.description}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-[#dcd5f4] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}