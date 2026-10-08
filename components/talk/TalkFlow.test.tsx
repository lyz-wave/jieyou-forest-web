import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GatherControls } from "@/components/forest/GatherControls";
import { Particles } from "@/components/scene/Particles";
import { AI_FAILURE_LINE } from "@/lib/ai/types";
import type { RiskResult, RoundtableResult, TreeSummary } from "@/lib/ai/schema";
import { TALK_MAX } from "@/lib/ai/request";
import { useForestStore } from "@/lib/stores/forest";
import { useSceneStore } from "@/lib/stores/scene";
import type { MemoryDraft } from "@/lib/journal/types";
import { useJournalStore } from "@/lib/stores/journal";
import { useTalkStore } from "@/lib/stores/talk";
import { TalkFlow } from "./TalkFlow";

afterEach(cleanup);

const api = vi.hoisted(() => ({
  roundtable: vi.fn<(context: unknown) => Promise<RoundtableResult>>(),
  summary: vi.fn<(context: unknown) => Promise<TreeSummary>>(),
  reply: vi.fn<(context: unknown, target: unknown) => Promise<{ speaker: "owl" | "tree"; text: string }>>(),
  risk: vi.fn<(text: string) => Promise<RiskResult>>(),
  memory: vi.fn<(context: unknown) => Promise<MemoryDraft>>(),
}));

vi.mock("@/lib/talk/client", () => ({ talkApi: api }));

const SPEECHES: RoundtableResult = {
  speeches: [
    { animal: "owl", text: "事实和猜测可以分开看。", mood: "thinking" },
    { animal: "bear", text: "先对自己好一点。", mood: "gentle" },
  ],
};

const SUMMARY: TreeSummary = {
  heard: "我听见你说，汇报搞砸了，你觉得自己不行。",
  voices: [{ animal: "owl", point: "分开看" }, { animal: "bear", point: "对自己好一点" }],
  thought: "一次汇报不等于你这个人。",
  nextStep: "明天先写三行提纲。",
  question: "如果是朋友搞砸了，你会怎么说他？",
};

const DRAFT: MemoryDraft = {
  title: "汇报搞砸了",
  summary: "一次汇报没做好，觉得自己整个人不行。",
  emotions: ["委屈", "疲惫"],
  themes: ["工作压力"],
  coreBelief: "我不行",
  shift: { from: "我整个人不行", to: "一次没做好" },
  insight: "我可以做得不好，也还是我。",
  action: "明天先写三行提纲",
};

function forest(): void {
  render(
    <>
      <GatherControls count={7} />
      <TalkFlow />
    </>,
  );
}

