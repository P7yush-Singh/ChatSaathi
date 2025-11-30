// app/signup/page.jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// import { signIn } from "next-auth/react"; // will work after NextAuth setup
import { apiRequest } from "@/lib/apiClient";

const PASSWORD_MIN = 6;

export default function SignupPage() {
  const router = useRouter();

  // Step control: "form" -> "otp"
  const [step, setStep] = useState("form");

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Avatar
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // OTP
  const [otp, setOtp] = useState("");
  const [signupEmailForOtp, setSignupEmailForOtp] = useState("");

  // UI states
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // ---------- Helpers ---------- //

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  async function uploadAvatarIfNeeded() {
    if (!avatarFile) return null;

    const formData = new FormData();
    formData.append("file", avatarFile);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to upload avatar");
    }

    const { url } = await res.json();
    return url;
  }

  function validateForm() {
    if (!displayName.trim()) return "Please enter your name.";
    if (!username.trim()) return "Please choose a username.";
    if (!email.trim()) return "Please enter your email.";
    if (!password || password.length < PASSWORD_MIN)
      return `Password must be at least ${PASSWORD_MIN} characters.`;
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  // ---------- Step 1: submit signup details ---------- //

  async function handleSubmitForm(e) {
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

      // 1) Upload avatar if user selected an image
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatarIfNeeded();
      }

      // 2) Call backend to start signup + send OTP
      await apiRequest("/api/auth/signup/start", {
        method: "POST",
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
          avatarUrl, // can be null, backend should fallback to default
        }),
      });

      setSignupEmailForOtp(email.trim().toLowerCase());
      setStep("otp");
      setInfo("We’ve sent a verification code to your email.");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  // ---------- Step 2: verify OTP ---------- //

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

      const res = await apiRequest("/api/auth/signup/verify", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmailForOtp,
          otp: otp.trim(),
        }),
      });

      // Expecting { token, user }
      if (!res.token || !res.user) {
        throw new Error("Invalid server response");
      }

      // Save JWT
      if (typeof window !== "undefined") {
        localStorage.setItem("chat_saathi_token", res.token);
      }

      setInfo("Account created successfully! Redirecting...");
      // You might also update your Auth context here if you have one.

      router.push("/chat");
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  }

  // Optional "resend OTP" – calls the same /signup/start again
  async function handleResendOtp() {
    if (!signupEmailForOtp) return;
    setError("");
    setInfo("");

    try {
      setOtpLoading(true);
      await apiRequest("/api/auth/signup/start", {
        method: "POST",
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          email: signupEmailForOtp,
          password,
          // avatarUrl ignored here or handle on backend; simplest is: backend uses
          // stored pending user and only resends OTP without changing data.
        }),
      });

      setInfo("OTP resent to your email.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  // ---------- Google signup/login (NextAuth) ---------- //

  function handleGoogleSignup() {
    signIn("google", { callbackUrl: "/chat" });
  }

  // ---------- UI ---------- //

  const containerClasses =
    "min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#0b141a] px-4 py-8";

  const cardClasses =
    "w-full max-w-md bg-[#111b21] border border-[#202c33] rounded-2xl shadow-xl p-6 md:p-8 text-slate-100";

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        <h1 className="text-xl md:text-2xl font-semibold mb-2 text-center">
          Create your Chat Saathi account
        </h1>
        <p className="text-xs text-slate-400 mb-6 text-center">
          Stay connected with friends using real-time chats and secure accounts.
        </p>

        {/* Error / Info */}
        {error && (
          <div className="mb-3 text-xs rounded-lg bg-red-500/10 border border-red-500/60 px-3 py-2 text-red-200">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-3 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/60 px-3 py-2 text-emerald-200">
            {info}
          </div>
        )}

        {/* STEP 1: DETAILS */}
        {step === "form" && (
          <>
            {/* Avatar selector */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="relative w-20 h-20">
                <Image
                  src={
                    avatarPreview ||
                    "/avatars/user1.png" /* default avatar asset */
                  }
                  alt="Avatar preview"
                  fill
                  className="rounded-full object-cover border border-[#202c33]"
                />
              </div>
              <label className="px-3 py-1 rounded-full bg-[#202c33] text-[11px] text-slate-200 cursor-pointer">
                {avatarFile ? "Change photo" : "Add photo (optional)"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <form
              onSubmit={handleSubmitForm}
              className="flex flex-col gap-3 text-xs"
            >
              <div>
                <label className="block mb-1 text-slate-300">
                  Display name
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-slate-100 outline-none"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name shown to everyone"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Username</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-sm">@</span>
                  <input
                    className="flex-1 px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-slate-100 outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="unique username"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  This is used for search and friend requests.
                </p>
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-slate-100 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-300">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-slate-100 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-slate-100 outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
              >
                {loading ? "Sending OTP…" : "Continue"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-[#202c33]" />
              <span className="text-[11px] text-slate-500">or</span>
              <div className="flex-1 h-px bg-[#202c33]" />
            </div>

            {/* Google auth */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full py-2 rounded-lg bg-white text-sm font-medium text-slate-900 flex items-center justify-center gap-2 hover:bg-slate-100"
            >
              <Image
                src="/icons/google.svg"
                alt="Google"
                width={18}
                height={18}
              />
              Continue with Google
            </button>

            <p className="mt-4 text-[11px] text-center text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-emerald-400 hover:underline"
              >
                Log in
              </Link>
            </p>
          </>
        )}

        {/* STEP 2: OTP */}
        {step === "otp" && (
          <form
            onSubmit={handleVerifyOtp}
            className="flex flex-col gap-4 text-xs"
          >
            <p className="text-slate-300 text-center">
              We&apos;ve sent a 6-digit code to{" "}
              <span className="font-semibold">{signupEmailForOtp}</span>.
              Enter it below to verify your email.
            </p>

            <div className="flex justify-center">
              <input
                className="w-40 text-center tracking-[0.3em] px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-slate-100 text-lg outline-none"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              className="w-full py-2 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
            >
              {otpLoading ? "Verifying…" : "Verify & create account"}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={otpLoading}
              className="mt-1 w-full py-2 rounded-lg border border-[#2a3942] text-slate-200 text-sm hover:bg-[#202c33] disabled:opacity-60"
            >
              Resend code
            </button>

            <p className="mt-2 text-[11px] text-center text-slate-400">
              Wrong email?{" "}
              <button
                type="button"
                className="text-emerald-400 hover:underline"
                onClick={() => {
                  setStep("form");
                  setOtp("");
                  setError("");
                  setInfo("");
                }}
              >
                Go back & edit details
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
