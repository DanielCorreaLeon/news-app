# Handoff — Daily News App

> **Punto único de entrada.** Si abres un chat nuevo con Claude, pega este archivo y Claude puede continuar sin preguntar nada.

---

## 🔗 Enlaces importantes (todo lo que necesitas)

| Qué | URL / ubicación |
|---|---|
| **App en vivo** (producción) | https://news-app-danielcorrealeon-3288s-projects.vercel.app |
| **Código fuente** (GitHub, público) | https://github.com/DanielCorreaLeon/news-app |
| **Dashboard Vercel** | https://vercel.com/danielcorrealeon-3288s-projects/news-app |
| **Spotify Developer Dashboard** | https://developer.spotify.com/dashboard (app: "Daily News" o similar) |
| **Carpeta local del proyecto** | `/Users/danielcorrea/Documents/Daniel/Claude code/news-app/` |
| **Archivo de credenciales locales** | `.env.local` (NO está en git, NO se sube a Vercel, vive solo en tu Mac) |

**Cuentas involucradas**
- GitHub: `DanielCorreaLeon` (autenticado via `gh` CLI)
- Vercel: `danielcorrealeon-3288` (autenticado via `vercel` CLI, plan Hobby, gratis)
- Spotify Developer: tu cuenta de Spotify personal

---

## 🚀 Qué hace la app

Agregador personal de lanzamientos musicales:
- **Seeds**: lanzamientos de los artistas que configuras con chips en `/setup`
- **Similares**: colaboraciones de esos artistas con otros (vía búsqueda en Spotify)
- **Para ti hoy**: resultados del campo "¿Qué estás escuchando hoy?"

**Flujo**: Landing (`/`) → Setup (`/setup`) con chips + listening → Feed (`/feed`) con bento grid.

Las preferencias viven en `localStorage` del navegador. No hay base de datos, no hay auth.

---

## 📁 Estructura del proyecto

```
news-app/
├── HANDOFF.md                       ← este archivo
├── README.md                        ← setup corto
├── .env.local.example               ← template con 2 claves de Spotify
├── .env.local                       ← secretos locales (gitignoreado)
├── .vercel/project.json             ← linking a Vercel (id del proyecto)
├── package.json
├── next.config.ts                   ← images.remotePatterns: **
├── app/
│   ├── layout.tsx                   ← fuentes (Geist + Space Grotesk), html.dark
│   ├── globals.css                  ← tokens oklch, utilidades grain/glass
│   ├── page.tsx                     ← LANDING server component
│   ├── setup/page.tsx               ← SETUP client, chips + listening
│   ├── feed/page.tsx                ← FEED client, bento grid
│   └── api/news/music/route.ts      ← GET artists/exclude/listening → Spotify
├── components/
│   ├── feed-cta-card.tsx            ← card izq del landing
│   ├── personal-panel.tsx           ← card der del landing (mosaico + chips)
│   ├── cover-wall.tsx               ← grid de portadas de fondo
│   ├── setup-screen.tsx
│   ├── prefs-editor.tsx
│   ├── bento-grid.tsx
│   ├── news-card.tsx                ← 5 variantes de tamaño
│   ├── image-with-fallback.tsx
│   ├── feed-skeleton.tsx
│   └── ui/                          ← shadcn
└── lib/
    ├── types.ts
    ├── preferences.ts               ← useSyncExternalStore para localStorage
    └── spotify.ts                   ← getReleasesInspiredBy, getLandingCovers (solo /search)
```

---

## 🛠️ Operar el proyecto

### Correr localmente
```bash
cd "/Users/danielcorrea/Documents/Daniel/Claude code/news-app"
npm run dev
# abrir http://localhost:3000
```

El archivo `.env.local` ya está creado con tus claves de Spotify. Si alguna vez se pierde, copiá `.env.local.example` y pegá tus credenciales del dashboard de Spotify.

### Desplegar cambios a producción
```bash
cd "/Users/danielcorrea/Documents/Daniel/Claude code/news-app"
# editá el código
git add -A
git commit -m "mensaje del cambio"
git push
# Vercel auto-deploya en ~30s. Mirá el resultado en la URL de producción.
```

**No hace falta hacer nada en Vercel manualmente.** Cada `git push` a `main` deploya automáticamente.

### Ver todos los deployments
```bash
cd "/Users/danielcorrea/Documents/Daniel/Claude code/news-app"
vercel ls news-app
```

### Rollback a una versión anterior
```bash
cd "/Users/danielcorrea/Documents/Daniel/Claude code/news-app"
git tag -l                    # listar versiones (v1, v2, v3, v4, v5, v6)
git checkout v5               # ir a v5 (modo lectura)
git checkout main             # volver a la última

# Para hacer rollback real en producción:
git reset --hard v5           # ⚠️ reescribe main a v5
git push --force              # ⚠️ auto-deploya esa versión
```

