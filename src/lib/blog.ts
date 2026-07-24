export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;       // ISO
  link: string;       // URL article source (WordPress)
  slug: string;
  image: string | null;
  categories: string[];
}

export interface BlogData {
  posts: BlogPost[];
  categories: string[];
}

/** Récupère les derniers articles via notre proxy same-origin /api/blog. */
export async function fetchBlog(limit = 12): Promise<BlogData> {
  try {
    const r = await fetch(`/api/blog?limit=${limit}`);
    if (!r.ok) throw new Error(String(r.status));
    const d = (await r.json()) as BlogData;
    return { posts: d.posts ?? [], categories: d.categories ?? [] };
  } catch {
    return { posts: [], categories: [] };
  }
}

/** Format court de date FR : « 8 sept. 2022 ». */
export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso.slice(0, 10); }
}

/** Temps de lecture estimé à partir de la longueur de l'extrait (approx.). */
export function readingTime(p: BlogPost): string {
  const words = (p.excerpt || '').split(/\s+/).length * 6 + 220;
  return `${Math.max(3, Math.round(words / 200))} min`;
}
