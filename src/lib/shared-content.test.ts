import { describe, expect, it } from "vitest";
import {
  SHARED_TEXT_MIN_LENGTH,
  classifySharedContent,
  sharedParamsFrom,
} from "./shared-content";

function filler(length: number): string {
  // Exactly `length` characters, no spaces (so trimming never changes the count), no links.
  return "a".repeat(length);
}

describe("sharedParamsFrom", () => {
  it("picks title, text and url", () => {
    expect(sharedParamsFrom({ title: "T", text: "X", url: "https://a.test/" })).toEqual({
      title: "T",
      text: "X",
      url: "https://a.test/",
    });
  });

  it("takes the first element of array values", () => {
    expect(sharedParamsFrom({ title: ["t1", "t2"], text: ["x1", "x2"], url: ["u1", "u2"] })).toEqual({
      title: "t1",
      text: "x1",
      url: "u1",
    });
  });

  it("ignores other keys", () => {
    const out = sharedParamsFrom({ text: "x", foo: "bar", other: ["1"] });
    expect(out).toEqual({ title: undefined, text: "x", url: undefined });
    expect(Object.keys(out).sort()).toEqual(["text", "title", "url"]);
  });
});

describe("classifySharedContent", () => {
  it("classifies a url param alone as url", () => {
    expect(classifySharedContent({ url: "https://example.com/ricetta" })).toEqual({
      kind: "url",
      url: "https://example.com/ricetta",
    });
  });

  it("finds a link only inside text", () => {
    expect(
      classifySharedContent({ text: "https://www.instagram.com/reel/CxAbC12/?igsh=abc" })
    ).toEqual({ kind: "url", url: "https://www.instagram.com/reel/CxAbC12/?igsh=abc" });
  });

  it.each([
    ["Guarda qui https://example.com/ricetta.", "https://example.com/ricetta"],
    ["Guarda qui https://example.com/ricetta,", "https://example.com/ricetta"],
    ["(https://example.com/ricetta)", "https://example.com/ricetta"],
    ["[https://example.com/ricetta]", "https://example.com/ricetta"],
    ["Wow! https://example.com/ricetta!?", "https://example.com/ricetta"],
  ])("cleans trailing punctuation: %s", (text, expected) => {
    expect(classifySharedContent({ text })).toEqual({ kind: "url", url: expected });
  });

  it("treats a short blurb plus link as url", () => {
    expect(
      classifySharedContent({
        text: "Pasta alla gricia - Giallozafferano https://example.com/gricia",
      })
    ).toEqual({ kind: "url", url: "https://example.com/gricia" });
  });

  it("uses the first link when text has several", () => {
    expect(
      classifySharedContent({ text: "https://a.test/one https://b.test/two" })
    ).toEqual({ kind: "url", url: "https://a.test/one" });
  });

  it("classifies long recipe text with a link as text, preserving the original", () => {
    const text = `${filler(SHARED_TEXT_MIN_LENGTH + 50)} https://example.com/fonte`;
    expect(classifySharedContent({ text })).toEqual({ kind: "text", text });
  });

  it("does not count link characters towards the threshold", () => {
    const text = `${filler(SHARED_TEXT_MIN_LENGTH - 1)} https://example.com/${"x".repeat(300)}`;
    expect(classifySharedContent({ text }).kind).toBe("url");
  });

  it("is at the boundary: one below is url, exactly at is text", () => {
    const below = `${filler(SHARED_TEXT_MIN_LENGTH - 1)} https://example.com/r`;
    const at = `${filler(SHARED_TEXT_MIN_LENGTH)} https://example.com/r`;
    expect(classifySharedContent({ text: below }).kind).toBe("url");
    expect(classifySharedContent({ text: at })).toEqual({ kind: "text", text: at });
  });

  it("classifies plain text without link as text", () => {
    expect(classifySharedContent({ text: "  Pasta: 300 g guanciale  " })).toEqual({
      kind: "text",
      text: "Pasta: 300 g guanciale",
    });
  });

  it("classifies long text without link as text", () => {
    const text = filler(SHARED_TEXT_MIN_LENGTH + 10);
    expect(classifySharedContent({ text })).toEqual({ kind: "text", text });
  });

  it("returns empty for whitespace-only or missing input", () => {
    expect(classifySharedContent({ text: "   \n\t " })).toEqual({ kind: "empty" });
    expect(classifySharedContent({})).toEqual({ kind: "empty" });
    expect(classifySharedContent({ title: undefined, text: undefined, url: undefined })).toEqual({
      kind: "empty",
    });
  });

  it.each([["javascript:alert(1)"], ["ftp://example.com/file"], ["not a url"], ["  "]])(
    "ignores non-http url param %j and yields empty",
    (url) => {
      expect(classifySharedContent({ url })).toEqual({ kind: "empty" });
    }
  );

  it("falls through to text when the url param is invalid", () => {
    expect(classifySharedContent({ url: "javascript:alert(1)", text: "Una ricetta" })).toEqual({
      kind: "text",
      text: "Una ricetta",
    });
  });

  it("falls through to a link in text when the url param is invalid", () => {
    expect(
      classifySharedContent({ url: "ftp://x.test/f", text: "Vedi https://example.com/r" })
    ).toEqual({ kind: "url", url: "https://example.com/r" });
  });

  it("prefers the url param over a different link in text", () => {
    expect(
      classifySharedContent({
        url: "https://primary.test/r",
        text: "Vedi https://other.test/r",
      })
    ).toEqual({ kind: "url", url: "https://primary.test/r" });
  });
});
