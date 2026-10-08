import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ANIMALS } from "@/lib/animals";
import { PaperPuppet } from "./PaperPuppet";

afterEach(cleanup);

function draw(props: {
  gesture?: "nod" | "ears" | "chin" | "think" | "smile" | null;
  gestureLoop?: boolean;
  reducedMotion?: boolean;
}) {
  return render(
    <PaperPuppet
      def={ANIMALS.bear.puppet}
      label="团团"
      shadow={{ dx: 0, dy: 2 }}
      reducedMotion={props.reducedMotion ?? false}
      gesture={props.gesture ?? null}
      gestureLoop={props.gestureLoop ?? false}
    />,
  );
}

describe("纸偶的小动作", () => {
  it("没有动作时标成 none", () => {
    draw({});
    expect(screen.getByRole("button", { name: "团团" })).toHaveAttribute("data-gesture", "none");
  });

  it("给了动作就把动作记在纸偶身上", () => {
    draw({ gesture: "chin" });
    expect(screen.getByRole("button", { name: "团团" })).toHaveAttribute("data-gesture", "chin");
  });

  it("减弱动画时也标出动作，只是不去播", () => {
    draw({ gesture: "nod", reducedMotion: true });
    expect(screen.getByRole("button", { name: "团团" })).toHaveAttribute("data-gesture", "nod");
  });
});
