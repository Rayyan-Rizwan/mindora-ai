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
      className="relative overflow-hidden bg-white py-24 sm:py-32"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-[#eeeaff] opacity-60 blur-3xl" />

      <div className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-[#f6f3ff] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Heading */}
        <div className="grid items-end gap-8 lg:grid-cols-2">

          <div>
            <span className="inline-flex items-center rounded-full border border-[#e5e0f5] bg-[#faf9ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8878ed]">
              Professional Support
            </span>

            <h2 className="mt-6 max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-[#17151f] sm:text-5xl">
              AI support when you need it.
              <span className="text-[#8878ed]">
                {" "}Human support when you want it.
              </span>
            </h2>
          </div>

          <p className="max-w-xl text-base leading-7 text-[#716d7c] lg:ml-auto lg:pb-1 sm:text-lg">
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
              className="group rounded-[28px] border border-[#ebe7f4] bg-[#faf9ff] p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-[#8b7cf6]/10"
            >
              {/* Profile visual */}
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#dcd5ff] to-[#bcb0fa] text-sm font-bold text-[#6555c7]">
                  {professional.initials}
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm text-[#8878ed] shadow-sm">
                  ✓
                </span>
              </div>

              {/* Content */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold tracking-tight text-[#25222e]">
                  {professional.name}
                </h3>

                <p className="mt-2 text-sm font-medium text-[#8878ed]">
                  {professional.role}
                </p>

                <p className="mt-4 text-sm leading-6 text-[#777381]">
                  {professional.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-[28px] border border-[#e8e3f2] bg-[#faf9ff] p-7 sm:flex-row sm:p-8">
          <div>
            <h3 className="text-xl font-semibold text-[#25222e]">
              Ready to explore professional support?
            </h3>

            <p className="mt-2 text-sm text-[#777381]">
              Browse available professionals and find the right type of support
              for you.
            </p>
          </div>

          <Link
            to="/login"
            className="shrink-0 rounded-full bg-[#17151f] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#292631]"
          >
            Find a Professional →
          </Link>
        </div>

      </div>
    </section>
  );
}