
function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.5 10V7.8a3.5 3.5 0 0 1 7 0V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 19 6v5.3c0 4.2-2.8 7.8-7 9.2-4.2-1.4-7-5-7-9.2V6l7-2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4-5.7-1.8L10.2 9 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const safetyPoints = [
  {
    icon: <LockIcon />,
    title: "Private conversations",
    description:
      "Your personal conversations are kept private and are only associated with your account.",
  },
  {
    icon: <ShieldIcon />,
    title: "Secure account",
    description:
      "Authentication and protected access help keep your account and personal information secure.",
  },
  {
    icon: <HeartIcon />,
    title: "Non-judgmental support",
    description:
      "Mindora is designed to provide a calm and supportive environment without judgment.",
  },
  {
    icon: <SparkIcon />,
    title: "Responsible AI",
    description:
      "The AI companion provides general emotional support and does not replace professional mental healthcare.",
  },
];

export default function Safety() {
  return (
    <section
      id="safety"
      className="relative overflow-hidden bg-[#211D22] py-24 text-white sm:py-32"
    >
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-500 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-brand-300 opacity-10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
            Safety &amp; Privacy
          </span>

          <h2 className="mt-6 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
            Your wellbeing deserves
            <span className="text-brand-300"> a safe space.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
            We designed Mindora with privacy, responsible AI, and user safety
            at the center of the experience.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {safetyPoints.map((point) => (
            <div
              key={point.title}
              className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                {point.icon}
              </div>

              <h3 className="mt-7 text-lg font-semibold">{point.title}</h3>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[28px] border border-red-400/25 bg-red-500/10 p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-300">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 3.5 21 20H3L12 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 9v4.5M12 17v.1"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Need immediate help?</h3>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                Mindora is not an emergency service and cannot replace
                professional or emergency care. If you or someone else is in
                immediate danger, contact your local emergency services or a
                qualified mental health professional.
              </p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