async function enter(user: ReturnType<typeof userEvent.setup>, text: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: /开始倾诉/ }));
  await user.type(screen.getByLabelText("想说的话"), text);
  await user.click(screen.getByRole("button", { name: "说给它听" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  useTalkStore.getState().finish();
  useForestStore.setState({ gather: "idle", companion: "fox" });
  useSceneStore.setState({ reducedMotionOverride: null });
  api.roundtable.mockResolvedValue(SPEECHES);
  api.summary.mockResolvedValue(SUMMARY);
  api.reply.mockResolvedValue({ speaker: "owl", text: "那我们先分一分。" });
  api.risk.mockResolvedValue({ risk: "none" });
  api.memory.mockResolvedValue(DRAFT);
});

describe("一次倾诉走到底", () => {
  it("从「开始倾诉」进写字，空着不能提交，写满到上限", async () => {
    const user = userEvent.setup({ delay: null });
    forest();
    await user.click(screen.getByRole("button", { name: /开始倾诉/ }));
    expect(screen.getByRole("heading", { name: "想说点什么？" })).toBeTruthy();
    expect(screen.getByRole("group", { name: /现在的心情/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "说给它听" })).toHaveProperty("disabled", true);
    const long = "字".repeat(TALK_MAX + 5);
    const box = screen.getByLabelText("想说的话");
    await user.click(box);
    await user.paste(long);
    await waitFor(() => {
      expect(box).toHaveValue("字".repeat(TALK_MAX));
    });
    expect(screen.getByTestId("talk-count").textContent).toBe(TALK_MAX + "/" + TALK_MAX);
  });

  it("写一句提交：一只一只说，圈一句，最后古树总结，结束回到森林", async () => {
    const user = userEvent.setup({ delay: null });
    forest();
    await enter(user, "这次汇报我觉得搞砸了。");
    await waitFor(() => {
      expect(screen.queryByText("墨墨")).toBeTruthy();
    });
    expect(screen.getAllByTestId("talk-speech")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "下一位" }));
    expect(screen.getAllByTestId("talk-speech")).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: /说到心里了/ })[0]);
    expect(useTalkStore.getState().marked).toEqual(["owl"]);
    await user.click(screen.getByRole("button", { name: "听听古树怎么说" }));
    expect(await screen.findByTestId("summary-question")).toBeTruthy();
    expect(screen.getByTestId("summary-heard").textContent).toBe(SUMMARY.heard);
    await user.click(screen.getByRole("button", { name: "先放一放" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "岁岁说" })).toBeNull();
    });
    expect(useTalkStore.getState().phase).toBe("away");
    expect(useTalkStore.getState().text).toBe("");
    expect(useForestStore.getState().gather).toBe("dispersing");
  });

  it("说到不想活这类话：岁岁先说话，求助卡给号码，确认安全之后才继续", async () => {
    const user = userEvent.setup({ delay: null });
    forest();
    await enter(user, "我不想活了。");
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "先停一下，我们慢慢来" })).toBeTruthy();
    expect(screen.getByText("12356")).toBeTruthy();
    expect(screen.getByText("400-161-9995")).toBeTruthy();
    expect(api.risk).not.toHaveBeenCalled();
    const go = screen.getByRole("button", { name: "我还想说，继续吧" });
    expect(go).toHaveProperty("disabled", true);
    await user.click(screen.getByRole("checkbox"));
    expect(go).toHaveProperty("disabled", false);
    await user.click(go);
    expect(useTalkStore.getState().phase).toBe("listening");
  });

  it("圆桌没接上：降级话 + 再试一次，写的内容没丢", async () => {
    const user = userEvent.setup({ delay: null });
    api.roundtable.mockRejectedValueOnce(new Error("down"));
    forest();
    await enter(user, "我还是想不通。");
    expect(await screen.findByText(AI_FAILURE_LINE)).toBeTruthy();
    expect(useTalkStore.getState().text).toBe("我还是想不通。");
    expect(useTalkStore.getState().phase).toBe("roundtable");
    await user.click(screen.getByRole("button", { name: "再试一次" }));
    await waitFor(() => {
      expect(screen.getAllByTestId("talk-speech").length).toBeGreaterThan(0);
    });
  });

  it("总结之后还能追问，@墨墨 就把话交到墨墨手上", async () => {
    const user = userEvent.setup({ delay: null });
    forest();
    await enter(user, "这次汇报我觉得搞砸了。");
    await waitFor(() => {
      expect(screen.getAllByTestId("talk-speech").length).toBeGreaterThan(0);
    });
    await user.click(screen.getByRole("button", { name: "全部显示" }));
    await user.click(screen.getByRole("button", { name: "我还想说一句" }));
    await user.type(screen.getByLabelText(/想跟谁说一句/), "@墨墨 那我要怎么跟领导说？");
    expect(screen.getByText(/这句话会交给：墨墨/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "说出去" }));
    expect(await screen.findByTestId("talk-reply")).toBeTruthy();
    expect(api.reply.mock.calls[0][1]).toBe("owl");
  });

  it("开了减弱动画：照样走到圆桌，路上没有跳动的小点", async () => {
    const user = userEvent.setup({ delay: null });
    useSceneStore.setState({ reducedMotionOverride: true });
    forest();
    await enter(user, "今天有点累。");
    await waitFor(() => {
      expect(screen.getAllByTestId("talk-speech").length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByTestId("talk-dot")).toHaveLength(0);
  });
});

