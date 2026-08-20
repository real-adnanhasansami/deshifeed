import { NextResponse } from "next/server";

// Simple server-side OpenGraph scraper. Runs on the server to avoid CORS
// issues and to keep the client bundle free of HTML-parsing dependencies.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DeshiFeedBot/1.0; +https://deshifeed.app)",
      },
      // Only fetch a reasonable amount of the page
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    }

    const html = await res.text();
    const meta = parseOgMeta(html);

    return NextResponse.json({
      url,
      title: meta.title || meta.ogTitle || url,
      description: meta.ogDescription || meta.description || "",
      image: meta.ogImage || "",
      siteName: meta.ogSiteName || new URL(url).hostname,
    });
  } catch (err) {
    return NextResponse.json({ error: "Could not load preview" }, { status: 502 });
  }
}

function getMetaContent(html, propOrName) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${propOrName}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const match = html.match(re);
  if (match) return match[1];

  // Attribute order can be reversed (content before property/name)
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${propOrName}["']`,
    "i"
  );
  const match2 = html.match(re2);
  return match2 ? match2[1] : null;
}

function parseOgMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return {
    title: titleMatch ? titleMatch[1].trim() : null,
    ogTitle: getMetaContent(html, "og:title"),
    ogDescription: getMetaContent(html, "og:description"),
    description: getMetaContent(html, "description"),
    ogImage: getMetaContent(html, "og:image"),
    ogSiteName: getMetaContent(html, "og:site_name"),
  };
}
