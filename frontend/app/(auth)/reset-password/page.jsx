// app/(auth)/reset-password/page.jsx
export default function ResetPasswordPage() {
    return (
      <div className="max-w-md mx-auto mt-12 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset your password 🔑
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enter your email and we’ll send you reset instructions
          </p>
        </div>
  
        <form className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Registered Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
  
          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 text-black font-medium rounded-lg hover:bg-emerald-400 transition"
          >
            Send reset link
          </button>
        </form>
  
        <p className="text-xs text-slate-400 text-center">
          Back to{" "}
          <a href="/login" className="text-emerald-400 hover:underline">
            Login
          </a>
        </p>
      </div>
    );
  }