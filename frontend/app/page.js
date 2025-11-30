// app/page.jsx
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-10 mt-8">
      {/* Left side: text */}
      <div className="max-w-xl space-y-5">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Meet <span className="text-emerald-400">Chat Saathi</span>,{" "}
          <span className="block mt-1">your real-time chat partner.</span>
        </h1>

        <p className="text-slate-300 text-sm md:text-base">
          One-on-one chats, powerful groups with admins, friend requests via
          unique usernames, and secure OTP-verified accounts. Built for speed,
          privacy and control.
        </p>

        <ul className="text-xs md:text-sm text-slate-400 space-y-1">
          <li>• Real-time WebSocket messaging</li>
          <li>• Group admin controls (add/remove, promote)</li>
          <li>• Online status, typing indicator &amp; read receipts</li>
          <li>• Google, GitHub &amp; email login with OTP verification</li>
        </ul>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/chat"
            className="px-5 py-2 rounded-md bg-emerald-500 text-slate-950 font-medium text-sm hover:bg-emerald-400"
          >
            Open Chat Saathi
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 rounded-md border border-slate-700 text-slate-100 text-sm hover:bg-slate-900"
          >
            Create an account
          </Link>
        </div>

        <p className="text-[11px] text-slate-500">
          Phase 1: DMs, groups, friend requests, OTP signup, status &amp; read
          receipts.
        </p>
      </div>

      {/* Right side: mock chat preview */}
      <div className="flex-1 w-full">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl">
          {/* window controls */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>

          {/* messages */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
                <Image src="/avatars/aanchal.png" width={32} height={32} alt="Aanchal Avatar" className="w-8 h-8 rounded-full bg-slate-700" />
              <div>
                <p className="font-medium text-slate-100 text-xs">Aanchal</p>
                <p className="text-slate-300 bg-slate-800/70 rounded-2xl rounded-tl-sm px-3 py-2 inline-block">
                  Welcome to <span className="text-emerald-400">Chat Saathi</span> 👋
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 justify-end">
              <div className="text-right">
                <p className="font-medium text-slate-100 text-xs">You</p>
                <p className="text-slate-300 bg-emerald-500/90 text-slate-950 rounded-2xl rounded-tr-sm px-3 py-2 inline-block">
                  Let&apos;s build this real-time app from scratch 💻
                </p>
              </div>
              <Image src="/avatars/user1.png" width={32} height={32} alt="Your Avatar" className="w-8 h-8 rounded-full bg-slate-700" />
            </div>

            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 mt-3">
              Typing indicator, online status and read receipts coming soon…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
