import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captionFromEmbedHtml,
  fetchInstagramCaption,
  instagramShortcode,
  isInstagramPostUrl,
  type PageFetcher,
} from "./instagram-caption";

const CODE = "CxAbC12_-dE";

const EMBED_HTML =
  '<html><body><div class="Embed"><div class="Caption">' +
  '<a class="CaptionUsername" href="https://www.instagram.com/someuser/">someuser</a>' +
  "<br /><br />First line<br />300 g di guanciale <br />Step one.<br />" +
  '<a href="/explore/tags/pasta/">#pasta</a> <a href="/explore/tags/italia/">#italia</a>' +
  '<div class="CaptionComments"><a class="CaptionCommentsExpand" href="https://www.instagram.com/p/x/">View all 12 comments</a></div>' +
  "</div></div></body></html>";

function html(body: string, status = 200): Response {
  return new Response(body, { status });
}

describe("instagramShortcode / isInstagramPostUrl", () => {
  it.each([
    [`https://www.instagram.com/p/${CODE}/`],
    [`https://www.instagram.com/reel/${CODE}/`],
    [`https://www.instagram.com/reels/${CODE}/`],
    [`https://www.instagram.com/tv/${CODE}/`],
    [`https://www.instagram.com/user.name/p/${CODE}/`],
    [`https://www.instagram.com/some_user/reel/${CODE}/`],
    [`https://www.instagram.com/p/${CODE}/?utm_source=ig_web_copy_link&igsh=abc`],
    [`https://www.instagram.com/p/${CODE}`],
    [`https://instagram.com/p/${CODE}/`],
    [`https://m.instagram.com/p/${CODE}/`],
    [`http://www.instagram.com/p/${CODE}/`],
    [`https://WWW.Instagram.com/p/${CODE}/`],
  ])("accepts %s", (url) => {
    expect(instagramShortcode(url)).toBe(CODE);
    expect(isInstagramPostUrl(url)).toBe(true);
  });

  it.each([
    ["https://www.instagram.com/someuser/"],
    ["https://www.instagram.com/"],
    ["https://www.instagram.com/explore/tags/pasta/"],
    ["https://www.instagram.com/stories/someuser/1234567890/"],
    [`https://instagram.com.evil.test/p/${CODE}/`],
    [`https://evilinstagram.com/p/${CODE}/`],
    [`https://example.com/p/${CODE}/`],
    [`ftp://www.instagram.com/p/${CODE}/`],
    [`javascript:alert("www.instagram.com/p/${CODE}/")`],
    ["not a url"],
    [""],
  ])("rejects %s", (url) => {
    expect(instagramShortcode(url)).toBeNull();
    expect(isInstagramPostUrl(url)).toBe(false);
  });
});

describe("captionFromEmbedHtml", () => {
  it("extracts the caption text from an embed page", () => {
    expect(captionFromEmbedHtml(EMBED_HTML)).toBe(
      "First line\n300 g di guanciale\nStep one.\n#pasta #italia"
    );
  });

  it("removes the username and the comments block", () => {
    const text = captionFromEmbedHtml(EMBED_HTML)!;
    expect(text).not.toContain("someuser");
    expect(text).not.toContain("comments");
  });

  it("keeps hashtag link text", () => {
    expect(captionFromEmbedHtml(EMBED_HTML)).toContain("#pasta");
    expect(captionFromEmbedHtml(EMBED_HTML)).toContain("#italia");
  });

  it("turns br into newlines", () => {
    const out = captionFromEmbedHtml('<div class="Caption">a<br>b<br/>c</div>');
    expect(out).toBe("a\nb\nc");
  });

  it("decodes HTML entities", () => {
    const out = captionFromEmbedHtml(
      '<div class="Caption">Pasta &amp; fagioli<br />l&#39;olio</div>'
    );
    expect(out).toBe("Pasta & fagioli\nl'olio");
  });

  it("tidies whitespace and collapses blank-line runs", () => {
    const out = captionFromEmbedHtml(
      '<div class="Caption">  a   b  <br /><br /><br /><br />  c  </div>'
    );
    expect(out).toBe("a b\n\nc");
  });

  it("returns null when there is no Caption element", () => {
    expect(captionFromEmbedHtml("<html><body><p>nothing</p></body></html>")).toBeNull();
    expect(captionFromEmbedHtml("")).toBeNull();
  });

  it("returns null when the caption is only the username", () => {
    const out = captionFromEmbedHtml(
      '<div class="Caption"><a class="CaptionUsername" href="#">someuser</a><br /><br /></div>'
    );
    expect(out).toBeNull();
  });
});

