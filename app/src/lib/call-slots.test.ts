import { describe, expect, test } from "vitest";
import { buildSlots, monthRange, slotLabel } from "./call-slots";

// Wed 11 Nov 2026, 12:00 Eastern (EST, UTC-5).
const NOW = Date.UTC(2026, 10, 11, 17, 0);

describe("buildSlots", () => {
  test("from Wed 11 Nov: Thu 12 Â· Fri 13 Â· Mon 16 Â· Tue 17 Â· Wed 18", () => {
    expect(buildSlots(NOW).map((d) => d.day.label)).toEqual([
      "Thu 12",
      "Fri 13",
      "Mon 16",
      "Tue 17",
      "Wed 18",
    ]);
  });

  test("8 times per day, in order, with the lunch gap", () => {
    const days = buildSlots(NOW);
    for (const d of days) expect(d.times).toHaveLength(8);
    expect(days[1].times.map((t) => t.label)).toEqual([
      "9:00 AM",
      "9:30 AM",
      "10:00 AM",
      "10:30 AM",
      "1:00 PM",
      "1:30 PM",
      "2:30 PM",
      "3:00 PM",
    ]);
  });

  test("late evening Eastern still starts tomorrow", () => {
    // Wed 11 Nov 23:30 ET = Thu 04:30 UTC
    const late = Date.UTC(2026, 10, 12, 4, 30);
    expect(buildSlots(late)[0].day.label).toBe("Thu 12");
  });

  test("a Saturday starts on Monday", () => {
    const sat = Date.UTC(2026, 10, 14, 17, 0);
    expect(buildSlots(sat)[0].day.label).toBe("Mon 16");
  });
});

describe("slotLabel", () => {
  test("Fri 13 Nov 10:00 AM Eastern", () => {
    const at = buildSlots(NOW)[1].times[2].at;
    expect(at).toBe(Date.UTC(2026, 10, 13, 15, 0));
    expect(slotLabel(at)).toBe("Fri, Nov 13 at 10:00 AM");
  });
});

describe("monthRange", () => {
  test("one month", () => {
    expect(monthRange(buildSlots(NOW).map((d) => d.day.date))).toBe("November 2026");
  });
  test("from Fri 27 Nov 2026 the range crosses into December", () => {
    const fri = Date.UTC(2026, 10, 27, 17, 0);
    const days = buildSlots(fri);
    expect(days.map((d) => d.day.label)).toEqual(["Mon 30", "Tue 1", "Wed 2", "Thu 3", "Fri 4"]);
    expect(monthRange(days.map((d) => d.day.date))).toBe("November – December 2026");
  });
  test("year boundary", () => {
    const d = buildSlots(Date.UTC(2026, 11, 29, 17, 0));
    expect(monthRange(d.map((x) => x.day.date))).toBe("December 2026 – January 2027");
  });
});
