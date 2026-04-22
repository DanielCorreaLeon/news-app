import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLandingCovers } from "@/lib/spotify";
import { CoverWall } from "@/components/cover-wall";

export const revalidate = 3600;

export default async function Home() {
  const covers = await getLandingCovers().catch(() => []);
  const year = new Date().getFullYear();

  return (
    <main className="relative mx-auto flex min-h-dvh w-full flex-1 flex-col overflow-hidden px-6 py-10 md:py-16">
      <CoverWall covers={covers} />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <header className="mb-16 flex items-center justify-between md:mb-24">
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
            {new Intl.DateTimeFormat("es-AR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })
              .format(new Date())
              .toUpperCase()}
          </span>
        </header>

        <section className="mb-12 max-w-4xl">
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
          <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty md:text-xl">
            Nuevos lanzamientos de {year}, filtrados por los artistas que te prenden
            y por lo que estás escuchando hoy. Cero bulla, puro descubrimiento.
          </p>
        </section>

        <section className="mt-auto">
          <Link
            href="/setup"
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-3xl p-8 text-white shadow-2xl transition-transform hover:scale-[1.015] md:p-10"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.32 0.18 330) 0%, oklch(0.22 0.18 300) 50%, oklch(0.18 0.14 260) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute -top-1/2 -left-1/3 h-[180%] w-[90%] rounded-full opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, oklch(0.75 0.25 330), transparent 70%)",
              }}
            />
            <div className="relative">
              <p className="text-xs tracking-widest uppercase opacity-80">
                Empezar
              </p>
              <p className="font-display text-3xl font-bold md:text-5xl">
                Armar mi feed
              </p>
              <p className="mt-2 max-w-md text-sm text-white/70 md:text-base">
                Contame 3 artistas que te inspiren. Te armo un bento visual con lo
                nuevo.
              </p>
            </div>
            <div className="relative rounded-full bg-white/15 p-4 backdrop-blur transition-transform group-hover:translate-x-2">
              <ArrowRight className="size-7" strokeWidth={2.5} />
            </div>
          </Link>
        </section>

        <footer className="mt-12 text-xs text-muted-foreground">
          Tus preferencias viven en tu navegador. Nada se sube a un servidor.
        </footer>
      </div>
    </main>
  );
}