describe("聆听时森林安静下来", () => {
  it("纸屑会暂停，减弱动画时干脆不渲染", () => {
    const paused = render(<Particles count={6} night={false} reducedMotion={false} quiet />);
    expect(paused.container.querySelector("[data-paused]")?.getAttribute("data-paused")).toBe("true");
    paused.unmount();
    const none = render(<Particles count={6} night={false} reducedMotion quiet />);
    expect(none.container.querySelector("[data-testid=particles]")).toBeNull();
  });
});
describe("只用键盘", () => {
  /** 一路 Tab 到目标，最多 30 次（焦点只在卡片里转，总能转到） */
  async function tabTo(user: ReturnType<typeof userEvent.setup>, target: HTMLElement): Promise<void> {
    let guard = 0;
    while (document.activeElement !== target && guard < 30) {
      await user.tab();
      guard += 1;
    }
    expect(document.activeElement).toBe(target);
  }

  it("Tab 走到输入框、打字、再 Tab 到提交，回车就发出去", async () => {
    const user = userEvent.setup({ delay: null });
    forest();
    await user.click(screen.getByRole("button", { name: /开始倾诉/ }));
    const box = await screen.findByLabelText("想说的话");
    let guard = 0;
    while (document.activeElement !== box && guard < 25) {
      await user.tab();
      guard += 1;
    }
    expect(document.activeElement).toBe(box);
    await user.keyboard("键盘走一遍");
    const submit = screen.getByRole("button", { name: "说给它听" });
    let more = 0;
    while (document.activeElement !== submit && more < 25) {
      await user.tab();
      more += 1;
    }
    expect(document.activeElement).toBe(submit);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(useTalkStore.getState().phase).toBe("roundtable"));
  });

  it("一路键盘走完：打分、下一位、一起说完、总结、@ 追问、结束", async () => {
    const user = userEvent.setup({ delay: null });
    forest();

    // 空格键与回车都能按按钮；这里用回车
    const start = screen.getByRole("button", { name: /开始倾诉/ });
    start.focus();
    await user.keyboard("{Enter}");

    const mood = screen.getByRole("button", { name: "心情 5 分" });
    await tabTo(user, mood);
    await user.keyboard("{Enter}");
    expect(mood.getAttribute("aria-pressed")).toBe("true");

    const box = screen.getByLabelText("想说的话");
    await tabTo(user, box);
    await user.keyboard("键盘走一遍");
    const submit = screen.getByRole("button", { name: "说给它听" });
    await tabTo(user, submit);
    await user.keyboard("{Enter}");

    const next = await screen.findByRole("button", { name: "下一位" });
    await tabTo(user, next);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getAllByTestId("talk-speech")).toHaveLength(2));

    // 两条都出来了，两个按钮换成「听听古树怎么说」与「我还想说一句」
    const ask = await screen.findByRole("button", { name: "听听古树怎么说" });
    await tabTo(user, ask);
    await user.keyboard("{Enter}");
    expect(await screen.findByTestId("summary-heard")).toBeTruthy();

    const more = screen.getByRole("button", { name: "我还想说一句" });
    await tabTo(user, more);
    await user.keyboard("{Enter}");

    const follow = await screen.findByLabelText(/想跟谁说一句/);
    await tabTo(user, follow);
    await user.keyboard("@墨墨 我还是想不通");
    const send = screen.getByRole("button", { name: "说出去" });
    await tabTo(user, send);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(api.reply).toHaveBeenCalledTimes(1));
    expect(api.reply.mock.calls[0][1]).toBe("owl");

    // 第三阶段起「心结解开了」先去打分页；键盘这条路走「先放一放」，把这一次存下来回森林
    const done = screen.getByRole("button", { name: "先放一放" });
    await tabTo(user, done);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(useTalkStore.getState().phase).toBe("away"));
  });
});

describe("点头像点名", () => {
  async function toFollowUp(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    await enter(user, "这次汇报我觉得搞砸了。");
    await waitFor(() => {
      expect(screen.getAllByTestId("talk-speech").length).toBeGreaterThan(0);
    });
    await user.click(screen.getByRole("button", { name: "全部显示" }));
    await user.click(screen.getByRole("button", { name: "我还想说一句" }));
  }

  it("不点谁就交给岁岁，点了墨墨就交给墨墨", async () => {
    const user = userEvent.setup({ delay: null });
    forest();
    await toFollowUp(user);

    expect(screen.getByText(/这句话会交给：岁岁（默认）/)).toBeTruthy();
    await user.type(screen.getByLabelText(/想跟谁说一句/), "第一句");
    await user.click(screen.getByRole("button", { name: "说出去" }));
    await waitFor(() => {
      expect(api.reply).toHaveBeenCalledTimes(1);
    });
    expect(api.reply.mock.calls[0][1]).toBe("tree");

    const owl = screen.getByRole("button", { name: "问 墨墨" });
    await user.click(owl);
    expect(owl.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/这句话会交给：墨墨/)).toBeTruthy();
    await user.type(screen.getByLabelText(/想跟谁说一句/), "第二句");
    await user.click(screen.getByRole("button", { name: "说出去" }));
    await waitFor(() => {
      expect(api.reply).toHaveBeenCalledTimes(2);
    });
    expect(api.reply.mock.calls[1][1]).toBe("owl");
    expect((api.reply.mock.calls[1][0] as { text: string }).text).toBe("第二句");
  });

  it("写了 @名字 时以文字为准，头像只是备选", async () => {
    const user = userEvent.setup({ delay: null });
    forest();
    await toFollowUp(user);

    await user.click(screen.getByRole("button", { name: "问 团团" }));
    await user.type(screen.getByLabelText(/想跟谁说一句/), "@墨墨 你说呢");
    expect(screen.getByText(/这句话会交给：墨墨/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "说出去" }));
    await waitFor(() => {
      expect(api.reply).toHaveBeenCalledTimes(1);
    });
    expect(api.reply.mock.calls[0][1]).toBe("owl");
    expect((api.reply.mock.calls[0][0] as { text: string }).text).toBe("你说呢");
  });
});

