import type { AiTopic, NewsItem } from "./types";

const TOPIC_KEYWORDS: Record<AiTopic, string[]> = {
  models: ["LLM", "Claude", "GPT", "Gemini", "Llama", "Anthropic", "OpenAI"],
  coding: ["copilot", "Cursor", "code generation", "AI coding"],
  agents: ["AI agent", "autonomous", "agentic"],
  image: ["image generation", "Midjourney", "diffusion"],
  research: ["AI research", "paper", "benchmark"],
  startups: ["AI startup", "funding", "seed round"],
};

type HnHit = {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string;
  created_at: string;
  created_at_i: number;
  points: number;
  num_comments: number;
  story_text: string | null;
  _tags: string[];
};

type HnResponse = { hits: HnHit[] };

const GRADIENT_POOL = [
  "linear-gradient(135deg, oklch(0.45 0.2 300), oklch(0.25 0.15 280))",
  "linear-gradient(135deg, oklch(0.5 0.18 220), oklch(0.28 0.15 200))",
  "linear-gradient(135deg, oklch(0.48 0.2 180), oklch(0.26 0.15 160))",
  "linear-gradient(135deg, oklch(0.5 0.2 20), oklch(0.28 0.15 10))",
  "linear-gradient(135deg, oklch(0.52 0.2 60), oklch(0.3 0.16 45))",
  "linear-gradient(135deg, oklch(0.48 0.2 130), oklch(0.28 0.15 150))",
  "linear-gradient(135deg, oklch(0.5 0.22 340), oklch(0.3 0.18 315))",
  "linear-gradient(135deg, oklch(0.5 0.18 250), oklch(0.3 0.15 270))",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function gradientFor(seed: string): string {
  return GRADIENT_POOL[hashString(seed) % GRADIENT_POOL.length];
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "news";
  }
}

function buildQuery(
  topics: AiTopic[],
  tools: string[],
  focus?: string,
): string {
  const topicTerms =
    topics.length === 0
      ? ["AI", "LLM"]
      : topics.flatMap((t) => TOPIC_KEYWORDS[t] ?? []);
  const toolTerms = tools.slice(0, 4);
  const focusTerms = focus ? [focus] : [];

  const all = [...topicTerms, ...toolTerms, ...focusTerms]
    .filter(Boolean)
    .slice(0, 10);

  return all.join(" ");
}

export async function getAiNews(
  topics: AiTopic[],
  tools: string[] = [],
  focus?: string,
): Promise<NewsItem[]> {
  const query = buildQuery(topics, tools, focus);
  const since = Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60;

  const url = new URL("https://hn.algolia.com/api/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("tags", "story");
  url.searchParams.set("numericFilters", `created_at_i>${since},points>5`);
  url.searchParams.set("hitsPerPage", "30");

  const res = await fetch(url.toString(), {
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`Hacker News API error ${res.status}`);
  }

  const data = (await res.json()) as HnResponse;

  const items = data.hits
    .filter((h) => h.title && h.url)
    .map<NewsItem & { fallbackGradient: string }>((h) => {
      const domain = extractDomain(h.url!);
      return {
        id: h.objectID,
        title: h.title!,
        snippet:
          h.story_text?.slice(0, 200) ??
          `${h.points} puntos · ${h.num_comments} comentarios en HN`,
        image: null,
        source: domain,
        url: h.url!,
        publishedAt: h.created_at,
        tag: topics[0],
        fallbackGradient: gradientFor(h.objectID),
      };
    });

  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return items.slice(0, 14);
}
