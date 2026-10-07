import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ANIMAL_CAST, ANIMALS } from "@/lib/animals";
import { puppetColors } from "@/lib/puppet/types";
import { PuppetMark } from "./PuppetMark";

describe("PuppetMark：把纸偶缩小成的标记", () => {
  it("每只动物和古树都画得出来：一张 aria-hidden 的纸偶，尺寸由 size 决定", () => {
    for (const a of [...ANIMAL_CAST, ANIMALS.tree]) {
      const { container, unmount } = render(<PuppetMark id={a.id} size={24} />);
      const box = container.firstElementChild as HTMLElement;
      expect(box.getAttribute("aria-hidden"), `${a.id} 的标记应当对读屏隐藏`).toBe("true");
      expect(box.style.width).toBe("24px");
      expect(box.style.height).toBe("24px");
      expect(box.querySelector("svg"), `${a.id} 的标记里应当有 SVG`).toBeTruthy();
      unmount();
    }
  });

  it("用的是这套纸偶自己的纸色，而不是字体里的彩色符号", () => {
    const { container } = render(<PuppetMark id="turtle" size={32} />);
    const fills = [...container.querySelectorAll("path")].map((p) => p.getAttribute("fill"));
    expect(fills).toContain(puppetColors(ANIMALS.turtle.puppet)[0]);
  });

  it("自己不产出文字，读屏只会读到旁边的名字", () => {
    const { container } = render(<PuppetMark id="fox" size={32} />);
    expect(container.textContent).toBe("");
  });
});
