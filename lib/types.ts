export type Category = "music" | "ai";

export type MusicPrefs = {
  likedArtists: string[];
  dislikedArtists: string[];
  genres: string[];
  lastSession: {
    listening?: string;
    mood?: string;
    updatedAt: string;
  };
};

export const AI_TOPICS = [
  "models",
  "coding",
  "agents",
  "image",
  "research",
  "startups",
] as const;

export type AiTopic = (typeof AI_TOPICS)[number];

export type AiPrefs = {
  topics: AiTopic[];
  toolsInUse: string[];
  lastSession: {
    focus?: string;
    updatedAt: string;
  };
};

export type NewsItem = {
  id: string;
  title: string;
  snippet: string;
  image: string | null;
  source: string;
  url: string;
  publishedAt: string;
  tag?: string;
  fallbackGradient?: string;
};

export type MusicItem = {
  id: string;
  title: string;
  artist: string;
  image: string | null;
  url: string;
  releaseDate: string;
  albumType: "single" | "album" | "compilation";
};

export type FeedItem =
  | ({ kind: "news" } & NewsItem)
  | ({ kind: "music" } & MusicItem);
