"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Doctor01Icon,
  Login01Icon,
  Logout01Icon,
  Shield01Icon,
  Stethoscope02Icon,
  UserAdd01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import type { UserRole } from "@/lib/auth";

type Mode = "login" | "signup";

const roleConfig = {
  admin: {
    icon: Shield01Icon,
    badgeClass: "bg-[#f15b5d] text-white",
    badgeText: "Admin",
  },
  user: {
    icon: UserIcon,
    badgeClass: "",
    badgeText: null,
  },
  assistant: {
    icon: Stethoscope02Icon,
    badgeClass: "bg-[#dff7ef] text-[#17433a]",
    badgeText: "Assistant",
  },
  doctor: {
    icon: Doctor01Icon,
    badgeClass: "bg-[#ffc7c8] text-[#7b2f2f]",
    badgeText: "Doctor",
  },
} as const;

export default function AuthPanel() {
  const { t } = useLanguage();
  const copy = t.auth;
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
    setStatus(null);
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    resetForm();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const body = mode === "signup"
        ? { name, email, password, role }
        : { email, password };

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json() as { user?: typeof user; error?: string };

      if (!response.ok || !data.user) {
        throw new Error(data.error || copy.genericError);
      }

      setUser(data.user ?? null);
      setOpen(false);
      resetForm();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : copy.genericError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setUser(null);
    setLoading(false);
  };

  if (user) {
    const cfg = roleConfig[user.role];
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-full border-2 border-[#2d2118]/10 bg-white/75 p-1.5 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 px-3 font-black text-[#2d2118]">
          <HugeiconsIcon icon={cfg.icon} size={20} strokeWidth={2} />
          <span className="max-w-[140px] truncate">{user.name}</span>
          {cfg.badgeText && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-black ${cfg.badgeClass}`}>
              {cfg.badgeText}
            </span>
          )}
        </div>
        <Button
          type="button"
          onClick={logout}
          disabled={loading}
          className="h-9 rounded-full bg-[#2d2118] px-4 font-black text-white"
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={2} />
          {copy.logout}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setOpen((c) => !c)}
        className="rounded-full bg-[#f15b5d] px-5 font-black text-white shadow-[0_8px_0_#7b2f2f]"
      >
        <HugeiconsIcon icon={mode === "signup" ? UserAdd01Icon : Login01Icon} size={18} strokeWidth={2} />
        {copy.account}
      </Button>

      {open && (
        <div className="absolute right-0 top-14 z-40 w-[min(92vw,380px)] rounded-[1.8rem] border-2 border-[#2d2118]/10 bg-white p-5 shadow-[0_28px_70px_rgba(77,53,31,0.22)]">
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-full bg-[#f7ead7] p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                mode === "login" ? "bg-[#2d2118] text-white" : "text-[#6f5b49]"
              }`}
            >
              {copy.login}
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                mode === "signup" ? "bg-[#2d2118] text-white" : "text-[#6f5b49]"
              }`}
            >
              {copy.signup}
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="auth-name" className="font-black text-[#5c3b11]">
                    {copy.name}
                  </Label>
                  <Input
                    id="auth-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-[1.1rem] border-2 bg-[#fffaf0] px-4 font-bold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-[#5c3b11]">{copy.roleLabel}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["user", "assistant", "doctor"] as UserRole[]).map((r) => {
                      const cfg = roleConfig[r];
                      const selected = role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`flex flex-col items-center gap-1.5 rounded-[1.2rem] border-2 p-3 text-xs font-black transition ${
                            selected
                              ? "border-[#f15b5d] bg-[#fff2d9]"
                              : "border-[#2d2118]/10 bg-[#fffaf0] text-[#6f5b49]"
                          }`}
                        >
                          <HugeiconsIcon icon={cfg.icon} size={22} strokeWidth={1.8} />
                          {copy.roles[r]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email" className="font-black text-[#5c3b11]">
                {copy.email}
              </Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-[1.1rem] border-2 bg-[#fffaf0] px-4 font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-password" className="font-black text-[#5c3b11]">
                {copy.password}
              </Label>
              <Input
                id="auth-password"
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-[1.1rem] border-2 bg-[#fffaf0] px-4 font-bold"
                required
              />
            </div>

            {status && (
              <div className="rounded-[1rem] border border-[#dd3d3d]/30 bg-[#fff0f0] p-3 text-sm font-bold text-[#9a2b2b]">
                {status}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-full bg-[#2d2118] font-black text-white"
            >
              {loading ? copy.working : mode === "signup" ? copy.createAccount : copy.signIn}
            </Button>
            <p className="text-center text-xs font-bold text-[#7c6654]">{copy.optional}</p>
          </form>
        </div>
      )}
    </div>
  );
}
