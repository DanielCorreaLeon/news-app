import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLandingCovers } from "@/lib/spotify";
import { CoverWall } from "@/components/cover-wall";
import { PersonalPanel } from "@/components/personal-panel";

export const revalidate = 3600;

export default async function Home() {
  const covers = await getLandingCovers().catch(() => []);

  return (
    <main className="relative mx-auto flex min-h-dvh w-full flex-1 flex-col overflow-hidden px-6 py-10 md:py-14">
      <CoverWall covers={covers} />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <header className="mb-10 flex items-center justify-between md:mb-16">
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

        <div className="grid flex-1 grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-12">
          <section className="md:col-span-7">
            <p className="mb-4 text-sm tracking-[0.2em] uppercase text-muted-foreground">
              Hola, Daniel
            </p>
            <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-tighter text-balance md:text-7xl lg:text-8xl">
              Tu música, como{" "}
              <span className="bg-gradient-to-r from-[var(--music-from)] via-[var(--music-to)] to-[oklch(0.7_0.2_250)] bg-clip-text text-transparent">
                nunca
              </span>{" "}
              la escuchaste.
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground text-pretty md:text-lg">
              Nuevos lanzamientos de los artistas que te gustan y de otros que
              suenan parecido. Cuéntanos qué escuchas hoy y afinamos tu feed.
            </p>

            <Link
              href="/setup"
              className="group mt-10 inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-white shadow-xl transition-transform hover:scale-[1.03]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.58 0.25 330), oklch(0.42 0.22 290))",
              }}
            >
              <span className="font-medium">Armar mi feed</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </span>
            </Link>
          </section>

          <aside className="md:col-span-5">
            <PersonalPanel name="Daniel" fallbackCovers={covers} />
          </aside>
        </div>

        <footer className="mt-12 text-xs text-muted-foreground md:mt-16">
          Tus preferencias viven en tu navegador. Nada se sube a un servidor.
        </footer>
      </div>
    </main>
  );
}
