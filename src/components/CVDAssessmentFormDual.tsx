"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  BloodPressureIcon,
  CheckmarkCircle02Icon,
  Doctor01Icon,
  HeartCheckIcon,
  Loading03Icon,
  StethoscopeIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getExample,
  getFeatures,
  getModels,
  type FeaturesResponse,
  type ModelOption,
  type ModelType,
  type PredictPayload,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Props = {
  onSubmit: (data: PredictPayload) => void;
  loading: boolean;
  error: string | null;
};

const FIELD_LABELS: Record<string, string> = {
  Sex: "Sex",
  Age: "Age",
  "Weight (kg)": "Weight",
  "Height (cm)": "Height",
  BMI: "BMI",
  "Abdominal Circumference (cm)": "Waist",
  "Total Cholesterol (mg/dL)": "Total cholesterol",
  "HDL (mg/dL)": "HDL",
  "Fasting Blood Sugar (mg/dL)": "Blood sugar",
  "Smoking Status": "Smoking",
  "Diabetes Status": "Diabetes",
  "Physical Activity Level": "Activity",
  "Family History of CVD": "Family history",
  "Waist-to-Height Ratio": "Waist-height ratio",
  "Systolic BP": "Systolic BP",
  "Diastolic BP": "Diastolic BP",
  "Estimated LDL (mg/dL)": "Estimated LDL",
  Cholesterol_HDL_Ratio: "Cholesterol/HDL",
  LDL_HDL_Ratio: "LDL/HDL",
  Multiple_Risk_Factors: "Risk flags",
  Pulse_Pressure: "Pulse pressure",
};

const DERIVED_FIELDS = [
  "Cholesterol_HDL_Ratio",
  "LDL_HDL_Ratio",
  "Multiple_Risk_Factors",
  "Pulse_Pressure",
  "Waist-to-Height Ratio",
];

const categoryIcons = {
  Demographics: Doctor01Icon,
  Vitals: BloodPressureIcon,
  "Lab Values": StethoscopeIcon,
  Lifestyle: HeartCheckIcon,
  "Body Composition": AiBrain01Icon,
};

function parseValue(value: string) {
  if (value.trim() === "") return "";
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
}

