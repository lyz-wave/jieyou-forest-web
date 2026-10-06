import { describe, expect, it } from "vitest";
import { ANIMALS } from "./animals";
import { validatePuppet } from "./puppet/types";

describe("ANIMALS", () => {
  for (const a of Object.values(ANIMALS)) {
    if (!a) continue;
    it(`${a.name} 的纸偶定义合法`, () => {
      expect(validatePuppet(a.puppet)).toEqual([]);
    });

    it(`${a.name} 的设定完整`, () => {
      for (const field of [a.name, a.species, a.mindset, a.summary, a.basis, a.tone, a.sample]) {
        expect(field.trim().length).toBeGreaterThan(0);
      }
    });
  }
});