describe("fetchInstagramCaption", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const okFetcher = () => vi.fn<PageFetcher>(async () => html(EMBED_HTML));

  it.each([
    [`https://www.instagram.com/p/${CODE}/`],
    [`https://www.instagram.com/reel/${CODE}/?igsh=abc&utm_source=qr`],
    [`https://www.instagram.com/user.name/p/${CODE}`],
    [`https://m.instagram.com/tv/${CODE}/`],
  ])("always requests the canonical embed URL (%s)", async (input) => {
    const fetchPage = okFetcher();
    await fetchInstagramCaption(input, fetchPage);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage.mock.calls[0][0]).toBe(
      `https://www.instagram.com/p/${CODE}/embed/captioned/`
    );
  });

  it("identifies itself honestly in the User-Agent", async () => {
    const fetchPage = okFetcher();
    await fetchInstagramCaption(`https://www.instagram.com/p/${CODE}/`, fetchPage);
    const ua = (fetchPage.mock.calls[0] as unknown as [string, { headers: Record<string, string> }])[1]
      .headers["User-Agent"];
    expect(ua.startsWith("dueforchette/")).toBe(true);
    expect(ua).not.toContain("Mozilla");
    expect(ua).not.toContain("facebookexternalhit");
  });

  it("returns the caption and canonical post URL on success", async () => {
    const result = await fetchInstagramCaption(
      `https://www.instagram.com/reel/${CODE}/?igsh=abc`,
      okFetcher()
    );
    expect(result).toEqual({
      ok: true,
      caption: "First line\n300 g di guanciale\nStep one.\n#pasta #italia",
      postUrl: `https://www.instagram.com/p/${CODE}/`,
    });
  });

  it.each([403, 404, 429, 500])("reports blocked on HTTP %i", async (status) => {
    const fetchPage = vi.fn(async () => html("nope", status));
    const result = await fetchInstagramCaption(`https://www.instagram.com/p/${CODE}/`, fetchPage);
    expect(result).toEqual({ ok: false, reason: "blocked" });
  });

  it("reports blocked when the fetcher throws", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchPage = vi.fn(async () => {
      throw new Error("network down");
    });
    const result = await fetchInstagramCaption(`https://www.instagram.com/p/${CODE}/`, fetchPage);
    expect(result).toEqual({ ok: false, reason: "blocked" });
    expect(spy).toHaveBeenCalled();
  });

  it("reports no_caption for a 200 page without a caption", async () => {
    const fetchPage = vi.fn(async () =>
      html("<html><body><div class='Embed'>This post may have been removed.</div></body></html>")
    );
    const result = await fetchInstagramCaption(`https://www.instagram.com/p/${CODE}/`, fetchPage);
    expect(result).toEqual({ ok: false, reason: "no_caption" });
  });

  it("reports blocked when redirected to the login page without a caption", async () => {
    const res = html("<html><body>Log in to Instagram</body></html>");
    Object.defineProperty(res, "url", {
      value: "https://www.instagram.com/accounts/login/?next=/p/x/",
    });
    const result = await fetchInstagramCaption(
      `https://www.instagram.com/p/${CODE}/`,
      vi.fn(async () => res)
    );
    expect(result).toEqual({ ok: false, reason: "blocked" });
  });

  it("does not call the fetcher for non-Instagram URLs", async () => {
    const fetchPage = okFetcher();
    const result = await fetchInstagramCaption("https://example.com/p/abcdef/", fetchPage);
    expect(result).toEqual({ ok: false, reason: "blocked" });
    expect(fetchPage).not.toHaveBeenCalled();
  });
});
