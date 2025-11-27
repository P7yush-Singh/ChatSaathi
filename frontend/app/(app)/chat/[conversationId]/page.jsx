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

  // header/meta
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

  // group UI state
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [addMembersInput, setAddMembersInput] = useState("");
  const [groupSaving, setGroupSaving] = useState(false);

  // ---------- 1) Load conversation meta (name, type, admins) ----------
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
          // admins might be populated docs OR plain ids
          const adminIds = (convo.admins || []).map((a) => {
            if (a && a._id) return a._id.toString();
            return a.toString();
          });

          const myId = user.id || user._id;
          const isAdminHere = adminIds.includes(myId.toString());

          setHeader({
            title: convo.name || "Group",
            avatar: "/avatars/group.png",
            type: "group",
            otherUserId: null,
            isAdmin: isAdminHere,
          });

          setGroupNameInput(convo.name || "");
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

  // ---------- 2) Load initial messages ----------
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

  // ---------- 3) Mark conversation as read ----------
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

  // ---------- 4) Socket: realtime + presence ----------
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
      if (!user || uid === user.id || uid === user._id) return;

      console.log("conversation:read received for convo", conversationId);

      setMessages((prev) =>
        prev.map((m) =>
          m.fromMe ? { ...m, status: "read" } : m
        )
      );
    }

    function handlePresence({ userId: uid, online, lastSeen }) {
      if (
        header.type === "dm" &&
        header.otherUserId &&
        uid === header.otherUserId
      ) {
        setPresence({ online, lastSeen });
      }
    }

    function handlePresenceState({ userId: uid, online, lastSeen }) {
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
    socket.on("presence:state", handlePresenceState);

    if (header.type === "dm" && header.otherUserId) {
      socket.emit("presence:check", { userId: header.otherUserId });
    }

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("conversation:read", handleRead);
      socket.off("user:presence", handlePresence);
      socket.off("presence:state", handlePresenceState);
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

  // ---------- GROUP ADMIN ACTIONS ---------- //

  async function handleRenameGroup() {
    if (header.type !== "group" || !header.isAdmin) return;
    if (!groupNameInput.trim()) return;

    try {
      setGroupSaving(true);
      const updated = await apiRequest(
        `/api/conversations/${convoId}/group-name`,
        {
          method: "PATCH",
          body: JSON.stringify({ name: groupNameInput.trim() }),
        }
      );
      setHeader((prev) => ({
        ...prev,
        title: updated.name || groupNameInput.trim(),
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setGroupSaving(false);
    }
  }

  async function handleAddMembers() {
    if (header.type !== "group" || !header.isAdmin) return;

    const usernames = addMembersInput
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    if (!usernames.length) return;

    try {
      setGroupSaving(true);
      await apiRequest(`/api/conversations/${convoId}/members/add`, {
        method: "POST",
        body: JSON.stringify({ usernames }),
      });
      setAddMembersInput("");
      alert("Members added");
    } catch (err) {
      alert(err.message);
    } finally {
      setGroupSaving(false);
    }
  }

  async function handleRemoveMember() {
    if (header.type !== "group" || !header.isAdmin) return;
    const username = prompt("Username to remove (without @):");
    if (!username) return;

    try {
      await apiRequest(`/api/conversations/${convoId}/members/remove`, {
        method: "POST",
        body: JSON.stringify({ username }),
      });
      alert("Member removed");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleMakeAdmin() {
    if (header.type !== "group" || !header.isAdmin) return;
    const username = prompt("Username to make admin (without @):");
    if (!username) return;

    try {
      await apiRequest(`/api/conversations/${convoId}/admins/add`, {
        method: "POST",
        body: JSON.stringify({ username }),
      });
      alert("User is now admin");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoveAdmin() {
    if (header.type !== "group" || !header.isAdmin) return;
    const username = prompt("Username to remove admin (without @):");
    if (!username) return;

    try {
      await apiRequest(`/api/conversations/${convoId}/admins/remove`, {
        method: "POST",
        body: JSON.stringify({ username }),
      });
      alert("Admin role removed");
    } catch (err) {
      alert(err.message);
    }
  }

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

        <div className="relative flex items-center gap-2 text-slate-300 text-lg">
          <button className="hidden md:block">🔍</button>

          <button
            onClick={() => {
              setGroupMenuOpen((v) => !v);
            }}
            className="px-1"
          >
            ⋮
          </button>

          {header.type === "group" && header.isAdmin && groupMenuOpen && (
            <div className="absolute right-0 top-8 w-48 bg-[#202c33] border border-[#2a3942] rounded-xl shadow-xl text-xs z-40">
              <button
                type="button"
                onClick={() => {
                  setGroupPanelOpen(true);
                  setGroupMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 hover:bg-[#2a3942] text-slate-100"
              >
                Group settings
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                className="block w-full text-left px-3 py-2 hover:bg-[#2a3942] text-red-300"
              >
                Remove member
              </button>
              <button
                type="button"
                onClick={handleMakeAdmin}
                className="block w-full text-left px-3 py-2 hover:bg-[#2a3942] text-slate-100"
              >
                Make admin
              </button>
              <button
                type="button"
                onClick={handleRemoveAdmin}
                className="block w-full text-left px-3 py-2 hover:bg-[#2a3942] text-red-300"
              >
                Remove admin
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NICE GROUP SETTINGS PANEL (rename + add members) */}
      {header.type === "group" && header.isAdmin && groupPanelOpen && (
        <div className="border-b border-[#2a3942] bg-[#111b21] px-4 py-3 text-xs text-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[11px] uppercase tracking-wide text-slate-300">
              Group settings
            </span>
            <button
              className="text-[11px] text-slate-400 hover:text-slate-200"
              onClick={() => setGroupPanelOpen(false)}
            >
              Close ✕
            </button>
          </div>

          {/* Rename */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">
              Group name
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-1 rounded-lg bg-[#202c33] text-xs text-slate-100 outline-none border border-[#2a3942]"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                placeholder="Enter group name"
              />
              <button
                onClick={handleRenameGroup}
                disabled={groupSaving}
                className="px-3 py-1 rounded-lg bg-emerald-500 text-black text-[11px] font-semibold hover:bg-emerald-400 disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>

          {/* Add members */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">
              Add members (comma separated usernames, without @)
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-1 rounded-lg bg-[#202c33] text-xs text-slate-100 outline-none border border-[#2a3942]"
                value={addMembersInput}
                onChange={(e) => setAddMembersInput(e.target.value)}
                placeholder="punit, rahul, someone"
              />
              <button
                onClick={handleAddMembers}
                disabled={groupSaving}
                className="px-3 py-1 rounded-lg bg-sky-500 text-black text-[11px] font-semibold hover:bg-sky-400 disabled:opacity-60"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

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
