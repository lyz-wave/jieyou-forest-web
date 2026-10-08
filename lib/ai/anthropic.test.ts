import { afterEach, describe, expect, it, vi } from "vitest";
import { ANIMAL_CAST } from "@/lib/animals";
import type { Prompt } from "@/lib/prompts";
import {
  DEFAULT_MODEL_LIGHT,
  DEFAULT_MODEL_MAIN,
  createServerAI,
  defaultServerAI,
  parseModelJson,
  type AiTransport,
  type TransportOptions,
} from "./anthropic";

const context = { nickname: "小满", companion: "fox" as const, text: "他两天没回我消息，他一定讨厌我了" };
const speeches = ANIMAL_CAST.map((animal) => ({ animal: animal.id, text: "我在。", mood: "gentle" }));
const summary = {
  heard: "他两天没回消息，这件事压得你很沉。",
  voices: [{ animal: "owl", point: "分清事实和猜测" }, { animal: "bear", point: "先照顾自己" }],
  thought: "沉默不等于答案。",
  nextStep: "今天先泡杯热的。",
  question: "今晚想怎么对自己？",
};

function spyTransport(value: unknown): { transport: AiTransport; calls: { prompt: Prompt; options: TransportOptions }[] } {
  const calls: { prompt: Prompt; options: TransportOptions }[] = [];
  const transport: AiTransport = async (prompt, options) => {
    calls.push({ prompt, options });
    return value;
  };
  return { transport, calls };
}

describe("服务端的一次模型调用", () => {
  it("圆桌用主模型，Prompt 是圆桌那套", async () => {
    const { transport, calls } = spyTransport({ speeches });
    const ai = createServerAI({ transport, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai.roundtable(context)).resolves.toEqual({ speeches });
    expect(calls[0].options.model).toBe("main-model");
    expect(calls[0].prompt.system).toContain("speeches");
    expect(calls[0].prompt.user).toContain(context.text);
  });

  it("总结与追问也用主模型，风险检测用轻量模型", async () => {
    const main = spyTransport(summary);
    const ai = createServerAI({ transport: main.transport, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai.summary(context)).resolves.toEqual(summary);
    expect(main.calls[0].options.model).toBe("main-model");

    const light = spyTransport({ risk: "crisis", reason: "提到了不想活" });
    const ai2 = createServerAI({ transport: light.transport, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai2.risk("我不想活了")).resolves.toEqual({ risk: "crisis", reason: "提到了不想活" });
    expect(light.calls[0].options.model).toBe("light-model");
    expect(light.calls[0].prompt.user).toContain("我不想活了");
  });

  it("追问会把目标动物写进 Prompt", async () => {
    const { transport, calls } = spyTransport({ speaker: "owl", text: "我们先把事实分开。" });
    const ai = createServerAI({ transport, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai.reply({ ...context, target: "owl" })).resolves.toEqual({ speaker: "owl", text: "我们先把事实分开。" });
    expect(calls[0].prompt.system).toContain("墨墨");
  });

  it("上游报错、返回形状不对，一律给 null（调用方走降级文案）", async () => {
    const boom: AiTransport = async () => {
      throw new Error("anthropic 500");
    };
    const ai = createServerAI({ transport: boom, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai.roundtable(context)).resolves.toBeNull();
    await expect(ai.summary(context)).resolves.toBeNull();
    await expect(ai.reply({ ...context, target: "tree" })).resolves.toBeNull();
    await expect(ai.risk("随便写点什么")).resolves.toBeNull();

    const garbage = spyTransport({ nope: true });
    const ai2 = createServerAI({ transport: garbage.transport, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai2.roundtable(context)).resolves.toBeNull();
    await expect(ai2.risk("随便写点什么")).resolves.toBeNull();
  });

  it("拆一拆、翻面镜、藏坚果也用主模型，各自校验形状", async () => {
    const bubbles = { bubbles: [{ id: "b1", text: "他两天没回我消息", answer: "fact" }] };
    const one = spyTransport(bubbles);
    const ai = createServerAI({ transport: one.transport, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai.splitThought("他两天没回我消息，他一定讨厌我了")).resolves.toEqual(bubbles);
    expect(one.calls[0].options.model).toBe("main-model");
    expect(one.calls[0].prompt.user).toContain("他两天没回我消息");
    expect(one.calls[0].prompt.system).toContain("bubbles");

    const versions = {
      versions: [
        { kind: "humor", text: "就当练手" },
        { kind: "warm", text: "你已经很努力了" },
        { kind: "realistic", text: "这次有几个地方没讲清" },
      ],
    };
    const two = spyTransport(versions);
    const ai2 = createServerAI({ transport: two.transport, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai2.reframe("我这次汇报搞砸了")).resolves.toEqual(versions);
    expect(two.calls[0].prompt.system).toContain("humor");

    const steps = { steps: ["先把开头两句写下来", "给他发一条消息", "设个闹钟提醒自己"] };
    const three = spyTransport(steps);
    const ai3 = createServerAI({ transport: three.transport, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai3.breakDown("我怕明天的汇报")).resolves.toEqual(steps);
    expect(three.calls[0].prompt.system).toContain("steps");
  });

  it("小游戏的响应形状不对，也给 null", async () => {
    const garbage = spyTransport({ nope: true });
    const ai = createServerAI({ transport: garbage.transport, modelMain: "main-model", modelLight: "light-model" });
    await expect(ai.splitThought("他两天没回我消息")).resolves.toBeNull();
    await expect(ai.reframe("我这次汇报搞砸了")).resolves.toBeNull();
    await expect(ai.breakDown("我怕明天的汇报")).resolves.toBeNull();
  });

  it("失败时不把用户写的话抛出去", async () => {
    const boom: AiTransport = async () => {
      throw new Error("upstream");
    };
    const ai = createServerAI({ transport: boom, modelMain: "main-model", modelLight: "light-model" });
    const result = await ai.roundtable(context).catch((error: unknown) => error);
    expect(result).toBeNull();
  });
});

describe("把模型的话读成 JSON", () => {
  it("纯 JSON、带围栏、前后有解释文字都能读出来", () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseModelJson('好的，结果如下：{"a":1}\n希望有帮助')).toEqual({ a: 1 });
  });

  it("读不出来就给 null", () => {
    expect(parseModelJson("")).toBeNull();
    expect(parseModelJson("   ")).toBeNull();
    expect(parseModelJson("我觉得他可能是生气了")).toBeNull();
    expect(parseModelJson("{不是 json}")).toBeNull();
  });
});

describe("默认实现", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("没有 Key 时返回 null：上层直接走降级，不发请求", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(defaultServerAI({})).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("有 Key 时给出实现，模型名从环境变量读，缺省用文档里的名字", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const ai = defaultServerAI({ ANTHROPIC_API_KEY: "test-key" });
    expect(ai).not.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(DEFAULT_MODEL_MAIN).toBe("claude-sonnet-5");
    expect(DEFAULT_MODEL_LIGHT).toBe("claude-haiku-4-5-20251001");
  });
});