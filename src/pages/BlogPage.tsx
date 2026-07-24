import { useEffect, useMemo, useState } from 'react';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import GoldWaves from '@/components/ui/GoldWaves';
import { fetchBlog, fmtDate, readingTime, type BlogPost } from '@/lib/blog';
import '@/components/blog/blog.css';

const goHome = () => { window.location.href = '/'; };
const SHAPES = ['wide', 'med', 'tall', 'small', 'med', 'small', 'wide', 'tall'];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [cats, setCats] = useState<string[]>([]);
  const [active, setActive] = useState<string>('Tous');

  useEffect(() => {
    fetchBlog(12).then((d) => { setPosts(d.posts); setCats(d.categories); });
  }, []);

  const filtered = useMemo(() => {
    if (!posts) return [];
    if (active === 'Tous') return posts;
    return posts.filter((p) => p.categories.includes(active));
  }, [posts, active]);

  const lead = filtered[0];
  const rest = filtered.slice(1);

  return (
    <>
      <GoldWaves />
      <Nav onBook={goHome} />
      <main className="os-blog">
        <div className="os-blog__wrap">
          <div className="os-blog__masthead">
            <div>
              <p className="os-blog__eyebrow">Oui Stars · Travel Journal</p>
              <h1>Our <i>Blog</i></h1>
            </div>
            <div className="os-blog__meta">Paris · Île-de-France<br />Escapades &amp; art de vivre<br />Édition 2026</div>
          </div>

          {/* Filtre catégories */}
          <div className="os-blog__cats">
            {['Tous', ...cats].map((c) => (
              <button key={c} className={`os-blog__cat${active === c ? ' is-on' : ''}`} onClick={() => setActive(c)}>
                {c}
              </button>
            ))}
          </div>

          {posts === null && (
            <div className="os-blog__grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className={`os-bcard os-bcard--${SHAPES[i % SHAPES.length]}`} key={i}>
                  <div className="os-skel" style={{ position: 'absolute', inset: 0 }} />
                </div>
              ))}
            </div>
          )}

          {posts !== null && filtered.length === 0 && (
            <p className="os-blog__empty">Aucun article dans cette catégorie pour le moment.</p>
          )}

          {/* Une (lead) */}
          {lead && (
            <a className="os-blead" href={lead.link} target="_blank" rel="noopener noreferrer">
              <div className="os-blead__ph">{lead.image && <img src={lead.image} alt="" />}</div>
              <div className="os-blead__tx">
                <span className="os-blead__cat">À la une · {lead.categories[0] ?? 'Journal'}</span>
                <h2>{lead.title}</h2>
                <p>{lead.excerpt}</p>
                <span className="os-blead__rd">Lire l’article · {readingTime(lead)}</span>
              </div>
            </a>
          )}

          {/* Grille magazine asymétrique */}
          {rest.length > 0 && (
            <div className="os-blog__grid">
              {rest.map((p, i) => {
                const shape = SHAPES[i % SHAPES.length];
                if (i === 3) {
                  return (
                    <div className="os-bcard os-bcard--note" key={`note-${p.id}`}>
                      <div className="os-bcard__q">« Paris se raconte mieux depuis la banquette arrière. »</div>
                      <div className="os-bcard__sig">Oui Stars — Travel Journal</div>
                    </div>
                  );
                }
                return (
                  <a className={`os-bcard os-bcard--${shape}`} key={p.id} href={p.link} target="_blank" rel="noopener noreferrer">
                    <div className="os-bcard__ph">{p.image && <img src={p.image} alt="" loading="lazy" />}</div>
                    <div className="os-bcard__body">
                      <span className="os-bcard__cat">{p.categories[0] ?? 'Journal'} · {readingTime(p)}</span>
                      <h3>{p.title}</h3>
                      <span className="os-bcard__dt">{fmtDate(p.date)}</span>
                    </div>
                    <span className="os-bcard__go" aria-hidden>→</span>
                  </a>
                );
              })}
            </div>
          )}

          <p className="os-blog__note">Articles synchronisés depuis ouistarstravel.com — mis à jour à chaque publication.</p>
        </div>
      </main>
      <Footer onJoin={goHome} />
    </>
  );
}
