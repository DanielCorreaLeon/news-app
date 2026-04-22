import { NextResponse } from "next/server";
import { getNewReleasesForArtists } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const artists = (searchParams.get("artists") ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const exclude = (searchParams.get("exclude") ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  if (artists.length === 0) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await getNewReleasesForArtists(artists, exclude);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
