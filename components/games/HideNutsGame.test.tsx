import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { forestAI } from "@/lib/ai";
import { EMPTY_HOARD_HINT, ENCOURAGE_ONE } from "@/lib/games/hide-nuts";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { HideNutsGame } from "./HideNutsGame";

vi.mock("@/lib/ai", () => ({
  forestAI: { splitThought: vi.fn(), reframe: vi.fn(), breakDown: vi.fn() },
}));

const STEPS = ["先回一封最要紧的邮件", "把要做的三件事写下来", "给自己倒一杯水"];
const TOPIC = "下周要做汇报";

afterEach(() => {
  cleanup();
  useGameContextStore.getState().clear();
  vi.clearAllMocks();
});

async function crack(): Promise<void> {
  fireEvent.change(screen.getByLabelText("写下让你焦虑的大事"), { target: { value: TOPIC } });
  fireEvent.click(screen.getByRole("button", { name: "啃一啃" }));
  await screen.findByText(STEPS[0]);
}

describe("藏坚果", () => {
  it("把愿意试的坚果放进树洞，点「就这些」跳跳打气并记账", async () => {
    vi.mocked(forestAI.breakDown).mockResolvedValue({ steps: STEPS });
    render(<HideNutsGame onClose={vi.fn()} />);
    await crack();
    fireEvent.click(screen.getByRole("button", { name: STEPS[0] }));
    fireEvent.click(screen.getByRole("button", { name: "树洞" }));
    fireEvent.click(screen.getByRole("button", { name: "就这些" }));
    expect(screen.getByTestId("nut-encourage")).toHaveTextContent(ENCOURAGE_ONE);
    expect(useGameContextStore.getState().entries).toEqual([
      "【藏坚果】让人焦虑的事：" + TOPIC + "；愿意尝试的小步骤：" + STEPS[0],
    ]);
  });

  it("一颗都没选时「就这些」不可用，跳跳会提示挑一颗最小的", async () => {
    vi.mocked(forestAI.breakDown).mockResolvedValue({ steps: STEPS });
    render(<HideNutsGame onClose={vi.fn()} />);
    await crack();
    expect(screen.getByRole("button", { name: "就这些" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(EMPTY_HOARD_HINT);
  });

  it("空输入或超过 60 字不能啃", () => {
    render(<HideNutsGame onClose={vi.fn()} />);
    const button = screen.getByRole("button", { name: "啃一啃" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("写下让你焦虑的大事"), { target: { value: "啊".repeat(61) } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("写下让你焦虑的大事"), { target: { value: TOPIC } });
    expect(button).toBeEnabled();
  });
});