export const logger = {
  info: (message: string, payload?: unknown) => {
    console.info(`[marketplace] ${message}`, payload ?? "");
  },
  error: (message: string, payload?: unknown) => {
    console.error(`[marketplace] ${message}`, payload ?? "");
  }
};
