import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV_GROUPS, type NavEntry } from '@/admin/nav';
import { useAuth } from '@/admin/auth/AuthContext';
import { getAdminTheme, setAdminTheme, type AdminTheme } from '@/admin/adminlte';

function hrefOf(item: NavEntry): string {
  if (item.to) return item.to;
  if (item.collection) return `/admin/content/${item.collection}`;
  return '/admin/soon/' + encodeURIComponent(item.label);
}

export default function AdminLayout() {
  const loc = useLocation();
  const { email, profile, signOut } = useAuth();
  const [q, setQ] = useState('');
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<AdminTheme>(getAdminTheme());

  const toggleTheme = () => {
    const next: AdminTheme = theme === 'dark' ? 'light' : 'dark';
    setAdminTheme(next); setTheme(next);
  };

  // Ferme le menu mobile après navigation.
  useEffect(() => {
    document.body.classList.remove('sidebar-open');
    setMobileOpen(false);
  }, [loc.pathname]);

  const closeMobile = () => { document.body.classList.remove('sidebar-open'); setMobileOpen(false); };

  const currentLabel = useMemo(() => {
    for (const g of NAV_GROUPS) {
      for (const it of g.items) {
        const href = hrefOf(it);
        const active = href === '/admin' ? loc.pathname === '/admin' : loc.pathname.startsWith(href);
        if (active) return it.label;
      }
    }
    if (loc.pathname.includes('/singleton/')) return 'Contenu';
    return 'Command Center';
  }, [loc.pathname]);

  const filtered = (items: NavEntry[]) =>
    q.trim() ? items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())) : items;

  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      const open = !document.body.classList.contains('sidebar-open');
      document.body.classList.toggle('sidebar-open', open);
      setMobileOpen(open);
    } else {
      document.body.classList.toggle('sidebar-collapse');
    }
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <nav className="app-header navbar navbar-expand bg-body">
        <div className="container-fluid">
          <ul className="navbar-nav">
            <li className="nav-item">
              <button className="nav-link btn btn-link" type="button" onClick={toggleSidebar} aria-label="Menu">
                <i className="bi bi-list fs-4" />
              </button>
            </li>
            <li className="nav-item d-none d-md-block">
              <span className="navbar-text fw-semibold text-body">{currentLabel}</span>
            </li>
          </ul>
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <button className="nav-link btn btn-link" type="button" onClick={toggleTheme}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
                <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'} fs-5`} />
              </button>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/" title="Voir le site"><i className="bi bi-box-arrow-up-right" /></a>
            </li>
            <li className="nav-item dropdown user-menu position-relative">
              <button className="nav-link btn btn-link d-flex align-items-center gap-2" type="button"
                onClick={() => setUserOpen((v) => !v)}>
                <span className="d-none d-sm-inline text-body">{profile?.displayName ?? email ?? 'Admin'}</span>
                <span className="badge text-bg-warning text-uppercase">{profile?.role ?? ''}</span>
                <i className="bi bi-person-circle fs-5" />
              </button>
              {userOpen && (
                <div className="dropdown-menu dropdown-menu-end show mt-2" style={{ right: 0 }}>
                  <span className="dropdown-item-text small text-muted">{email}</span>
                  <div className="dropdown-divider" />
                  <a className="dropdown-item" href="/">← Retour au site</a>
                  <button className="dropdown-item text-danger" onClick={signOut}>Se déconnecter</button>
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="app-sidebar shadow" data-bs-theme="dark">
        <div className="sidebar-brand">
          <a href="/admin" className="brand-link">
            <span className="brand-text">OUI<b className="text-warning">STARS</b></span>
          </a>
        </div>
        <div className="sidebar-wrapper">
          <div className="px-2 py-2">
            <input className="form-control form-control-sm" placeholder="Filtrer le menu…"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <nav>
            <ul className="nav sidebar-menu flex-column" role="menu">
              {NAV_GROUPS.map((g) => {
                const items = filtered(g.items);
                if (!items.length) return null;
                return (
                  <li key={g.section} className="nav-section-block">
                    <span className="nav-header">{g.section}</span>
                    {items.map((it) => {
                      const href = hrefOf(it);
                      return (
                        <NavLink key={it.label} to={href} end={href === '/admin'} role="menuitem"
                          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                          <i className={`nav-icon bi ${it.icon}`} />
                          <p>{it.label}{it.soon && <span className="badge text-bg-secondary ms-auto">bientôt</span>}</p>
                        </NavLink>
                      );
                    })}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Voile mobile (ferme le menu au clic) */}
      {mobileOpen && <div className="adm-backdrop d-lg-none" onClick={closeMobile} />}

      {/* Contenu */}
      <main className="app-main">
        <div className="app-content-header">
          <div className="container-fluid">
            <h3 className="mb-0">{currentLabel}</h3>
          </div>
        </div>
        <div className="app-content">
          <div className="container-fluid">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
