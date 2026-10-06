import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore, __setProfileStoreForTest } from "@/lib/stores/app";
import { useSceneStore } from "@/lib/stores/scene";
import { createProfileStore } from "@/lib/db/profile";
import { Onboarding } from "./Onboarding";

afterEach(() => {
  cleanup();
  __setProfileStoreForTest(null);
  vi.restoreAllMocks();
});
beforeEach(() => {
  useSceneStore.setState({ reducedMotionOverride: true });
  useAppStore.setState({ phase: "onboarding", profile: null, persistent: true });
});

const reachNickname = async (): Promise<void> => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "走进森林" }));
  expect(screen.getByRole("heading", { name: "我是岁岁" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "你好，岁岁" }));
};

describe("Onboarding", () => {
  it("空白昵称不能继续，输入最多接受 12 个字符", async () => {
    render(<Onboarding />);
    await reachNickname();
    const input = screen.getByRole("textbox", { name: "你的昵称" });
    expect(screen.getByRole("button", { name: "继续" })).toBeDisabled();
    fireEvent.change(input, { target: { value: "　 " } });
    expect(screen.getByRole("button", { name: "继续" })).toBeDisabled();
    fireEvent.change(input, { target: { value: "🌱".repeat(13) } });
    expect(input).toHaveValue("🌱".repeat(12));
    expect(screen.getByRole("button", { name: "继续" })).toBeEnabled();
  });

  it("说明确认后展示七位伙伴，只有最后确认时才保存资料", async () => {
    const store = await createProfileStore("onboarding-flow");
    __setProfileStoreForTest(store);
    const user = userEvent.setup();
    render(<Onboarding />);
    await reachNickname();
    await user.type(screen.getByRole("textbox", { name: "你的昵称" }), " 小满 ");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByText(/这里不是心理治疗/)).toBeInTheDocument();
    expect(await store.load()).toBeNull();
    await user.click(screen.getByRole("button", { name: "我知道了" }));
    expect(screen.getAllByRole("radio")).toHaveLength(7);
    expect(screen.getByRole("button", { name: "一起入林" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /阿橘/ }));
    expect(await store.load()).toBeNull();
    await user.click(screen.getByRole("button", { name: "一起入林" }));
    await waitFor(() => expect(useAppStore.getState().phase).toBe("forest"));
    expect(await store.load()).toMatchObject({ nickname: "小满", companion: "fox" });
    expect((await store.load())?.onboardedAt).toBeGreaterThan(0);
  });

  it("刷新未完成的引导会回到第一步", async () => {
    const view = render(<Onboarding />);
    await reachNickname();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "小满" } });
    view.unmount();
    render(<Onboarding />);
    expect(screen.getByRole("button", { name: "走进森林" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("存储不可用时显示友好提示，并允许本次访问继续", async () => {
    useAppStore.setState({ persistent: false });
    render(<Onboarding />);
    expect(screen.getByRole("status")).toHaveTextContent("森林这次记不住你，关掉页面后需要重新认识哦");
    await reachNickname();
    expect(screen.getByRole("textbox", { name: "你的昵称" })).toBeInTheDocument();
  });
});
