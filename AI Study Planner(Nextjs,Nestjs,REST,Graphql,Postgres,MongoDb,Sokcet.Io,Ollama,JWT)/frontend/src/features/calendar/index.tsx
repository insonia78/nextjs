"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getPlans, type ApiPlan, updatePlanTaskStatus } from "@/lib/study-planner-api";

type CalendarTask = {
  planId: string;
  planTitle: string;
  topicName: string;
  taskId: string;
  title: string;
  timeMinutes: number;
  status: "completed" | "in_progress" | "pending" | string;
  deadline: string;
};

function deadlineRank(deadline: string): number {
  const match = deadline.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function flattenCalendarTasks(plans: ApiPlan[]): CalendarTask[] {
  return plans.flatMap((plan) =>
    plan.topics.flatMap((topic) =>
      topic.tasks
        .filter((task) => task.deadline)
        .map((task) => ({
          planId: plan.id,
          planTitle: plan.title,
          topicName: topic.name,
          taskId: task.id,
          title: task.title,
          timeMinutes: task.timeMinutes,
          status: task.status,
          deadline: task.deadline ?? "Unscheduled",
        })),
    ),
  );
}

export default function CalendarFeature() {
  const { user } = useAuth();
  const userId = user?.id;
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    async function loadCalendar() {
      try {
        setLoading(true);
        setError(null);
        setPlans(await getPlans(userId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load calendar");
      } finally {
        setLoading(false);
      }
    }

    void loadCalendar();
  }, [userId]);

  async function handleToggleTask(taskId: string, completed: boolean) {
    try {
      setUpdatingTaskId(taskId);
      setError(null);
      const updatedPlan = await updatePlanTaskStatus(taskId, completed ? "completed" : "pending");
      setPlans((currentPlans) => currentPlans.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const tasks = useMemo(() => flattenCalendarTasks(plans), [plans]);
  const groupedTasks = useMemo(() => {
    const groups = new Map<string, CalendarTask[]>();

    for (const task of tasks) {
      const current = groups.get(task.deadline) ?? [];
      current.push(task);
      groups.set(task.deadline, current);
    }

    return Array.from(groups.entries())
      .sort(([left], [right]) => deadlineRank(left) - deadlineRank(right))
      .map(([deadline, items]) => ({
        deadline,
        items,
      }));
  }, [tasks]);

  const totalMinutes = tasks.reduce((sum, task) => sum + task.timeMinutes, 0);
  const completedCount = tasks.filter((task) => task.status === "completed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">See your study tasks grouped by planned deadline.</p>
        </div>
        <Link
          href="/plans"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition"
        >
          Open Plans
          <ArrowRight size={16} />
        </Link>
      </div>

      {error ? <p className="text-sm text-red-500 mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Scheduled Tasks</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{tasks.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{completedCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Planned Minutes</p>
          <p className="text-3xl font-bold text-primary mt-2">{totalMinutes}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading schedule...</div>
        ) : groupedTasks.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No scheduled tasks yet. Add deadlines to your plans to populate this view.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {groupedTasks.map((group) => (
              <div key={group.deadline} className="p-5">
                <div className="flex items-center gap-2 mb-4 text-gray-800">
                  <CalendarDays size={18} className="text-primary" />
                  <h2 className="font-semibold">{group.deadline}</h2>
                </div>

                <div className="space-y-3">
                  {group.items.map((task) => {
                    const isCompleted = task.status === "completed";

                    return (
                      <div key={task.taskId} className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          disabled={updatingTaskId === task.taskId}
                          onChange={(e) => void handleToggleTask(task.taskId, e.target.checked)}
                          className="w-5 h-5 text-primary rounded shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isCompleted ? (
                              <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                            ) : (
                              <Circle size={16} className="text-gray-300 shrink-0" />
                            )}
                            <p className={`font-medium ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
                              {task.title}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500">{task.planTitle} · {task.topicName}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                          <Clock3 size={14} />
                          <span>{task.timeMinutes}m</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}