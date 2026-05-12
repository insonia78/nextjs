import axios from "axios";

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("study_planner_token");
}

function attachAuthInterceptor(instance: ReturnType<typeof axios.create>) {
  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

export const progressApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PROGRESS_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

export const aiApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

attachAuthInterceptor(authApi);
attachAuthInterceptor(progressApi);
attachAuthInterceptor(aiApi);
