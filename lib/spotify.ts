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

async function sp<T>(path: string, revalidate = 600): Promise<T> {
  const token = await getToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Spotify ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

type SpotifyAlbum = {
  id: string;
  name: string;
  album_type: "single" | "album" | "compilation";
  release_date: string;
  images: Array<{ url: string; width: number; height: number }>;
  external_urls: { spotify: string };
  artists: Array<{ name: string }>;
};

type ArtistSearchRes = {
  artists: { items: Array<{ id: string; name: string }> };
};
type AlbumSearchRes = { albums: { items: SpotifyAlbum[] } };
type ArtistAlbumsRes = { items: SpotifyAlbum[] };

async function searchArtistCandidates(
  name: string,
): Promise<Array<{ id: string; name: string }>> {
  const q = encodeURIComponent(name);
  const data = await sp<ArtistSearchRes>(
    `/search?q=${q}&type=artist&limit=10`,
  );
  return data.artists.items;
}

async function getArtistAlbums(id: string): Promise<SpotifyAlbum[]> {
  const data = await sp<ArtistAlbumsRes>(
    `/artists/${id}/albums?include_groups=single,album&limit=10&market=US`,
  );
  return data.items;
}

async function getAppearsOnAlbums(id: string): Promise<SpotifyAlbum[]> {
  const data = await sp<ArtistAlbumsRes>(
    `/artists/${id}/albums?include_groups=appears_on&limit=10&market=US`,
  );
  return data.items;
}

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
  try {
    const candidates = await searchArtistCandidates(name);
    if (candidates.length === 0) {
      console.warn(`[spotify] no candidates for "${name}"`);
      return { seed: [], similar: [] };
    }

    const nameLower = name.toLowerCase().trim();
    const exact = candidates.filter(
      (c) => c.name.toLowerCase().trim() === nameLower,
    );
    const toTry = exact.length > 0 ? exact : [candidates[0]];

    const perCandidate = await Promise.all(
      toTry.map(async (cand) => {
        const [albums, appears] = await Promise.all([
          getArtistAlbums(cand.id).catch((err) => {
            console.error(`[spotify] albums "${cand.name}":`, err);
            return [] as SpotifyAlbum[];
          }),
          getAppearsOnAlbums(cand.id).catch((err) => {
            console.error(`[spotify] appears_on "${cand.name}":`, err);
            return [] as SpotifyAlbum[];
          }),
        ]);
        return {
          seed: albums.map((a) => toMusicItem(a, "seed")),
          similar: appears.map((a) => toMusicItem(a, "similar")),
        };
      }),
    );

    return {
      seed: perCandidate.flatMap((p) => p.seed),
      similar: perCandidate.flatMap((p) => p.similar),
    };
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

  const seedNamesLower = new Set(
    uniqueSeeds.map((n) => n.toLowerCase().trim()),
  );

  const seedItems = seedResults.flatMap((r) => r.seed);
  const similarItems = seedResults
    .flatMap((r) => r.similar)
    .filter((item) => {
      const mainArtist = item.artist.split(",")[0]?.toLowerCase().trim() ?? "";
      return !seedNamesLower.has(mainArtist);
    });

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

const LANDING_ARTIST_IDS = [
  "06HL4z0CvFAxyc27GXpf02", // Taylor Swift
  "4q3ewBCX7sLwd24euuV69X", // Bad Bunny
  "1Xyo4u8uXC1ZmMpatF05PJ", // The Weeknd
  "3TVXtAsR1Inumwj472S9r4", // Drake
  "7ltDVBr6mKbRvohxheJ9h1", // Rosalía
  "6qqNVTkY8uBg9cP3Jd7DAH", // Billie Eilish
  "6M2wZ9GZgrQXHCFfjv46we", // Dua Lipa
  "2YZyLoL8N0Wb9xBt1NhZWg", // Kendrick Lamar
  "790FomKkXshlbRYZFtlgla", // Karol G
  "66CXWjxzNUsdJxJ2JdwvnR", // Ariana Grande
  "6KImCVD70vtIoJWnq6nGn3", // Harry Styles
  "6yNG9z9CGWa1QczJxMyGY2", // Alex Warren (pop)
];

export async function getLandingCovers(): Promise<
  Array<{ image: string; artist: string; title: string }>
> {
  try {
    const results = await Promise.allSettled(
      LANDING_ARTIST_IDS.map((id) =>
        sp<ArtistAlbumsRes>(
          `/artists/${id}/albums?include_groups=single,album&limit=4&market=US`,
          3600,
        ),
      ),
    );
    const covers: Array<{ image: string; artist: string; title: string }> = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      const recent = r.value.items.find(
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
