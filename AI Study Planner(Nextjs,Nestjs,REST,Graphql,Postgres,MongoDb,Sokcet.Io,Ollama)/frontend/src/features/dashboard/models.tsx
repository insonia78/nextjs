export interface StudyPlan {
  id: string;
  title: string;
  topics: Topic[];
  progress: number;
  lastStudied?: string;
  color?: string;
  createdAt?: string;
}

export interface Topic {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  timeMinutes: number;
  status: "completed" | "in_progress" | "pending" | string;
  deadline?: string | null;
}

export interface TodayPlanItem {
  subject: string;
  taskCount: number;
  timeMinutes: number;
  status: "in_progress" | "pending" | "completed";
}

export interface ProgressEntry {
  userId: string;
  taskId: string;
  status: "completed" | "in_progress" | "pending";
  timeSpent: number;
  date: string;
}

export interface AIRecommendation {
  id: string;
  message: string;
  targetTopic: string;
}
