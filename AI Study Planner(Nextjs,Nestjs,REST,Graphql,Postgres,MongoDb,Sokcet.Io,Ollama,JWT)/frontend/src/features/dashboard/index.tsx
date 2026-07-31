"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Flame, Bot, Clock3, PlayCircle } from "lucide-react";
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
  updatePlanTaskStatus,
  type ApiPlan,
} from "@/lib/study-planner-api";
import { useAuth } from "@/lib/auth-context";
import {
  formatTaskElapsed,
  readActiveTaskTimer,
  startTaskTimer,
  subscribeToTaskTimerUpdates,
} from "@/lib/task-timer-storage";

type ActiveTaskDetails = {
  taskId: string;
  title: string;
  planTitle: string;
  topicName: string;
  elapsedSeconds: number;
  startedAt: string | null;
};

function deriveTodayPlan(plans: ApiPlan[]): TodayPlanItem[] {
  return plans
    .map((plan) => {
      const tasks = plan.topics.flatMap((topic) => topic.tasks);
      const status = tasks.some((t) => t.status === "in_progress")
          ? ("in_progress" as const)
          : tasks.length > 0 && tasks.every((t) => t.status === "completed")
            ? ("completed" as const)
            : ("pending" as const);

      return {
        subject: plan.title,
        taskCount: tasks.length,
        timeMinutes: tasks.reduce((sum, t) => sum + (t.timeMinutes ?? 30), 0),
        status,
      };
    })
    .sort((left, right) => {
      const rank = { in_progress: 0, pending: 1, completed: 2 };
      const statusOrder = rank[left.status] - rank[right.status];
      if (statusOrder !== 0) {
        return statusOrder;
      }

      return right.taskCount - left.taskCount;
    });
}

