import { useEffect, useState } from 'react';
import { fetchBlog, fmtDate, type BlogPost } from '@/lib/blog';
import './blog.css';

interface Props { open: boolean; onClose: () => void; }

/** Tiroir latéral « Our Blog » — file verticale des derniers articles (WordPress). */
export default function BlogDrawer({ open, onClose }: Props) {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);

  useEffect(() => {
    if (open && posts === null) fetchBlog(7).then((d) => setPosts(d.posts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`os-bd__scrim${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden />
      <aside className={`os-bd${open ? ' is-open' : ''}`} aria-label="Our Blog" aria-hidden={!open}>
        <div className="os-bd__head">
          <div className="os-bd__k">
            <p className="os-bd__eyebrow">Derniers articles</p>
            <button className="os-bd__x" onClick={onClose} aria-label="Fermer">×</button>
          </div>
          <h3>Our <i>Blog</i></h3>
          <p className="os-bd__sub">Le journal de vos escapades parisiennes.</p>
        </div>

        <div className="os-bd__feed">
          {posts === null && Array.from({ length: 5 }).map((_, i) => (
            <div className="os-bd__item os-bd__item--skel" key={i}>
              <div className="os-bd__th os-skel" />
              <div style={{ flex: 1 }}>
                <div className="os-skel" style={{ height: 9, width: '40%', marginBottom: 8 }} />
                <div className="os-skel" style={{ height: 13, width: '92%', marginBottom: 6 }} />
                <div className="os-skel" style={{ height: 13, width: '65%' }} />
              </div>
            </div>
          ))}

          {posts !== null && posts.length === 0 && (
            <p className="os-bd__empty">Les articles seront bientôt disponibles.</p>
          )}

          {posts?.map((p, i) => (
            <a className="os-bd__item" key={p.id} href={`/blog?a=${p.slug}`}>
              <div className="os-bd__th">
                <span className="os-bd__num">{String(i + 1).padStart(2, '0')}</span>
                {p.image && <img src={p.image} alt="" loading="lazy" />}
              </div>
              <div className="os-bd__meta">
                <span className="os-bd__cat">{p.categories[0] ?? 'Journal'}</span>
                <h4>{p.title}</h4>
                <span className="os-bd__dt">{fmtDate(p.date)}</span>
              </div>
            </a>
          ))}
        </div>

        <div className="os-bd__foot">
          <a className="os-bd__all" href="/blog">Voir tout le journal <span>→</span></a>
        </div>
      </aside>
    </>
  );
}
