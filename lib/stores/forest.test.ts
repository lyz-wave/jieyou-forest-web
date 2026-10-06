import { beforeEach, describe, expect, it } from "vitest";
import { useForestStore } from "./forest";

describe("useForestStore 聚拢状态", () => {
  beforeEach(() => useForestStore.setState({ gather: "idle", pending: 0 }));

  it("所有动物到位后进入 seated", () => {
    const s = useForestStore.getState();
    s.startGather(3);
    expect(useForestStore.getState().gather).toBe("gathering");
    s.arrived();
    s.arrived();
    expect(useForestStore.getState().gather).toBe("gathering");
    s.arrived();
    expect(useForestStore.getState().gather).toBe("seated");
  });

  it("散开后回到 idle", () => {
    const s = useForestStore.getState();
    s.startDisperse(2);
    s.arrived();
    s.arrived();
    expect(useForestStore.getState().gather).toBe("idle");
  });

  it("多余的 arrived 不会让计数变成负数", () => {
    const s = useForestStore.getState();
    s.startGather(1);
    s.arrived();
    s.arrived();
    expect(useForestStore.getState().pending).toBe(0);
    expect(useForestStore.getState().gather).toBe("seated");
  });
});
