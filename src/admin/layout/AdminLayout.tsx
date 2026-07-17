import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/admin', label: 'Tableau de bord', end: true, icon: '◧' },
  { to: '/admin/bookings', label: 'Réservations', icon: '⇄' },
  { to: '/admin/quotes', label: 'Devis & Événements', icon: '✎' },
  { to: '/admin/pricing', label: 'Tarifs 2026-2027', icon: '€' },
  { to: '/admin/documents', label: 'Documents chauffeurs', icon: '⧉' },
  { to: '/admin/drivers', label: 'Chauffeurs', icon: '☺' },
  { to: '/admin/applications', label: 'Candidatures', icon: '✦' },
  { to: '/admin/vehicles', label: 'Flotte', icon: '⛛' },
];

export default function AdminLayout() {
  const loc = useLocation();
  const [query, setQuery] = useState('');
  const current = NAV.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)));
  return (
    <div className="adm">
      <aside className="adm__side">
        <div className="adm__brand">OUI<span>STARS</span><small>Ops</small></div>
        <nav className="adm__nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `adm__link${isActive ? ' is-active' : ''}`}>
              <span className="adm__link-ic">{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <a className="adm__back" href="/">← Retour au site</a>
      </aside>
      <div className="adm__main">
        <header className="adm__header">
          <h1>{current?.label ?? 'Back-office'}</h1>
          <div className="adm__tools">
            <input
              className="adm__search"
              type="search"
              placeholder="Rechercher (réf., client…)"
              aria-label="Rechercher"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="adm__bell" type="button" aria-label="Notifications : 3 non lues">
              ◷<span className="adm__bell-badge">3</span>
            </button>
            <div className="adm__user">Ops · Oui Stars</div>
          </div>
        </header>
        <div className="adm__content"><Outlet /></div>
      </div>
    </div>
  );
}
