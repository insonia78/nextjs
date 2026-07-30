"use client";

import { useEffect, useState } from "react";
import { BookText, Save, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const DEFAULT_NOTES = [
  "Focus topic:",
  "",
  "Key concepts:",
  "- ",
  "",
  "Questions to review:",
  "- ",
  "",
  "Next study step:",
].join("\n");

function getStorageKey(userId: string) {
  return `study-planner-notes:${userId}`;
}

export default function NotesFeature() {
  const { user } = useAuth();
  const userId = user?.id;
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotes(DEFAULT_NOTES);
      setSavedAt(null);
      setReady(true);
      return;
    }

    const storedNotes = window.localStorage.getItem(getStorageKey(userId));
    const storedSavedAt = window.localStorage.getItem(`${getStorageKey(userId)}:savedAt`);

    setNotes(storedNotes && storedNotes.trim().length > 0 ? storedNotes : DEFAULT_NOTES);
    setSavedAt(storedSavedAt);
    setReady(true);
  }, [userId]);

  function handleSave() {
    if (!userId) {
      return;
    }

    const timestamp = new Date().toLocaleString();
    window.localStorage.setItem(getStorageKey(userId), notes);
    window.localStorage.setItem(`${getStorageKey(userId)}:savedAt`, timestamp);
    setSavedAt(timestamp);
  }

  function handleReset() {
    setNotes(DEFAULT_NOTES);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Capture quick study notes, review prompts, and next steps for your sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!userId}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            Save Notes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="card">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your study notes here..."
            className="w-full min-h-[420px] resize-y rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4 text-gray-800">
            <BookText size={18} />
            <h2 className="text-lg font-semibold">Study Notes</h2>
          </div>

          <div className="space-y-3 text-sm text-gray-500">
            <p>Use this space for formulas, reminders, weak spots, or the next thing to revisit.</p>
            <p>{savedAt ? `Last saved: ${savedAt}` : ready ? "Notes are stored locally in this browser." : "Loading notes..."}</p>
            <p>
              Notes are saved per signed-in user so you can keep separate working drafts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}