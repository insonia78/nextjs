"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { submitProgress } from "@/lib/study-planner-api";
import {
  EMPTY_TIMER,
  formatTaskElapsed,
  persistTaskTimer,
  readTaskTimer,
  startTaskTimer,
  subscribeToTaskTimerUpdates,
  type TimerSnapshot,
} from "@/lib/task-timer-storage";

type TaskStatus = "completed" | "in_progress" | "pending";

type TaskCompletionTimerProps = {
  userId: string;
  taskId: string;
  planId: string;
  topicId: string;
  status: string;
  disabled?: boolean;
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onError: (message: string) => void;
};

function getElapsedSeconds(snapshot: TimerSnapshot, now: number) {
  if (!snapshot.startedAt) {
    return snapshot.elapsedSeconds;
  }

  const startedAtMs = new Date(snapshot.startedAt).getTime();
  const runningSeconds = Number.isFinite(startedAtMs)
    ? Math.max(0, Math.floor((now - startedAtMs) / 1000))
    : 0;

  return snapshot.elapsedSeconds + runningSeconds;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function TaskCompletionTimer({
  userId,
  taskId,
  planId,
  topicId,
  status,
  disabled,
  onStatusChange,
  onError,
}: TaskCompletionTimerProps) {
  const [snapshot, setSnapshot] = useState<TimerSnapshot>(() => readTaskTimer(userId, taskId));
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSnapshot(readTaskTimer(userId, taskId));
    setNow(Date.now());
  }, [taskId, userId]);

  useEffect(() => {
    return subscribeToTaskTimerUpdates(userId, () => {
      setSnapshot(readTaskTimer(userId, taskId));
      setNow(Date.now());
    });
  }, [taskId, userId]);

  useEffect(() => {
    if (status !== "completed") {
      return;
    }

    persistTaskTimer(userId, taskId, EMPTY_TIMER);
    setSnapshot(EMPTY_TIMER);
    setNow(Date.now());
  }, [status, taskId, userId]);

  useEffect(() => {
    if (!snapshot.startedAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [snapshot.startedAt]);

  const elapsedSeconds = useMemo(() => getElapsedSeconds(snapshot, now), [now, snapshot]);
  const isRunning = Boolean(snapshot.startedAt);

  function updateSnapshot(nextSnapshot: TimerSnapshot) {
    setSnapshot(nextSnapshot);
    setNow(Date.now());
    persistTaskTimer(userId, taskId, nextSnapshot);
  }

  async function handleTimerToggle() {
    if (disabled || submitting || status === "completed") {
      return;
    }

    if (isRunning) {
      updateSnapshot({ elapsedSeconds, startedAt: null });
      return;
    }

    try {
      setSubmitting(true);
      if (status === "pending") {
        await onStatusChange("in_progress");
      }
      setSnapshot(startTaskTimer(userId, taskId));
      setNow(Date.now());
    } catch (error) {
      onError(getErrorMessage(error, "Failed to start task timer"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetTimer() {
    if (disabled || submitting) {
      return;
    }

    updateSnapshot(EMPTY_TIMER);
  }

  async function handleCompletionChange(checked: boolean) {
    if (disabled || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      if (checked) {
        const timeSpent = elapsedSeconds > 0 ? Math.max(1, Math.ceil(elapsedSeconds / 60)) : 0;
        await onStatusChange("completed");
        await submitProgress({
          userId,
          taskId,
          planId,
          topicId,
          status: "completed",
          timeSpent,
        });
      } else {
        await onStatusChange("pending");
      }

      updateSnapshot(EMPTY_TIMER);
    } catch (error) {
      onError(getErrorMessage(error, "Failed to update task completion"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={status === "completed"}
        disabled={disabled || submitting}
        onChange={(event) => void handleCompletionChange(event.target.checked)}
        className="h-5 w-5 rounded text-primary shrink-0"
      />

      <div className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-xs text-gray-500 ring-1 ring-gray-200">
        <button
          type="button"
          onClick={() => void handleTimerToggle()}
          disabled={disabled || submitting || status === "completed"}
          className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-primary disabled:opacity-50"
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <span className="min-w-[4.5rem] text-center font-medium tabular-nums text-gray-700">
          {formatTaskElapsed(elapsedSeconds)}
        </span>
        <button
          type="button"
          onClick={handleResetTimer}
          disabled={disabled || submitting || elapsedSeconds === 0}
          className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-primary disabled:opacity-50"
          aria-label="Reset timer"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