describe("让大家再说说", () => {
  it("在总结里点它：再请一轮圆桌，说过的从头看起", async () => {
    const user = userEvent.setup({ delay: null });
    forest();
    await enter(user, "这次汇报我觉得搞砸了。");
    await waitFor(() => {
      expect(screen.getAllByTestId("talk-speech").length).toBeGreaterThan(0);
    });
    await user.click(screen.getByRole("button", { name: "全部显示" }));
    await user.click(screen.getByRole("button", { name: "听听古树怎么说" }));
    expect(await screen.findByTestId("summary-heard")).toBeTruthy();
    expect(api.roundtable).toHaveBeenCalledTimes(1);
    expect((api.roundtable.mock.calls[0][0] as { history: unknown[] }).history).toEqual([]);

    await user.click(screen.getByRole("button", { name: "让大家再说说" }));
    await waitFor(() => {
      expect(api.roundtable).toHaveBeenCalledTimes(2);
    });
    const second = api.roundtable.mock.calls[1][0] as { text: string; history: { speaker: string; content: string }[] };
    expect(second.text).toBe("这次汇报我觉得搞砸了。");
    expect(second.history.map((line) => line.content)).toContain("事实和猜测可以分开看。");
    // 新一轮从第一句看起，不是停在上一轮的「全部显示」
    expect(useTalkStore.getState().shown).toBe(1);
    expect(useTalkStore.getState().all).toBe(false);
    await waitFor(() => {
      expect(screen.getAllByTestId("talk-speech")).toHaveLength(1);
    });
  });
});

describe("心结解开了之后", () => {
  beforeEach(async () => {
    await useJournalStore.getState().load();
    await useJournalStore.getState().clear();
  });

  async function toSummary(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    forest();
    await user.click(screen.getByRole("button", { name: /开始倾诉/ }));
    await user.click(screen.getByRole("button", { name: "心情 4 分" }));
    await user.type(screen.getByLabelText("想说的话"), "这次汇报我觉得搞砸了。");
    await user.click(screen.getByRole("button", { name: "说给它听" }));
    await waitFor(() => {
      expect(screen.getByTestId("talk-speech")).toBeTruthy();
    });
    await user.click(screen.getByRole("button", { name: "全部显示" }));
    await user.click(screen.getByRole("button", { name: "听听古树怎么说" }));
    await waitFor(() => {
      expect(screen.getByTestId("summary-heard")).toBeTruthy();
    });
  }

  it("再打一次分，年轮长出新的一圈，成长卡片把这一次收进来", async () => {
    const user = userEvent.setup({ delay: null });
    await toSummary(user);
    await user.click(screen.getByRole("button", { name: "心结解开了" }));
    expect(screen.getByRole("heading", { name: "现在心里松一点了吗？" })).toBeTruthy();
    expect(screen.getByText("进来的时候是 4 分。")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "心情 8 分" }));
    await user.click(screen.getByRole("button", { name: "看看这次留下了什么" }));
    await waitFor(() => {
      expect(screen.getByTestId("growth-card")).toBeTruthy();
    });
    expect(screen.getByTestId("growth-mood").textContent).toContain("8");
    expect(screen.getByTestId("growth-card").textContent).toContain("从「我整个人不行」到「一次没做好」");
    expect(api.memory).toHaveBeenCalledTimes(1);
    const asked = api.memory.mock.calls[0][0] as { moodAfter?: number; text?: string };
    expect(asked.moodAfter).toBe(8);
    expect(asked.text).toBe("这次汇报我觉得搞砸了。");
    const memories = useJournalStore.getState().memories;
    expect(memories.length).toBe(1);
    expect(memories[0].moodBefore).toBe(4);
    expect(memories[0].moodAfter).toBe(8);
    expect(useJournalStore.getState().paused).toBeNull();
    await user.click(screen.getByRole("button", { name: "收好，回到森林" }));
    expect(useTalkStore.getState().phase).toBe("away");
  });

  it("先放一放：这一次先留在库里，回森林不沉淀", async () => {
    const user = userEvent.setup({ delay: null });
    await toSummary(user);
    await user.click(screen.getByRole("button", { name: "先放一放" }));
    await waitFor(() => {
      expect(useJournalStore.getState().paused).not.toBeNull();
    });
    expect(useJournalStore.getState().paused?.status).toBe("paused");
    expect(useJournalStore.getState().paused?.messages.length).toBeGreaterThan(1);
    expect(useJournalStore.getState().memories).toEqual([]);
    expect(api.memory).not.toHaveBeenCalled();
    expect(useTalkStore.getState().phase).toBe("away");
  });
});
