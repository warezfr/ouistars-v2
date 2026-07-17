import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV_GROUPS, type NavEntry } from '@/admin/nav';
import { useAuth } from '@/admin/auth/AuthContext';

function hrefOf(item: NavEntry): string {
  if (item.to) return item.to;
  if (item.collection) return `/admin/content/${item.collection}`;
  return '/admin/soon/' + encodeURIComponent(item.label);
}

export default function AdminLayout() {
  const loc = useLocation();
  const { email, profile, signOut } = useAuth();
  const [q, setQ] = useState('');

  const currentLabel = useMemo(() => {
    for (const g of NAV_GROUPS) {
      for (const it of g.items) {
        const href = hrefOf(it);
        const active = href === '/admin' ? loc.pathname === '/admin' : loc.pathname.startsWith(href);
        if (active) return it.label;
      }
    }
    if (loc.pathname.includes('/singleton/')) return 'Contenu';
    return 'Back-office';
  }, [loc.pathname]);

  const filtered = (items: NavEntry[]) =>
    q.trim() ? items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())) : items;

  return (
    <div className="adm">
      <aside className="adm__side">
        <div className="adm__brand">OUI<span>STARS</span><small>Back-office</small></div>

        <div className="adm__navsearch">
          <input placeholder="Filtrer le menu…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <nav className="adm__nav">
          {NAV_GROUPS.map((g) => {
            const items = filtered(g.items);
            if (!items.length) return null;
            return (
              <div className="adm__group" key={g.section}>
                <p className="adm__group-title">{g.section}</p>
                {items.map((it) => {
                  const href = hrefOf(it);
                  return (
                    <NavLink key={it.label} to={href}
                      end={href === '/admin'}
                      className={({ isActive }) => `adm__link${isActive ? ' is-active' : ''}${it.soon ? ' is-soon' : ''}`}>
                      {it.label}{it.soon && <span className="adm__soon-dot" title="Bientôt" />}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <a className="adm__back" href="/">← Retour au site</a>
      </aside>

      <div className="adm__main">
        <header className="adm__header">
          <h1>{currentLabel}</h1>
          <div className="adm__tools">
            <div className="adm__user">
              <b>{profile?.displayName ?? email ?? 'Admin'}</b>
              <span>{profile?.role ?? ''}</span>
            </div>
            <button className="adm__logout" onClick={signOut}>Déconnexion</button>
          </div>
        </header>
        <div className="adm__content"><Outlet /></div>
      </div>
    </div>
  );
}
