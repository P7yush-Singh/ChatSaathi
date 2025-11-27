// app/(app)/profile/page.jsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";

function formatNextChange(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth(); // assuming you have refreshUser or can re-fetch /me
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  const [usernameMessage, setUsernameMessage] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest("/api/profile/me");
        setProfile(data);
        setDisplayName(data.displayName || "");
        setUsername(data.username || "");
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveProfile() {
    try {
      setSaving(true);
      await apiRequest("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName }),
      });

      // username change handled separately
      setProfile((prev) => ({ ...prev, displayName }));
      if (refreshUser) refreshUser();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveUsername() {
    try {
      setUsernameError("");
      setUsernameMessage("");
      if (!username.trim()) {
        setUsernameError("Username cannot be empty.");
        return;
      }

      const res = await apiRequest("/api/profile/username", {
        method: "PATCH",
        body: JSON.stringify({ username }),
      });

      setUsername(res.username);
      setProfile((prev) => ({
        ...prev,
        username: res.username,
        usernameLastChanged: res.usernameLastChanged,
      }));

      setUsernameMessage("Username updated successfully ✅");
      if (refreshUser) refreshUser();
    } catch (err) {
      setUsernameError(err.message || "Failed to update username");
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  // ✅ FIXED: read the real JWT token from localStorage and send it
  async function handleUploadAvatar(e) {
    e.preventDefault();
    if (!avatarFile) {
      alert("Please choose a file first.");
      return;
    }

    try {
      setAvatarSaving(true);
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      // IMPORTANT:
      // Use the SAME key you already use for login/socket/api.
      // I'm using "chat_saathi_token" — if your key is different, change it here.
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("chat_saathi_token")
          : null;

      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
        }/api/profile/avatar`,
        {
          method: "POST",
          credentials: "include",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      setProfile(data);
      setAvatarPreview(null);
      setAvatarFile(null);
      if (refreshUser) refreshUser();
    } catch (err) {
      alert(err.message);
    } finally {
      setAvatarSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0b141a]">
        <p className="text-slate-300 text-sm">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0b141a]">
        <p className="text-red-400 text-sm">Failed to load profile.</p>
      </div>
    );
  }

  const avatarSrc = avatarPreview || profile.avatarUrl || "/avatars/user1.png";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0b141a] flex justify-center py-8 px-4">
      <div className="w-full max-w-3xl bg-[#111b21] border border-[#202c33] rounded-2xl shadow-xl p-6 md:p-8 text-slate-100 flex flex-col gap-6">
        <h1 className="text-xl md:text-2xl font-semibold mb-2">
          Profile
        </h1>

        {/* TOP: avatar + email */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-24 h-24 md:w-32 md:h-32">
              <Image
                src={avatarSrc}
                alt="Profile avatar"
                fill
                className="rounded-full object-cover border border-[#202c33]"
              />
            </div>

            <form
              onSubmit={handleUploadAvatar}
              className="flex flex-col items-center gap-2 text-xs"
            >
              <label className="px-3 py-1 rounded-full bg-[#202c33] text-slate-200 cursor-pointer text-[11px]">
                Change photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              {avatarFile && (
                <button
                  type="submit"
                  disabled={avatarSaving}
                  className="px-3 py-1 rounded-full bg-emerald-500 text-black text-[11px] font-semibold hover:bg-emerald-400 disabled:opacity-60"
                >
                  {avatarSaving ? "Uploading…" : "Save photo"}
                </button>
              )}
            </form>
          </div>

          <div className="flex-1 text-xs md:text-sm">
            <p className="text-slate-400 mb-1">Email</p>
            <p className="text-slate-100 font-medium break-all">
              {profile.email}
            </p>
          </div>
        </div>

        {/* DISPLAY NAME */}
        <div className="border-t border-[#202c33] pt-4">
          <h2 className="text-sm font-semibold mb-3 text-slate-200">
            Display name
          </h2>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              className="flex-1 px-3 py-2 rounded-lg bg-[#202c33] text-sm text-slate-100 outline-none border border-[#2a3942]"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name that everyone sees"
            />
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* USERNAME */}
        <div className="border-t border-[#202c33] pt-4">
          <h2 className="text-sm font-semibold mb-2 text-slate-200">
            Username
          </h2>
        <p className="text-[11px] text-slate-400 mb-2">
            Your unique username is used for search and friend requests.
            You can change it once every 14 days.
          </p>

          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 flex items-center gap-1">
              <span className="text-slate-400 text-sm">@</span>
              <input
                className="flex-1 px-3 py-2 rounded-lg bg-[#202c33] text-sm text-slate-100 outline-none border border-[#2a3942]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </div>
            <button
              onClick={handleSaveUsername}
              className="px-4 py-2 rounded-lg bg-sky-500 text-black text-sm font-semibold hover:bg-sky-400 disabled:opacity-60"
            >
              Save username
            </button>
          </div>

          {usernameError && (
            <p className="text-[11px] text-red-400 mt-1">
              {usernameError}
            </p>
          )}
          {usernameMessage && (
            <p className="text-[11px] text-emerald-400 mt-1">
              {usernameMessage}
            </p>
          )}

          {profile.usernameLastChanged && (
            <p className="text-[11px] text-slate-500 mt-2">
              Last changed:{" "}
              {new Date(profile.usernameLastChanged).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
