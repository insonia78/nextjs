import type { ParsedGeneratedPlan } from "./models";

export function parseTopics(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function tryParseGeneratedPlan(plan: string): ParsedGeneratedPlan | null {
  try {
    const parsed = JSON.parse(plan) as ParsedGeneratedPlan;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.title || !Array.isArray(parsed.topics)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function ensurePositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.round(value);
}
