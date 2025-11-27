"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("cs_token", res.token);
      }

      router.push("/chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back 👋
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Login to continue using Chat Saathi
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Email or Username
          </label>
          <input
            type="text"
            placeholder="you@example.com or @username"
            value={form.emailOrUsername}
            onChange={handleChange("emailOrUsername")}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange("password")}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-500 text-black font-medium rounded-lg hover:bg-emerald-400 transition disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="flex justify-between text-xs text-slate-400">
        <Link href="/reset-password" className="hover:text-emerald-400">
          Forgot password?
        </Link>
        <Link href="/register" className="hover:text-emerald-400">
          Create account
        </Link>
      </div>
    </div>
  );
}
