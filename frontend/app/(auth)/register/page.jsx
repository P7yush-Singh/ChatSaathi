// app/(auth)/register/page.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/apiClient"; // unchanged helper that attaches Authorization header

const PASSWORD_MIN = 6;

function getPasswordStrengthLabel(pw) {
  if (!pw) return "Weak";
  if (pw.length < PASSWORD_MIN) return "Weak";
  if (pw.length >= 12 && /[\W_]/.test(pw)) return "Strong";
  if (pw.length >= 8) return "Medium";
  return "Weak";
}

export default function RegisterPage() {
  const router = useRouter();

  // page state
  const [checkingSession, setCheckingSession] = useState(true); // <-- show loader while checking
  const [step, setStep] = useState("form");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [signupEmailForOtp, setSignupEmailForOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ----------------------------------------
  // Session check on mount
  // If user already logged in -> redirect to /chat
  // This avoids showing signup to logged-in users and avoids reload loops.
  // ----------------------------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // quick check: if token in localStorage then verify with /api/auth/me
        const token = typeof window !== "undefined" ? localStorage.getItem("chat_saathi_token") : null;
        if (!token) {
          if (mounted) setCheckingSession(false);
          return;
        }

        // apiRequest should add Authorization header automatically using stored token.
        // we call /api/auth/me which uses authRequired middleware
        const res = await apiRequest("/api/auth/me", { method: "GET" });

        // if server returns a user -> redirect
        if (res && res.user) {
          // user is logged in
          router.replace("/chat");
          return;
        } else {
          if (mounted) setCheckingSession(false);
        }
      } catch (err) {
        // invalid token or server error -> allow signup
        if (mounted) setCheckingSession(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ----------------------------------------
  // Form validation and handlers (unchanged)
  // ----------------------------------------
  function validateForm() {
    if (!displayName.trim()) return "Please enter your display name.";
    if (!username.trim()) return "Please choose a username.";
    if (!email.trim()) return "Please enter your email address.";
    if (!password || password.length < PASSWORD_MIN)
      return `Password must be at least ${PASSWORD_MIN} characters.`;
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/api/auth/register/start", {
        method: "POST",
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      setSignupEmailForOtp(email.trim().toLowerCase());
      setStep("otp");
      setInfo("We’ve sent a verification code to your email.");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!otp.trim()) {
      setError("Please enter the OTP sent to your email.");
      return;
    }

    try {
      setOtpLoading(true);
      const res = await apiRequest("/api/auth/register/verify", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmailForOtp,
          otp: otp.trim(),
        }),
      });

      // Expect { token, user }
      if (typeof window !== "undefined" && res.token) {
        // **consistent token key for app**
        localStorage.setItem("chat_saathi_token", res.token);
      }

      setInfo("Account created successfully! Redirecting...");
      router.push("/chat");
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!signupEmailForOtp) return;
    setError("");
    setInfo("");

    try {
      setOtpLoading(true);
      await apiRequest("/api/auth/register/start", {
        method: "POST",
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          email: signupEmailForOtp,
          password,
        }),
      });

      setInfo("OTP resent to your email.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  // password strength visuals (unchanged)
  const strengthLabel = getPasswordStrengthLabel(password);
  const strengthWidth =
    strengthLabel === "Strong" ? "100%" : strengthLabel === "Medium" ? "66%" : "33%";
  const strengthColor =
    strengthLabel === "Strong"
      ? "bg-emerald-500"
      : strengthLabel === "Medium"
      ? "bg-yellow-500"
      : "bg-red-500";

  // ----------------------------------------
  // Render
  // - show a small loader while session check happening
  // ----------------------------------------
  if (checkingSession) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-300">Checking session…</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0b141a] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-4xl bg-[#111b21] border border-[#202c33] rounded-2xl shadow-xl px-6 md:px-10 py-8 md:py-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">
          Create your Chat Saathi account ✨
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mb-6">
          Choose a unique username, verify your email with OTP and start
          chatting.
        </p>

        {error && (
          <div className="mb-4 text-xs rounded-lg bg-red-500/10 border border-red-500/60 px-3 py-2 text-red-200">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/60 px-3 py-2 text-emerald-200">
            {info}
          </div>
        )}

        {/* step form / otp (kept same structure and styles you had) */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-200">Display Name</label>
                <input
                  className="w-full px-3 py-2 rounded-md bg-[#070f17] border border-[#1f2933] text-slate-100 outline-none focus:border-emerald-500"
                  placeholder="Your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-slate-500">This name is visible to everyone in chats.</p>
              </div>

              <div>
                <label className="block mb-1 text-slate-200">Username</label>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-2 rounded-md bg-[#070f17] border border-[#1f2933] text-slate-400 text-xs">@</span>
                  <input
                    className="w-full px-3 py-2 rounded-md bg-[#070f17] border border-[#1f2933] text-slate-100 outline-none focus:border-emerald-500"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Unique ID used for search & friend requests.</p>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-slate-200">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-md bg-[#070f17] border border-[#1f2933] text-slate-100 outline-none focus:border-emerald-500"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-200">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded-md bg-[#070f17] border border-[#1f2933] text-slate-100 outline-none focus:border-emerald-500"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="mt-2">
                <div className="w-full h-1.5 rounded-full bg-[#050b10] overflow-hidden">
                  <div className={`h-full ${strengthColor} transition-all`} style={{ width: strengthWidth }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Password strength: {strengthLabel}</p>
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-4 w-full py-2.5 rounded-md bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 disabled:opacity-60">
              {loading ? "Sending OTP…" : "Continue & Verify Email"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs md:text-sm">
            <p className="text-slate-300">We&apos;ve sent a 6-digit verification code to <span className="font-semibold">{signupEmailForOtp}</span>. Enter it below to complete your signup.</p>

            <div className="flex justify-center">
              <input
                className="w-40 text-center tracking-[0.3em] px-3 py-2 rounded-md bg-[#070f17] border border-[#1f2933] text-slate-100 text-lg outline-none focus:border-emerald-500"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                placeholder="••••••"
              />
            </div>

            <button type="submit" disabled={otpLoading} className="w-full py-2.5 rounded-md bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 disabled:opacity-60">
              {otpLoading ? "Verifying…" : "Verify & Create Account"}
            </button>

            <button type="button" disabled={otpLoading} onClick={handleResendOtp} className="w-full py-2.5 rounded-md border border-[#1f2933] text-slate-200 text-sm hover:bg-[#070f17] disabled:opacity-60">
              Resend code
            </button>

            <p className="text-[11px] text-slate-400 text-center">Wrong email? <button type="button" className="text-emerald-400 hover:underline" onClick={() => { setStep("form"); setOtp(""); setError(""); setInfo(""); }}>Go back & edit details</button></p>
          </form>
        )}

        <p className="mt-6 text-[11px] text-slate-400">Already have an account? <Link href="/login" className="text-emerald-400 hover:underline">Login here</Link></p>
      </div>

      <div className="w-full max-w-4xl mt-6 bg-[#111b21] border border-[#202c33] rounded-2xl px-6 md:px-10 py-5 text-xs md:text-sm text-slate-300">
        <h2 className="text-sm md:text-base font-semibold mb-2">Why join Chat Saathi?</h2>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li>One-on-one chats with read receipts & typing indicators.</li>
          <li>Powerful groups with admin controls.</li>
          <li>Unique username system for search and requests.</li>
          <li>Email is private, only your name & username are public.</li>
        </ul>
      </div>
    </div>
  );
}
