"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlan, type ApiPlan } from "@/lib/study-planner-api";
import { useAuth } from "@/lib/auth-context";

interface PlanDetail extends ApiPlan {
  description?: string;
  updatedAt?: string;
}

export default function PlanDetailFeature({ planId }: { planId: string }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFoundTriggered, setNotFoundTriggered] = useState(false);

  useEffect(() => {
    if (!user?.id || !planId) return;

    async function loadPlan() {
      try {
        setLoading(true);
        setError(null);
        const result = await getPlan(planId);
        
        if (!result) {
          setNotFoundTriggered(true);
          notFound();
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

  if (notFoundTriggered) {
    return null;
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

  if (error || !plan) {
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <Link
        href="/plans"
        className="flex items-center gap-2 text-primary hover:text-primary-dark mb-6 font-semibold"
      >
        <ArrowLeft size={18} />
        Back to Plans
      </Link>

      {/* Plan Title and Stats */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{plan.title}</h1>

        {plan.description && (
          <p className="text-gray-600 mb-6 text-lg">{plan.description}</p>
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
        <div className="grid grid-cols-3 gap-4">
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
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <BookOpen className="text-primary mt-1 shrink-0" size={20} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{topic.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {topic.tasks?.filter((t) => t.status === "completed").length ?? 0} of{" "}
                      {topic.tasks?.length ?? 0} tasks completed
                    </p>
                  </div>
                </div>
              </div>

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
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        readOnly
                        className="w-5 h-5 text-primary rounded"
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
                      {task.timeMinutes && (
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Clock size={14} />
                          {task.timeMinutes}m
                        </div>
                      )}
                      {task.status === "completed" && (
                        <CheckCircle className="text-green-600 shrink-0" size={18} />
                      )}
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
