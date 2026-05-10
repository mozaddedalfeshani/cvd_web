"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  HeartCheckIcon,
  MagicWand01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import CVDAssessmentFormDual from "@/components/CVDAssessmentFormDual";
import PredictionResultView from "@/components/PredictionResult";
import { predictRisk, type PredictPayload, type PredictionResult } from "@/lib/api";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { useState } from "react";

export default function AssessmentWrapper() {
  const { t } = useLanguage();
  const copy = t.checkPage;
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

      <section className="relative z-10">
        {prediction ? (
          <PredictionResultView
            prediction={prediction}
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
            />
          </div>
        )}
      </section>
    </div>
  );
}
