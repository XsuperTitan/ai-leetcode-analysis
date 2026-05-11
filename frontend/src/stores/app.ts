import { defineStore } from "pinia";

const APP_ID_KEY = "ai-coding-analysis.appId";
const DEFAULT_APP_ID = "interview-coach-web";

export const useAppStore = defineStore("app", {
  state: () => ({
    appId: loadAppId()
  }),
  actions: {
    setAppId(value: string) {
      this.appId = value;
      localStorage.setItem(APP_ID_KEY, value);
    }
  }
});

function loadAppId(): string {
  const stored = localStorage.getItem(APP_ID_KEY);
  return stored && stored.trim().length > 0 ? stored : DEFAULT_APP_ID;
}
