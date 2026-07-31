export type TimerSnapshot = {
  elapsedSeconds: number;
  startedAt: string | null;
};

type TimerUpdateDetail = {
  userId: string;
};

export const EMPTY_TIMER: TimerSnapshot = {
  elapsedSeconds: 0,
  startedAt: null,
};

const TIMER_EVENT_NAME = "study-planner-task-timers-updated";

function getStorageKey(userId: string) {
  return `study-planner-task-timers:${userId}`;
}

function readTimerMap(userId: string): Record<string, TimerSnapshot> {
  if (typeof window === "undefined") {
    return {};
  }

  const saved = window.localStorage.getItem(getStorageKey(userId));
  if (!saved) {
    return {};
  }

  try {
    const parsed = JSON.parse(saved) as Record<string, TimerSnapshot>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTimerMap(userId: string, nextMap: Record<string, TimerSnapshot>) {
  if (typeof window === "undefined") {
    return;
  }

  if (Object.keys(nextMap).length === 0) {
    window.localStorage.removeItem(getStorageKey(userId));
    return;
  }

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(nextMap));
}

function dispatchTimerUpdate(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<TimerUpdateDetail>(TIMER_EVENT_NAME, {
      detail: { userId },
    }),
  );
}

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

export function formatTaskElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainderSeconds = seconds % 60;

  return [hours, minutes, remainderSeconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

export function readTaskTimer(userId: string, taskId: string): TimerSnapshot {
  return readTimerMap(userId)[taskId] ?? EMPTY_TIMER;
}

export function persistTaskTimer(userId: string, taskId: string, snapshot: TimerSnapshot) {
  const nextMap = readTimerMap(userId);

  if (snapshot.elapsedSeconds <= 0 && !snapshot.startedAt) {
    delete nextMap[taskId];
  } else {
    nextMap[taskId] = snapshot;
  }

  writeTimerMap(userId, nextMap);
  dispatchTimerUpdate(userId);
}

export function readActiveTaskTimer(userId: string): { taskId: string; snapshot: TimerSnapshot } | null {
  const timers = readTimerMap(userId);

  for (const [taskId, snapshot] of Object.entries(timers)) {
    if (snapshot.startedAt) {
      return { taskId, snapshot };
    }
  }

  return null;
}

export function subscribeToTaskTimerUpdates(userId: string, onUpdate: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const customEventListener = (event: Event) => {
    const detail = (event as CustomEvent<TimerUpdateDetail>).detail;
    if (!detail || detail.userId !== userId) {
      return;
    }

    onUpdate();
  };

  const storageEventListener = (event: StorageEvent) => {
    if (event.key !== getStorageKey(userId)) {
      return;
    }

    onUpdate();
  };

  window.addEventListener(TIMER_EVENT_NAME, customEventListener as EventListener);
  window.addEventListener("storage", storageEventListener);

  return () => {
    window.removeEventListener(TIMER_EVENT_NAME, customEventListener as EventListener);
    window.removeEventListener("storage", storageEventListener);
  };
}

export function startTaskTimer(userId: string, taskId: string): TimerSnapshot {
  const now = Date.now();
  const nextMap = readTimerMap(userId);

  for (const [otherTaskId, snapshot] of Object.entries(nextMap)) {
    if (!snapshot.startedAt || otherTaskId === taskId) {
      continue;
    }

    nextMap[otherTaskId] = {
      elapsedSeconds: getElapsedSeconds(snapshot, now),
      startedAt: null,
    };
  }

  const current = nextMap[taskId] ?? EMPTY_TIMER;
  const nextSnapshot = current.startedAt
    ? current
    : {
        elapsedSeconds: current.elapsedSeconds,
        startedAt: new Date(now).toISOString(),
      };

  nextMap[taskId] = nextSnapshot;
  writeTimerMap(userId, nextMap);
  dispatchTimerUpdate(userId);
  return nextSnapshot;
}