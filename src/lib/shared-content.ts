/**
 * Sorts what another app handed over through the phone's share menu.
 * Apps are inconsistent: some put a link in `url`, most put it in `text`,
 * and a chat message may be a whole recipe that happens to contain a link.
 */

export interface SharedParams {
  title?: string;
  text?: string;
  url?: string;
}

export type SharedContent =
  | { kind: "url"; url: string }
  | { kind: "text"; text: string }
  | { kind: "empty" };

/** Text this long next to a link is treated as the recipe itself. */
export const SHARED_TEXT_MIN_LENGTH = 200;

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

function asHttpUrl(candidate: string | undefined): string | null {
  const value = candidate?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads the share parameters out of a page's search params. */
export function sharedParamsFrom(
  searchParams: Record<string, string | string[] | undefined>
): SharedParams {
  return {
    title: firstParam(searchParams.title),
    text: firstParam(searchParams.text),
    url: firstParam(searchParams.url),
  };
}

export function classifySharedContent(params: SharedParams): SharedContent {
  const text = params.text?.trim() ?? "";
  const linksInText = text.match(URL_PATTERN) ?? [];
  const textWithoutLinks = text.replace(URL_PATTERN, " ").replace(/\s+/g, " ").trim();

  if (textWithoutLinks.length >= SHARED_TEXT_MIN_LENGTH) {
    return { kind: "text", text };
  }

  const url =
    asHttpUrl(params.url) ??
    linksInText.map((link) => asHttpUrl(link.replace(/[.,;:!?)\]]+$/, ""))).find(Boolean) ??
    null;
  if (url) return { kind: "url", url };

  if (text) return { kind: "text", text };
  return { kind: "empty" };
}
