# Daily — News App

Agregador visual personal de noticias de **música** (nuevos lanzamientos) e **inteligencia artificial** (novedades y herramientas). Construido con Next.js 16, shadcn/ui, Vercel AI SDK, Spotify Web API y NewsAPI.org.

## Setup

```bash
cp .env.local.example .env.local
# completar las 4 claves (Spotify, NewsAPI, Anthropic)
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Dónde obtener las claves

- **Spotify** — https://developer.spotify.com/dashboard → crear app → copiar Client ID y Client Secret.
- **NewsAPI** — https://newsapi.org/register (free tier: 100 requests/día).
- **Anthropic Claude** — https://console.anthropic.com/settings/keys.

## Flujo

1. Landing: elegís una vertical (Música o IA).
2. Chat: un curador conversacional (Claude Haiku 4.5) te hace preguntas cortas mientras editás tus preferencias con chips. Las prefs viven en `localStorage`.
3. Feed: bento grid de 6–14 tarjetas con tamaños variados (hero, wide, tall, square, banner) e imágenes hero grandes.

## Estructura

```
app/
├─ page.tsx                  → landing
├─ music/page.tsx            → chat música
├─ music/feed/page.tsx       → bento feed música
├─ ai/page.tsx               → chat IA
├─ ai/feed/page.tsx          → bento feed IA
└─ api/
   ├─ chat/route.ts          → stream Claude
   ├─ news/music/route.ts    → Spotify releases
   └─ news/ai/route.ts       → NewsAPI

components/
├─ category-card.tsx
├─ chat-ui.tsx               → useChat + DefaultChatTransport
├─ prefs-editor.tsx          → chips para artistas/tópicos/tools
├─ bento-grid.tsx            → CSS Grid 4-col con spans
├─ news-card.tsx             → 5 variantes de tamaño
├─ image-with-fallback.tsx
└─ feed-skeleton.tsx

lib/
├─ types.ts
├─ preferences.ts            → helpers localStorage
├─ spotify.ts                → Client Credentials + new releases
└─ newsapi.ts                → /v2/everything + keyword filter
```

## Deploy

Push a Vercel, configurar las variables de entorno en **Project Settings → Environment Variables**, y listo.
