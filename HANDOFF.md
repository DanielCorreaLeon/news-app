# Handoff — Daily News App

> Punto de entrada para entender todo el proyecto. Si abres un chat nuevo con Claude, pega este archivo y Claude puede continuar sin preguntar nada.

## 1. Qué es

App web personal de **Daniel** (primer proyecto web full-stack). Muestra lanzamientos musicales personalizados:
- **Seeds**: lanzamientos de los artistas que el usuario configura (chips)
- **Similares**: colaboraciones de esos artistas con otros (via búsqueda en Spotify)
- **Para ti hoy**: resultados de lo que escribe en el campo "¿Qué estás escuchando?"

**Objetivo:** que sea **visualmente impresionante**. El feed es un bento grid con tamaños variados (hero 2×2, wide 2×1, tall 1×2, square 1×1, banner 4×1), portadas reales grandes, gradientes oscuros y tipografía display bold. Landing con 2 cards simétricas (CTA + panel personal con mosaico).

## 2. Stack

- **Next.js 16.2.4** (App Router, Turbopack, React 19.2.4)
- **TypeScript 5** (strict)
- **Tailwind CSS 4** + **shadcn/ui** (neutral base, dark mode forzado)
- **Motion** (framer-motion v12) — transiciones
- **Lucide React** — iconos
- **Spotify Web API** (Client Credentials, sin login de usuario)
- **Idioma:** español neutro (ni argentino, ni castellano)

Dependencias AI/IA fueron removidas (sin Claude API, sin NewsAPI).

**Persistencia:** **solo `localStorage`**. No hay base de datos.

**Deploy:** Vercel (plugin + CLI configurados globalmente, user `danielcorrealeon-3288`).

## 3. Ubicación

```
/Users/danielcorrea/Documents/Daniel/Claude code/news-app/
```

Repo git independiente. GitHub: `DanielCorreaLeon/news-app` (pendiente de crear al desplegar).

## 4. Versiones guardadas en git

Cada versión está taggeada. Para volver a una: `git checkout vN`.

| Tag | Descripción |
|---|---|
| `v1` | Landing con 2 cards (Música + IA). HN para IA news. Sin filtro de año. Bugs con homónimos. |
| `v2` | Solo música. Filtro de 2026 (causa feed vacío con muchos artistas). |
| `v3` | Fixes del límite de Spotify (apps nuevas capadas a `limit=10`). |
| `v4` | Landing 2 cols, español neutro, `appears_on` para similares. |
| `v5` | Cards simétricas aspect-[4/5] en landing. |
| `v6` ⭐ | **Actual.** Pivot a `search` API (evita rate-limit de `/artists/{id}/albums`). |

## 5. Estructura de archivos

```
news-app/
├── HANDOFF.md                       ← este archivo
├── README.md                        ← setup corto
├── .env.local.example               ← solo Spotify (2 claves)
├── .env.local                       ← secretos locales, no en git
├── package.json                     ← sin AI SDK, sin newsapi
├── next.config.ts                   ← images.remotePatterns: **
├── tsconfig.json                    ← paths @/* → ./*
├── app/
│   ├── layout.tsx                   ← fuentes (Geist + Space Grotesk), html.dark, gradientes de fondo, grain
│   ├── globals.css                  ← tokens oklch (music-from/to), utilidades .font-display/.glass/.grain
│   ├── page.tsx                     ← LANDING: server, fetch getLandingCovers, dos cards en grid
│   ├── setup/
│   │   └── page.tsx                 ← SETUP: client, chips + input listening + CTA "Ver mi feed"
│   ├── feed/
│   │   └── page.tsx                 ← FEED: client, fetch /api/news/music, BentoGrid
│   └── api/news/music/route.ts      ← GET artists=...&exclude=...&listening=... → llama lib/spotify
├── components/
│   ├── feed-cta-card.tsx            ← card izq de la landing (gradient violeta + Disc3)
│   ├── personal-panel.tsx           ← card der de la landing (mosaico 2x2 + chips + "Ir a mi feed")
│   ├── cover-wall.tsx               ← background grid de portadas en landing
│   ├── setup-screen.tsx             ← pantalla de setup (sin chat, solo configuración)
│   ├── prefs-editor.tsx             ← chips editables de artistas
│   ├── bento-grid.tsx               ← CSS Grid 4-col con patrón de spans
│   ├── news-card.tsx                ← 5 variantes (hero/wide/tall/square/banner) + badge de source
│   ├── image-with-fallback.tsx      ← <img> con fallback gradient si 404/null
│   ├── feed-skeleton.tsx            ← shimmer mientras carga
│   └── ui/                          ← button, card, input, avatar, badge, skeleton (shadcn)
└── lib/
    ├── types.ts                     ← MusicPrefs, MusicItem, ReleaseSource
    ├── preferences.ts               ← getMusicPrefs/setMusicPrefs + useMusicPrefs (useSyncExternalStore)
    └── spotify.ts                   ← getReleasesInspiredBy, getLandingCovers (solo usa /search)
```

## 6. Cómo funciona

### Landing (`app/page.tsx`)
- Server component con `revalidate = 3600`.
- Fetch `getLandingCovers()` → 8 artistas populares, 1 portada cada uno (cacheado 1h en servidor Next).
- Render: header, hero text, grid 2-col con `<FeedCtaCard />` izq + `<PersonalPanel />` der.
- `<CoverWall />` con las portadas en grid 4x3 de fondo al 38% opacity.

