"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Circle, Clock, ArrowRight, PlayCircle } from "lucide-react";
import TaskCompletionTimer from "@/components/TaskCompletionTimer";
import { useAuth } from "@/lib/auth-context";
import { getPlans, type ApiPlan, updatePlanTaskStatus } from "@/lib/study-planner-api";
import { readActiveTaskTimer, subscribeToTaskTimerUpdates } from "@/lib/task-timer-storage";

type TaskRow = {
  planId: string;
  planTitle: string;
  topicId: string;
  topicName: string;
  taskId: string;
  title: string;
  timeMinutes: number;
  status: "completed" | "in_progress" | "pending" | string;
  deadline?: string | null;
};

const TASK_STATUS_RANK: Record<string, number> = {
  in_progress: 0,
  pending: 1,
  completed: 2,
};

function flattenTasks(plans: ApiPlan[]): TaskRow[] {
  return plans.flatMap((plan) =>
    plan.topics.flatMap((topic) =>
      topic.tasks.map((task) => ({
        planId: plan.id,
        planTitle: plan.title,
        topicId: topic.id,
        topicName: topic.name,
        taskId: task.id,
        title: task.title,
        timeMinutes: task.timeMinutes,
        status: task.status,
        deadline: task.deadline,
      })),
    ),
  );
}

function sortTasks(tasks: TaskRow[], activeTaskId: string | null) {
  return [...tasks].sort((left, right) => {
    const leftIsActive = left.taskId === activeTaskId;
    const rightIsActive = right.taskId === activeTaskId;

    if (leftIsActive !== rightIsActive) {
      return leftIsActive ? -1 : 1;
    }

    const leftStatusRank = TASK_STATUS_RANK[left.status] ?? 99;
    const rightStatusRank = TASK_STATUS_RANK[right.status] ?? 99;
    if (leftStatusRank !== rightStatusRank) {
      return leftStatusRank - rightStatusRank;
    }

    const leftDeadline = left.deadline ? new Date(left.deadline).getTime() : Number.POSITIVE_INFINITY;
    const rightDeadline = right.deadline ? new Date(right.deadline).getTime() : Number.POSITIVE_INFINITY;
    if (leftDeadline !== rightDeadline) {
      return leftDeadline - rightDeadline;
    }

    return left.title.localeCompare(right.title);
  });
}

export default function TasksFeature() {
  const { user } = useAuth();
  const userId = user?.id;
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!userId) {
      return;
    }

    const currentUserId = userId;

    async function loadTasks() {
      try {
        setLoading(true);
        setError(null);
        setPlans(await getPlans(currentUserId));
        setActiveTimerTaskId(readActiveTaskTimer(currentUserId)?.taskId ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    void loadTasks();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToTaskTimerUpdates(userId, () => {
      setActiveTimerTaskId(readActiveTaskTimer(userId)?.taskId ?? null);
    });
  }, [userId]);

  async function handleTaskStatusChange(
    taskId: string,
    status: "completed" | "in_progress" | "pending",
  ) {
    try {
      setUpdatingTaskId(taskId);
      setError(null);
      const updatedPlan = await updatePlanTaskStatus(taskId, status);
      setPlans((currentPlans) =>
        currentPlans.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const tasks = sortTasks(flattenTasks(plans), activeTimerTaskId);
  const pendingTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.length - pendingTasks.length;
  const routeActiveTaskId = searchParams.get("activeTask");

  useEffect(() => {
    if (!routeActiveTaskId || loading) {
      return;
    }

    const target = taskRefs.current[routeActiveTaskId];
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedTaskId(routeActiveTaskId);

    const timeoutId = window.setTimeout(() => {
      setHighlightedTaskId((current) => (current === routeActiveTaskId ? null : current));
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [loading, routeActiveTaskId, tasks.length]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Track every task across your study plans.</p>
        </div>
        <Link
          href="/plans"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark sm:w-auto"
        >
          View Plans
          <ArrowRight size={16} />
        </Link>
      </div>

      {error ? <p className="text-sm text-red-500 mb-4">{error}</p> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{tasks.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{pendingTasks.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{completedTasks}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No tasks yet. Create a plan to get started.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const isCompleted = task.status === "completed";
              const isActive = activeTimerTaskId === task.taskId;

              return (
                <div
                  key={task.taskId}
                  ref={(element) => {
                    taskRefs.current[task.taskId] = element;
                  }}
                  className={`flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center ${
                    highlightedTaskId === task.taskId
                      ? "bg-primary/5 ring-2 ring-primary/20"
                      : isActive
                        ? "bg-primary/5"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <TaskCompletionTimer
                    userId={userId!}
                    taskId={task.taskId}
                    planId={task.planId}
                    topicId={task.topicId}
                    status={task.status}
                    disabled={updatingTaskId === task.taskId}
                    onStatusChange={(status) => handleTaskStatusChange(task.taskId, status)}
                    onError={(message) => setError(message)}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                      ) : (
                        <Circle size={16} className="text-gray-300 shrink-0" />
                      )}
                      <p className={`font-medium ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
                        {task.title}
                      </p>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          <PlayCircle size={12} />
                          Active
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-500">
                      {task.planTitle} · {task.topicName}
                      {task.deadline ? ` · ${task.deadline}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0 sm:self-center">
                    <Clock size={14} />
                    <span>{task.timeMinutes}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}