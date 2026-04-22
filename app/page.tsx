import { Disc3, Sparkles } from "lucide-react";
import { CategoryCard } from "@/components/category-card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 md:py-16">
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
          {new Intl.DateTimeFormat("es-AR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })
            .format(new Date())
            .toUpperCase()}
        </span>
      </header>

      <section className="mb-14 max-w-4xl">
        <p className="mb-4 text-sm tracking-[0.2em] uppercase text-muted-foreground">
          Hola, Daniel
        </p>
        <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tighter text-balance md:text-7xl lg:text-8xl">
          ¿Qué querés{" "}
          <span className="bg-gradient-to-r from-[var(--music-from)] via-[var(--music-to)] to-[var(--ai-from)] bg-clip-text text-transparent">
            saber
          </span>{" "}
          hoy?
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
          Elegí una vertical y te armo tu dosis diaria. Un chat corto para entender
          qué tenés en la cabeza, y después un feed pensado para que te pierdas un rato.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CategoryCard
          href="/music"
          title="Música"
          subtitle="Nuevos lanzamientos de los artistas que te importan. Singles, álbumes, lo que salió esta semana."
          eyebrow="Lanzamientos"
          icon={<Disc3 className="size-14" strokeWidth={1.2} />}
          gradient="linear-gradient(135deg, oklch(0.32 0.18 330) 0%, oklch(0.22 0.18 300) 60%, oklch(0.16 0.12 280) 100%)"
          accent="oklch(0.75 0.25 330)"
        />
        <CategoryCard
          href="/ai"
          title="IA"
          subtitle="Las herramientas, modelos y novedades que están saliendo ahora. Lo justo para que no te atrases."
          eyebrow="Novedades"
          icon={<Sparkles className="size-14" strokeWidth={1.2} />}
          gradient="linear-gradient(135deg, oklch(0.28 0.14 220) 0%, oklch(0.22 0.14 200) 60%, oklch(0.16 0.1 180) 100%)"
          accent="oklch(0.78 0.17 220)"
        />
      </section>

      <footer className="mt-auto pt-16 text-xs text-muted-foreground">
        <p>
          Tus preferencias viven en tu navegador. Nada se sincroniza, nada se sube a un servidor.
        </p>
      </footer>
    </main>
  );
}