function findFirstPendingTask(
  plans: ApiPlan[],
): { taskId: string; planId: string; topicId: string; status: "pending" | "in_progress" } | null {
  for (const plan of plans) {
    for (const topic of plan.topics) {
      const task = topic.tasks.find(
        (t) => t.status === "pending" || t.status === "in_progress",
      );
      if (task) {
        return {
          taskId: task.id,
          planId: plan.id,
          topicId: topic.id,
          status: task.status === "in_progress" ? "in_progress" : "pending",
        };
      }
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

function getLiveElapsedSeconds(elapsedSeconds: number, startedAt: string | null, now: number) {
  if (!startedAt) {
    return elapsedSeconds;
  }

  const startedAtMs = new Date(startedAt).getTime();
  const runningSeconds = Number.isFinite(startedAtMs)
    ? Math.max(0, Math.floor((now - startedAtMs) / 1000))
    : 0;

  return elapsedSeconds + runningSeconds;
}

function findActiveTaskDetails(plans: ApiPlan[], userId: string): ActiveTaskDetails | null {
  const activeTimer = readActiveTaskTimer(userId);
  if (!activeTimer) {
    return null;
  }

  for (const plan of plans) {
    for (const topic of plan.topics) {
      const task = topic.tasks.find((entry) => entry.id === activeTimer.taskId);
      if (!task) {
        continue;
      }

      return {
        taskId: task.id,
        title: task.title,
        planTitle: plan.title,
        topicName: topic.name,
        elapsedSeconds: activeTimer.snapshot.elapsedSeconds,
        startedAt: activeTimer.snapshot.startedAt,
      };
    }
  }

  return null;
}

export default function DashboardFeature() {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id;
  const today = formatDate(new Date());
  const [todayPlan, setTodayPlan] = useState<TodayPlanItem[]>([]);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recommendation, setRecommendation] = useState(
    "Connect AI service to generate personalized recommendations.",
  );
  const [stats, setStats] = useState<{ totalMinutes: number; totalSessions: number; completed: number } | null>(null);
  const [pendingTask, setPendingTask] = useState<{ taskId: string; planId: string; topicId: string; status: "pending" | "in_progress" } | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTaskId, setStartTaskId] = useState<string | null>(null);
  const [activeTimerNow, setActiveTimerNow] = useState(() => Date.now());

  const loadDashboard = useCallback(async (currentUserId: string) => {
      try {
        setLoading(true);
        setError(null);
        const [plans, sessions, loadedStats] = await Promise.all([
          getPlans(currentUserId),
          getProgressSessions(currentUserId),
          getProgressStats(currentUserId),
        ]);

        setPlans(plans);
        const computedPlan = deriveTodayPlan(plans);
        setTodayPlan(computedPlan);
        setPendingTask(findFirstPendingTask(plans));
        setActiveTask(findActiveTaskDetails(plans, currentUserId));
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

        setLoading(false);

        if (sessions.length > 0) {
          try {
            const ai = await getAiRecommendation({
              userId: currentUserId,
              recentProgress: sessions.slice(0, 5).map((s) => ({
                topic: s.topicId ?? "General",
                timeSpent: s.timeSpent,
                status: s.status,
              })),
            });
            setRecommendation(ai.message || recommendation);
          } catch {
            setRecommendation(
              "Connect AI service to generate personalized recommendations.",
            );
          }
        } else {
          setRecommendation(
            `You have ${loadedStats.totalSessions} session${loadedStats.totalSessions !== 1 ? "s" : ""} logged. Keep studying daily to build your streak!`,
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
        setLoading(false);
      } finally {
        
      }
    }, []);

  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;

    void loadDashboard(currentUserId);
  }, [loadDashboard, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToTaskTimerUpdates(userId, () => {
      setActiveTask(findActiveTaskDetails(plans, userId));
      setActiveTimerNow(Date.now());
    });
  }, [plans, userId]);

  useEffect(() => {
    if (!activeTask?.startedAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveTimerNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeTask?.startedAt]);

  const activeTaskElapsed = useMemo(() => {
    if (!activeTask) {
      return 0;
    }

    return getLiveElapsedSeconds(activeTask.elapsedSeconds, activeTask.startedAt, activeTimerNow);
  }, [activeTask, activeTimerNow]);

  async function handleStartStudying() {
    if (!pendingTask || !userId) return;
    try {
      setStartTaskId(pendingTask.taskId);
      setError(null);

      if (pendingTask.status === "pending") {
        await updatePlanTaskStatus(pendingTask.taskId, "in_progress");
      }

      startTaskTimer(userId, pendingTask.taskId);
      router.push(`/tasks?activeTask=${pendingTask.taskId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start a study session");
    } finally {
      setStartTaskId(null);
    }
  }

  return (
    <div>
      {/* Greeting */}
      <h1 className="mb-1 text-2xl font-bold text-gray-800 sm:text-3xl">
        {getGreeting()}, {user?.name || user?.email?.split("@")[0] || "there"}! 👋
      </h1>
      <p className="text-gray-500 text-sm mb-6">Let&apos;s achieve your goals today.</p>
      {error ? <p className="text-sm text-red-500 mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Today's Plan */}
        <div className="card xl:col-span-7">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
                className="flex flex-col gap-3 border-b border-gray-50 py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
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
            {startTaskId ? "Starting..." : activeTask ? "Resume Studying" : "Start Studying"}
          </button>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5 xl:col-span-5">
          {activeTask ? (
            <div className="card border border-primary/10 bg-primary/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <PlayCircle size={16} />
                    Active Study Session
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-800">{activeTask.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{activeTask.planTitle} · {activeTask.topicName}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-primary/10">
                  <p className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <Clock3 size={14} />
                    Running Time
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-primary">
                    {formatTaskElapsed(activeTaskElapsed)}
                  </p>
                </div>
              </div>
              <Link
                href={`/tasks?activeTask=${activeTask.taskId}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark"
              >
                Open active task
              </Link>
            </div>
          ) : null}

          {/* Overall Progress */}
          <div className="card flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0">
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
          <div className={`${styles.streakBadge} flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4`}>
            <Flame size={32} />
            <div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-sm opacity-80">days in a row</p>
            </div>
            <span className="text-sm font-semibold opacity-90 sm:ml-auto">Study Streak</span>
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
