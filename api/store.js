import { Redis } from '@upstash/redis';

// Reads UPSTASH_REDIS_REST_URL / _TOKEN, and falls back to KV_REST_API_URL / _TOKEN.
// The Vercel "Upstash for Redis" Marketplace integration injects these automatically.
const redis = Redis.fromEnv({ automaticDeserialization: false });

// Rooms / moves are ephemeral. Expire after 6 hours so the DB cleans itself up.
const TTL_SECONDS = 60 * 60 * 6;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'missing key' });
      const raw = await redis.get(key);
      return res.status(200).json({ value: raw ? JSON.parse(raw) : null });
    }

    if (req.method === 'POST') {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: 'missing key' });
      await redis.set(key, JSON.stringify(value), { ex: TTL_SECONDS });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'missing key' });
      await redis.del(key);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
