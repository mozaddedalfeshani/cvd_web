"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Doctor01Icon,
  Loading03Icon,
  Stethoscope02Icon,
  UserIcon,
  Shield01Icon,
  AnalyticsUpIcon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
  assessmentCount: number;
};

type Assessment = {
  _id: string;
  result: {
    prediction: { risk_level: "HIGH" | "NON_HIGH"; confidence: number };
    model_used: { accuracy: number };
    clinical_interpretation: { risk_category: string; recommendations: { recommendation: string } };
  };
  inputs: Record<string, number | string>;
  createdAt: string;
};

const roleOrder = { admin: 0, doctor: 1, assistant: 2, user: 3 };
const roleIcon = {
  admin: Shield01Icon,
  doctor: Doctor01Icon,
  assistant: Stethoscope02Icon,
  user: UserIcon,
};
const roleBadge: Record<string, string> = {
  admin: "bg-[#f15b5d] text-white",
  doctor: "bg-[#ffc7c8] text-[#7b2f2f]",
  assistant: "bg-[#dff7ef] text-[#17433a]",
  user: "bg-[#f7ead7] text-[#6f5b49]",
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;

    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data: { users?: AdminUser[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        const sorted = (data.users ?? []).sort(
          (a, b) =>
            (roleOrder[a.role as keyof typeof roleOrder] ?? 9) -
            (roleOrder[b.role as keyof typeof roleOrder] ?? 9)
        );
        setUsers(sorted);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load users"))
      .finally(() => setLoadingUsers(false));
  }, [user, authLoading]);

  const loadAssessments = async (u: AdminUser) => {
    setSelectedUser(u);
    setAssessments([]);
    setLoadingAssessments(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/assessments`);
      const data = await res.json() as { assessments?: Assessment[] };
      setAssessments(data.assessments ?? []);
    } catch {
      setAssessments([]);
    } finally {
      setLoadingAssessments(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <HugeiconsIcon icon={Loading03Icon} size={32} strokeWidth={2} className="animate-spin text-[#f15b5d]" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-[2rem] border-2 border-[#2d2118]/10 bg-white/80 p-10 shadow-sm">
          <HugeiconsIcon icon={Shield01Icon} size={48} strokeWidth={1.6} className="mx-auto text-[#f15b5d]" />
          <h1 className="font-display mt-5 text-4xl font-black text-[#2d2118]">Access Denied</h1>
          <p className="mt-3 text-[#6f5b49]">Admin access only. Sign in with an admin account.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2d2118] px-6 py-3 font-black text-white">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
            Back home
          </Link>
        </div>
      </div>
    );
  }

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
          Back home
        </Link>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f15b5d] px-4 py-2 font-black text-white shadow-[0_6px_0_#7b2f2f]">
          <HugeiconsIcon icon={Shield01Icon} size={18} strokeWidth={2} />
          Admin Dashboard
        </div>
      </header>

      <section className="relative z-10 mb-6 rounded-[2.4rem] border-2 border-[#2d2118]/10 bg-white/75 p-6 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="rounded-[1.2rem] bg-[#f15b5d] p-3 text-white">
            <HugeiconsIcon icon={Shield01Icon} size={28} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-display text-4xl font-black text-[#2d2118]">User Management</h1>
            <p className="text-[#7c6654]">{users.length} registered accounts · sorted by role</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="relative z-10 mb-6 rounded-[1.5rem] border-2 border-[#dd3d3d]/30 bg-[#fff0f0] p-4 font-bold text-[#9a2b2b]">
          {error}
        </div>
      )}

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* User list */}
        <section className="curve-card border-2 border-[#2d2118]/10 bg-[#fffdf7]/80 p-4 shadow-sm">
          {loadingUsers ? (
            <div className="flex items-center justify-center gap-3 py-12 text-[#7c6654]">
              <HugeiconsIcon icon={Loading03Icon} size={24} strokeWidth={2} className="animate-spin" />
              Loading users...
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => {
                const icon = roleIcon[u.role as keyof typeof roleIcon] ?? UserIcon;
                const badge = roleBadge[u.role] ?? roleBadge.user;
                const isSelected = selectedUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => loadAssessments(u)}
                    className={`w-full rounded-[1.4rem] border-2 p-4 text-left transition hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-[#f15b5d] bg-[#fff2d9]"
                        : "border-[#2d2118]/10 bg-white hover:bg-[#fffaf0]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-[1rem] bg-[#f7ead7] p-2.5">
                        <HugeiconsIcon icon={icon} size={20} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-[#2d2118] truncate">{u.name}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${badge}`}>
                            {u.role}
                          </span>
                          {u.verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#dff7ef] px-2 py-0.5 text-xs font-black text-[#17433a]">
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} strokeWidth={2} />
                              verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#7c6654] truncate">{u.email}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#ffe2a8] px-2.5 py-1 text-xs font-black text-[#2d2118]">
                        {u.assessmentCount} reports
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Assessment panel */}
        <section className="curve-card border-2 border-[#2d2118]/10 bg-white/80 p-5">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#7c6654]">
              <HugeiconsIcon icon={AnalyticsUpIcon} size={40} strokeWidth={1.6} className="opacity-40" />
              <p className="font-bold">Select a user to view their reports</p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3 border-b border-[#2d2118]/10 pb-4">
                <div className="rounded-[1.1rem] bg-[#ffe2a8] p-2.5">
                  <HugeiconsIcon icon={roleIcon[selectedUser.role as keyof typeof roleIcon] ?? UserIcon} size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-black text-[#2d2118]">{selectedUser.name}</h2>
                  <p className="text-sm text-[#7c6654]">{selectedUser.email} · {selectedUser.role}</p>
                </div>
              </div>

              {loadingAssessments ? (
                <div className="flex items-center justify-center gap-3 py-10 text-[#7c6654]">
                  <HugeiconsIcon icon={Loading03Icon} size={22} strokeWidth={2} className="animate-spin" />
                  Loading reports...
                </div>
              ) : assessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-[#7c6654]">
                  <HugeiconsIcon icon={AnalyticsUpIcon} size={30} strokeWidth={1.6} className="opacity-40" />
                  <p className="font-bold text-sm">No assessment reports yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((a, i) => {
                    const isHigh = a.result?.prediction?.risk_level === "HIGH";
                    return (
                      <div
                        key={a._id ?? i}
                        className={`rounded-[1.4rem] border-2 p-4 ${
                          isHigh
                            ? "border-[#f15b5d]/30 bg-[#fff2f2]"
                            : "border-[#54bfa2]/30 bg-[#f0fdf8]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <HugeiconsIcon
                              icon={isHigh ? Alert01Icon : CheckmarkCircle02Icon}
                              size={20}
                              strokeWidth={2}
                              className={isHigh ? "text-[#f15b5d]" : "text-[#54bfa2]"}
                            />
                            <span className="font-black text-[#2d2118]">
                              {a.result?.prediction?.risk_level ?? "—"}
                            </span>
                            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-black text-[#7c6654]">
                              {((a.result?.prediction?.confidence ?? 0) * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <span className="shrink-0 text-xs text-[#7c6654]">
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        {a.result?.clinical_interpretation?.recommendations?.recommendation && (
                          <p className="mt-2 text-xs leading-relaxed text-[#6f5b49]">
                            {a.result.clinical_interpretation.recommendations.recommendation}
                          </p>
                        )}
                        {a.result?.model_used?.accuracy !== undefined && (
                          <p className="mt-1 text-xs font-bold text-[#7c6654]">
                            Model accuracy: {(a.result.model_used.accuracy * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {user.role === "admin" && (
        <div className="relative z-10 mt-6">
          <AdminActions onUsersRefresh={() => {
            setLoadingUsers(true);
            fetch("/api/admin/users")
              .then((r) => r.json())
              .then((data: { users?: AdminUser[] }) => setUsers(data.users ?? []))
              .finally(() => setLoadingUsers(false));
          }} />
        </div>
      )}
    </div>
  );
}

function AdminActions({ onUsersRefresh }: { onUsersRefresh: () => void }) {
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const runSetup = async () => {
    setRunning(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "x-setup-secret": "cvd-setup-2025" },
      });
      const data = await res.json() as { results?: string[] };
      setMsg((data.results ?? []).join(" · "));
      onUsersRefresh();
    } catch {
      setMsg("Setup failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="curve-card border-2 border-dashed border-[#f15b5d]/35 bg-[#fffdf7]/80 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-display text-2xl font-black text-[#2d2118]">Admin Actions</h3>
          <p className="text-sm text-[#7c6654]">Re-seed verified accounts (safe to re-run)</p>
        </div>
        <Button
          type="button"
          onClick={runSetup}
          disabled={running}
          className="rounded-full bg-[#2d2118] px-5 font-black text-white"
        >
          {running ? (
            <HugeiconsIcon icon={Loading03Icon} size={18} strokeWidth={2} className="animate-spin" />
          ) : (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />
          )}
          Initialize accounts
        </Button>
      </div>
      {msg && (
        <p className="mt-3 rounded-[1rem] bg-[#dff7ef] px-4 py-2 text-sm font-bold text-[#17433a]">{msg}</p>
      )}
    </div>
  );
}
