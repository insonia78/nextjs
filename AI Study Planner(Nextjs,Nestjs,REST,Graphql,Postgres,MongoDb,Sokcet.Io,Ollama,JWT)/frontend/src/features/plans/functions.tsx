import type { StudyPlan } from "../dashboard/models";

export const mockPlans: StudyPlan[] = [
  {
    id: "1",
    title: "Full Stack Development",
    topics: [],
    progress: 76,
    lastStudied: "Today",
    color: "#6C47FF",
  },
  {
    id: "2",
    title: "System Design Mastery",
    topics: [],
    progress: 60,
    lastStudied: "Yesterday",
    color: "#FF6B6B",
  },
  {
    id: "3",
    title: "AWS Certification",
    topics: [],
    progress: 40,
    lastStudied: "2 days ago",
    color: "#FF9800",
  },
  {
    id: "4",
    title: "Data Structures & Algorithms",
    topics: [],
    progress: 80,
    lastStudied: "3 days ago",
    color: "#4CAF50",
  },
];

export type PlanTab = "All Plans" | "Active" | "Completed" | "Archived";
export const PLAN_TABS: PlanTab[] = ["All Plans", "Active", "Completed", "Archived"];

export function filterPlans(plans: StudyPlan[], tab: PlanTab): StudyPlan[] {
  if (tab === "All Plans") return plans;
  if (tab === "Active") return plans.filter((p) => p.progress < 100 && p.progress > 0);
  if (tab === "Completed") return plans.filter((p) => p.progress === 100);
  if (tab === "Archived") return [];
  return plans;
}
