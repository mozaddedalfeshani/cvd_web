"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Login01Icon, Logout01Icon, UserAdd01Icon, UserCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/LanguageProvider";

type User = {
  id: string;
  name: string;
  email: string;
};

type Mode = "login" | "signup";

export default function AuthPanel() {
  const { t } = useLanguage();
  const copy = t.auth;
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user: User | null }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
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
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
      });
      const data = (await response.json()) as { user?: User; error?: string };

      if (!response.ok || !data.user) {
        throw new Error(data.error || copy.genericError);
      }

      setUser(data.user);
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
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-full border-2 border-[#2d2118]/10 bg-white/75 p-1.5 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 px-3 font-black text-[#2d2118]">
          <HugeiconsIcon icon={UserCircleIcon} size={20} strokeWidth={2} />
          <span className="max-w-[140px] truncate">{user.name}</span>
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
        onClick={() => setOpen((current) => !current)}
        className="rounded-full bg-[#f15b5d] px-5 font-black text-white shadow-[0_8px_0_#7b2f2f]"
      >
        <HugeiconsIcon icon={mode === "signup" ? UserAdd01Icon : Login01Icon} size={18} strokeWidth={2} />
        {copy.account}
      </Button>

      {open && (
        <div className="absolute right-0 top-14 z-40 w-[min(92vw,360px)] rounded-[1.8rem] border-2 border-[#2d2118]/10 bg-white p-5 shadow-[0_28px_70px_rgba(77,53,31,0.22)]">
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
              <div className="space-y-2">
                <Label htmlFor="auth-name" className="font-black text-[#5c3b11]">
                  {copy.name}
                </Label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11 rounded-[1.1rem] border-2 bg-[#fffaf0] px-4 font-bold"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email" className="font-black text-[#5c3b11]">
                {copy.email}
              </Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
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
