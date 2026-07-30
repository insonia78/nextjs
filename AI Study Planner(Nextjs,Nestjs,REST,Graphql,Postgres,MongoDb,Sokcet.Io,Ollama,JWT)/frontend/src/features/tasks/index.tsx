"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getPlans, type ApiPlan, updatePlanTaskStatus } from "@/lib/study-planner-api";

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

export default function TasksFeature() {
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

    async function loadTasks() {
      try {
        setLoading(true);
        setError(null);
        setPlans(await getPlans(userId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    void loadTasks();
  }, [userId]);

  async function handleToggleTask(taskId: string, completed: boolean) {
    try {
      setUpdatingTaskId(taskId);
      setError(null);
      const updatedPlan = await updatePlanTaskStatus(taskId, completed ? "completed" : "pending");
      setPlans((currentPlans) =>
        currentPlans.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const tasks = flattenTasks(plans);
  const pendingTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.length - pendingTasks.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Track every task across your study plans.</p>
        </div>
        <Link
          href="/plans"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition"
        >
          View Plans
          <ArrowRight size={16} />
        </Link>
      </div>

      {error ? <p className="text-sm text-red-500 mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

              return (
                <div key={task.taskId} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
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
                    <p className="text-sm text-gray-500">
                      {task.planTitle} · {task.topicName}
                      {task.deadline ? ` · ${task.deadline}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
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