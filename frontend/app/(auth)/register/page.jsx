"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
  });
  const [passwordStrength, setPasswordStrength] = useState({
    label: "Weak",
    color: "text-slate-500",
    bar: "w-1/4 bg-slate-700",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field === "password") updateStrength(value);
    };
  }

  function updateStrength(password) {
    if (!password) {
      setPasswordStrength({
        label: "Weak",
        color: "text-slate-500",
        bar: "w-1/4 bg-slate-700",
      });
      return;
    }
    const len = password.length;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (len >= 10 && hasNumber && hasSymbol) {
      setPasswordStrength({
        label: "Strong",
        color: "text-emerald-400",
        bar: "w-full bg-emerald-500",
      });
    } else if (len >= 8 && (hasNumber || hasSymbol)) {
      setPasswordStrength({
        label: "Medium",
        color: "text-yellow-400",
        bar: "w-2/3 bg-yellow-400",
      });
    } else {
      setPasswordStrength({
        label: "Weak",
        color: "text-red-400",
        bar: "w-1/3 bg-red-500",
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("cs_token", res.token);
      }

      // Later you can redirect to /verify-otp
      router.push("/chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 grid gap-10 md:grid-cols-[1.1fr,0.9fr]">
      {/* Left: form */}
      <div className="space-y-7">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Create your Chat Saathi account ✨
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Choose a unique username, verify your email later with OTP and start chatting.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
        >
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={form.displayName}
                onChange={handleChange("displayName")}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This name is visible to everyone in chats.
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Username
              </label>
              <div className="flex items-center gap-2">
                <span className="px-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-500">
                  @
                </span>
                <input
                  type="text"
                  placeholder="username"
                  value={form.username}
                  onChange={handleChange("username")}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Unique ID used for search & friend requests.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange("email")}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange("password")}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="mt-2 space-y-1">
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${passwordStrength.bar}`}
                />
              </div>
              <p className={`text-[11px] ${passwordStrength.color}`}>
                Password strength: {passwordStrength.label}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 text-black font-medium rounded-lg hover:bg-emerald-400 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Continue & Verify Email"}
          </button>
        </form>

        <p className="text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>

      {/* Right side box stays same as before or keep simple */}
      <div className="hidden md:flex flex-col gap-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-100">
          Why join Chat Saathi?
        </h2>
        <ul className="text-xs text-slate-400 space-y-2">
          <li>• One-on-one chats with read receipts & typing indicators.</li>
          <li>• Powerful groups with admin controls.</li>
          <li>• Unique username system for search and requests.</li>
          <li>• Email is private, only your name & username are public.</li>
        </ul>
      </div>
    </div>
  );
}
