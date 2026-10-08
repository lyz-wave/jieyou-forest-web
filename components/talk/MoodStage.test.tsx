import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MoodStage } from "./MoodStage";
import { useTalkStore } from "@/lib/stores/talk";

beforeEach(() => {
  useTalkStore.getState().finish();
});

afterEach(cleanup);

function box(): HTMLTextAreaElement {
  return screen.getByLabelText("想说的话") as HTMLTextAreaElement;
}

describe("倾诉框", () => {
  it("平常进来时是空的", () => {
    useTalkStore.getState().open();
    render(<MoodStage onSpeak={() => undefined} />);
    expect(box().value).toBe("");
  });

  it("从「上次那件事」接着聊时，框里已经放着上次那句", () => {
    useTalkStore.getState().open();
    useTalkStore.getState().setText("上次说到一半的那件事");
    render(<MoodStage onSpeak={() => undefined} />);
    expect(box().value).toBe("上次说到一半的那件事");
  });
});
