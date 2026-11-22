import * as cheerio from "cheerio";
import { safeFetch } from "./safe-fetch";

/**
 * Reads the caption of a public Instagram post from its embed page, the HTML
 * Instagram serves for posts embedded in other sites. No login and no API key.
 * The request names this app in its User-Agent; when Instagram answers with a
 * login wall or an error we report "blocked" and do not try to get around it.
 */

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);
// /p/<code>/, /reel/<code>/, /reels/<code>/, /tv/<code>/, optionally prefixed by /<username>/.
const POST_PATH = /^\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]{5,40})(?:\/|$)/;

const USER_AGENT = "dueforchette/1.0 (+https://recipes.giulioprinaricotti.com)";

export type InstagramCaptionFailure = "blocked" | "no_caption";

export type InstagramCaptionResult =
  | { ok: true; caption: string; postUrl: string }
  | { ok: false; reason: InstagramCaptionFailure };

export type PageFetcher = (
  url: string,
  init: { headers: Record<string, string> }
) => Promise<Response>;

/** Returns the post's shortcode, or null when the URL is not an Instagram post. */
export function instagramShortcode(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;
  return POST_PATH.exec(url.pathname)?.[1] ?? null;
}

export function isInstagramPostUrl(rawUrl: string): boolean {
  return instagramShortcode(rawUrl) !== null;
}

/** Caption text of an embed page, or null when the page carries none. */
export function captionFromEmbedHtml(html: string): string | null {
  const $ = cheerio.load(html);
  const caption = $(".Caption").first();
  if (!caption.length) return null;

  caption.find(".CaptionUsername, .CaptionComments").remove();
  caption.find("br").replaceWith("\n");

  const text = caption
    .text()
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || null;
}

export async function fetchInstagramCaption(
  rawUrl: string,
  fetchPage: PageFetcher = safeFetch
): Promise<InstagramCaptionResult> {
  const shortcode = instagramShortcode(rawUrl);
  if (!shortcode) return { ok: false, reason: "blocked" };

  // The same shortcode resolves under /p/ for posts and reels alike. Building
  // the URL from the shortcode also drops tracking parameters of the share link.
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;

  let response: Response;
  try {
    response = await fetchPage(`${postUrl}embed/captioned/`, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    });
  } catch (err) {
    console.error("Instagram caption fetch failed", err);
    return { ok: false, reason: "blocked" };
  }

  // A redirect to the login page comes back as the last hop, not a 200.
  if (!response.ok) return { ok: false, reason: "blocked" };

  const html = await response.text();
  if (/\/accounts\/login/i.test(response.url) && !html.includes('class="Caption"')) {
    return { ok: false, reason: "blocked" };
  }

  const caption = captionFromEmbedHtml(html);
  if (!caption) return { ok: false, reason: "no_caption" };
  return { ok: true, caption, postUrl };
}
