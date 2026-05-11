"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-600" size={32} />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Error</h1>
        <p className="text-gray-600 mb-4">
          We encountered an issue loading your dashboard. Please try again.
        </p>

        {error.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-sm text-red-600 text-left">
            <p className="font-semibold mb-1">Details:</p>
            <p className="break-words">{error.message}</p>
          </div>
        )}

        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-dark transition mb-3"
        >
          <RotateCw size={16} />
          Try Again
        </button>
        <Link
          href="/plans"
          className="block bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
        >
          Go to Plans
        </Link>
      </div>
    </div>
  );
}
