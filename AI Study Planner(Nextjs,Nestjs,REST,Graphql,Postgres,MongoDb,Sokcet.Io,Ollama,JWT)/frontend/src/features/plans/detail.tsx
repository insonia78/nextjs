"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle, Clock, AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  addPlanTask,
  deletePlanTask,
  getPlan,
  type ApiPlan,
  updatePlanTask,
  updatePlanTaskStatus,
} from "@/lib/study-planner-api";
import { useAuth } from "@/lib/auth-context";

interface PlanDetail extends ApiPlan {
  description?: string;
  updatedAt?: string;
}

type TaskFormState = {
  title: string;
  timeMinutes: string;
  deadline: string;
};

const EMPTY_TASK_FORM: TaskFormState = {
  title: "",
  timeMinutes: "30",
  deadline: "",
};

export default function PlanDetailFeature({ planId }: { planId: string }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK_FORM);
  const [savingTask, setSavingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !planId) return;

    async function loadPlan() {
      try {
        setLoading(true);
        setError(null);
        const result = await getPlan(planId);
        
        if (!result) {
          setError("Plan not found");
          return;
        }

        setPlan(result as PlanDetail);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load plan";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadPlan();
  }, [user?.id, planId]);

  async function handleToggleTask(taskId: string, completed: boolean) {
    try {
      setUpdatingTaskId(taskId);
      setError(null);
      const updatedPlan = await updatePlanTaskStatus(
        taskId,
        completed ? "completed" : "pending",
      );
      setPlan(updatedPlan as PlanDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  function openAddTask(topicId: string) {
    setEditingTaskId(null);
    setEditingTopicId(topicId);
    setTaskForm(EMPTY_TASK_FORM);
    setError(null);
  }

  function openEditTask(topicId: string, task: PlanDetail["topics"][number]["tasks"][number]) {
    setEditingTaskId(task.id);
    setEditingTopicId(topicId);
    setTaskForm({
      title: task.title,
      timeMinutes: String(task.timeMinutes ?? 30),
      deadline: task.deadline ?? "",
    });
    setError(null);
  }

  function closeTaskEditor() {
    setEditingTaskId(null);
    setEditingTopicId(null);
    setTaskForm(EMPTY_TASK_FORM);
    setSavingTask(false);
  }

  async function handleSaveTask() {
    if (!editingTopicId) {
      return;
    }

    const trimmedTitle = taskForm.title.trim();
    if (!trimmedTitle) {
      setError("Task title is required");
      return;
    }

    const parsedTime = Number.parseInt(taskForm.timeMinutes, 10);
    const timeMinutes = Number.isFinite(parsedTime) && parsedTime > 0 ? parsedTime : 30;

    try {
      setSavingTask(true);
      setError(null);

      const updatedPlan = editingTaskId
        ? await updatePlanTask(editingTaskId, {
            title: trimmedTitle,
            timeMinutes,
            deadline: taskForm.deadline.trim() || undefined,
          })
        : await addPlanTask(editingTopicId, {
            title: trimmedTitle,
            timeMinutes,
            deadline: taskForm.deadline.trim() || undefined,
          });

      setPlan(updatedPlan as PlanDetail);
      closeTaskEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
      setSavingTask(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(taskId);
      setError(null);
      const updatedPlan = await deletePlanTask(taskId);
      setPlan(updatedPlan as PlanDetail);

      if (editingTaskId === taskId) {
        closeTaskEditor();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeletingTaskId(null);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view plan details</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/plans"
          className="flex items-center gap-2 text-primary hover:text-primary-dark mb-6"
        >
          <ArrowLeft size={18} />
          Back to Plans
        </Link>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="text-red-600 mx-auto mb-3" size={32} />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Could Not Load Plan</h2>
          <p className="text-red-600 mb-4">{error || "Plan not found"}</p>
          <Link
            href="/plans"
            className="inline-block bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
          >
            Return to Plans
          </Link>
        </div>
      </div>
    );
  }

  const totalTasks = plan.topics?.reduce((sum, topic) => sum + (topic.tasks?.length ?? 0), 0) ?? 0;
  const completedTasks =
    plan.topics?.reduce(
      (sum, topic) =>
        sum + (topic.tasks?.filter((t) => t.status === "completed").length ?? 0),
      0
    ) ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      {/* Header */}
      <Link
        href="/plans"
        className="flex items-center gap-2 text-primary hover:text-primary-dark mb-6 font-semibold"
      >
        <ArrowLeft size={18} />
        Back to Plans
      </Link>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* Plan Title and Stats */}
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-800 sm:text-4xl">{plan.title}</h1>

        {plan.description && (
          <p className="mb-6 text-base text-gray-600 sm:text-lg">{plan.description}</p>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-gray-700">{plan.progress ?? 0}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all"
              style={{ width: `${plan.progress ?? 0}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{totalTasks}</div>
            <p className="text-sm text-gray-600">Total Tasks</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{completedTasks}</div>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0)}%
            </div>
            <p className="text-sm text-gray-600">Complete</p>
          </div>
        </div>
      </div>

      {/* Topics and Tasks */}
      <div className="space-y-6">
        {plan.topics && plan.topics.length > 0 ? (
          plan.topics.map((topic) => (
            <div key={topic.id} className="card p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-1 items-start gap-3">
                  <BookOpen className="text-primary mt-1 shrink-0" size={20} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{topic.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {topic.tasks?.filter((t) => t.status === "completed").length ?? 0} of{" "}
                      {topic.tasks?.length ?? 0} tasks completed
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openAddTask(topic.id)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark sm:self-start"
                >
                  <Plus size={16} />
                  Add Task
                </button>
              </div>

              {editingTopicId === topic.id ? (
                <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_140px]">
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm((current) => ({ ...current, title: e.target.value }))}
                      placeholder="Task title"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      min={1}
                      value={taskForm.timeMinutes}
                      onChange={(e) => setTaskForm((current) => ({ ...current, timeMinutes: e.target.value }))}
                      placeholder="Minutes"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="text"
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm((current) => ({ ...current, deadline: e.target.value }))}
                      placeholder="Deadline"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={closeTaskEditor}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveTask()}
                      disabled={savingTask}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                    >
                      {savingTask ? "Saving..." : editingTaskId ? "Save Task" : "Add Task"}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${
                        topic.tasks && topic.tasks.length > 0
                          ? Math.round(
                              (topic.tasks.filter((t) => t.status === "completed").length /
                                topic.tasks.length) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Tasks */}
              {topic.tasks && topic.tasks.length > 0 ? (
                <div className="space-y-2">
                  {topic.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 transition hover:bg-gray-100 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                        <input
                          type="checkbox"
                          checked={task.status === "completed"}
                          disabled={updatingTaskId === task.id || deletingTaskId === task.id}
                          onChange={(e) => void handleToggleTask(task.id, e.target.checked)}
                          className="mt-0.5 h-5 w-5 rounded text-primary sm:mt-0"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            task.status === "completed"
                              ? "line-through text-gray-400"
                              : "text-gray-700"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        {task.timeMinutes && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={14} />
                            {task.timeMinutes}m
                          </div>
                        )}
                        <div className="flex items-center gap-1 sm:gap-0">
                          <button
                            type="button"
                            onClick={() => openEditTask(topic.id, task)}
                            disabled={deletingTaskId === task.id}
                            className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-primary"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteTask(task.id)}
                            disabled={deletingTaskId === task.id}
                            className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-red-500 disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                          {task.status === "completed" && (
                            <CheckCircle className="shrink-0 text-green-600" size={18} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">No tasks yet</p>
              )}
            </div>
          ))
        ) : (
          <div className="card p-6 text-center">
            <BookOpen className="text-gray-400 mx-auto mb-3" size={32} />
            <p className="text-gray-600">No topics added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
