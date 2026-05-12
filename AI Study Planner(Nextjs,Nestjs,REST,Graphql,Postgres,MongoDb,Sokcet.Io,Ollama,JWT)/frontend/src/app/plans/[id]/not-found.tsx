import { Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PlanNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="text-gray-600" size={32} />
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Plan Not Found</h2>
        <p className="text-gray-600 mb-8">
          The study plan you're looking for doesn't exist or has been deleted.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Link
            href="/plans"
            className="flex items-center justify-center gap-2 flex-1 bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-dark transition"
          >
            <ArrowLeft size={16} />
            Back to Plans
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
