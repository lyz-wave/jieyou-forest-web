import { describe, expect, it } from "vitest";
import type { ReframeVersion } from "@/lib/ai/types";
import { flipMirrorContext, toggleCollection } from "./flip-mirror";

const warm: ReframeVersion = { kind: "warm", text: "你对朋友也会这么苛刻吗？" };
const humor: ReframeVersion = { kind: "humor", text: "要不先颁个「最严格评委奖」给自己？" };

describe("翻面镜的收藏与记录", () => {
  it("没收藏任何一句就不产生 gameContext", () => {
    expect(flipMirrorContext("我什么都做不好", [])).toBeNull();
  });

  it("收藏了就用「原来的想法 + 收藏的说法」记录", () => {
    expect(flipMirrorContext("我什么都做不好", [warm])).toBe(
      "原来的想法：我什么都做不好；收藏的说法：温柔版：你对朋友也会这么苛刻吗？",
    );
  });

  it("收藏多句时用「；」连起来，顺序按收藏先后", () => {
    expect(flipMirrorContext("我什么都做不好", [warm, humor])).toBe(
      "原来的想法：我什么都做不好；收藏的说法：温柔版：你对朋友也会这么苛刻吗？；幽默版：要不先颁个「最严格评委奖」给自己？",
    );
  });

  it("同一句再点一次取消收藏", () => {
    const once = toggleCollection([], warm);
    expect(once).toEqual([warm]);
    expect(toggleCollection(once, warm)).toEqual([]);
  });

  it("按版本种类去重（同一种只有一句）", () => {
    const other: ReframeVersion = { kind: "warm", text: "换一句温柔的" };
    expect(toggleCollection([warm], other)).toEqual([other]);
  });
});