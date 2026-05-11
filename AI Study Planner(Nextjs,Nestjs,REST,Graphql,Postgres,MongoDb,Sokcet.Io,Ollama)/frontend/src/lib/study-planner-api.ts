import { aiApi, progressApi } from "./api";

export type ApiTask = {
  id: string;
  title: string;
  timeMinutes: number;
  status: string;
  deadline?: string | null;
};

export type ApiTopic = {
  id: string;
  name: string;
  tasks: ApiTask[];
};

export type ApiPlan = {
  id: string;
  title: string;
  userId: string;
  progress: number;
  createdAt?: string;
  topics: ApiTopic[];
};

export type ProgressSession = {
  _id?: string;
  userId: string;
  taskId: string;
  status: "completed" | "in_progress" | "pending";
  timeSpent: number;
  planId?: string;
  topicId?: string;
  notes?: string;
  createdAt?: string;
};

const plannerGraphqlUrl =
  process.env.NEXT_PUBLIC_PLANNER_GRAPHQL_URL ?? "http://localhost:3000/graphql";

async function plannerQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    console.log(`Sending GraphQL query to ${plannerGraphqlUrl} with variables:`, variables);
  try{  
  const response = await fetch(plannerGraphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`Planner request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }

  if (!payload.data) {
    throw new Error("Planner returned an empty response");
  }

  return payload.data;

  }catch(err) {
    console.error("Error during planner query:", err);
    throw new Error("Failed to connect to planner service");
  }
  
}

export async function getPlans(userId: string): Promise<ApiPlan[]> {
    console.log(`Fetching plans for user ID: ${userId}`);
  const data = await plannerQuery<{ plans: ApiPlan[] }>(
    `query Plans($userId: String!) {
      plans(userId: $userId) {
        id
        title
        userId
        progress
        createdAt
        topics {
          id
          name
          tasks {
            id
            title
            timeMinutes
            status
            deadline
          }
        }
      }
    }`,
    { userId },
  );

  return data.plans ?? [];
}

export async function getPlan(planId: string): Promise<ApiPlan | null> {
    console.log(`Fetching plan with ID: ${planId}`);
  const data = await plannerQuery<{ plan: ApiPlan | null }>(
    `query Plan($id: ID!) {
      plan(id: $id) {
        id
        title
        userId
        progress
        createdAt
        topics {
          id
          name
          tasks {
            id
            title
            timeMinutes
            status
            deadline
          }
        }
      }
    }`,
    { id: planId },
  );

  return data.plan ?? null;
}

export type TopicInput = {
  name: string;
  tasks?: Array<{ title: string; timeMinutes?: number; deadline?: string }>;
};

export async function createPlan(
  userId: string,
  title: string,
  topics?: TopicInput[],
): Promise<ApiPlan> {
  const data = await plannerQuery<{ createPlan: ApiPlan }>(
    `mutation CreatePlan($input: CreatePlanInput!) {
      createPlan(input: $input) {
        id
        title
        userId
        progress
        createdAt
        topics {
          id
          name
          tasks {
            id
            title
            timeMinutes
            status
            deadline
          }
        }
      }
    }`,
    {
      input: {
        userId,
        title,
        topics: topics ?? [
          {
            name: "General",
            tasks: [{ title: "Kickoff Session", timeMinutes: 45, deadline: "Day 1" }],
          },
        ],
      },
    },
  );

  return data.createPlan;
}

export async function deletePlan(planId: string): Promise<boolean> {
  const data = await plannerQuery<{ deletePlan: boolean }>(
    `mutation DeletePlan($id: ID!) {
      deletePlan(id: $id)
    }`,
    { id: planId },
  );

  return data.deletePlan ?? false;
}

export async function getProgressSessions(userId: string): Promise<ProgressSession[]> {
  const response = await progressApi.get<ProgressSession[]>(`/api/progress/${userId}`);
  return response.data ?? [];
}

export async function getProgressStats(userId: string): Promise<{
  totalMinutes: number;
  totalSessions: number;
  completed: number;
}> {
  const response = await progressApi.get(`/api/progress/${userId}/stats`);
  return response.data;
}

export async function submitProgress(entry: {
  userId: string;
  taskId: string;
  status: "completed" | "in_progress" | "pending";
  timeSpent: number;
  planId?: string;
  topicId?: string;
  notes?: string;
}) {
  const response = await progressApi.post("/api/progress", entry);
  return response.data;
}

export async function getAiRecommendation(payload: {
  userId: string;
  recentProgress: Array<{ topic: string; timeSpent: number; status: string }>;
}): Promise<{ message: string; targetTopic: string }> {
  const response = await aiApi.post("/api/ai/recommend", payload);
  return response.data;
}

export async function generateAiPlan(payload: {
  userId: string;
  goal: string;
  topics: string[];
  hoursPerDay?: number;
  daysAvailable?: number;
}): Promise<{ plan: string }> {
  const response = await aiApi.post("/api/ai/generate-plan", payload);
  return response.data;
}
