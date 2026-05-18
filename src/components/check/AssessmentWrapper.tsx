"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Doctor01Icon,
  HeartCheckIcon,
  Login01Icon,
  MagicWand01Icon,
  SparklesIcon,
  Stethoscope02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import CVDAssessmentFormDual from "@/components/CVDAssessmentFormDual";
import PredictionResultView from "@/components/PredictionResult";
import { predictRisk, type PredictPayload, type PredictionResult } from "@/lib/api";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAuth } from "@/components/providers/AuthProvider";

import { useState } from "react";

export default function AssessmentWrapper() {
  const { t } = useLanguage();
  const copy = t.checkPage;
  const { user } = useAuth();
  const uiMode = user?.role === "doctor" || user?.role === "assistant" ? "clinical" : "simple";
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrediction = async (payload: PredictPayload) => {
    setLoading(true);
    setError(null);

    try {
      const data = await predictRisk(payload);
      setPrediction(data.result);
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (user) {
        fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result: data.result, inputs: payload.patient_data }),
        }).catch(() => null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : copy.errors.backend
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-7xl px-5 py-8 lg:px-10">
      <div className="absolute left-[-120px] top-[-100px] h-72 w-72 rounded-full bg-[#bfeee1] blur-3xl" />
      <div className="absolute right-[-90px] top-20 h-72 w-72 rounded-full bg-[#ffc7c8] blur-3xl" />

      <header className="relative z-10 mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-[#2d2118]/10 bg-white/75 px-4 py-2 font-black text-[#6f5b49] shadow-sm backdrop-blur transition hover:-translate-y-0.5"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
          {copy.backHome}
        </Link>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#2d2118] px-4 py-2 font-black text-white">
          <HugeiconsIcon icon={MagicWand01Icon} size={18} strokeWidth={2} />
          {copy.apiBadge}
        </div>
      </header>

      <section className="relative z-10 mb-8 rounded-[2.8rem] border-2 border-[#2d2118]/10 bg-white/75 p-6 shadow-sm backdrop-blur md:p-9">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#dff7ef] px-4 py-2 text-sm font-black text-[#17433a]">
              <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} />
              {copy.badge}
            </div>
            <h1 className="font-display text-5xl font-black leading-[0.95] text-[#2d2118] md:text-7xl">
              {copy.title}
            </h1>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#6f5b49]">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* Auth-aware context banner */}
      {user ? (
        <div className={`relative z-10 mb-6 flex items-center gap-4 rounded-[1.8rem] border-2 p-4 ${
          uiMode === "clinical"
            ? "border-[#17433a]/20 bg-[#dff7ef]"
            : "border-[#f15b5d]/20 bg-[#fff2d9]"
        }`}>
          <div className={`rounded-[1.1rem] p-2.5 ${uiMode === "clinical" ? "bg-[#17433a] text-white" : "bg-[#f15b5d] text-white"}`}>
            <HugeiconsIcon
              icon={user.role === "doctor" ? Doctor01Icon : user.role === "assistant" ? Stethoscope02Icon : UserIcon}
              size={22}
              strokeWidth={1.8}
            />
          </div>
          <div className="flex-1">
            <p className="font-black text-[#2d2118]">
              {uiMode === "clinical"
                ? `Clinical mode — ${user.role === "doctor" ? "Doctor" : "Medical Assistant"} view`
                : `Welcome back, ${user.name.split(" ")[0]}!`}
            </p>
            <p className={`text-sm font-bold ${uiMode === "clinical" ? "text-[#17443a]" : "text-[#7c6654]"}`}>
              {uiMode === "clinical"
                ? "Full clinical labels, probability breakdown, and model stats are enabled."
                : "Your results will be saved to your account automatically."}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 mb-6 flex items-center justify-between gap-4 rounded-[1.8rem] border-2 border-dashed border-[#2d2118]/15 bg-white/60 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-[1.1rem] bg-[#f7ead7] p-2.5">
              <HugeiconsIcon icon={Login01Icon} size={20} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-black text-[#2d2118]">Sign in for the full experience</p>
              <p className="text-sm font-bold text-[#7c6654]">Save results · clinical mode for doctors · role-based view</p>
            </div>
          </div>
        </div>
      )}

      <section className="relative z-10">
        {prediction ? (
          <PredictionResultView
            prediction={prediction}
            uiMode={uiMode}
            onReset={() => {
              setPrediction(null);
              setError(null);
            }}
          />
        ) : (
          <div className="rounded-[2.8rem] border-2 border-[#2d2118]/10 bg-[#fffdf7]/80 p-4 shadow-[0_30px_80px_rgba(77,53,31,0.12)] backdrop-blur md:p-7">
            <div className="mb-5 flex items-center gap-3 px-2">
              <div className="rounded-[1.4rem] bg-[#f15b5d] p-3 text-white">
                <HugeiconsIcon icon={HeartCheckIcon} size={30} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="font-display text-3xl font-black">{copy.formTitle}</h2>
                <p className="text-[#7c6654]">
                  {copy.formSubtitle}
                </p>
              </div>
            </div>
            <CVDAssessmentFormDual
              onSubmit={handlePrediction}
              loading={loading}
              error={error}
              uiMode={uiMode}
            />
          </div>
        )}
      </section>
    </div>
  );
}
