import { getLandingCovers } from "@/lib/spotify";
import { CoverWall } from "@/components/cover-wall";
import { PersonalPanel } from "@/components/personal-panel";
import { FeedCtaCard } from "@/components/feed-cta-card";

export const revalidate = 3600;

export default async function Home() {
  const covers = await getLandingCovers().catch(() => []);

  return (
    <main className="relative mx-auto flex min-h-dvh w-full flex-1 flex-col overflow-hidden px-5 py-8 md:px-6 md:py-12">
      <CoverWall covers={covers} />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <header className="mb-8 flex items-center justify-between md:mb-12">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="block size-2.5 rounded-full bg-[var(--music-from)]" />
              <span className="absolute inset-0 size-2.5 animate-ping rounded-full bg-[var(--music-from)] opacity-60" />
            </div>
            <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-foreground/80">
              Daily
            </span>
          </div>
          <span className="hidden text-xs tracking-widest uppercase text-muted-foreground md:inline">
            {new Intl.DateTimeFormat("es", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })
              .format(new Date())
              .toUpperCase()}
          </span>
        </header>

        <section className="mb-10 max-w-3xl md:mb-14">
          <p className="mb-3 text-xs tracking-[0.2em] uppercase text-muted-foreground">
            Hola, Daniel
          </p>
          <h1 className="font-display text-4xl leading-[0.95] font-bold tracking-tighter text-balance md:text-6xl lg:text-7xl">
            Tu música, como{" "}
            <span className="bg-gradient-to-r from-[var(--music-from)] via-[var(--music-to)] to-[oklch(0.7_0.2_250)] bg-clip-text text-transparent">
              nunca
            </span>{" "}
            la escuchaste.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground text-pretty md:text-lg">
            Nuevos lanzamientos de los artistas que te gustan y de otros que
            suenan parecido.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <FeedCtaCard />
          <PersonalPanel name="Daniel" fallbackCovers={covers} />
        </div>

        <footer className="mt-auto pt-10 text-xs text-muted-foreground md:pt-16">
          Tus preferencias viven en tu navegador. Nada se sube a un servidor.
        </footer>
      </div>
    </main>
  );
}