### Gestionar variables de entorno en Vercel
```bash
cd "/Users/danielcorrea/Documents/Daniel/Claude code/news-app"
vercel env ls                                           # listar
vercel env rm SPOTIFY_CLIENT_ID production --yes        # borrar
printf "%s" "NUEVO_VALOR" | vercel env add SPOTIFY_CLIENT_ID production
# importante: usar printf (sin \n), NO echo
```

### Chequeos antes de pushear
```bash
npm run build          # build production (obligatorio pasar antes de pushear)
npm run lint           # eslint
npx tsc --noEmit       # typecheck
```

---

## 📦 Versiones guardadas (git tags)

Cada versión está taggeada. Para volver: `git checkout vN`.

| Tag | Estado | Descripción |
|---|---|---|
| `v1` | archivada | Landing con 2 cards (Música + IA). HN para IA news. Sin filtro de año. |
| `v2` | archivada | Solo música. Filtro de 2026 (causa feed vacío si artista no tiene releases este año). |
| `v3` | archivada | Fix del límite de Spotify (apps nuevas capadas a `limit=10`). |
| `v4` | archivada | Landing 2 cols, español neutro, `appears_on` para similares. |
| `v5` | archivada | Cards simétricas aspect-[4/5]. |
| **`v6`** | **✅ actual, deployada** | Pivot a `search` API (evita rate-limit de `/artists/{id}/albums`). |

---

## 🔑 Credenciales Spotify (dónde vive cada parte)

1. **Spotify Developer Dashboard** (donde creaste la app)
   - URL: https://developer.spotify.com/dashboard
   - App name: la que creaste (probablemente "Daily News")
   - Redirect URI registrada: `http://127.0.0.1:3000` (NO se usa, pero Spotify lo exige)
   - Flow: Client Credentials (sin login de usuario)

2. **Archivo local** (`.env.local`, gitignoreado, vive solo en tu Mac)
   ```
   SPOTIFY_CLIENT_ID=407170f1a81347fe909e298abf4fcfe0
   SPOTIFY_CLIENT_SECRET=3084a772f7d5452b82bdf1dde3b0b59c
   ```

3. **En Vercel** (ya configurado, cifrado en su sistema)
   - Entornos: Production, Development, Preview
   - Variables: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
   - Dashboard: https://vercel.com/danielcorrealeon-3288s-projects/news-app/settings/environment-variables

**Si alguna vez necesitas rotar las claves** (ejemplo: se filtran): ir al dashboard de Spotify, regenerar el secret, actualizar `.env.local` y las env vars en Vercel, redeployar con `git push` (commit vacío: `git commit --allow-empty -m "rotate creds" && git push`).

---

## 🧠 Cómo funciona el código

### Landing (`app/page.tsx`) — server component
- `revalidate = 3600` (regenera la página cada hora máximo)
- Fetch `getLandingCovers()` → 8 artistas populares, 1 portada cada uno
- Renderiza: `<CoverWall />` de fondo + 2 cards (`<FeedCtaCard />` + `<PersonalPanel />`)

### Setup (`/setup`) — client component
- `useMusicPrefs()` hook lee de localStorage
- Chips editables de artistas + campo opcional "¿Qué estás escuchando?"
- Al guardar la nota, se escribe en `lastSession.listening`
- Botón "Ver mi feed →" → `/feed`

### Feed (`/feed`) — client component
- `useMusicPrefs()` → fetch a `/api/news/music?artists=...&listening=...`
- Skeleton mientras carga → `<BentoGrid />` con patrón fijo de tamaños
- Cada card muestra su source: "Tus artistas", "Similar", "Para ti hoy"

### API `/api/news/music`
- Recibe `artists`, `exclude`, `listening` en querystring
- Llama a `getReleasesInspiredBy(artists, exclude, listening)` de `lib/spotify.ts`

### `lib/spotify.ts` — núcleo
- **Token**: Client Credentials, cacheado en memoria hasta expirar
- **SOLO usa `/search`** (otros endpoints están rate-limited o deprecated)
- Por cada seed:
  - `search?q=artist:"Nombre"&type=album` → filtro main artist match → **seeds**
  - `search?q="Nombre"&type=album` → filtro main artist NO es seed → **similares** (colaboraciones)
- Listening: `search?q=<texto>&type=album` → tag **listening**
- Merge: dedupe por album ID, prioridad seed > listening > similar, sort release_date desc, cap 18

---

## ⚠️ Gotchas que tienes que saber

