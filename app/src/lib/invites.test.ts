import { describe, expect, it } from "vitest";
import { parseInviteList, validateInvite } from "./invites";

describe("parseInviteList", () => {
  it("splits on comma, semicolon, space and newline", () => {
    const { emails } = parseInviteList("a@x.com, b@x.com;c@x.com d@x.com\ne@x.com\r\nf@x.com");
    expect(emails).toEqual(["a@x.com", "b@x.com", "c@x.com", "d@x.com", "e@x.com", "f@x.com"]);
  });

  it("trims and lowercases", () => {
    const { emails } = parseInviteList("  Dana.Reyes@HarborCB.com ,\t<Marcus@HarborCB.com>  ");
    expect(emails).toEqual(["dana.reyes@harborcb.com", "marcus@harborcb.com"]);
  });

  it("dedupes and counts duplicates", () => {
    const r = parseInviteList("a@x.com\nA@x.com, b@x.com; a@x.com");
    expect(r.emails).toEqual(["a@x.com", "b@x.com"]);
    expect(r.duplicates).toBe(2);
  });

  it("returns nothing for blank input", () => {
    expect(parseInviteList(" ,; \n")).toEqual({ emails: [], duplicates: 0 });
  });
});

describe("validateInvite", () => {
  it("invalid email → invalid", () => {
    expect(validateInvite("not-an-email")).toBe("invalid");
    expect(validateInvite("a@b")).toBe("invalid");
    expect(validateInvite("")).toBe("invalid");
  });

  it("other domain → wrong_domain when a domain is set", () => {
    expect(validateInvite("a@gmail.com", "harborcb.com")).toBe("wrong_domain");
    expect(validateInvite("a@harborcb.com", "harborcb.com")).toBeNull();
    expect(validateInvite("A@HarborCB.com", "harborcb.com")).toBeNull();
  });

  it("no domain set → any valid email passes", () => {
    expect(validateInvite("a@gmail.com")).toBeNull();
    expect(validateInvite("a@gmail.com", undefined)).toBeNull();
  });
});
