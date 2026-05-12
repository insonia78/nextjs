"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Flame, Bot } from "lucide-react";
import Link from "next/link";
import styles from "./styles.module.css";
import {
  formatDate,
  getStatusBadgeClass,
  getStatusLabel,
} from "./functions";
import type { TodayPlanItem } from "./models";
import {
  getAiRecommendation,
  getPlans,
  getProgressSessions,
  getProgressStats,
  submitProgress,
  type ApiPlan,
} from "@/lib/study-planner-api";
import { useAuth } from "@/lib/auth-context";

function deriveTodayPlan(plans: ApiPlan[]): TodayPlanItem[] {
  return plans
    .flatMap((plan) =>
      plan.topics.map((topic) => ({
        subject: topic.name,
        taskCount: topic.tasks.length,
        timeMinutes: topic.tasks.reduce((sum, t) => sum + (t.timeMinutes ?? 30), 0),
        status: topic.tasks.some((t) => t.status === "in_progress")
          ? ("in_progress" as const)
          : topic.tasks.length > 0 && topic.tasks.every((t) => t.status === "completed")
            ? ("completed" as const)
            : ("pending" as const),
      }))
    )
    .slice(0, 3);
}

function findFirstPendingTask(
  plans: ApiPlan[],
): { taskId: string; planId: string; topicId: string } | null {
  for (const plan of plans) {
    for (const topic of plan.topics) {
      const task = topic.tasks.find(
        (t) => t.status === "pending" || t.status === "in_progress",
      );
      if (task) return { taskId: task.id, planId: plan.id, topicId: topic.id };
    }
  }
  return null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;

  const daySet = new Set(
    dates.map((d) => {
      const date = new Date(d);
      return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
    }),
  );

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
    if (!daySet.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export default function DashboardFeature() {
  const { user } = useAuth();
  const userId = user?.id;
  const today = formatDate(new Date());
  const [todayPlan, setTodayPlan] = useState<TodayPlanItem[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recommendation, setRecommendation] = useState(
    "Connect AI service to generate personalized recommendations.",
  );
  const [stats, setStats] = useState<{ totalMinutes: number; totalSessions: number; completed: number } | null>(null);
  const [pendingTask, setPendingTask] = useState<{ taskId: string; planId: string; topicId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTaskId, setStartTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;

    async function loadDashboard() {
      try {
        setLoading(true);
        const [plans, sessions, loadedStats] = await Promise.all([
          getPlans(currentUserId),
          getProgressSessions(currentUserId),
          getProgressStats(currentUserId),
        ]);

        const computedPlan = deriveTodayPlan(plans);
        setTodayPlan(computedPlan);
        setPendingTask(findFirstPendingTask(plans));
        setStats(loadedStats);

        if (plans.length > 0) {
          const avg =
            plans.reduce((sum, p) => sum + (Number.isFinite(p.progress) ? p.progress : 0), 0) /
            plans.length;
          setOverallProgress(Math.round(avg));
        } else {
          setOverallProgress(0);
        }

        setStreak(calcStreak(sessions.map((s) => s.createdAt ?? "")));

        if (sessions.length > 0) {
          const ai = await getAiRecommendation({
            userId: currentUserId,
            recentProgress: sessions.slice(0, 5).map((s) => ({
              topic: s.topicId ?? "General",
              timeSpent: s.timeSpent,
              status: s.status,
            })),
          });
          setRecommendation(ai.message || recommendation);
        } else {
          setRecommendation(
            `You have ${loadedStats.totalSessions} session${loadedStats.totalSessions !== 1 ? "s" : ""} logged. Keep studying daily to build your streak!`,
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [userId]);

  async function handleStartStudying() {
    if (!pendingTask || !userId) return;
    try {
      setStartTaskId(pendingTask.taskId);
      await submitProgress({
        userId,
        taskId: pendingTask.taskId,
        planId: pendingTask.planId,
        topicId: pendingTask.topicId,
        status: "in_progress",
        timeSpent: 25,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start a study session");
    } finally {
      setStartTaskId(null);
    }
  }

  return (
    <div>
      {/* Greeting */}
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        {getGreeting()}, {user?.name || user?.email?.split("@")[0] || "there"}! 👋
      </h1>
      <p className="text-gray-500 text-sm mb-6">Let&apos;s achieve your goals today.</p>
      {error ? <p className="text-sm text-red-500 mb-4">{error}</p> : null}

      <div className="grid grid-cols-12 gap-5">
        {/* Today's Plan */}
        <div className="col-span-12 lg:col-span-7 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Today&apos;s Plan</h2>
            <span className="text-xs text-gray-400">{today}</span>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? <p className="text-sm text-gray-400">Loading your tasks...</p> : null}
            {!loading && todayPlan.length === 0 ? (
              <p className="text-sm text-gray-400">No tasks yet. Create a plan to get started.</p>
            ) : null}
            {todayPlan.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  {item.status === "completed" ? (
                    <CheckCircle2 size={18} className="text-primary" />
                  ) : (
                    <Circle size={18} className="text-gray-300" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.subject}</p>
                    <p className="text-xs text-gray-400">
                      {item.taskCount} tasks · {item.timeMinutes} min
                    </p>
                  </div>
                </div>
                <span className={getStatusBadgeClass(item.status)}>
                  {getStatusLabel(item.status)}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartStudying}
            disabled={loading || pendingTask === null || startTaskId !== null}
            className="mt-5 w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition disabled:opacity-50"
          >
            {startTaskId ? "Starting..." : "Start Studying"}
          </button>
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">
          {/* Overall Progress */}
          <div className="card flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none" stroke="#f0ecff" strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none" stroke="#6C47FF" strokeWidth="3"
                  strokeDasharray={`${overallProgress} ${100 - overallProgress}`}
                  strokeDashoffset="25"
                  strokeLinecap="round"
                  className={styles.progressRing}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">
                {overallProgress}%
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Overall Progress</p>
              {stats ? (
                <p className="text-xs text-gray-400 mt-0.5">
                  {stats.totalSessions} session{stats.totalSessions !== 1 ? "s" : ""} · {stats.totalMinutes} min total
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Loading stats...</p>
              )}
            </div>
          </div>

          {/* Study Streak */}
          <div className={`${styles.streakBadge} flex items-center gap-4`}>
            <Flame size={32} />
            <div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-sm opacity-80">days in a row</p>
            </div>
            <span className="ml-auto text-sm font-semibold opacity-90">Study Streak</span>
          </div>

          {/* AI Recommendation */}
          <div className={`${styles.aiCard} p-5 flex flex-col gap-3`}>
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold text-sm">AI Recommendation</span>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">
              {recommendation}
            </p>
            <Link
              href="/ai"
              className="self-start bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
