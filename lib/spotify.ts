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
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return tokenCache.accessToken;
}

async function sp<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`Spotify error ${res.status} on ${path}`);
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
  artists: {
    items: Array<{ id: string; name: string; genres?: string[] }>;
  };
};

type AlbumSearchRes = { albums: { items: SpotifyAlbum[] } };
type ArtistAlbumsRes = { items: SpotifyAlbum[] };
type ArtistInfo = { id: string; name: string; genres: string[] };

async function findArtist(name: string): Promise<ArtistInfo | null> {
  const q = encodeURIComponent(name);
  const data = await sp<ArtistSearchRes>(
    `/search?q=${q}&type=artist&limit=1`,
  );
  const hit = data.artists.items[0];
  if (!hit) return null;
  const full = await sp<ArtistInfo>(`/artists/${hit.id}`);
  return { id: full.id, name: full.name, genres: full.genres ?? [] };
}

async function getArtistAlbums(id: string): Promise<SpotifyAlbum[]> {
  const data = await sp<ArtistAlbumsRes>(
    `/artists/${id}/albums?include_groups=single,album&limit=30&market=US`,
  );
  return data.items;
}

async function searchAlbums(query: string, limit: number): Promise<SpotifyAlbum[]> {
  const q = encodeURIComponent(query);
  const data = await sp<AlbumSearchRes>(
    `/search?q=${q}&type=album&limit=${Math.min(limit, 50)}&market=US`,
  );
  return data.albums.items;
}

function toMusicItem(
  a: SpotifyAlbum,
  source: ReleaseSource,
  extras: { matchedSeed?: string; matchedGenre?: string } = {},
): MusicItem {
  return {
    id: a.id,
    title: a.name,
    artist: a.artists.map((x) => x.name).join(", "),
    image: a.images[0]?.url ?? null,
    url: a.external_urls.spotify,
    releaseDate: a.release_date,
    albumType: a.album_type,
    source,
    ...extras,
  };
}

export async function getReleasesInspiredBy(
  seedArtistNames: string[],
  excludedNames: string[] = [],
  listening?: string,
): Promise<MusicItem[]> {
  const year = String(new Date().getFullYear());
  const blocked = new Set(excludedNames.map((n) => n.toLowerCase().trim()));

  const uniqueSeeds = Array.from(
    new Set(
      seedArtistNames
        .map((a) => a.trim())
        .filter((a) => a && !blocked.has(a.toLowerCase())),
    ),
  );

  // 1. Resolve seeds → ids + genres
  const seeds = (
    await Promise.all(uniqueSeeds.map((n) => findArtist(n).catch(() => null)))
  ).filter((s): s is ArtistInfo => s !== null);

  // 2. Top 3 genres by frequency across seeds
  const genreCounts = new Map<string, number>();
  for (const s of seeds) {
    for (const g of s.genres) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
  }
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  // 3. In parallel: seed albums, similar-genre albums, listening search
  const [seedAlbumsNested, genreAlbumsNested, listeningAlbums] = await Promise.all([
    Promise.all(
      seeds.map(async (s) => {
        try {
          const albums = await getArtistAlbums(s.id);
          return albums
            .filter((a) => a.release_date.startsWith(year))
            .map((a) => toMusicItem(a, "seed", { matchedSeed: s.name }));
        } catch {
          return [] as MusicItem[];
        }
      }),
    ),
    Promise.all(
      topGenres.map(async (g) => {
        try {
          const q = `genre:"${g}" year:${year}`;
          const albums = await searchAlbums(q, 10);
          return albums
            .filter((a) => a.release_date.startsWith(year))
            .map((a) => toMusicItem(a, "similar", { matchedGenre: g }));
        } catch {
          return [] as MusicItem[];
        }
      }),
    ),
    listening
      ? searchAlbums(`${listening} year:${year}`, 12)
          .then((albums) =>
            albums
              .filter((a) => a.release_date.startsWith(year))
              .map((a) => toMusicItem(a, "listening")),
          )
          .catch(() => [] as MusicItem[])
      : Promise.resolve([] as MusicItem[]),
  ]);

  const all = [
    ...seedAlbumsNested.flat(),
    ...genreAlbumsNested.flat(),
    ...listeningAlbums,
  ];

  // 4. Exclude blocked artists
  const notBlocked = all.filter(
    (it) =>
      !it.artist
        .toLowerCase()
        .split(",")
        .some((a) => blocked.has(a.trim())),
  );

  // 5. Dedupe by album ID, prefer "seed" > "listening" > "similar" when collisions
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

  // 6. Sort by release_date desc
  const unique = Array.from(byId.values());
  unique.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  return unique.slice(0, 18);
}
