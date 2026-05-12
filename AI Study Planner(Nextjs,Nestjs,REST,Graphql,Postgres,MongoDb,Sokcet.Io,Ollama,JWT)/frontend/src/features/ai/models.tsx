export interface AiRecommendInput {
  userId: string;
  recentProgress: Array<{
    topic: string;
    timeSpent: number;
    status: string;
  }>;
}

export interface AiPlanInput {
  userId: string;
  goal: string;
  topics: string[];
  hoursPerDay?: number;
  daysAvailable?: number;
}

export interface ParsedGeneratedPlan {
  title: string;
  topics: Array<{
    name: string;
    tasks: Array<{
      title: string;
      timeMinutes: number;
      deadline?: string;
    }>;
  }>;
}
