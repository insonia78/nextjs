"use client";
import { useEffect, useState } from "react";
import { Plus, MoreVertical, Trash2, X } from "lucide-react";
import Link from "next/link";
import { PLAN_TABS, filterPlans, type PlanTab } from "./functions";
import type { StudyPlan } from "../dashboard/models";
import styles from "./styles.module.css";
import { createPlan, getPlans, deletePlan, type ApiPlan, type TopicInput } from "@/lib/study-planner-api";
import { useAuth } from "@/lib/auth-context";

const PLAN_COLORS = ["#6C47FF", "#FF6B6B", "#FF9800", "#4CAF50", "#1FA2FF"];
function mapPlan(plan: ApiPlan, index: number): StudyPlan {
  return {
    ...plan,
    color: PLAN_COLORS[index % PLAN_COLORS.length],
    lastStudied: plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "Recently",
  };
}

interface PlanCardProps {
  plan: StudyPlan;
  onDelete: (id: string) => Promise<void>;
  deleting?: boolean;
}

function PlanCard({ plan, onDelete, deleting }: PlanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      setIsDeleting(true);
      await onDelete(plan.id);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <Link href={`/plans/${plan.id}`}>
      <div className={`card flex items-center gap-4 cursor-pointer ${styles.planCard} hover:shadow-md transition`}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: plan.color + "20" }}
        >
          <div className="w-4 h-4 rounded-md" style={{ backgroundColor: plan.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{plan.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">Last study: {plan.lastStudied}</p>
          <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${plan.progress}%`, backgroundColor: plan.color }}
            />
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-600 shrink-0">{plan.progress}%</span>
        <div className="relative" onClick={(e) => e.preventDefault()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-gray-100"
            disabled={deleting || isDeleting}
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
              >
                <Trash2 size={16} />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function PlansFeature() {
  const { user } = useAuth();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState<PlanTab>("All Plans");
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [topics, setTopics] = useState<TopicInput[]>([{ name: "" }]);
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;

    async function loadPlans() {
      try {
        setLoading(true);
        const result = await getPlans(currentUserId);
        setPlans(result.map(mapPlan));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    }

    void loadPlans();
  }, [userId]);

  async function handleCreatePlan() {
    if (!userId) return;
    if (!planTitle.trim()) {
      setDialogError("Plan title is required.");
      return;
    }
    const validTopics = topics.filter((t) => t.name.trim() !== "");

    try {
      setCreating(true);
      setDialogError(null);
      const plan = await createPlan(
        userId,
        planTitle.trim(),
        validTopics.length > 0 ? validTopics : undefined,
      );
      setPlans((prev) => [...prev, mapPlan(plan, prev.length)]);
      setShowDialog(false);
      setPlanTitle("");
      setTopics([{ name: "" }]);
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setCreating(false);
    }
  }

  function openDialog() {
    setPlanTitle("");
    setTopics([{ name: "" }]);
    setDialogError(null);
    setShowDialog(true);
  }

  function addTopic() {
    setTopics((prev) => [...prev, { name: "" }]);
  }

  function removeTopic(index: number) {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTopicName(index: number, value: string) {
    setTopics((prev) => prev.map((t, i) => (i === index ? { ...t, name: value } : t)));
  }

  async function handleDeletePlan(planId: string) {
    try {
      setDeleting(true);
      setError(null);
      await deletePlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = filterPlans(plans, activeTab);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Plans</h1>
        <button
          onClick={openDialog}
          disabled={creating}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50"
        >
          <Plus size={16} />
          New Plan
        </button>
      </div>

      {error ? <p className="text-sm text-red-500 mb-4">{error}</p> : null}

      {/* New Plan Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-5">New Study Plan</h2>

            {/* Title */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g. React Fundamentals"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            {/* Topics */}
            <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>
            <div className="flex flex-col gap-2 mb-3">
              {topics.map((topic, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Topic ${i + 1} name`}
                    value={topic.name}
                    onChange={(e) => updateTopicName(i, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {topics.length > 1 && (
                    <button
                      onClick={() => removeTopic(i)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addTopic}
              type="button"
              className="text-xs text-primary font-semibold hover:underline mb-5"
            >
              + Add another topic
            </button>

            {dialogError && (
              <p className="text-xs text-red-500 mb-3">{dialogError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={creating}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {PLAN_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Plans list */}
      <div className="flex flex-col gap-3">
        {loading ? <p className="text-gray-400 text-sm">Loading plans...</p> : null}
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">No plans in this category.</p>
        ) : (
          filtered.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onDelete={handleDeletePlan} deleting={deleting} />
          ))
        )}
      </div>
    </div>
  );
}
