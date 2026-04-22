import type { MusicItem, ReleaseSource } from "./types";

type TokenState = { accessToken: string; expiresAt: number };
let tokenCache: TokenState | null = null;

async function getToken(): Promise<string> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  }
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.accessToken;
  }
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return tokenCache.accessToken;
}

async function sp<T>(path: string, revalidate = 3600): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = await getToken();
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate },
    });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "2");
      const waitMs = Math.min((retryAfter + attempt) * 1000, 4000);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Spotify ${res.status} on ${path}: ${body.slice(0, 200)}`,
      );
    }
    return (await res.json()) as T;
  }
  throw new Error(`Spotify rate limited on ${path}`);
}

type SpotifyAlbum = {
  id: string;
  name: string;
  album_type: "single" | "album" | "compilation";
  release_date: string;
  images: Array<{ url: string; width: number; height: number }>;
  external_urls: { spotify: string };
  artists: Array<{ id?: string; name: string }>;
};

type AlbumSearchRes = { albums: { items: SpotifyAlbum[] } };

async function searchAlbums(query: string): Promise<SpotifyAlbum[]> {
  const q = encodeURIComponent(query);
  const data = await sp<AlbumSearchRes>(
    `/search?q=${q}&type=album&limit=10&market=US`,
  );
  return data.albums.items;
}

function toMusicItem(a: SpotifyAlbum, source: ReleaseSource): MusicItem {
  return {
    id: a.id,
    title: a.name,
    artist: a.artists.map((x) => x.name).join(", "),
    image: a.images[0]?.url ?? null,
    url: a.external_urls.spotify,
    releaseDate: a.release_date,
    albumType: a.album_type,
    source,
    matchedSeed: source === "seed" ? a.artists[0]?.name : undefined,
  };
}

type SeedResult = { seed: MusicItem[]; similar: MusicItem[] };

async function getReleasesForOneSeed(name: string): Promise<SeedResult> {
  const lower = name.toLowerCase().trim();
  try {
    const [strict, loose] = await Promise.all([
      searchAlbums(`artist:"${name}"`).catch((err) => {
        console.error(
          `[spotify] strict "${name}":`,
          err instanceof Error ? err.message : err,
        );
        return [] as SpotifyAlbum[];
      }),
      searchAlbums(`"${name}"`).catch((err) => {
        console.error(
          `[spotify] loose "${name}":`,
          err instanceof Error ? err.message : err,
        );
        return [] as SpotifyAlbum[];
      }),
    ]);

    const seed = strict
      .filter((a) => {
        const main = a.artists[0]?.name.toLowerCase().trim() ?? "";
        return main === lower;
      })
      .map((a) => toMusicItem(a, "seed"));

    const seedIds = new Set(seed.map((s) => s.id));
    const similar = loose
      .filter((a) => {
        const main = a.artists[0]?.name.toLowerCase().trim() ?? "";
        return main !== lower && !seedIds.has(a.id);
      })
      .map((a) => toMusicItem(a, "similar"));

    return { seed, similar };
  } catch (err) {
    console.error(
      `[spotify] seed "${name}" failed:`,
      err instanceof Error ? err.message : err,
    );
    return { seed: [], similar: [] };
  }
}

export async function getReleasesInspiredBy(
  seedArtistNames: string[],
  excludedNames: string[] = [],
  listening?: string,
): Promise<MusicItem[]> {
  const blocked = new Set(excludedNames.map((n) => n.toLowerCase().trim()));

  const uniqueSeeds = Array.from(
    new Set(
      seedArtistNames
        .map((a) => a.trim())
        .filter((a) => a && !blocked.has(a.toLowerCase())),
    ),
  );

  const [seedResults, listeningItems] = await Promise.all([
    Promise.all(uniqueSeeds.map((n) => getReleasesForOneSeed(n))),
    listening
      ? searchAlbums(listening)
          .then((albums) => albums.map((a) => toMusicItem(a, "listening")))
          .catch((err) => {
            console.error(
              `[spotify] listening "${listening}" failed:`,
              err instanceof Error ? err.message : err,
            );
            return [] as MusicItem[];
          })
      : Promise.resolve([] as MusicItem[]),
  ]);

  const seedItems = seedResults.flatMap((r) => r.seed);
  const similarItems = seedResults.flatMap((r) => r.similar);

  const all = [...seedItems, ...similarItems, ...listeningItems];

  const notBlocked = all.filter(
    (it) =>
      !it.artist
        .toLowerCase()
        .split(",")
        .some((a) => blocked.has(a.trim())),
  );

  const priority: Record<ReleaseSource, number> = {
    seed: 0,
    listening: 1,
    similar: 2,
  };
  const byId = new Map<string, MusicItem>();
  for (const it of notBlocked) {
    const existing = byId.get(it.id);
    if (!existing || priority[it.source] < priority[existing.source]) {
      byId.set(it.id, it);
    }
  }

  const unique = Array.from(byId.values());
  unique.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  return unique.slice(0, 18);
}

const LANDING_SEED_ARTISTS = [
  "Bad Bunny",
  "The Weeknd",
  "Drake",
  "Rosalía",
  "Billie Eilish",
  "Kendrick Lamar",
  "Karol G",
  "Harry Styles",
];

export async function getLandingCovers(): Promise<
  Array<{ image: string; artist: string; title: string }>
> {
  try {
    const results = await Promise.allSettled(
      LANDING_SEED_ARTISTS.map((name) =>
        sp<AlbumSearchRes>(
          `/search?q=${encodeURIComponent(`artist:"${name}"`)}&type=album&limit=3&market=US`,
          3600,
        ),
      ),
    );
    const covers: Array<{ image: string; artist: string; title: string }> = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      const items = r.value.albums.items;
      items.sort((a, b) => b.release_date.localeCompare(a.release_date));
      const recent = items.find(
        (a) => a.images[0]?.url && a.release_date.length >= 4,
      );
      if (recent) {
        covers.push({
          image: recent.images[0]!.url,
          artist: recent.artists[0]?.name ?? "",
          title: recent.name,
        });
      }
    }
    return covers;
  } catch (err) {
    console.error("[spotify] landing covers failed:", err);
    return [];
  }
}
