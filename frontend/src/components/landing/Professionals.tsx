import { Link } from "react-router-dom";

export default function Professionals() {
  const professionals = [
    {
      initials: "DR",
      name: "Mental Health Professionals",
      role: "Licensed & qualified support",
      description:
        "Connect with professionals when you want guidance beyond your AI companion.",
    },
    {
      initials: "CA",
      name: "Personalized Care",
      role: "Support that fits your needs",
      description:
        "Find professionals based on your preferred consultation type and availability.",
    },
    {
      initials: "LS",
      name: "Live Sessions",
      role: "Chat, audio & video",
      description:
        "Choose a consultation format that feels comfortable and convenient for you.",
    },
  ];

  return (
    <section
      id="professionals"
      className="relative overflow-hidden bg-surface py-24 sm:py-32"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-mist opacity-60 blur-3xl" />

      <div className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-mist blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Heading */}
        <div className="grid items-end gap-8 lg:grid-cols-2">

          <div>
            <span className="inline-flex items-center rounded-full border border-line bg-surface-muted px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              Professional Support
            </span>

            <h2 className="mt-6 max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-ink-900 sm:text-5xl">
              AI support when you need it.
              <span className="text-brand-600">
                {" "}Human support when you want it.
              </span>
            </h2>
          </div>

          <p className="max-w-xl text-base leading-7 text-ink-500 lg:ml-auto lg:pb-1 sm:text-lg">
            Mindora is designed to give you different levels of support.
            Start with your AI companion and connect with a mental health
            professional whenever you feel ready.
          </p>
        </div>

        {/* Professional cards */}
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {professionals.map((professional) => (
            <div
              key={professional.name}
              className="group rounded-[28px] border border-line bg-surface-muted p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-xl hover:shadow-brand-500/10"
            >
              {/* Profile visual */}
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-200 to-brand-300 text-sm font-bold text-brand-700">
                  {professional.initials}
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm text-brand-600 shadow-sm">
                  ✓
                </span>
              </div>

              {/* Content */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold tracking-tight text-ink-800">
                  {professional.name}
                </h3>

                <p className="mt-2 text-sm font-medium text-brand-600">
                  {professional.role}
                </p>

                <p className="mt-4 text-sm leading-6 text-ink-500">
                  {professional.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-[28px] border border-line bg-surface-muted p-7 sm:flex-row sm:p-8">
          <div>
            <h3 className="text-xl font-semibold text-ink-800">
              Ready to explore professional support?
            </h3>

            <p className="mt-2 text-sm text-ink-500">
              Browse available professionals and find the right type of support
              for you.
            </p>
          </div>

          <Link
            to="/login"
            className="shrink-0 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800"
          >
            Find a Professional →
          </Link>
        </div>

      </div>
    </section>
  );
}