### 1. Spotify rate-limits severos
Estos endpoints NO se pueden usar con apps nuevas (Client Credentials sin extensión de cuota):
- `/artists/{id}/albums` → 429 con retry-after de 20+ horas si se abusa
- `/artists/{id}/top-tracks` → 403
- `/artists/{id}/related-artists` → 403
- `/recommendations` → 403
- `/browse/new-releases` → 403
- `genre:` filter en search → devuelve 0

**Workaround actual**: usamos EXCLUSIVAMENTE `/search`, que tiene quota separada y generosa.

### 2. Límite de 10 resultados
Las apps no-extended tienen `limit=10` máximo en `/search`. Pedir más tira error 400 "Invalid limit".

### 3. localStorage es por navegador
Las preferencias NO se sincronizan entre dispositivos. Si abres la app en otro browser o cierras caché, tienes que reconfigurar tus artistas.

### 4. El email del commit importa
En Hobby plan con repo privado, Vercel rechaza deploys si el autor del commit no está verificado en tu cuenta de GitHub. **Por eso el repo es PÚBLICO** (los repos públicos no tienen esa restricción).

Si alguna vez quieres volver a privado, antes asegúrate de que `git config user.email` matchee un email verificado en tu cuenta de GitHub (`DanielCorreaLeon`).

### 5. Spotify dejó de incluir `genres` y `popularity`
Los endpoints de artist ya no retornan estos campos (cambio reciente de privacidad). Por eso no podemos filtrar por género.

### 6. Las env vars en Vercel son **por deployment**
Si cambias una env var en el dashboard, los deployments ANTERIORES siguen usando el valor viejo. **Siempre redeploy después de tocar env vars**: `git commit --allow-empty -m "update env" && git push`.

---

## 🚫 Lo que NO hacer sin pensarlo

- Agregar base de datos (Postgres, Redis, etc.)
- Agregar auth (NextAuth, Clerk, Spotify OAuth de usuario)
- Cambiar el stack (Next.js + shadcn está funcionando)
- Borrar localStorage en algún flujo automático
- Volver el repo privado (rompe deploys)
- Conectar analytics sin revisar privacidad
- Usar `echo` para setear env vars de Vercel (agrega `\n` al final que rompe la auth)

---

## 💡 Ideas para iterar (no urgentes)

- **Spotify user OAuth** para acceder a top tracks reales del usuario (mejora el panel personal, agrega complejidad)
- **Last.fm API** como fuente alternativa de similares (más limpios que `appears_on`)
- **Guardar favoritos** (toggle ♥ en cada card del bento, persist en localStorage)
- **Share del feed** por URL (serializar prefs en query string)
- **Dominio custom** (configurable en Vercel dashboard → Settings → Domains)

---

## 🧰 Referencia rápida de comandos

```bash
# ir al proyecto
cd "/Users/danielcorrea/Documents/Daniel/Claude code/news-app"

# correr local
npm run dev                   # http://localhost:3000

# deploy (automático, solo pushear)
git add -A && git commit -m "cambio" && git push

# ver deployments
vercel ls news-app

# ver env vars
vercel env ls

# logs en vivo de Vercel (puede tener delay según status de Vercel)
vercel logs https://news-app-danielcorrealeon-3288s-projects.vercel.app

# checks antes de pushear
npm run build && npm run lint && npx tsc --noEmit

# volver a una versión anterior
git checkout v5               # inspeccionar
git reset --hard v5 && git push --force   # ⚠️ rollback real
```

---

## 📞 Si algo rompe

1. **App en blanco en Vercel / feed vacío**
   - `vercel logs <URL>` para ver errores del servidor
   - Chequear que env vars estén bien: `vercel env pull /tmp/check.txt --environment production && grep SPOTIFY /tmp/check.txt` (NO deben tener `"..."` ni `\n`)
   - Si hay `\n`, borrar y re-agregar con `printf` (ver sección "Gestionar variables de entorno")

2. **"Error: Spotify rate limited"**
   - Significa que estamos haciendo demasiadas requests. Normalmente se resuelve solo en minutos/horas.
   - Si persiste 24h+, probablemente te excediste con `/artists/{id}/albums` — el código v6 ya NO usa ese endpoint, pero si modificaste algo, verifica.

3. **Deploy en estado "Error"**
   - Chequear `vercel inspect <deployment-url>` para ver el errorLink
   - Causa más común: email del commit no verificado. Como el repo es público, esto no debería pasar.

4. **"No sé qué hace este código"**
   - Pegá este HANDOFF.md en un chat nuevo con Claude.
   - Claude lo entiende completo.

---

*Última actualización: v6 deployada en Vercel y funcionando. Fecha: 2026-04-22.*
