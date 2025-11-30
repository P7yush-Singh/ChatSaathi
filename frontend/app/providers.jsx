// app/providers.jsx
"use client";

let AuthProvider = ({ children }) => children;

// try to load your AuthProvider if present
// (this avoids crashing if you don't have it)
try {
  // eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires
  const maybe = require("@/hooks/useAuth");
  if (maybe && maybe.AuthProvider) AuthProvider = maybe.AuthProvider;
  if (maybe && typeof maybe.default === "function") AuthProvider = maybe.default;
} catch (e) {
  // no-op if hook isn't present
  // console.log("No AuthProvider found, using passthrough");
}

export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
