// components/chat/ChatSidebar.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { connectSocket } from "@/lib/socketClient";

function formatTimeLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({}); // { [conversationId]: number }

  // search state
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]); // messages

  // small dropdown for New button
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  async function loadConversations() {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest("/api/conversations");
      setConversations(data);

      const s = connectSocket();
      if (s) {
        data.forEach((c) => {
          s.emit("conversation:join", c._id);
        });
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  // socket: unread counts
  useEffect(() => {
    const s = connectSocket();
    if (!s) return;

    function handleNewMessage(msg) {
      const convoId =
        typeof msg.conversation === "string"
          ? msg.conversation
          : msg.conversation?._id?.toString();

      const senderId =
        typeof msg.sender === "string"
          ? msg.sender
          : msg.sender?._id?.toString();

      if (!convoId || !user) return;
      if (senderId === user.id || senderId === user._id) return;

      const currentPath = `/chat/${convoId}`;
      if (pathname === currentPath) return;

      setUnreadCounts((prev) => {
        const current = prev[convoId] || 0;
        return { ...prev, [convoId]: current + 1 };
      });
    }

    s.on("message:new", handleNewMessage);
    return () => {
      s.off("message:new", handleNewMessage);
    };
  }, [user, pathname]);

  // ---------- NEW CHAT / GROUP CREATION ---------- //

  // Direct message via username
  async function handleNewDM() {
    const username = prompt("Enter username to start chat (without @):");
    if (!username) return;

    try {
      const convo = await apiRequest("/api/conversations/dm-by-username", {
        method: "POST",
        body: JSON.stringify({ username }),
      });

      await loadConversations();
      setNewMenuOpen(false);
      router.push(`/chat/${convo._id}`);
    } catch (err) {
      alert(err.message);
    }
  }

  // New group via group name + usernames
  async function handleNewGroup() {
    const name = prompt("Enter group name:");
    if (!name) return;

    const usernamesStr = prompt(
      "Enter usernames to add (comma separated, without @):"
    );
    const usernames =
      usernamesStr
        ?.split(",")
        .map((u) => u.trim())
        .filter(Boolean) || [];

    try {
      const convo = await apiRequest("/api/conversations/group", {
        method: "POST",
        body: JSON.stringify({ name, usernames }),
      });

      await loadConversations();
      setNewMenuOpen(false);
      router.push(`/chat/${convo._id}`);
    } catch (err) {
      alert(err.message);
    }
  }

  // open conversation: clear unread
  function handleOpenConversation(id) {
    setUnreadCounts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  // ---------- SEARCH ---------- //

  async function handleSearch(e) {
    e.preventDefault();
    const q = searchText.trim();
    setSearchResults([]);

    if (!q) return;

    // @username → DM
    if (q.startsWith("@")) {
      const username = q.slice(1);
      if (!username) return;

      try {
        const convo = await apiRequest("/api/conversations/dm-by-username", {
          method: "POST",
          body: JSON.stringify({ username }),
        });

        await loadConversations();
        setSearchText("");
        router.push(`/chat/${convo._id}`);
      } catch (err) {
        alert(err.message);
      }
      return;
    }

    // normal text → message search
    try {
      const results = await apiRequest(
        `/api/search/messages?q=${encodeURIComponent(q)}`
      );
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* top bar */}
      <div className="px-4 py-3 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between relative">
        <h3 className="text-white font-semibold text-sm">Chats</h3>

        <div className="relative">
          <button
            className="text-xs px-2 py-1 rounded-md bg-[#111b21] border border-[#2a3942] text-slate-200 hover:bg-[#1f2c33]"
            onClick={() => setNewMenuOpen((v) => !v)}
          >
            New
          </button>

          {newMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-[#202c33] border border-[#2a3942] rounded-xl shadow-xl z-30 text-xs text-slate-100">
              <button
                type="button"
                onClick={handleNewDM}
                className="block w-full text-left px-3 py-2 hover:bg-[#2a3942]"
              >
                New direct chat
              </button>
              <button
                type="button"
                onClick={handleNewGroup}
                className="block w-full text-left px-3 py-2 hover:bg-[#2a3942]"
              >
                New group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* search */}
      <form onSubmit={handleSearch} className="p-3 bg-[#111b21] relative">
        <input
          placeholder="Search messages or @username"
          className="w-full px-4 py-2 rounded-full bg-[#202c33] text-sm text-slate-200 outline-none"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        {searchResults.length > 0 && (
          <div className="absolute left-3 right-3 mt-2 max-h-64 overflow-y-auto bg-[#202c33] border border-[#2a3942] rounded-xl shadow-xl z-20">
            {searchResults.map((msg) => {
              const convoId =
                typeof msg.conversation === "string"
                  ? msg.conversation
                  : msg.conversation?._id;
              const convoName = msg.conversation?.name || "Chat";

              const preview =
                msg.text.length > 40
                  ? msg.text.slice(0, 40) + "…"
                  : msg.text;

              return (
                <button
                  key={msg._id}
                  type="button"
                  onClick={() => {
                    setSearchResults([]);
                    setSearchText("");
                    router.push(`/chat/${convoId}`);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#2a3942] text-xs text-slate-100"
                >
                  <div className="font-medium text-[11px] text-emerald-300">
                    {convoName}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {preview}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </form>

      {/* list */}
      <div className="flex-1 overflow-y-auto bg-[#111b21]">
        {loading && (
          <p className="text-xs text-slate-400 px-4 py-2">Loading chats…</p>
        )}
        {error && (
          <p className="text-xs text-red-400 px-4 py-2">
            Failed to load chats: {error}
          </p>
        )}
        {!loading && !error && conversations.length === 0 && (
          <p className="text-xs text-slate-400 px-4 py-2">
            No conversations yet. Click &quot;New&quot; to start a chat.
          </p>
        )}

        {conversations.map((convo) => {
          const href = `/chat/${convo._id}`;
          const isActive = pathname === href;
          const unread = unreadCounts[convo._id] || 0;

          let title = convo.name || "Group";
          let avatar = "/avatars/group.png";

          if (convo.type === "dm" && user && convo.members?.length) {
            const other =
              convo.members.find(
                (m) =>
                  m._id !== user.id &&
                  m._id !== user._id &&
                  m.username !== user.username
              ) || convo.members[0];

            if (other) {
              title = other.displayName || other.username;
              avatar = other.avatarUrl || "/avatars/user1.png";
            }
          }

          const timeLabel = formatTimeLabel(
            convo.lastMessageAt || convo.updatedAt
          );

          return (
            <Link
              key={convo._id}
              href={href}
              onClick={() => handleOpenConversation(convo._id)}
              className={`flex gap-3 px-4 py-3 items-center border-b border-[#1f2c33] transition ${
                isActive ? "bg-[#2a3942]" : "hover:bg-[#202c33]"
              }`}
            >
              <div className="w-12 h-12 relative">
                <Image
                  src={avatar}
                  alt={title}
                  fill
                  className="rounded-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {title}
                  </p>

                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-[10px] font-semibold text-black flex items-center justify-center shadow-sm">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {timeLabel}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 truncate">
                  {convo.type === "group"
                    ? `${convo.members?.length || 0} members`
                    : "Direct message"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
