import { NextResponse } from "next/server";
import { getAiNews } from "@/lib/newsapi";
import type { AiTopic } from "@/lib/types";
import { AI_TOPICS } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topicsParam = (searchParams.get("topics") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const topics = topicsParam.filter((t): t is AiTopic =>
    (AI_TOPICS as readonly string[]).includes(t),
  );
  const tools = (searchParams.get("tools") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const focus = searchParams.get("focus") ?? undefined;

  try {
    const items = await getAiNews(topics, tools, focus);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
