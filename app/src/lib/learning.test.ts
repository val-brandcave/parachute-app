import { describe, expect, it } from "vitest";
import { GUIDES, VIDEOS, stepVideo as reStepVideo, videoForStep } from "./learning";
import { SETUP_STEPS } from "./setup-steps";
import { stepVideo } from "./guides";

describe("learning catalog", () => {
  it("every Get started step has a video", () => {
    for (const s of SETUP_STEPS) expect(videoForStep(s.id), s.id).toBeDefined();
  });
  it("durations are m:ss", () => {
    for (const v of VIDEOS) expect(v.duration).toMatch(/^\d{1,2}:[0-5]\d$/);
  });
  it("audience ∈ admin|reviewer|everyone", () => {
    for (const x of [...VIDEOS, ...GUIDES]) expect(["admin", "reviewer", "everyone"]).toContain(x.audience);
  });
  it("stepVideo re-export matches lib/guides", () => {
    expect(reStepVideo).toBe(stepVideo);
  });
  it("ids unique", () => {
    expect(new Set(VIDEOS.map((v) => v.id)).size).toBe(VIDEOS.length);
  });
});
