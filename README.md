# Seven Wonders — Online

A single-page Seven Wonders (base game + Leaders expansion) with three modes:
**Play vs Bots**, **Pass & Play**, and **Online Room** (play with friends over the internet).

Online play needs a shared store. This project uses a tiny serverless function
(`/api/store`) backed by **Upstash Redis**, which Vercel provisions for you.

```
index.html      the whole game (UI + engine), self-contained
api/store.js     get/set/delete proxy to Upstash Redis
package.json     declares the @upstash/redis dependency
```

---

## Deploy (dashboard — no terminal needed)

1. **Put this folder on GitHub.** Create a new repo and upload these files
   (`index.html`, `api/store.js`, `package.json`, `.gitignore`).

2. **Import to Vercel.** Go to https://vercel.com → **Add New… → Project** →
   import the repo. Framework preset: **Other**. Click **Deploy**.
   (It deploys, but Online mode won't sync yet — no database attached.)

3. **Add the database.** Open the project → **Storage** tab →
   **Create / Connect Database** → choose **Upstash for Redis** from the
   Marketplace → pick a region near your friends → create. Vercel links it to
   the project and injects the credentials as environment variables automatically.

4. **Redeploy** so the function picks up the new env vars:
   **Deployments → ⋯ on the latest → Redeploy**.

5. **Play.** Open your `https://your-app.vercel.app` URL → **Online Room** →
   **Create a room** → share the 4-letter code. Friends open the same URL,
   choose **Online Room → Join**, enter the code. As host, hit **Start game**;
   any empty seats fill with bots.

## Deploy (CLI alternative)

```bash
npm i -g vercel
cd seven-wonders-online
vercel            # first deploy, links the project
vercel install    # add the Upstash Redis integration, provisions + injects env vars
vercel --prod     # redeploy to production with the database connected
```

---

## How online play works

- The **host** is authoritative: it's the only client that writes the shared
  game state. Each player writes their own move to a per-seat key, so two people
  picking at once never clobber each other.
- Clients poll every ~2.2s for the latest state. Turn-based, so polling is plenty.
- Room and move keys carry a 6-hour TTL and expire on their own.

## Environment variables

`Redis.fromEnv()` reads `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
and also falls back to `KV_REST_API_URL` / `KV_REST_API_TOKEN`. The Vercel
Upstash integration sets these for you. To run locally:

```bash
vercel env pull .env.development.local
vercel dev
```

## Free-tier note

Upstash's free tier is ~500k commands/month. Each player polling every ~2.2s
uses roughly 1,600 reads/hour, so a few friends playing for an hour or two is
well within it. If you host marathon sessions, raise the poll interval in
`index.html` (search for `2200` and `2000`) to, say, `4000`.

## Other modes

**Play vs Bots** and **Pass & Play** need no database and work on any static
host — even by opening `index.html` directly. Only **Online Room** requires the
Vercel + Upstash setup above.