### Setup (`/setup`)
- Client, usa `useMusicPrefs()` hook.
- Muestra `<PrefsEditor />` (chips editables de artistas) + campo "¿Qué estás escuchando hoy?" (opcional).
- Al guardar la nota, se escribe en `lastSession.listening`.
- Botón "Ver mi feed →" navega a `/feed`.

### Feed (`/feed`)
- Client, usa `useMusicPrefs()`, hace fetch a `/api/news/music?artists=...&listening=...`.
- Muestra loading skeleton → BentoGrid.
- Cada card muestra su source: "Tus artistas", "Similar", "Para ti hoy".
- Botón refresh invalida y reactualiza.

### API `/api/news/music`
- Recibe `artists`, `exclude`, `listening` (todo como CSV/texto en query string).
- Llama a `getReleasesInspiredBy(artists, exclude, listening)`.
- Devuelve `{ items: MusicItem[] }`.

### `lib/spotify.ts` — núcleo

**Token**: Client Credentials, cacheado en memoria hasta expirar.

**Rate limit**: ⚠️ `/artists/{id}/albums` está severamente rate-limited para apps no-extended (retry-after hasta 23h). **Solución v6**: usamos SOLO el endpoint `/search` que tiene quota separada y más generosa.

**Algoritmo por seed artist** (`getReleasesForOneSeed`):
- `search?q=artist:"Nombre"&type=album&limit=10` → filtra por main artist match exacto → **seeds**
- `search?q="Nombre"&type=album&limit=10` → filtra donde main artist NO sea el seed → **similares** (colaboraciones)

**Listening**: `search?q=<texto-libre>&type=album&limit=10` → tag `listening`.

**Merge**: dedupe por album ID, prioriza seed > listening > similar, sort por release_date desc, cap a 18.

### Preferences (`lib/preferences.ts`)
- `useSyncExternalStore` para hidratación correcta en React 19.
- Cache en memoria + listeners para notificar cambios.
- 1 sola key de localStorage: `news-app.music-prefs.v1`.

## 7. Setup local

```bash
cd "/Users/danielcorrea/Documents/Daniel/Claude code/news-app"
cp .env.local.example .env.local
# editar .env.local y pegar SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET
npm install   # deps ya instaladas, idempotente
npm run dev
# abrir http://localhost:3000
```

### Credenciales Spotify
- https://developer.spotify.com/dashboard → Create app
- Redirect URI: `http://127.0.0.1:3000` (Spotify rechaza `http://localhost:...` por política nueva)
- Copiar Client ID + Client Secret a `.env.local`

## 8. Estado actual (verificado)

- ✅ Build limpio (`npm run build`)
- ✅ Typecheck limpio (`npx tsc --noEmit`)
- ✅ Lint limpio (`npm run lint`)
- ✅ Feed funciona con Bad Bunny (seeds + similares reales como Aventura, J Balvin, Ozuna)
- ✅ Feed funciona con Harry Styles (2026 releases: Kiss All The Time, Aperture)
- ⚠️ Algunos artistas solistas puros (Harry Styles) no traen similares porque no tienen colaboraciones en Spotify — la "columna" similar queda vacía para ellos.

## 9. Lo que SÍ hay que saber antes de iterar

- **Spotify rate-limits severos**: `/artists/{id}/albums`, `/top-tracks`, `/related-artists`, `/recommendations`, `genre:` filter en search, `/browse/new-releases` → todos bloqueados o 403 para apps no-extended. **Solo funciona bien `/search`.**
- **`limit` máximo de Spotify search**: 10. No pidas más, tira 400.
- **Spotify dejó de incluir `genres` y `popularity`** en los objetos de artista (security/privacy change reciente).
- **Preferencias solo en localStorage**. Si Daniel limpia cookies/storage, pierde todo. Decisión explícita para MVP.

## 10. Lo que NO hacer sin preguntar

- Agregar base de datos (Postgres, Redis, etc.)
- Agregar auth (NextAuth, Clerk, Spotify OAuth)
- Cambiar el stack
- Borrar localStorage en algún flujo automático
- Conectar analytics

## 11. Ideas para iterar (no urgentes)

- **Spotify user OAuth** para acceder a top tracks reales del usuario (mejora masiva del panel personal, pero agrega complejidad)
- **Last.fm API** como fuente alternativa de similares (más limpios que appears_on)
- **Guardar favoritos** en localStorage (toggle ♥ en cada card del bento)
- **Share del feed** por URL (serializar prefs en query string)
- **Push notifications** cuando un artista seed suelta algo nuevo

## 12. Contactos / integraciones externas

| Servicio | Auth | Límites |
|---|---|---|
| Spotify Web API | Client Credentials | `/search` generoso, `/artists/{id}/*` bloqueado hasta 23h en rate-limit |
| Vercel | Plugin + CLI, user `danielcorrealeon-3288` | Hobby plan free |
| GitHub | gh CLI, user `DanielCorreaLeon` (token en keyring) | - |

## 13. Comandos útiles

```bash
# dev
npm run dev

# checks
npm run build
npx tsc --noEmit
npm run lint

# git versiones
git tag -l                 # listar tags
git checkout v1            # saltar a una versión vieja (crea detached HEAD)
git checkout main          # volver

# deploy
vercel deploy              # preview
vercel --prod              # production
```

---

*Última actualización: v6 (search-only pivot). Si algo cambió, verificar contra el código antes de asumir.*
