// app/(app)/chat/layout.jsx
"use client";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ProtectedClient from "@/components/auth/ProtectedClient";

export default function ChatLayout({ children }) {
  return (
    <ProtectedClient>
      <div className="h-[calc(100vh-80px)]">
        {/* Desktop / Tablet */}
        <div className="hidden md:flex items-center justify-center h-full">
          <div className="w-full max-w-6xl h-full rounded-2xl bg-white/5 border border-white/10 shadow-2xl overflow-hidden flex backdrop-blur-xl">
            {/* LEFT – sidebar */}
            <div className="w-[340px] border-r border-white/10 bg-gradient-to-b from-[#111b21] to-[#0a141a]">
              <ChatSidebar />
            </div>

            {/* RIGHT – chat area */}
            <div
              className="flex-1 flex flex-col relative"
              style={{
                backgroundColor: "#0b141a",
                backgroundImage:
                  "url('https://www.transparenttextures.com/patterns/cubes.png')",
              }}
            >
              {children}
            </div>
          </div>
        </div>

        {/* Mobile – children decide what to show */}
        <div className="md:hidden h-full">{children}</div>
      </div>
    </ProtectedClient>
  );
}
