import { create } from "zustand";

interface DevState {
  simulateAIFailure: boolean;
  setSimulateAIFailure(value: boolean): void;
}

export const useDevStore = create<DevState>()((set) => ({
  simulateAIFailure: false,
  setSimulateAIFailure: (simulateAIFailure) => set({ simulateAIFailure }),
}));
