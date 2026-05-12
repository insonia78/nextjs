"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getProgressSessions, getProgressStats } from "@/lib/study-planner-api";
import { useAuth } from "@/lib/auth-context";
import { useProgressSocket, type ProgressSession } from "@/lib/use-progress-socket";

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function ProgressFeature() {
  const { user } = useAuth();
  const userId = user?.id;
  const [stats, setStats] = useState({ totalMinutes: 0, totalSessions: 0, completed: 0 });
  const [sessions, setSessions] = useState<Array<{ createdAt?: string; timeSpent: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;

    async function loadProgress() {
      try {
        setLoading(true);
        const [statsRes, sessionsRes] = await Promise.all([
          getProgressStats(currentUserId),
          getProgressSessions(currentUserId),
        ]);
        setStats(statsRes);
        setSessions(sessionsRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load progress");
      } finally {
        setLoading(false);
      }
    }

    void loadProgress();
  }, [userId]);

  const weeklyData = useMemo(() => {    const today = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    return days.map((d) => {
      const key = d.toISOString().slice(0, 10);
      const minutes = sessions
        .filter((s) => (s.createdAt ? s.createdAt.slice(0, 10) === key : false))
        .reduce((sum, s) => sum + s.timeSpent, 0);

      return { day: dayLabel(d), minutes };
    });
  }, [sessions]);

  const studyHours = `${Math.round((stats.totalMinutes / 60) * 10) / 10}h`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Progress</h1>
      {error ? <p className="text-sm text-red-500 mb-4">{error}</p> : null}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        {[
          { label: "Total Study Hours", value: studyHours },
          { label: "Tasks Completed", value: String(stats.completed) },
          { label: "Total Sessions", value: String(stats.totalSessions) },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-3xl font-bold text-primary">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Weekly Study Minutes</h2>
        {loading ? <p className="text-sm text-gray-400 mb-4">Loading chart...</p> : null}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="minutes" fill="#6C47FF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
