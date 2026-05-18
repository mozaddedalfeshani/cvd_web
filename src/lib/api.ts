export type ModelType = "binary";

export type ModelOption = {
  id: ModelType;
  name: string;
  description: string;
  accuracy: string;
  features: number;
  time_required: string;
  recommended_for: string;
};

export type FeaturesResponse = {
  model: {
    name: string;
    accuracy: string;
    description: string;
  };
  required_features: string[];
  feature_count: number;
  categories: Record<string, string[]>;
  categorical_options: Record<string, string[]>;
};

export type PredictPayload = {
  model_type: ModelType;
  patient_data: Record<string, number | string>;
};

export type PredictionResult = {
  model_used: {
    type: string;
    name: string;
    accuracy: number;
    f1_score?: number;
    features_used: number;
  };
  prediction: {
    risk_level: "NON_HIGH" | "HIGH";
    risk_code: number;
    confidence: number;
    probabilities: {
      NON_HIGH: number;
      HIGH: number;
    };
  };
  clinical_interpretation: {
    risk_category: string;
    confidence_level: string;
    recommendations: {
      recommendation: string;
      follow_up: string;
      lifestyle: string;
    };
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://cvdapi.imurad.me";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with ${response.status}`);
  }

  return data as T;
}

export async function getModels() {
  return apiFetch<{
    available_models: ModelOption[];
    default_model: ModelType | null;
  }>("/api/models");
}

export async function getFeatures(modelType: ModelType) {
  return apiFetch<FeaturesResponse>(`/api/features/${modelType}`);
}

export async function getExample(modelType: ModelType, risk: "non_high" | "high") {
  return apiFetch<{
    model_type: ModelType;
    risk_type: string;
    example_data: Record<string, number | string>;
  }>(`/api/example/${modelType}?risk=${risk}`);
}

export async function predictRisk(payload: PredictPayload) {
  return apiFetch<{
    success: boolean;
    result: PredictionResult;
    timestamp: string;
  }>("/api/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
