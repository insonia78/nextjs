"use client";

import { useState } from "react";
import { Bot, Sparkles, Wand2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  generateAiPlan,
  getAiRecommendation,
  getProgressSessions,
} from "@/lib/study-planner-api";
import { ensurePositiveInt, parseTopics, tryParseGeneratedPlan } from "./functions";
import styles from "./css/styles.module.css";

export default function AiFeature() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [goal, setGoal] = useState("Become confident in system design interviews");
  const [topicsInput, setTopicsInput] = useState("System Design, Databases, Caching, Scalability");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [daysAvailable, setDaysAvailable] = useState(21);

  const [recommendation, setRecommendation] = useState<string>("");
  const [targetTopic, setTargetTopic] = useState<string>("");
  const [generatedPlanRaw, setGeneratedPlanRaw] = useState<string>("");
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedPlan = generatedPlanRaw ? tryParseGeneratedPlan(generatedPlanRaw) : null;

  async function handleGetRecommendation() {
    if (!userId) return;

    try {
      setError(null);
      setLoadingRecommendation(true);

      const sessions = await getProgressSessions(userId);
      const recentProgress = sessions.slice(0, 8).map((s) => ({
        topic: s.topicId ?? "General",
        timeSpent: s.timeSpent,
        status: s.status,
      }));

      const response = await getAiRecommendation({
        userId,
        recentProgress,
      });

      setRecommendation(response.message);
      setTargetTopic(response.targetTopic);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get recommendation");
    } finally {
      setLoadingRecommendation(false);
    }
  }

  async function handleGeneratePlan() {
    if (!userId) return;

    const topics = parseTopics(topicsInput);
    if (topics.length === 0) {
      setError("Please add at least one topic.");
      return;
    }

    try {
      setError(null);
      setLoadingPlan(true);

      const response = await generateAiPlan({
        userId,
        goal,
        topics,
        hoursPerDay: ensurePositiveInt(hoursPerDay, 2),
        daysAvailable: ensurePositiveInt(daysAvailable, 30),
      });

      setGeneratedPlanRaw(response.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI plan");
    } finally {
      setLoadingPlan(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">AI Recommendations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate personalized recommendations and create a study plan with your AI service.
        </p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className={`${styles.panel} p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-800 font-semibold">
              <Bot size={18} />
              Smart Recommendation
            </div>
            <span className={styles.pill}>POST /api/ai/recommend</span>
          </div>

          <p className="text-sm text-gray-500">
            Uses your latest progress sessions to suggest where to focus next.
          </p>

          <button
            onClick={handleGetRecommendation}
            disabled={!userId || loadingRecommendation}
            className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50"
          >
            {loadingRecommendation ? "Generating..." : "Get Recommendation"}
          </button>

          <div className={`${styles.outputBox} p-4`}> 
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Message</p>
            <p className="text-sm text-gray-700 min-h-[42px]">
              {recommendation || "No recommendation yet."}
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Target topic: <span className="font-medium text-gray-700">{targetTopic || "-"}</span>
            </p>
          </div>
        </section>

        <section className={`${styles.panel} p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-800 font-semibold">
              <Sparkles size={18} />
              AI Plan Generator
            </div>
            <span className={styles.pill}>POST /api/ai/generate-plan</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Your learning goal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topics (comma-separated)</label>
              <input
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="React, TypeScript, Algorithms"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Day</label>
                <input
                  type="number"
                  min={1}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Days Available</label>
                <input
                  type="number"
                  min={1}
                  value={daysAvailable}
                  onChange={(e) => setDaysAvailable(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={!userId || loadingPlan}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50"
          >
            <Wand2 size={16} />
            {loadingPlan ? "Generating..." : "Generate AI Plan"}
          </button>
        </section>
      </div>

      <section className={`${styles.panel} p-5 space-y-3`}>
        <h2 className="text-base font-semibold text-gray-800">Generated Plan Output</h2>

        {generatedPlanRaw ? (
          parsedPlan ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="text-lg font-semibold text-gray-800">{parsedPlan.title}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parsedPlan.topics.map((topic, idx) => (
                  <article key={`${topic.name}-${idx}`} className={`${styles.topicCard} p-3`}>
                    <h3 className="font-semibold text-sm text-gray-800">{topic.name}</h3>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      {topic.tasks.map((task, taskIdx) => (
                        <li key={`${task.title}-${taskIdx}`}>
                          {task.title} ({task.timeMinutes}m{task.deadline ? `, ${task.deadline}` : ""})
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <pre className={`${styles.outputBox} p-4 text-xs text-gray-700 whitespace-pre-wrap`}>
              {generatedPlanRaw}
            </pre>
          )
        ) : (
          <p className="text-sm text-gray-500">No plan generated yet.</p>
        )}
      </section>
    </div>
  );
}
