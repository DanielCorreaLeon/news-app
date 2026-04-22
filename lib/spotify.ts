import type { MusicItem } from "./types";

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
  if (!res.ok) {
    throw new Error(`Spotify token error: ${res.status}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return tokenCache.accessToken;
}

async function spotifyFetch<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 600 },
  });
  if (!res.ok) {
    throw new Error(`Spotify error ${res.status} on ${path}`);
  }
  return (await res.json()) as T;
}

type ArtistSearch = {
  artists: { items: Array<{ id: string; name: string }> };
};

async function findArtistId(name: string): Promise<string | null> {
  const q = encodeURIComponent(name);
  const data = await spotifyFetch<ArtistSearch>(
    `/search?q=${q}&type=artist&limit=1`,
  );
  return data.artists.items[0]?.id ?? null;
}

type Album = {
  id: string;
  name: string;
  album_type: "single" | "album" | "compilation";
  release_date: string;
  images: Array<{ url: string; width: number; height: number }>;
  external_urls: { spotify: string };
  artists: Array<{ name: string }>;
};

type AlbumList = { items: Album[] };

async function getArtistReleases(
  artistId: string,
  limit = 6,
): Promise<Album[]> {
  const data = await spotifyFetch<AlbumList>(
    `/artists/${artistId}/albums?include_groups=single,album&limit=${limit}&market=US`,
  );
  return data.items;
}

export async function getNewReleasesForArtists(
  artists: string[],
  excludeArtists: string[] = [],
): Promise<MusicItem[]> {
  const blocked = new Set(excludeArtists.map((a) => a.toLowerCase().trim()));
  const uniqueArtists = Array.from(
    new Set(
      artists.map((a) => a.trim()).filter((a) => a && !blocked.has(a.toLowerCase())),
    ),
  );

  const releases = await Promise.all(
    uniqueArtists.map(async (name): Promise<MusicItem[]> => {
      try {
        const id = await findArtistId(name);
        if (!id) return [];
        const albums = await getArtistReleases(id, 4);
        return albums.map((a) => ({
          id: a.id,
          title: a.name,
          artist: a.artists.map((x) => x.name).join(", ") || name,
          image: a.images[0]?.url ?? null,
          url: a.external_urls.spotify,
          releaseDate: a.release_date,
          albumType: a.album_type,
        }));
      } catch {
        return [];
      }
    }),
  );

  const flat = releases.flat();
  flat.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  const seen = new Set<string>();
  const unique: MusicItem[] = [];
  for (const item of flat) {
    const key = `${item.artist}::${item.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= 12) break;
  }
  return unique;
}
