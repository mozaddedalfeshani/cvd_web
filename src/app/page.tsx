import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  ArrowRight01Icon,
  BloodPressureIcon,
  CheckmarkCircle02Icon,
  Doctor01Icon,
  HeartCheckIcon,
  Shield01Icon,
  SparklesIcon,
  StethoscopeIcon,
} from "@hugeicons/core-free-icons";

const highlights = [
  {
    icon: AiBrain01Icon,
    title: "Binary research model",
    text: "XGBoost artifact trained for the paper framing: HIGH versus NON-HIGH.",
  },
  {
    icon: BloodPressureIcon,
    title: "Clinical inputs",
    text: "17 usable inputs after removing leakage-prone risk score and BP category fields.",
  },
  {
    icon: Shield01Icon,
    title: "Decision support",
    text: "Designed for research demos and screening, not as a replacement for doctors.",
  },
];

export default function HomePage() {
  return (
    <main className="soft-grid relative min-h-screen overflow-hidden">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#bfeee1] blur-3xl" />
      <div className="absolute right-[-90px] top-28 h-72 w-72 rounded-full bg-[#ffd09c] blur-3xl" />
      <div className="absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-[#ffc7c8] blur-3xl" />
      <span className="squiggle left-10 top-24 hidden text-[#f15b5d] opacity-40 md:block" />
      <span className="squiggle bottom-20 right-16 hidden text-[#54bfa2] opacity-40 md:block" />

      <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-[#2d2118]/10 bg-white/70 px-4 py-2 text-sm font-extrabold text-[#6e4a26] shadow-sm backdrop-blur">
            <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} />
            Bangladesh smart healthcare research demo
          </div>

          <h1 className="font-display max-w-4xl text-6xl font-black leading-[0.92] tracking-tight text-[#2d2118] md:text-8xl">
            Heart risk checks, but make it gentle.
          </h1>

          <p className="mt-7 max-w-2xl text-xl leading-8 text-[#6f5b49]">
            A totally redesigned Next.js experience for the research paper’s
            binary CVD screening: HIGH versus NON-HIGH, powered by Flask fetch
            calls and a freshly trained model artifact.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/check"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#f15b5d] px-7 py-4 text-lg font-black text-white shadow-[0_18px_0_#7b2f2f] transition hover:-translate-y-1 hover:shadow-[0_22px_0_#7b2f2f]"
            >
              Start assessment
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={22}
                strokeWidth={2.2}
                className="transition group-hover:translate-x-1"
              />
            </Link>
            <a
              href="#model-story"
              className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-[#2d2118] bg-white/80 px-7 py-4 text-lg font-black text-[#2d2118] shadow-[0_10px_0_#ead8bc] transition hover:-translate-y-1"
            >
              View model story
            </a>
          </div>
        </div>

        <div className="floaty curve-card relative border-2 border-[#2d2118]/10 bg-white/80 p-5 shadow-[0_30px_80px_rgba(77,53,31,0.18)] backdrop-blur">
          <div className="curve-card bg-[#fff2d9] p-5">
            <div className="rounded-[2rem] bg-[#2d2118] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-white/15 p-4">
                  <HugeiconsIcon icon={HeartCheckIcon} size={54} strokeWidth={1.7} />
                </div>
                <div className="rounded-full bg-[#bfeee1] px-4 py-2 text-sm font-black text-[#17433a]">
                  Live API
                </div>
              </div>
              <div className="mt-10">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#ffd09c]">
                  Risk preview
                </p>
                <h2 className="font-display mt-2 text-5xl font-black">
                  HIGH / NON-HIGH
                </h2>
                <p className="mt-4 text-white/75">
                  The backend returns the binary class, confidence, probability
                  breakdown, model accuracy, and clinical next-step guidance.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-[1.8rem] bg-white p-5">
                <HugeiconsIcon icon={StethoscopeIcon} size={30} strokeWidth={1.8} />
                <p className="mt-5 text-sm font-bold text-[#7c6654]">Mode</p>
                <p className="font-display text-3xl font-black">Binary</p>
              </div>
              <div className="rounded-[1.8rem] bg-[#dff7ef] p-5">
                <HugeiconsIcon icon={Doctor01Icon} size={30} strokeWidth={1.8} />
                <p className="mt-5 text-sm font-bold text-[#39675d]">Use</p>
                <p className="font-display text-3xl font-black">Screening</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="model-story" className="relative mx-auto max-w-7xl px-5 pb-24 lg:px-10">
        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="curve-card border-2 border-[#2d2118]/10 bg-white/75 p-7 shadow-sm backdrop-blur"
            >
              <div className="mb-8 inline-flex rounded-[1.4rem] bg-[#ffe2a8] p-4">
                <HugeiconsIcon icon={item.icon} size={34} strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-3xl font-black">{item.title}</h3>
              <p className="mt-3 leading-7 text-[#6f5b49]">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[2.4rem] border-2 border-dashed border-[#f15b5d]/40 bg-[#fffdf7]/80 p-6 text-[#6f5b49]">
          <div className="flex items-start gap-3">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} strokeWidth={2} />
            <p>
              Educational and research use only. Cardiovascular decisions should
              always be reviewed by a qualified healthcare professional.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
