// components/chat/MessageList.jsx
"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

function DateSeparator({ label }) {
  return (
    <div className="flex justify-center my-3">
      <span className="px-3 py-1 rounded-full bg-black/30 text-[11px] text-slate-200 border border-white/10 backdrop-blur">
        {label}
      </span>
    </div>
  );
}

export default function MessageList({ messages }) {
  const scrollRef = useRef(null);
  let lastDateLabel = null;

  // 🚀 Auto scroll to bottom whenever messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-3"
    >
      {messages.length === 0 && (
        <p className="text-xs text-slate-400 text-center mt-4">
          No messages yet. Say hi 👋
        </p>
      )}

      {messages.map((msg) => {
        const showDate = msg.dateLabel && msg.dateLabel !== lastDateLabel;
        if (showDate) lastDateLabel = msg.dateLabel;

        return (
          <div key={msg._id || msg.id}>
            {showDate && <DateSeparator label={msg.dateLabel} />}
            <MessageBubble
              fromMe={msg.fromMe}
              text={msg.text}
              time={msg.time}
              status={msg.status || "sent"}
            />
          </div>
        );
      })}
    </div>
  );
}
