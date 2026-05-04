import AssessmentWrapper from "@/components/check/AssessmentWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "HeartNest AI - CVD Assessment",
  description: "Run a trained CVD risk model through a playful clinical form.",
};

export default function CheckPage() {
  return (
    <main className="soft-grid min-h-screen overflow-hidden">
      <AssessmentWrapper />
    </main>
  );
}
