"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Clock3, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getProgressSessions, getProgressStats } from "@/lib/study-planner-api";

type Session = {
  createdAt?: string;
  timeSpent: number;
  status: "completed" | "in_progress" | "pending" | string;
};

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default function StatisticsFeature() {
  const { user } = useAuth();
  const userId = user?.id;
  const [stats, setStats] = useState({ totalMinutes: 0, totalSessions: 0, completed: 0 });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const currentUserId = userId;

    async function loadStatistics() {
      try {
        setLoading(true);
        setError(null);
        const [nextStats, nextSessions] = await Promise.all([
          getProgressStats(currentUserId),
          getProgressSessions(currentUserId),
        ]);
        setStats(nextStats);
        setSessions(nextSessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    }

    void loadStatistics();
  }, [userId]);

  const metrics = useMemo(() => {
    const totalHours = Math.round((stats.totalMinutes / 60) * 10) / 10;
    const averageMinutes = stats.totalSessions > 0 ? Math.round(stats.totalMinutes / stats.totalSessions) : 0;
    const completionRate = stats.totalSessions > 0 ? Math.round((stats.completed / stats.totalSessions) * 100) : 0;
    const weekStart = startOfWeek(new Date());
    const weeklyMinutes = sessions.reduce((sum, session) => {
      if (!session.createdAt) {
        return sum;
      }

      const sessionDate = new Date(session.createdAt);
      return sessionDate >= weekStart ? sum + session.timeSpent : sum;
    }, 0);

    return {
      totalHours,
      averageMinutes,
      completionRate,
      weeklyMinutes,
    };
  }, [sessions, stats]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Statistics</h1>
        <p className="text-sm text-gray-500 mt-1">A quick view of your study performance and momentum.</p>
      </div>

      {error ? <p className="text-sm text-red-500 mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-primary">
            <Clock3 size={18} />
            <span className="text-sm font-semibold">Total Study Hours</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{loading ? "..." : `${metrics.totalHours}h`}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-primary">
            <BarChart3 size={18} />
            <span className="text-sm font-semibold">Average Session</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{loading ? "..." : `${metrics.averageMinutes}m`}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-primary">
            <Target size={18} />
            <span className="text-sm font-semibold">Completion Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{loading ? "..." : `${metrics.completionRate}%`}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-primary">
            <TrendingUp size={18} />
            <span className="text-sm font-semibold">This Week</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{loading ? "..." : `${metrics.weeklyMinutes}m`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Study Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total sessions</span>
              <span className="font-semibold text-gray-800">{loading ? "..." : stats.totalSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Completed tasks</span>
              <span className="font-semibold text-gray-800">{loading ? "..." : stats.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Minutes studied</span>
              <span className="font-semibold text-gray-800">{loading ? "..." : stats.totalMinutes}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          {loading ? <p className="text-sm text-gray-500">Loading recent sessions...</p> : null}
          {!loading && sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No study sessions recorded yet.</p>
          ) : null}
          {!loading && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session, index) => (
                <div key={`${session.createdAt ?? "session"}-${index}`} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{session.status.replace("_", " ")}</p>
                    <p className="text-xs text-gray-500">
                      {session.createdAt ? new Date(session.createdAt).toLocaleString() : "Unknown time"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{session.timeSpent}m</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}