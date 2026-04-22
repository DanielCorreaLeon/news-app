# Handoff — Daily News App

> Este documento es el punto de entrada para entender el proyecto entero. Si abrís un chat nuevo con Claude, pegá este archivo y Claude puede continuar sin preguntar nada.

## 1. Qué es esto

Una app web personal para **Daniel** (primer proyecto web full-stack) que agrega noticias en dos verticales:

- **Música** — nuevos lanzamientos (singles/álbumes) de artistas favoritos, via Spotify Web API.
- **IA** — novedades y herramientas nuevas, via NewsAPI.org filtrada por tópicos y tools.

**Objetivo central:** que sea **sumamente visual**. El criterio de éxito es "alguien pasa detrás mío y dice wow". Por eso el feed final es un **bento grid** con tarjetas de tamaños variados (hero 2×2, wide 2×1, tall 1×2, square 1×1, banner 4×1) con imágenes hero grandes, gradientes oscuros para legibilidad y tipografía display bold.

**Flujo de usuario:**

1. Landing `/` → dos cards gigantes con gradientes (morado→violeta = música, celeste→cyan = IA).
2. Chat `/music` o `/ai` → curador conversacional (Claude Haiku 4.5) hace preguntas cortas mientras el usuario edita chips de preferencias. Preferencias viven en `localStorage`.
3. Feed `/music/feed` o `/ai/feed` → bento grid de 6–14 tarjetas con imágenes hero. Click en card abre la nota/Spotify en pestaña nueva.

## 2. Stack (ya instalado)

- **Next.js 16.2.4** (App Router, Turbopack, React 19.2.4)
- **TypeScript 5** (strict)
- **Tailwind CSS 4** + **shadcn/ui** (neutral base, dark mode forzado)
- **Vercel AI SDK v6** (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) — streaming chat con Claude Haiku 4.5
- **Motion** (framer-motion v12) — transiciones y hover-lift
- **Lucide React** — iconografía
- **Zod** — no usado todavía, disponible para validación de API si hace falta

**Fuentes de datos:**

- Spotify Web API con **Client Credentials** flow (sin login de usuario, token cacheado en memoria del server)
- NewsAPI.org **free tier** (100 requests/día, rate-limit clave — el endpoint cachea 30 min)
- **Anthropic Claude Haiku 4.5** (`claude-haiku-4-5`) para el chat

**Persistencia:** **solo `localStorage`**. No hay base de datos. Decisión explícita para MVP (sincronizado con Daniel, no tocar sin preguntar).

**Deploy destino:** Vercel. Todavía no se hizo, pero `npm run build` pasa.

## 3. Ubicación del proyecto

```
/Users/danielcorrea/Documents/Daniel/Claude code/news-app/
```

Al lado de `n8n-agent-v2`, `n8n-agent-v1`, etc. **Repo independiente**, no toca nada afuera de esa carpeta.

## 4. Estructura completa de archivos

```
news-app/
├── HANDOFF.md                       ← este archivo
├── README.md                        ← setup corto
├── .env.local.example               ← template con las 4 claves y sus URLs
├── package.json                     ← deps ya instaladas
├── next.config.ts                   ← images.remotePatterns: **  (acepta cualquier dominio)
├── tsconfig.json                    ← paths @/* → ./*
├── components.json                  ← config shadcn
├── app/
│   ├── layout.tsx                   ← fuentes (Geist + Space Grotesk display), html.dark, body con gradientes radiales y textura grain
│   ├── globals.css                  ← design tokens (oklch), tokens custom --music-from/--ai-from, utilidades .font-display/.glass/.grain
│   ├── page.tsx                     ← LANDING: header Daily, h1 "¿Qué querés saber hoy?", dos CategoryCard
│   ├── music/
│   │   ├── page.tsx                 ← CHAT música (client): lee useMusicPrefs, monta ChatUI
│   │   └── feed/page.tsx            ← FEED música (client): fetch /api/news/music, BentoGrid
│   ├── ai/
│   │   ├── page.tsx                 ← CHAT ia (client): espejo de music/page.tsx
│   │   └── feed/page.tsx            ← FEED ia (client): fetch /api/news/ai, BentoGrid
│   └── api/
│       ├── chat/route.ts            ← streaming chat Claude: system prompt distinto por categoría, lee prefs del body
│       ├── news/music/route.ts      ← GET ?artists=x,y&exclude=z → llama a lib/spotify
│       └── news/ai/route.ts         ← GET ?topics=a,b&tools=c&focus=d → llama a lib/newsapi
├── components/
│   ├── category-card.tsx            ← card animada de landing (hover-lift, icono que rota, eyebrow con ping)
│   ├── chat-ui.tsx                  ← UI de chat: bubbles, input flotante glass, header con "Ver mi feed" + PrefsEditor arriba
│   ├── prefs-editor.tsx             ← chips editables: Music (lista de artistas) / AI (tópicos toggle + tools)
│   ├── bento-grid.tsx               ← CSS Grid 4-col con patrón fijo de spans (hero, wide, square, tall, banner)
│   ├── news-card.tsx                ← tarjeta polimórfica (size: hero/wide/tall/square/banner), imagen + gradiente + título display + meta
│   ├── image-with-fallback.tsx      ← <img> con fallback a gradiente si 404 o src null
│   ├── feed-skeleton.tsx            ← skeleton shimmer con el mismo patrón de tamaños
│   └── ui/                          ← button, card, input, avatar, badge, skeleton, scroll-area (generados por shadcn)
└── lib/
    ├── types.ts                     ← MusicPrefs, AiPrefs, AiTopic, NewsItem, MusicItem, FeedItem (discriminated union), Category
    ├── preferences.ts               ← getMusicPrefs/setMusicPrefs, useMusicPrefs/useAiPrefs (useSyncExternalStore con cache + listeners)
    ├── spotify.ts                   ← getToken (Client Credentials, cacheado), findArtistId, getArtistReleases, getNewReleasesForArtists
    ├── newsapi.ts                   ← buildQuery (topics → keywords), getAiNews (/v2/everything, filtra items sin imagen primero)
    └── utils.ts                     ← cn() de shadcn
```

