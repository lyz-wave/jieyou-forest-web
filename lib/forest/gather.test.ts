import { describe, expect, it } from "vitest";
import type { AnimalId } from "../animals";
import { clearingCenter, gatherSeats, GATHER_ORDER } from "./gather";
import { groundY, inStream, sizeAt } from "./ground";
import { HABITS } from "./territory";

describe("gatherSeats", () => {
  for (const layout of ["portrait", "landscape"] as const) {
    for (const companion of ["fox", "bear", "owl"] as AnimalId[]) {
      it(`${layout}，伙伴是 ${companion}`, () => {
        const seats = gatherSeats(companion, layout);
        const center = clearingCenter();
        // 每只动物一个座位
        expect(Object.keys(seats).sort()).toEqual([...GATHER_ORDER].sort());
        for (const s of Object.values(seats)) {
          // 都坐在草地上，不在水里
          expect(s.pos.y).toBeCloseTo(groundY(s.pos.depth), 5);
          expect(inStream(s.pos.x, s.pos.depth)).toBe(false);
          // 面朝空地中心（篝火 / 阳光）
          if (s.pos.x < center.x - 1) expect(s.facing).toBe("right");
          if (s.pos.x > center.x + 1) expect(s.facing).toBe("left");
        }
        // 中心前方留空：没有动物坐在中心正前方挡住篝火
        for (const s of Object.values(seats)) {
          const inFront = s.pos.depth < center.depth;
          if (inFront) expect(Math.abs(s.pos.x - center.x)).toBeGreaterThan(40);
        }
        // 伙伴坐在最靠近中心的位置之一（左右第一个）
        const dist = (id: AnimalId) => Math.abs(seats[id].pos.x - center.x);
        const sorted = (Object.keys(seats) as AnimalId[]).sort((a, b) => dist(a) - dist(b));
        expect(sorted.slice(0, 2)).toContain(companion);
        // 同一侧相邻两只不会叠成一团：外侧的往后退（被内侧的挡住一部分没关系），横向至少错开 40% 身宽
        for (const side of [-1, 1]) {
          const row = (Object.entries(seats) as [AnimalId, (typeof seats)[AnimalId]][])
            .filter(([, s]) => Math.sign(s.pos.x - center.x) === side)
            .sort((a, b) => Math.abs(a[1].pos.x) - Math.abs(b[1].pos.x));
          for (let i = 1; i < row.length; i++) {
            const [ida, a] = row[i - 1];
            const [idb, b] = row[i];
            const k = sizeAt((a.pos.depth + b.pos.depth) / 2);
            const minGap = (HABITS[ida].size[layout] + HABITS[idb].size[layout]) * k * 0.2;
            expect(Math.abs(b.pos.x - a.pos.x)).toBeGreaterThan(minGap);
            expect(b.pos.depth).toBeGreaterThanOrEqual(a.pos.depth);
          }
        }
      });
    }
  }

  it("竖屏时所有座位都在手机能看到的范围内", () => {
    for (const s of Object.values(gatherSeats("fox", "portrait"))) {
      expect(Math.abs(s.pos.x)).toBeLessThan(205);
    }
  });
});
