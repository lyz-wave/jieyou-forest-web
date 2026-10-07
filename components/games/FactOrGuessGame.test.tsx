import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { forestAI } from "@/lib/ai";
import type { ThoughtBubble } from "@/lib/ai/types";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { FactOrGuessGame } from "./FactOrGuessGame";

vi.mock("@/lib/ai", () => ({
  forestAI: { splitThought: vi.fn(), reframe: vi.fn(), breakDown: vi.fn() },
}));

const BUBBLES: ThoughtBubble[] = [
  { id: "b1", text: "他两天没回我消息", answer: "fact" },
  { id: "b2", text: "他一定讨厌我了", answer: "guess", trap: "mind-reading" },
];

const THOUGHT = "他没回我消息，我觉得他讨厌我";

afterEach(() => {
  cleanup();
  useGameContextStore.getState().clear();
  vi.clearAllMocks();
});

async function split(): Promise<void> {
  fireEvent.change(screen.getByLabelText("写下让你不安的话"), { target: { value: THOUGHT } });
  fireEvent.click(screen.getByRole("button", { name: "拆一拆" }));
  await screen.findByText(BUBBLES[0].text);
}

function place(text: string, zone: string): void {
  fireEvent.click(screen.getByRole("button", { name: text }));
  fireEvent.click(screen.getByRole("button", { name: zone }));
}

describe("事实还是猜测", () => {
  it("气泡分进两个树洞后给出点评，并记下猜测与思维陷阱", async () => {
    vi.mocked(forestAI.splitThought).mockResolvedValue({ bubbles: BUBBLES });
    render(<FactOrGuessGame onClose={vi.fn()} />);
    await split();
    expect(screen.getByRole("button", { name: "看看结果" })).toBeDisabled();
    place(BUBBLES[0].text, "事实树洞");
    place(BUBBLES[1].text, "事实树洞");
    const finish = screen.getByRole("button", { name: "看看结果" });
    expect(finish).toBeEnabled();
    fireEvent.click(finish);
    const review = screen.getByTestId("guess-review");
    expect(review).toHaveTextContent("这一个我倒觉得更像猜测——你能确定吗？");
    expect(review).toHaveTextContent("读心术");
    expect(review).not.toHaveTextContent("错了");
    expect(useGameContextStore.getState().entries).toEqual([
      "【事实还是猜测】困扰的话：" + THOUGHT + "；其中的猜测：他一定讨厌我了；可能的思维陷阱：读心术",
    ]);
  });

  it("放对了的气泡得到一句肯定", async () => {
    vi.mocked(forestAI.splitThought).mockResolvedValue({ bubbles: BUBBLES });
    render(<FactOrGuessGame onClose={vi.fn()} />);
    await split();
    place(BUBBLES[0].text, "事实树洞");
    place(BUBBLES[1].text, "猜测树洞");
    fireEvent.click(screen.getByRole("button", { name: "看看结果" }));
    const review = screen.getByTestId("guess-review");
    expect(review).not.toHaveTextContent("这一个我倒觉得更像");
    expect(review).toHaveTextContent("读心术");
  });

  it("可以一键填示例，空输入时不能提交", async () => {
    render(<FactOrGuessGame onClose={vi.fn()} />);
    const submit = screen.getByRole("button", { name: "拆一拆" });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "一键填示例" }));
    expect(screen.getByLabelText("写下让你不安的话")).not.toHaveValue("");
    expect(submit).toBeEnabled();
  });
});