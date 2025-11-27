// components/layout/AppHeader.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AppHeader() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const linkClass = (href) =>
    `px-3 py-1.5 rounded-lg text-sm transition ${
      pathname === href
        ? "bg-emerald-500 text-black font-medium"
        : "text-slate-300 hover:text-white hover:bg-slate-800"
    }`;

  return (
    <header className="flex items-center justify-between mb-8">
      {/* Logo + Brand */}
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/chatsaathi.jpg" // your logo
          alt="Chat Saathi Logo"
          width={38}
          height={38}
          className="rounded-full object-contain"
          priority
        />
        <span className="text-xl font-semibold tracking-tight">
          Chat Saathi
        </span>
      </Link>

      {/* Right side: nav + auth status */}
      <div className="flex items-center gap-4">
        {/* Basic nav only on md+ */}
        <nav className="hidden md:flex items-center gap-2">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>
          <Link href="/chat" className={linkClass("/chat")}>
            Open App
          </Link>
        </nav>

        {/* Auth status */}
        {loading ? (
          <span className="text-xs text-slate-400">Checking...</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <Link href="/profile" className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image
                  src={user.avatarUrl || "/avatars/user1.png"}
                  alt={user.displayName}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-slate-300">
                  {user.displayName}
                </span>
                <span className="text-[10px] text-emerald-400">
                  @{user.username}
                </span>
              </div>
            </Link>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className={linkClass("/login")}>
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-medium text-sm hover:bg-emerald-400 transition"
            >
              Signup
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
