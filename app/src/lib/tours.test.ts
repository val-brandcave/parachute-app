import { describe, expect, it } from "vitest";
import { TOURS, tourForPath } from "./tours";

describe("tours", () => {
  it("ids unique", () => {
    expect(new Set(TOURS.map((t) => t.id)).size).toBe(TOURS.length);
  });
  it("first-review has 4 steps and completes tutorial", () => {
    const t = TOURS.find((x) => x.id === "first-review")!;
    expect(t.steps).toHaveLength(4);
    expect(t.completesStep).toBe("tutorial");
    expect(t.scope).toBe("run");
  });
  it("every target is a [data-tour=…] selector", () => {
    for (const t of TOURS) for (const s of t.steps) expect(s.target).toMatch(/^\[data-tour="[a-z0-9-]+"\]$/);
  });
  it("tourForPath('/configure/checklists') → checklists", () => {
    expect(tourForPath("/configure/checklists")?.id).toBe("checklists");
    expect(tourForPath("/configure/checklists/")?.id).toBe("checklists");
  });
  it("tourForPath('/reviews/x') → undefined (run tour is not a page chip)", () => {
    expect(tourForPath("/reviews/x")).toBeUndefined();
  });
  it("checklists and workbook-layouts have 2 steps", () => {
    expect(TOURS.find((t) => t.id === "checklists")!.steps).toHaveLength(2);
    expect(TOURS.find((t) => t.id === "workbook-layouts")!.steps).toHaveLength(2);
  });
});
