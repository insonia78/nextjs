import type { TodayPlanItem, AIRecommendation } from "./models";

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getStatusBadgeClass(status: TodayPlanItem["status"]): string {
  switch (status) {
    case "in_progress":
      return "badge-inprogress";
    case "completed":
      return "badge-completed";
    default:
      return "badge-pending";
  }
}

export function getStatusLabel(status: TodayPlanItem["status"]): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Pending";
  }
}

export const mockTodayPlan: TodayPlanItem[] = [
  { subject: "Data Structures", taskCount: 2, timeMinutes: 90, status: "in_progress" },
  { subject: "System Design", taskCount: 1, timeMinutes: 60, status: "pending" },
  { subject: "Cloud Computing", taskCount: 2, timeMinutes: 120, status: "pending" },
];

export const mockRecommendation: AIRecommendation = {
  id: "1",
  message: "Based on your progress, focus more on System Design. You tend to lose time on this topic.",
  targetTopic: "System Design",
};
