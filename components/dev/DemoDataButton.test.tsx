import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DemoDataButton, DEMO_SEED } from "./DemoDataButton";
import { demoMemories } from "@/lib/rings/rings";
import { useJournalStore } from "@/lib/stores/journal";

beforeEach(async () => {
  await useJournalStore.getState().load("jieyou-demo-" + Math.random().toString(36).slice(2));
  await useJournalStore.getState().clear();
});

afterEach(cleanup);

describe("生成演示数据", () => {
  it("点一下就把跨年的假记录写进年轮", async () => {
    const user = userEvent.setup({ delay: null });
    render(<DemoDataButton />);
    await user.click(screen.getByRole("button", { name: "生成演示数据" }));
    await waitFor(() => {
      expect(useJournalStore.getState().memories.length).toBe(demoMemories(DEMO_SEED).length);
    });
    expect(screen.getByRole("button", { name: /生成演示数据（/ })).toBeTruthy();
    const years = new Set(useJournalStore.getState().memories.map((memory) => memory.date.slice(0, 4)));
    expect(years.size).toBeGreaterThan(1);
  });
});
