"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800">Sign in to Study Planner</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">Use your Auth Service credentials.</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
