import { describe, expect, it } from "vitest";
import type { AnimalId } from "../animals";
import { gatherSeats } from "./gather";
import { groundY } from "./ground";
import { PODIUM_DEPTH, podiumPlan, podiumSpot } from "./podium";
import { CLEARING } from "./territory";

describe("podiumSpot", () => {
  it("在空地正中、比所有座位都靠近镜头", () => {
    const spot = podiumSpot();
    expect(spot.x).toBe(CLEARING.x);
    expect(spot.y).toBeCloseTo(groundY(PODIUM_DEPTH));
    expect(spot.depth).toBeLessThan(CLEARING.depth);
    for (const layout of ["portrait", "landscape"] as const) {
      for (const seat of Object.values(gatherSeats("fox", layout))) {
        expect(spot.depth).toBeLessThan(seat.pos.depth);
      }
    }
  });
});

describe("podiumPlan", () => {
  const seats = gatherSeats("fox", "portrait");

  it("该发言的那只走到前面，朝向跟座位一致", () => {
    const plan = podiumPlan(seats, "owl");
    expect(plan).not.toBeNull();
    expect(plan?.speaker).toBe("owl");
    expect(plan?.to).toEqual(podiumSpot());
    expect(plan?.facing).toBe(seats.owl.facing);
  });

  it("没人在说、或者这只没有座位时谁也不动", () => {
    expect(podiumPlan(seats, null)).toBeNull();
    expect(podiumPlan({} as Record<AnimalId, never>, "bear")).toBeNull();
  });
});