## 5. Cómo funciona cada pieza

### Landing (`app/page.tsx`)
- Server component puro.
- Usa `<CategoryCard>` con `href`, `gradient` inline, `accent` para el blob radial que se revela en hover, icon de Lucide (Disc3 / Sparkles).
- Fecha de hoy formateada en español.

### Chat (`app/music/page.tsx` y `app/ai/page.tsx`)
- Client components muy delgados: hook `useMusicPrefs()` / `useAiPrefs()` para leer de localStorage, pasan a `<ChatUI>` junto con `accentFrom/accentTo` (oklch violeta o cyan).
- `onPrefsChange` llama a `setMusicPrefs/setAiPrefs` que escribe en localStorage y notifica listeners.

### ChatUI (`components/chat-ui.tsx`)
- Estado local: `prefs` (mutable sin escribir a storage hasta que `onPrefsChange` se dispare), `input`.
- Usa `useChat({ transport })` de `@ai-sdk/react` con un `DefaultChatTransport` **declarado a nivel de módulo** (fuera del componente) — esto es intencional para evitar el lint `react-hooks/refs`.
- El body dinámico (category + prefs) se pasa al llamar `sendMessage({ text }, { body: { category, prefs } })`.
- Greeting inicial se calcula con `useMemo` según si tiene prefs o no (onboarding vs returning).
- Input flotante al pie con efecto `glass` (backdrop-blur).
- Scroll auto-bottom en cada nuevo mensaje o cambio de status.
- Botón sticky arriba derecha "Ver mi feed →" (gradient button, siempre habilitado).

### PrefsEditor (`components/prefs-editor.tsx`)
- Modo `music`: chips de artistas (AnimatePresence para agregar/quitar con escala), input inline con Enter para agregar, lista de sugerencias seed si está vacío (Bad Bunny, Taylor Swift, etc.).
- Modo `ai`: toggles de tópicos (models/coding/agents/image/research/startups) + chips de tools en uso.

### Feed (`app/music/feed/page.tsx` y `app/ai/feed/page.tsx`)
- Client component: `useMusicPrefs()` → deriva `hasPrefs` → `useEffect` con `AbortController` que hace `fetch('/api/news/...')`.
- `likedKey/topicsKey/toolsKey` como deps (strings, estables).
- Estados visuales: sin prefs → `<EmptyState>`, cargando → `<FeedSkeleton>`, vacío → EmptyState, con datos → `<BentoGrid>`, error → banner destructivo.
- Botón "Actualizar" incrementa `refreshKey` (re-fetch).

### BentoGrid (`components/bento-grid.tsx`)
- `grid-cols-4` md, `auto-rows-[200px]`, gap-4.
- Patrón fijo de 14 tamaños que se cicla: `[hero, wide, square, square, tall, wide, square, banner, hero, wide, square, square, tall, wide]`.
- Mobile: colapsa a 1 columna.

