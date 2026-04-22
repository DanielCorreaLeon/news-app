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

export type ReleaseSource = "seed" | "similar" | "listening";

export type MusicItem = {
  id: string;
  title: string;
  artist: string;
  image: string | null;
  url: string;
  releaseDate: string;
  albumType: "single" | "album" | "compilation";
  source: ReleaseSource;
  matchedSeed?: string;
  matchedGenre?: string;
};
