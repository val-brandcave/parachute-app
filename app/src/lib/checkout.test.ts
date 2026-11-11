import { describe, expect, it } from "vitest";
import { checkoutHref, initialChoice, parseCheckoutQuery, safeReturn } from "./checkout";
import { CUSTOM_CREDITS, DEFAULT_PACK_ID } from "./pricing";

describe("safeReturn", () => {
  it("/reviews/abc kept", () => expect(safeReturn("/reviews/abc")).toBe("/reviews/abc"));
  it("//evil.example → /configure/billing", () => expect(safeReturn("//evil.example")).toBe("/configure/billing"));
  it("https://x → /configure/billing", () => expect(safeReturn("https://x")).toBe("/configure/billing"));
  it("/checkout/credits → /configure/billing", () =>
    expect(safeReturn("/checkout/credits")).toBe("/configure/billing"));
  it("empty → /configure/billing", () => {
    expect(safeReturn("")).toBe("/configure/billing");
    expect(safeReturn(null)).toBe("/configure/billing");
  });
  it("backslash trick → /configure/billing", () => expect(safeReturn("/\\evil.example")).toBe("/configure/billing"));
});

describe("initialChoice", () => {
  it("1 → custom 1", () => expect(initialChoice(1)).toEqual({ credits: 1 }));
  it("5 → pack5", () => expect(initialChoice(5)).toEqual({ pack: "pack5" }));
  it("6 → pack10", () => expect(initialChoice(6)).toEqual({ pack: "pack10" }));
  it("undefined → DEFAULT_PACK_ID", () => expect(initialChoice()).toEqual({ pack: DEFAULT_PACK_ID }));
  it("30 → custom 30", () => expect(initialChoice(30)).toEqual({ credits: 30 }));
});

describe("checkoutHref", () => {
  it("encodes return and types", () => {
    expect(checkoutHref({ credits: 1, returnTo: "/reviews/r-1", types: ["technical", "administrative"] })).toBe(
      "/checkout/credits?credits=1&return=%2Freviews%2Fr-1&types=technical%2Cadministrative",
    );
  });
  it("pack with no extras", () => expect(checkoutHref({ pack: "pack10" })).toBe("/checkout/credits?pack=pack10"));
});

describe("parseCheckoutQuery", () => {
  it("clamps credits to CUSTOM_CREDITS", () => {
    expect(parseCheckoutQuery(new URLSearchParams("credits=500")).choice).toEqual({ credits: CUSTOM_CREDITS.max });
    expect(parseCheckoutQuery(new URLSearchParams("credits=0")).choice).toEqual({ credits: CUSTOM_CREDITS.min });
  });
  it("unknown pack → DEFAULT_PACK_ID", () =>
    expect(parseCheckoutQuery(new URLSearchParams("pack=pack99")).choice).toEqual({ pack: DEFAULT_PACK_ID }));
  it("unknown step → amount", () => expect(parseCheckoutQuery(new URLSearchParams("step=nope")).step).toBe("amount"));
  it("round-trips checkoutHref", () => {
    const href = checkoutHref({ credits: 1, returnTo: "/reviews/r-1", types: ["technical"], step: "review" });
    const d = parseCheckoutQuery(new URLSearchParams(href.split("?")[1]));
    expect(d).toMatchObject({ choice: { credits: 1 }, step: "review", returnTo: "/reviews/r-1", hasReturn: true, types: ["technical"] });
  });
  it("unsafe return falls back and is not a return", () => {
    const d = parseCheckoutQuery(new URLSearchParams("return=%2F%2Fevil.example"));
    expect(d.returnTo).toBe("/configure/billing");
    expect(d.hasReturn).toBe(false);
  });
});
