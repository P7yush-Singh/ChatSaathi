// lib/socketClient.js
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (typeof window === "undefined") return null;

  if (!socket) {
    const URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

    socket = io(URL, {
      autoConnect: false,
    });
  }

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s) return null;

  if (!s.connected) {
    const token = localStorage.getItem("cs_token");
    s.auth = { token };
    s.connect();
  }

  return s;
}
