"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  AnalyticsUpIcon,
  ArrowReloadHorizontalIcon,
  CheckmarkCircle02Icon,
  Doctor01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { PredictionResult } from "@/lib/api";

type Props = {
  prediction: PredictionResult;
  onReset?: () => void;
};

const riskTheme = {
  NON_HIGH: {
    label: "NON-HIGH",
    bg: "bg-[#dff7ef]",
    ink: "text-[#17433a]",
    icon: CheckmarkCircle02Icon,
    copy: "The binary screening model does not flag this patient as HIGH risk.",
  },
  HIGH: {
    label: "HIGH",
    bg: "bg-[#ffc7c8]",
    ink: "text-[#7b2f2f]",
    icon: Alert01Icon,
    copy: "The binary screening model flags this patient as HIGH risk for clinical attention.",
  },
};

export default function PredictionResultView({ prediction, onReset }: Props) {
  const risk = prediction.prediction.risk_level;
  const theme = riskTheme[risk];
  const recommendations = prediction.clinical_interpretation.recommendations;

  return (
    <div className="space-y-6">
      <section className={`curve-card ${theme.bg} ${theme.ink} relative overflow-hidden border-2 border-[#2d2118]/10 p-7 shadow-[0_30px_80px_rgba(77,53,31,0.12)] md:p-10`}>
        <div className="absolute right-[-40px] top-[-40px] h-48 w-48 rounded-full bg-white/35" />
        <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="mb-7 inline-flex rounded-[1.8rem] bg-white/65 p-5">
              <HugeiconsIcon icon={theme.icon} size={58} strokeWidth={1.6} />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.28em] opacity-70">
              Binary screening result
            </p>
            <h2 className="font-display mt-2 text-6xl font-black leading-none md:text-8xl">
              {theme.label}
            </h2>
            <p className="mt-5 max-w-xl text-xl font-bold opacity-80">{theme.copy}</p>
          </div>
          <div className="rounded-[2rem] bg-white/70 p-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Confidence" value={`${(prediction.prediction.confidence * 100).toFixed(1)}%`} />
              <StatCard label="Model" value="Binary" />
              <StatCard label="Accuracy" value={`${(prediction.model_used.accuracy * 100).toFixed(1)}%`} />
              <StatCard label="Features" value={String(prediction.model_used.features_used)} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="curve-card border-2 border-[#2d2118]/10 bg-white/80 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-[1.2rem] bg-[#ffe2a8] p-3">
              <HugeiconsIcon icon={AnalyticsUpIcon} size={26} strokeWidth={1.8} />
            </div>
            <h3 className="font-display text-3xl font-black">Binary probability</h3>
          </div>
          <div className="space-y-5">
            {Object.entries(prediction.prediction.probabilities).map(([level, value]) => (
              <div key={level}>
                <div className="mb-2 flex justify-between text-sm font-black text-[#6f5b49]">
                  <span>{level === "NON_HIGH" ? "NON-HIGH" : "HIGH"}</span>
                  <span>{(value * 100).toFixed(1)}%</span>
                </div>
                <div className="h-5 rounded-full bg-[#f7ead7] p-1">
                  <div
                    className={`h-full rounded-full ${
                      level === "NON_HIGH" ? "bg-[#54bfa2]" : "bg-[#f15b5d]"
                    }`}
                    style={{ width: `${Math.max(value * 100, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="curve-card border-2 border-[#2d2118]/10 bg-[#2d2118] p-6 text-white">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-[1.2rem] bg-white/15 p-3">
              <HugeiconsIcon icon={Doctor01Icon} size={26} strokeWidth={1.8} />
            </div>
            <h3 className="font-display text-3xl font-black">Next steps</h3>
          </div>
          <div className="space-y-4 text-white/80">
            <Advice title="Recommendation" text={recommendations.recommendation} />
            <Advice title="Follow-up" text={recommendations.follow_up} />
            <Advice title="Lifestyle" text={recommendations.lifestyle} />
          </div>
        </div>
      </section>

      <section className="curve-card border-2 border-dashed border-[#f15b5d]/35 bg-[#fffdf7]/80 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 text-[#6f5b49]">
            <HugeiconsIcon icon={Shield01Icon} size={26} strokeWidth={1.8} />
            <p>
              Research disclaimer: this follows the paper’s HIGH vs NON-HIGH
              screening framing. It is not a medical diagnosis.
            </p>
          </div>
          {onReset && (
            <Button
              type="button"
              onClick={onReset}
              className="rounded-full bg-[#f15b5d] px-6 font-black text-white shadow-[0_8px_0_#7b2f2f]"
            >
              <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={20} strokeWidth={2} />
              Check another
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4">
      <p className="text-sm font-black text-[#7c6654]">{label}</p>
      <p className="font-display mt-1 text-3xl font-black text-[#2d2118]">{value}</p>
    </div>
  );
}

function Advice({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.4rem] bg-white/10 p-4">
      <p className="font-display text-xl font-black text-white">{title}</p>
      <p className="mt-1 leading-7">{text}</p>
    </div>
  );
}