### NewsCard (`components/news-card.tsx`)
- Polimórfico: recibe `item: FeedItem` (discriminated union `{kind: 'news' | 'music'}`).
- Tamaño controla `col-span/row-span` y `aspect-ratio` del wrapper de imagen.
- Título con `text-3xl → text-5xl` según tamaño, `font-display` (Space Grotesk bold).
- Meta (source + fecha relativa): `hace 3h`, `hace 2d`, `15 abr`, etc.
- Hover: `y: -4`, imagen `scale-105`, icono ArrowUpRight aparece.

### API routes

**`POST /api/chat`** (`runtime: nodejs`, `maxDuration: 60`)
- Body: `{ messages: UIMessage[], category, prefs }`.
- `convertToModelMessages` (await — retorna Promise en v6) → `streamText` con `anthropic('claude-haiku-4-5')`.
- System prompt interpola prefs y fecha de hoy en español.
- Retorna `result.toUIMessageStreamResponse()` (stream SSE compatible con `useChat`).

**`GET /api/news/music?artists=a,b&exclude=c`**
- Llama a `getNewReleasesForArtists`: busca cada artista, trae sus últimos álbumes/singles, ordena por fecha desc, dedupe por `artista::título`, corta a 12.
- Cache Next 10 min (`next: { revalidate: 600 }`).

**`GET /api/news/ai?topics=models,agents&tools=claude,cursor&focus=foo`**
- `buildQuery` arma `(keywords OR tools OR focus) AND (launched OR release OR announced OR introduces)`.
- Ventana: últimos 7 días.
- Prioriza items con imagen (NewsAPI trae muchos sin `urlToImage`). Corta a 14.
- Cache 30 min.

### Preferences module (`lib/preferences.ts`)
- Cache en memoria + listeners para `useSyncExternalStore`.
- `set*Prefs` ejecuta los listeners sincrónicamente → todos los consumidores re-renderizan.
- Hydration SSR: retorna `DEFAULT_*` en el servidor para evitar mismatch, luego se hidrata cliente-side cuando `useSyncExternalStore` se suscribe.

## 6. Configuración visual

- **Dark mode forzado** (clase `dark` en `<html>`, no system preference).
- **Tokens oklch** con gradientes radiales de fondo (`--music-from` magenta, `--ai-from` cyan).
- **Textura grain** (SVG noise inline) con `mix-blend-overlay` a 4% opacity para romper el "look digital".
- **Fuente display: Space Grotesk** 500/600/700 (cargada via `next/font/google`) con `letter-spacing: -0.03em`.
- **Scrollbar del OS** — no customizado.

## 7. Pasos para arrancar (setup completo desde cero)

### 7.1. Conseguir las 4 API keys

1. **Spotify** — https://developer.spotify.com/dashboard
   - Loguearse con tu cuenta de Spotify.
   - "Create app" → cualquier nombre (ej: "Daily News").
   - En "Redirect URI" poné `http://localhost:3000` (no se usa pero el dashboard lo exige).
   - "Save" → en la card de la app, click "Settings" → copiar **Client ID** y ver **Client Secret**.

2. **NewsAPI** — https://newsapi.org/register
   - Registrarte con email.
   - Copiar la API key que te muestran.
   - Free tier: 100 requests/día (alcanza de sobra; el endpoint cachea 30 min).

3. **Anthropic** — https://console.anthropic.com/settings/keys
   - Loguearse (ya tenés cuenta).
   - "Create Key" → copiar.

### 7.2. Instalar y correr

```bash
cd "/Users/danielcorrea/Documents/Daniel/Claude code/news-app"
cp .env.local.example .env.local
# editar .env.local y pegar las 4 claves
npm install         # si se borró node_modules (ya está instalado)
npm run dev
```

Abrir http://localhost:3000.

### 7.3. Golden path de prueba

**Música:**
1. Home → click card "Música"
2. Vas a `/music`. Aparecen sugerencias (Bad Bunny, Taylor Swift…). Click en 3–4.
3. Chat dice "Hola, te sigo a X, Y, Z. ¿Qué estás escuchando?" → escribir algo → Claude responde streaming.
4. Click "Ver mi feed →" → `/music/feed`.
5. Skeleton shimmer mientras carga, después bento grid con lanzamientos reales de tus artistas.

**IA:**
1. Home → click card "IA"
2. `/ai`. Tocar toggles de tópicos (ej: Modelos, Agentes). Agregar tools (ej: Claude, Cursor).
3. Chat → escribir → respuesta streaming.
4. "Ver mi feed →" → `/ai/feed` con bento de noticias.

## 8. Estado actual

✅ Funciona:
- Build (`npm run build`) pasa: 11 rutas compiladas
- Typecheck (`npx tsc --noEmit`) limpio
- Lint (`npm run lint`) limpio
- Las 5 rutas principales responden HTTP 200 en dev
- Dark mode, gradientes, motion transitions, glass effect, grain texture, fuentes custom, responsive mobile

