"use client";

import { useState, useRef } from "react";
import { apiRequest } from "@/lib/apiClient";
import { connectSocket } from "@/lib/socketClient";

export default function MessageInput({ conversationId }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef(null);

  function emitTyping(isTyping) {
    const s = connectSocket();
    if (!s || !conversationId) return;
    s.emit(isTyping ? "typing:start" : "typing:stop", { conversationId });
  }

  function handleChange(e) {
    const value = e.target.value;
    setMessage(value);

    emitTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 2000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;

    const text = message.trim();
    setMessage("");
    setSending(true);
    emitTyping(false);

    try {
      const s = connectSocket();
      if (s && s.connected) {
        s.emit("message:new", { conversationId, text });
      } else {
        await apiRequest("/api/messages/send", {
          method: "POST",
          body: JSON.stringify({ conversationId, text }),
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 px-3 py-3 bg-[#202c33]"
    >
      <button type="button" className="text-xl text-slate-300">
        😊
      </button>

      <input
        type="text"
        placeholder="Type a message"
        className="flex-1 bg-[#2a3942] px-4 py-2 rounded-full text-sm text-white outline-none"
        value={message}
        onChange={handleChange}
      />

      <button
        className="text-xl text-slate-300 disabled:opacity-40"
        type="submit"
        disabled={sending}
      >
        ➤
      </button>
    </form>
  );
}
