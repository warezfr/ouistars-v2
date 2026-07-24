import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy du blog WordPress (ouistarstravel.com) → JSON normalisé, même origine.
 * Évite les soucis CORS/CSP côté navigateur et permet un cache court.
 * GET /api/blog  → { posts: BlogPost[], categories: string[] }
 */
const WP = 'https://ouistarstravel.com/wp-json/wp/v2';
const TTL = 10 * 60 * 1000; // 10 min

interface BlogPost {
  id: number; title: string; excerpt: string; date: string;
  link: string; slug: string; image: string | null; categories: string[];
}

let cache: { at: number; data: { posts: BlogPost[]; categories: string[] } } | null = null;

function decode(s: string): string {
  return (s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#8217;|&#8216;|&#039;|&#39;/g, '’')
    .replace(/&#8220;|&#8221;|&quot;/g, '»')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&#8230;|&hellip;/g, '…')
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (cache && Date.now() - cache.at < TTL) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(cache.data);
  }

  try {
    const limit = Math.min(Number(req.query.limit ?? 12) || 12, 24);
    const r = await fetch(
      `${WP}/posts?per_page=${limit}&_embed=wp:featuredmedia,wp:term`,
      { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } },
    );
    if (!r.ok) throw new Error(`WP ${r.status}`);
    const raw = (await r.json()) as any[];

    const posts: BlogPost[] = raw.map((p) => {
      const media = p._embedded?.['wp:featuredmedia']?.[0];
      const image = media?.source_url
        ?? media?.media_details?.sizes?.large?.source_url
        ?? media?.media_details?.sizes?.medium_large?.source_url
        ?? null;
      const terms: { name: string; taxonomy: string }[] = (p._embedded?.['wp:term'] ?? []).flat();
      const categories = terms.filter((t) => t?.taxonomy === 'category').map((t) => decode(t.name));
      return {
        id: p.id,
        title: decode(p.title?.rendered),
        excerpt: decode(p.excerpt?.rendered).slice(0, 180),
        date: p.date,
        link: p.link,
        slug: p.slug,
        image,
        categories,
      };
    });

    const categories = Array.from(new Set(posts.flatMap((p) => p.categories)));
    const data = { posts, categories };
    cache = { at: Date.now(), data };
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(data);
  } catch (e) {
    if (cache) return res.status(200).json(cache.data); // repli sur le dernier cache
    return res.status(502).json({ error: `Blog indisponible : ${(e as Error).message}`, posts: [], categories: [] });
  }
}
