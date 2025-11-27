// app/(auth)/verify-otp/page.jsx
export default function VerifyOtpPage() {
    return (
      <div className="max-w-md mx-auto mt-12 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Verify your email 🔐
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enter the 6-digit code sent to your email
          </p>
        </div>
  
        <form className="space-y-4">
          <input
            type="text"
            maxLength={6}
            placeholder="• • • • • •"
            className="w-full text-center tracking-[0.5em] text-lg rounded-lg bg-slate-900 border border-slate-700 px-3 py-3 outline-none focus:ring-1 focus:ring-emerald-500"
          />
  
          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 text-black font-medium rounded-lg hover:bg-emerald-400 transition"
          >
            Verify & Continue
          </button>
        </form>
  
        <p className="text-xs text-slate-400 text-center">
          Didn&apos;t get code?{" "}
          <button className="text-emerald-400 hover:underline">
            Resend OTP
          </button>
        </p>
      </div>
    );
  }
  