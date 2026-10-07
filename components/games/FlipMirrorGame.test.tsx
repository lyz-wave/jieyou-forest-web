import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { forestAI } from "@/lib/ai";
import { REFRAME_LABELS, type ReframeVersion } from "@/lib/ai/types";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { FlipMirrorGame } from "./FlipMirrorGame";

vi.mock("@/lib/ai", () => ({
  forestAI: { splitThought: vi.fn(), reframe: vi.fn(), breakDown: vi.fn() },
}));

const VERSIONS: ReframeVersion[] = [
  { kind: "humor", text: "也许他把手机掉进火锅里了。" },
  { kind: "warm", text: "这次没回，不代表你不重要。" },
  { kind: "realistic", text: "他可能正忙，晚一点再问一次。" },
];

const THOUGHT = "他没回我消息，一定是讨厌我";

afterEach(() => {
  cleanup();
  useGameContextStore.getState().clear();
  vi.clearAllMocks();
});

async function flip(): Promise<void> {
  fireEvent.change(screen.getByLabelText("写下让你难受的想法"), { target: { value: THOUGHT } });
  fireEvent.click(screen.getByRole("button", { name: "翻一面" }));
  await screen.findByText(VERSIONS[0].text);
}

describe("翻面镜", () => {
  it("翻面后显示幽默、温柔、现实三个版本", async () => {
    vi.mocked(forestAI.reframe).mockResolvedValue({ versions: VERSIONS });
    render(<FlipMirrorGame onClose={vi.fn()} />);
    await flip();
    for (const version of VERSIONS) {
      expect(screen.getByText(version.text)).toBeInTheDocument();
      expect(screen.getByText(REFRAME_LABELS[version.kind])).toBeInTheDocument();
    }
    expect(vi.mocked(forestAI.reframe).mock.calls[0][0]).toBe(THOUGHT);
  });

  it("收藏一句后回到森林，才记下原来那句话和收藏的说法", async () => {
    vi.mocked(forestAI.reframe).mockResolvedValue({ versions: VERSIONS });
    const onClose = vi.fn();
    render(<FlipMirrorGame onClose={onClose} />);
    await flip();
    const collect = screen.getByRole("button", { name: "收藏" + REFRAME_LABELS.warm });
    fireEvent.click(collect);
    expect(collect).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "回到森林" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(useGameContextStore.getState().entries).toEqual([
      "【翻面镜】原来的想法：" + THOUGHT + "；收藏的说法：温柔版：" + VERSIONS[1].text,
    ]);
  });

  it("没收藏就不产生记录", async () => {
    vi.mocked(forestAI.reframe).mockResolvedValue({ versions: VERSIONS });
    render(<FlipMirrorGame onClose={vi.fn()} />);
    await flip();
    fireEvent.click(screen.getByRole("button", { name: "回到森林" }));
    expect(useGameContextStore.getState().entries).toEqual([]);
  });

  it("空输入或超过 60 字时不能翻面", () => {
    render(<FlipMirrorGame onClose={vi.fn()} />);
    const button = screen.getByRole("button", { name: "翻一面" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("写下让你难受的想法"), { target: { value: "啊".repeat(61) } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("写下让你难受的想法"), { target: { value: THOUGHT } });
    expect(button).toBeEnabled();
  });
});