⚠️ No probado en vivo (faltan claves):
- Chat real con Claude (lógica armada, pero sin `ANTHROPIC_API_KEY` no podés chatear)
- Fetch de Spotify (sin `SPOTIFY_CLIENT_*` el endpoint retorna 500 con mensaje claro)
- Fetch de NewsAPI (sin `NEWS_API_KEY` lo mismo)

Los errores se muestran inline en un banner destructivo en cada feed page, apuntando a `.env.local`.

## 9. Decisiones no-obvias (por si se pregunta "¿por qué?")

- **localStorage, no DB**: decisión explícita de Daniel para MVP. No proponer agregar DB sin que él lo pida.
- **DefaultChatTransport a nivel de módulo**: la documentación lo pone dentro del componente con `useMemo`, pero React 19 lint (`react-hooks/refs`) lo rechaza si accede a `ref.current`. Solución: transport estático + pasar body dinámico via `sendMessage(message, { body })`.
- **`useSyncExternalStore` en lugar de useState+useEffect**: React 19 introdujo `react-hooks/set-state-in-effect` que complains sobre hydration de localStorage con el patrón común. `useSyncExternalStore` es el patrón bendecido.
- **Sin Spotify user auth**: Client Credentials es suficiente para lookup público de artistas/albums. User auth (OAuth) agregaría complejidad sin beneficio claro para este MVP.
- **NewsAPI en inglés (`language=en`)**: las novedades de IA se cubren mejor en inglés. Si querés que también busque en español hay que parametrizarlo.
- **Sin tool calls en el chat**: inicialmente se consideró que Claude use tools para editar prefs, pero el lint de React 19 + la complejidad extra lo hicieron desestimable. El chat es puramente conversacional; la edición de prefs es manual con chips en la UI.
- **Imágenes via `<img>` y no `next/image`**: los hosts que devuelve NewsAPI son miles y variados; aunque `next.config.ts` acepta `**`, usar `<img>` con fallback gradient es más robusto para una UI que prioriza el visual y no se rompe si una imagen falla.

## 10. Próximos pasos sugeridos (ideas para iterar)

Sin urgencia ni compromiso, en orden de impacto:

1. **Conseguir las claves y probar end-to-end**. Este es el único paso crítico.
2. **Deploy a Vercel** — `vercel` CLI (`plugin-vercel-cli` ya está configurado globalmente según `MEMORY.md`). Setear las 4 variables en Project Settings.
3. **Preferencias compartidas via URL** — si Daniel quiere enseñar la app a alguien, poder exportar/importar un blob de prefs.
4. **Onboarding más guiado** — hoy si entrás a `/music` directo sin pasar por landing se ve un poco vacío. Un micro-tutorial o prompt "agregá tu primer artista" arriba sería lindo.
5. **Un toggle "en español"** en el feed de IA que cambie `language=es` en el query de NewsAPI.
6. **Lightbox al click en card** en vez de abrir en pestaña nueva — para un feel más app y menos "portal de links".
7. **Integración Last.fm** — si Daniel ya scrobblea, leer su "recently played" daría mejor personalización automática que la lista manual.
8. **Modo de resumen con IA** — botón en cada card "Resumime esto en 3 bullets" que llame a Claude con la URL.

## 11. Cosas que NO hacer sin preguntar

- Agregar base de datos (Postgres, Redis, etc.)
- Agregar auth (NextAuth, Clerk, etc.)
- Agregar Spotify user OAuth
- Cambiar el stack (migrar a Remix, reemplazar shadcn, etc.)
- Borrar localStorage en algún flujo automático
- Subir imágenes a un CDN propio (hoy son links directos a fuentes)
- Conectar analytics/telemetría

## 12. Comandos útiles

```bash
# dev
npm run dev

# build de producción
npm run build

# chequeos
npx tsc --noEmit        # typecheck
npm run lint            # eslint

# agregar componentes shadcn
npx shadcn@latest add <nombre>
```

## 13. Contactos / dependencies externas

| Servicio | Rate limit / Notas |
|---|---|
| Spotify Web API | 180 req/min compartido. Cache server-side 10 min por artista. |
| NewsAPI free | 100 req/día. Cache 30 min. Solo devuelve últimos 30 días de artículos. |
| Anthropic | pay-as-you-go. Haiku 4.5 es barato ~$1/M tokens input. Chat promedio cuesta fracciones de centavo. |

---

*Generado: 2026-04-22. Si algo de esto está desactualizado, verificar contra el código fuente real antes de asumir como fact.*
