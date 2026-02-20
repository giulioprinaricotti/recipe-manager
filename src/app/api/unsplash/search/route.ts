import { NextRequest, NextResponse } from "next/server";

export interface UnsplashPhoto {
  id: string;
  smallUrl: string;
  regularUrl: string;
  altDescription: string | null;
  photographerName: string;
  photographerProfileUrl: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json(
      { error: "Unsplash not configured" },
      { status: 503 }
    );
  }

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "12");
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${accessKey}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Unsplash API error" },
      { status: 502 }
    );
  }

  const data = await res.json();

  const results: UnsplashPhoto[] = data.results.map(
    (photo: Record<string, unknown>) => {
      const urls = photo.urls as Record<string, string>;
      const user = photo.user as Record<string, unknown>;
      const links = user.links as Record<string, string>;
      return {
        id: photo.id,
        smallUrl: urls.small,
        regularUrl: urls.regular,
        altDescription: photo.alt_description ?? null,
        photographerName: user.name,
        photographerProfileUrl: `${links.html}?utm_source=recipe_manager&utm_medium=referral`,
      };
    }
  );

  return NextResponse.json({ results });
}
