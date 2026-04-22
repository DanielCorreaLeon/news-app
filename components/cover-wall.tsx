type Props = {
  covers: Array<{ image: string; artist: string; title: string }>;
};

export function CoverWall({ covers }: Props) {
  if (covers.length === 0) return null;
  const tiles = covers.slice(0, 12);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="grid h-full w-full gap-1 opacity-[0.38]"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
        }}
      >
        {tiles.map((c, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c.image + i}
            src={c.image}
            alt=""
            className="h-full w-full object-cover"
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/70" />
    </div>
  );
}