export default function CVDAssessmentFormDual({ onSubmit, loading, error }: Props) {
  const { t } = useLanguage();
  const copy = t.checkPage;
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType>("binary");
  const [features, setFeatures] = useState<FeaturesResponse | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getModels()
      .then((data) => {
        if (!active) return;
        setModels(data.available_models);
        if (data.default_model) setSelectedModel(data.default_model);
      })
      .catch((err) => {
        if (!active) return;
        setSetupError(
          err instanceof Error
            ? err.message
            : copy.errors.models
        );
      });

    return () => {
      active = false;
    };
  }, [copy.errors.models]);

  useEffect(() => {
    let active = true;

    const resetFeaturesTimer = window.setTimeout(() => {
      if (active) setFeatures(null);
    }, 0);

    getFeatures(selectedModel)
      .then((data) => {
        if (!active) return;
        setFeatures(data);
        const nextData: Record<string, string> = {};
        data.required_features
          .filter((field) => !DERIVED_FIELDS.includes(field))
          .forEach((field) => {
            nextData[field] = "";
          });
        setFormData(nextData);
      })
      .catch((err) => {
        if (!active) return;
        setSetupError(
          err instanceof Error
            ? err.message
            : copy.errors.features
        );
      });

    return () => {
      active = false;
      window.clearTimeout(resetFeaturesTimer);
    };
  }, [copy.errors.features, selectedModel]);

  const visibleCategories = Object.entries(features?.categories || {})
    .map(([category, fields]) => [
      category,
      fields.filter((field) => !DERIVED_FIELDS.includes(field)),
    ] as const)
    .filter(([, fields]) => fields.length > 0);

  const loadExampleData = async (risk: "non_high" | "high") => {
    try {
      const data = await getExample(selectedModel, risk);
      setFormData((current) => {
        const next = { ...current };
        Object.entries(data.example_data).forEach(([key, value]) => {
          if (!DERIVED_FIELDS.includes(key)) next[key] = String(value);
        });
        return next;
      });
    } catch (err) {
      setSetupError(
        err instanceof Error ? err.message : copy.errors.example
      );
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!features) return;

    const requiredFields = features.required_features.filter(
      (field) => !DERIVED_FIELDS.includes(field)
    );
    const missing = requiredFields.filter((field) => !formData[field]);
    if (missing.length > 0) {
      setSetupError(`${copy.pleaseFill}: ${missing.map((field) => copy.fields[field as keyof typeof copy.fields] || FIELD_LABELS[field] || field).join(", ")}`);
      return;
    }

    setSetupError(null);
    const patientData: Record<string, number | string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      const parsed = parseValue(value);
      if (parsed !== "") patientData[key] = parsed;
    });

    onSubmit({
      model_type: selectedModel,
      patient_data: patientData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => setSelectedModel(model.id)}
            className={cn(
              "curve-card border-2 p-5 text-left transition hover:-translate-y-1",
              selectedModel === model.id
                ? "border-[#f15b5d] bg-[#fff2d9] shadow-[0_12px_0_#ffd09c]"
                : "border-[#2d2118]/10 bg-white"
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="rounded-[1.2rem] bg-[#2d2118] p-3 text-white">
                <HugeiconsIcon icon={AiBrain01Icon} size={26} strokeWidth={1.8} />
              </div>
              <span className="rounded-full bg-[#dff7ef] px-3 py-1 text-sm font-black text-[#17433a]">
                {model.accuracy}
              </span>
            </div>
            <h3 className="font-display mt-5 text-3xl font-black">{copy.model.name || model.name}</h3>
            <p className="mt-2 text-[#6f5b49]">{copy.model.description || model.description}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm font-black text-[#7c6654]">
              <span className="rounded-full bg-white/80 px-3 py-1">
                {model.features} {copy.fieldsSuffix}
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">
                {model.time_required}
              </span>
            </div>
          </button>
        ))}
      </section>

      <section className="curve-card border-2 border-[#2d2118]/10 bg-[#2d2118] p-5 text-white">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="font-display text-3xl font-black">{copy.quickTitle}</h3>
            <p className="text-white/70">{copy.quickSubtitle}</p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => loadExampleData("non_high")}
              className="rounded-full bg-[#bfeee1] px-5 font-black text-[#17433a] hover:bg-[#dff7ef]"
            >
              {copy.nonHighSample}
            </Button>
            <Button
              type="button"
              onClick={() => loadExampleData("high")}
              className="rounded-full bg-[#ffc7c8] px-5 font-black text-[#7b2f2f] hover:bg-[#ffd7d8]"
            >
              {copy.highSample}
            </Button>
          </div>
        </div>
      </section>

      {(setupError || error) && (
        <div className="rounded-[1.5rem] border-2 border-[#dd3d3d]/30 bg-[#fff0f0] p-4 font-bold text-[#9a2b2b]">
          {setupError || error}
        </div>
      )}

      {!features ? (
        <div className="curve-card flex items-center justify-center gap-3 border-2 border-dashed border-[#2d2118]/15 bg-white/70 p-12 text-[#7c6654]">
          <HugeiconsIcon icon={Loading03Icon} size={24} strokeWidth={2} className="animate-spin" />
          {copy.loadingFields}
        </div>
      ) : (
        <section className="space-y-5">
          {visibleCategories.map(([category, fields]) => {
            const icon = categoryIcons[category as keyof typeof categoryIcons] || HeartCheckIcon;
            return (
              <div
                key={category}
                className="curve-card border-2 border-[#2d2118]/10 bg-white p-5"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-[1.2rem] bg-[#ffe2a8] p-3">
                    <HugeiconsIcon icon={icon} size={24} strokeWidth={1.8} />
                  </div>
                  <h3 className="font-display text-3xl font-black">
                    {copy.categories[category as keyof typeof copy.categories] || category}
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {fields.map((field) => {
                    const options = features.categorical_options[field];
                    const label = copy.fields[field as keyof typeof copy.fields] || FIELD_LABELS[field] || field;

                    return (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="font-black text-[#5c3b11]">
                          {label}
                        </Label>
                        {options ? (
                          <Select
                            value={formData[field] || ""}
                            onValueChange={(value) =>
                              setFormData((current) => ({ ...current, [field]: value }))
                            }
                          >
                            <SelectTrigger
                              id={field}
                              className="h-12 w-full rounded-[1.1rem] border-2 bg-[#fffaf0] px-4 font-bold"
                            >
                              <SelectValue placeholder={`${copy.choose} ${label}`} />
                            </SelectTrigger>
                            <SelectContent className="rounded-[1.1rem]">
                              {options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {copy.options[option as keyof typeof copy.options] || option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={field}
                            type="number"
                            step={field.includes("Height") || field.includes("Ratio") ? "0.01" : "1"}
                            value={formData[field] || ""}
                            onChange={(event) =>
                              setFormData((current) => ({
                                ...current,
                                [field]: event.target.value,
                              }))
                            }
                            placeholder={`${copy.enter} ${label}`}
                            className="h-12 rounded-[1.1rem] border-2 bg-[#fffaf0] px-4 font-bold"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <Button
        type="submit"
        disabled={loading || !features}
        className="h-16 w-full rounded-full bg-[#f15b5d] text-xl font-black text-white shadow-[0_12px_0_#7b2f2f] transition hover:-translate-y-1 hover:bg-[#f15b5d]/95 disabled:shadow-none"
      >
        {loading ? (
          <>
            <HugeiconsIcon icon={Loading03Icon} size={24} strokeWidth={2} className="animate-spin" />
            {copy.predicting}
          </>
        ) : (
          <>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} strokeWidth={2} />
            {copy.predict}
          </>
        )}
      </Button>
    </form>
  );
}
