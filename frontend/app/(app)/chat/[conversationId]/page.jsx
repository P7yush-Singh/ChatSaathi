// app/(app)/chat/[conversationId]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { connectSocket } from "@/lib/socketClient";

function formatTime(dateString) {
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ConversationPage() {
  const { conversationId } = useParams();
  const convoId = conversationId?.toString();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // header info: name + avatar + type + dm other user id
  const [header, setHeader] = useState({
    title: "",
    avatar: "/avatars/user1.png",
    type: "dm",
    otherUserId: null,
    isAdmin: false,
  });

  const [isTyping, setIsTyping] = useState(false);
  const [presence, setPresence] = useState({
    online: false,
    lastSeen: null,
  });

  // 1) Load conversation meta (so header shows username / group name)
  useEffect(() => {
    async function loadConversationMeta() {
      if (!convoId || !user) return;

      try {
        const convo = await apiRequest(`/api/conversations/${convoId}`);

        if (convo.type === "dm") {
          const other =
            convo.members.find(
              (m) =>
                m._id !== user.id &&
                m._id !== user._id &&
                m.username !== user.username
            ) || convo.members[0];

          const title =
            other?.displayName ||
            (other?.username ? `@${other.username}` : "Direct message");

          setHeader({
            title,
            avatar: other?.avatarUrl || "/avatars/user1.png",
            type: "dm",
            otherUserId: other?._id?.toString() || null,
            isAdmin: false,
          });
        } else {
          const adminIds = (convo.admins || []).map((a) =>
            a.toString ? a.toString() : a
          );
          const isAdminHere =
            user &&
            adminIds.some(
              (id) => id === user.id || id === user._id
            );

          setHeader({
            title: convo.name || "Group",
            avatar: "/avatars/group.png",
            type: "group",
            otherUserId: null,
            isAdmin: isAdminHere,
          });
        }
      } catch (err) {
        console.error("Load conversation meta error:", err);
        setHeader((prev) => ({
          ...prev,
          title: "Chat",
          avatar: "/avatars/user1.png",
        }));
      }
    }

    loadConversationMeta();
  }, [convoId, user]);

  // 2) Load initial messages
  useEffect(() => {
    async function loadMessages() {
      if (!convoId) return;

      try {
        setLoading(true);
        const data = await apiRequest(`/api/conversations/${convoId}/messages`);

        const formatted = data.map((m) => {
          const created = m.createdAt || new Date().toISOString();

          const senderId =
            typeof m.sender === "string"
              ? m.sender
              : m.sender?._id?.toString();

          const fromMe =
            user && (senderId === user.id || senderId === user._id);

          const readCount = Array.isArray(m.readBy) ? m.readBy.length : 0;
          const status = fromMe
            ? readCount > 1
              ? "read"
              : "sent"
            : "sent";

          return {
            ...m,
            text: m.text,
            fromMe,
            time: formatTime(created),
            dateLabel: formatDateLabel(created),
            status,
          };
        });

        setMessages(formatted);
      } catch (err) {
        console.error("Load messages error:", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [convoId, user]);

  // 3) Mark conversation as read when messages are loaded
  useEffect(() => {
    async function markRead() {
      if (!convoId || messages.length === 0) return;

      try {
        await apiRequest(`/api/read/conversation/${convoId}`, {
          method: "POST",
        });
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }

    if (!loading) {
      markRead();
    }
  }, [loading, messages.length, convoId]);

  // 4) Socket: join room + listen for realtime events
  useEffect(() => {
    if (!convoId) return;

    const socket = connectSocket();
    if (!socket) return;

    socket.emit("conversation:join", convoId);

    function handleNewMessage(m) {
      const cId =
        typeof m.conversation === "string"
          ? m.conversation
          : m.conversation?._id?.toString();
      if (cId !== convoId) return;

      const senderId =
        typeof m.sender === "string"
          ? m.sender
          : m.sender?._id?.toString();

      const created = m.createdAt || new Date().toISOString();
      const fromMe =
        user && (senderId === user.id || senderId === user._id);

      const readCount = Array.isArray(m.readBy) ? m.readBy.length : 0;
      const status = fromMe
        ? readCount > 1
          ? "read"
          : "sent"
        : "sent";

      const uiMsg = {
        ...m,
        text: m.text,
        fromMe,
        time: formatTime(created),
        dateLabel: formatDateLabel(created),
        status,
      };

      setMessages((prev) => [...prev, uiMsg]);
    }

    function handleTypingStart({ conversationId, userId: uid }) {
      if (conversationId !== convoId) return;
      if (user && (uid === user.id || uid === user._id)) return;
      setIsTyping(true);
    }

    function handleTypingStop({ conversationId, userId: uid }) {
      if (conversationId !== convoId) return;
      if (user && (uid === user.id || uid === user._id)) return;
      setIsTyping(false);
    }

    function handleRead({ conversationId, userId: uid }) {
      if (conversationId !== convoId) return;
      // If OTHER user read, mark my messages as read
      if (!user || uid === user.id || uid === user._id) return;

      console.log("conversation:read received for convo", conversationId);

      setMessages((prev) =>
        prev.map((m) =>
          m.fromMe ? { ...m, status: "read" } : m
        )
      );
    }

    function handlePresence({ userId: uid, online, lastSeen }) {
      // For DM, only track presence of the OTHER user
      if (
        header.type === "dm" &&
        header.otherUserId &&
        uid === header.otherUserId
      ) {
        setPresence({ online, lastSeen });
      }
    }

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("conversation:read", handleRead);
    socket.on("user:presence", handlePresence);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("conversation:read", handleRead);
      socket.off("user:presence", handlePresence);
    };
  }, [convoId, user, header.type, header.otherUserId]);

  if (!convoId) return null;

  const presenceText =
    header.type === "dm"
      ? presence.online
        ? "online"
        : presence.lastSeen
        ? `last seen at ${formatTime(presence.lastSeen)}`
        : "last seen recently"
      : "group";

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: "#0b141a",
        backgroundImage:
          "url('https://www.transparenttextures.com/patterns/cubes.png')",
      }}
    >
      {/* HEADER */}
      <div className="h-[60px] px-3 md:px-4 flex items-center justify-between bg-[#202c33] border-b border-[#2a3942]">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="md:hidden text-xl text-slate-100 mr-1">
            ←
          </Link>

          <div className="relative w-10 h-10">
            <Image
              src={header.avatar || "/avatars/user1.png"}
              alt={header.title || "Chat"}
              fill
              className="rounded-full object-cover"
            />
            {header.type === "dm" && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#202c33] ${
                  presence.online ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-medium text-white truncate">
              {header.title || "Chat"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {presenceText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-300 text-lg">
          {/* later we'll add group settings button when header.type === 'group' && header.isAdmin */}
          <button className="hidden md:block">🔍</button>
          <button>⋮</button>
        </div>
      </div>

      {/* MESSAGES */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400">Loading messages…</p>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 pb-1 text-[11px] text-emerald-300">
          typing…
        </div>
      )}

      {/* INPUT */}
      <MessageInput conversationId={convoId} />
    </div>
  );
}
