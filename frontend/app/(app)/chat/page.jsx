// app/(app)/chat/page.jsx
"use client";

import ChatSidebar from "@/components/chat/ChatSidebar";
import { useAuth } from "@/hooks/useAuth";

export default function ChatHomePage() {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile: full-screen chat list */}
      <div className="md:hidden h-full bg-[#111b21]">
        <ChatSidebar />
      </div>

      {/* Desktop: welcome text in right-hand panel (sidebar comes from layout) */}
      <div className="hidden md:flex flex-1 items-center justify-center flex-col text-center px-4">
        <h2 className="text-xl font-semibold mb-2">
          Welcome{user ? `, ${user.displayName}` : ""} 👋
        </h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Select a chat from the left or start a new one. Your conversations
          will appear here.
        </p>
      </div>
    </>
  );
}
