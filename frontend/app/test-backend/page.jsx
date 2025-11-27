// app/test-backend/page.jsx
"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";

export default function TestBackendPage() {
  const [status, setStatus] = useState("Checking...");
  const [error, setError] = useState("");

  useEffect(() => {
    async function check() {
      try {
        const res = await apiRequest("/");
        setStatus(JSON.stringify(res));
      } catch (err) {
        setError(err.message);
      }
    }
    check();
  }, []);

  return (
    <div className="mt-10 space-y-3">
      <h1 className="text-xl font-semibold">Backend Test</h1>
      <p className="text-sm text-slate-300">
        GET <code className="bg-slate-900 px-1 rounded">/</code> from backend
      </p>
      {error ? (
        <p className="text-red-400 text-sm">Error: {error}</p>
      ) : (
        <pre className="bg-slate-900 text-xs p-3 rounded-lg">
          {status}
        </pre>
      )}
    </div>
  );
}
