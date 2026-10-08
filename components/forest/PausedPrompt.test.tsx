import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PausedPrompt } from "./PausedPrompt";
import type { Session } from "@/lib/journal/types";
import { useForestStore } from "@/lib/stores/forest";
import { useJournalStore } from "@/lib/stores/journal";
import { useTalkStore } from "@/lib/stores/talk";

function pausedSession(): Session {
  return {
    id: "s-1",
    startedAt: 1,
    endedAt: 2,
    status: "paused",
    companion: "fox",
    moodBefore: 4,
    gameContext: [],
    matchedMemoryIds: [],
    messages: [
      { id: "m-0", speaker: "user", content: "上次说到一半的那件事", createdAt: 1 },
      { id: "m-1", speaker: "owl", content: "分清事实和猜测。", createdAt: 2 },
    ],
  };
}

function put(paused: Session | null): void {
  useJournalStore.setState({ ready: true, persistent: false, memories: [], paused, getSession: async () => null });
}

beforeEach(() => {
  put(pausedSession());
  useTalkStore.getState().finish();
  useForestStore.setState({ gather: "idle", wanderPaused: false });
});

afterEach(cleanup);

describe("上次那件事", () => {
  it("没有暂存会话时什么都不问", () => {
    put(null);
    render(<PausedPrompt />);
    expect(screen.queryByTestId("paused-prompt")).toBeNull();
  });

  it("有暂存会话时古树问一句，并把上次那句摆出来", () => {
    render(<PausedPrompt />);
    expect(screen.getByText("上次那件事，还想接着聊吗？")).toBeTruthy();
    expect(screen.getByText("上次停在这句：「上次说到一半的那件事」")).toBeTruthy();
  });

  it("说「接着聊」就把上次那句带回倾诉框，大家重新聚拢", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PausedPrompt />);
    await user.click(screen.getByRole("button", { name: "接着聊" }));
    expect(screen.queryByTestId("paused-prompt")).toBeNull();
    expect(useTalkStore.getState().phase).toBe("mood");
    expect(useTalkStore.getState().text).toBe("上次说到一半的那件事");
    expect(useForestStore.getState().gather).not.toBe("idle");
  });

  it("说「先不用」就收起来，那一次还留在库里", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PausedPrompt />);
    await user.click(screen.getByRole("button", { name: "先不用" }));
    expect(screen.queryByTestId("paused-prompt")).toBeNull();
    expect(useTalkStore.getState().phase).toBe("away");
    expect(useJournalStore.getState().paused?.id).toBe("s-1");
  });
});
