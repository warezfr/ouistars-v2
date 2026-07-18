import { useEffect, useState } from 'react';
import { ROUTE_RATES, MEET_GREET_RATES, PRICE_LIST_VERSION } from '@/data/pricing';
import { supabase } from '@/lib/supabase';
import { listEntries, createEntry, updateEntry, getSingleton, saveSingleton } from '../cms/api';
import type { CmsEntry } from '../cms/types';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';

/**
 * TARIFICATION GLOBALE — pilotage centralisé de TOUS les prix du site :
 *   · Grille des trajets (E/V/S) — collection « route »
 *   · Tarifs horaires / au km / minimum d'heures — singleton « rates »
 *   · Tarifs Meet & Greeter — collection « greeter_rate »
 * Chaque modification est répliquée automatiquement :
 *   site public (calculateur, grille, forfaits, wizard, section M&G),
 *   montants officiels calculés par le serveur (/api/intake),
 *   et API partenaires via le bouton « Synchroniser l'API ETG ».
 */

const CATS: Record<string, string> = {
  airport: 'Aéroports', city: 'Ville', station: 'Gares', tour: 'Excursions',
  riviera: 'Côte d’Azur', 'city-to-city': 'City-to-city',
};

/** Correspondance grille site → route_keys des rate cards ETG. */
const ETG_MAP: Record<string, string[]> = {
  'cdg-ory-lbg-paris': ['cdg-paris', 'ory-paris', 'lbg-paris', 'paris-cdg', 'paris-ory'],
  'paris-versailles': ['paris-versailles'],
  'paris-stations': ['gare-nord-paris'],
  'nce-monaco': ['nce-monaco', 'monaco-nce'],
};
const CLASS_TO_ETG: Record<string, string> = { E: 'business', V: 'business_van', S: 'first' };

interface RouteRow { label?: string; routeId?: string; category?: string; priceE?: number; priceV?: number; priceS?: number; note?: string }
interface GreeterRow { airport?: string; rateId?: string; base?: number | null; includedPax?: number; extraPaxSurcharge?: number | null }

function Card({ title, sub, right, children }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card card-outline card-warning mb-4">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h3 className="card-title mb-0" style={{ float: 'none', display: 'block' }}>{title}</h3>
          {sub && <small className="text-muted d-block">{sub}</small>}
        </div>
        {right}
      </div>
      <div className="card-body p-0">{children}</div>
    </div>
  );
}

export default function Pricing() {
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);

  const [routes, setRoutes] = useState<CmsEntry[]>([]);
  const [greeters, setGreeters] = useState<CmsEntry[]>([]);
  const [rates, setRates] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  /* ————— Filtres ————— */
  const [typeFilter, setTypeFilter] = useState<'all' | 'routes' | 'greeter' | 'rates'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [q, setQ] = useState('');

  const notice = (m: string) => { setFlash(m); window.setTimeout(() => setFlash(null), 4500); };

  async function loadAll() {
    setLoading(true);
    try {
      const [r, g, rt] = await Promise.all([listEntries('route'), listEntries('greeter_rate'), getSingleton('rates')]);
      setRoutes(r.filter((e) => (e.status as string) !== 'archived'));
      setGreeters(g.filter((e) => (e.status as string) !== 'archived'));
      setRates(rt);
    } catch (e) { notice(`Erreur de chargement : ${(e as Error).message}`); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  /* ————— Édition inline ————— */
  const setRouteField = (id: string, k: keyof RouteRow, v: unknown) =>
    setRoutes((rs) => rs.map((r) => r.id === id ? { ...r, data: { ...r.data, [k]: v } } : r));
  const setGreeterField = (id: string, k: keyof GreeterRow, v: unknown) =>
    setGreeters((gs) => gs.map((g) => g.id === id ? { ...g, data: { ...g.data, [k]: v } } : g));

  /** Pousse UN trajet vers les rate cards de l'API partenaires (si mappé). */
  async function syncEtgRoute(d: RouteRow): Promise<number> {
    if (!supabase || !d.routeId) return 0;
    const prefixes = ETG_MAP[d.routeId];
    if (!prefixes) return 0;
    let updated = 0;
    for (const prefix of prefixes) {
      for (const [cls, cat] of Object.entries(CLASS_TO_ETG)) {
        const price = d[`price${cls}` as 'priceE'];
        if (price == null) continue;
        const { data: rows } = await supabase
          .from('etg_rate_cards')
          .update({ base_price: price })
          .eq('route_key', `${prefix}-${cat === 'business' ? 'business' : cat === 'business_van' ? 'business-van' : 'first'}`)
          .select('id');
        updated += rows?.length ?? 0;
      }
    }
    return updated;
  }

  async function saveRoute(r: CmsEntry) {
    setSaving(r.id);
    try {
      await updateEntry(r.id, { data: r.data, title: (r.data as RouteRow).label ?? null, status: 'published' });
      // Synchronisation automatique de l'API partenaires pour ce trajet.
      const pushed = await syncEtgRoute(r.data as RouteRow).catch(() => 0);
      notice(pushed > 0
        ? `✓ Trajet enregistré — site, montants serveur et API partenaires (${pushed} rate cards) alignés.`
        : '✓ Trajet enregistré — répliqué sur le site et les montants serveur.');
    } catch (e) { notice(`Erreur : ${(e as Error).message}`); }
    finally { setSaving(null); }
  }
  async function saveGreeter(g: CmsEntry) {
    setSaving(g.id);
    try {
      await updateEntry(g.id, { data: g.data, title: (g.data as GreeterRow).airport ?? null, status: 'published' });
      notice('✓ Tarif Meet & Greeter enregistré — répliqué (section, wizard, serveur).');
    } catch (e) { notice(`Erreur : ${(e as Error).message}`); }
    finally { setSaving(null); }
  }
  async function saveRates() {
    setSaving('rates');
    try {
      await saveSingleton('rates', rates);
      notice('✓ Tarifs horaires / km enregistrés — répliqués partout.');
    } catch (e) { notice(`Erreur : ${(e as Error).message}`); }
    finally { setSaving(null); }
  }

  /* ————— Amorçage depuis la grille statique ————— */
  async function seedRoutes() {
    setSaving('seed-routes');
    try {
      let pos = 0;
      for (const r of ROUTE_RATES) {
        await createEntry({
          collection: 'route', status: 'published', position: pos++, title: r.label,
          data: { label: r.label, routeId: r.id, category: r.category, priceE: r.prices.E, priceV: r.prices.V, priceS: r.prices.S, note: r.note ?? '' },
        });
      }
      notice(`✓ ${ROUTE_RATES.length} trajets importés — la grille est maintenant pilotée depuis cette page.`);
      await loadAll();
      await syncEtg(); // aligne aussi l'API partenaires dans la foulée
    } catch (e) { notice(`Erreur : ${(e as Error).message}`); }
    finally { setSaving(null); }
  }
  async function seedGreeters() {
    setSaving('seed-greeters');
    try {
      let pos = 0;
      for (const m of MEET_GREET_RATES) {
        await createEntry({
          collection: 'greeter_rate', status: 'published', position: pos++, title: m.airport,
          data: { airport: m.airport, rateId: m.id, base: m.base, includedPax: m.includedPax, extraPaxSurcharge: m.extraPaxSurcharge },
        });
      }
      notice(`✓ ${MEET_GREET_RATES.length} tarifs Meet & Greeter importés — pilotés depuis cette page.`);
      await loadAll();
    } catch (e) { notice(`Erreur : ${(e as Error).message}`); }
    finally { setSaving(null); }
  }
  async function addGreeter() {
    setSaving('add-greeter');
    try {
      await createEntry({
        collection: 'greeter_rate', status: 'published', position: greeters.length, title: 'Nouvel aéroport',
        data: { airport: 'Nouvel aéroport', rateId: `apt-${Date.now().toString(36)}`, base: null, includedPax: 3, extraPaxSurcharge: null },
      });
      await loadAll();
    } catch (e) { notice(`Erreur : ${(e as Error).message}`); }
    finally { setSaving(null); }
  }

  /** Pousse les prix de la grille vers les rate cards de l'API partenaires (ETG). */
  async function syncEtg() {
    if (!supabase) { notice('Supabase non configuré.'); return; }
    setSyncing(true);
    try {
      let updated = 0, missed = 0;
      for (const r of routes) {
        const d = r.data as RouteRow;
        const prefixes = d.routeId ? ETG_MAP[d.routeId] : undefined;
        if (!prefixes) continue;
        for (const prefix of prefixes) {
          for (const [cls, cat] of Object.entries(CLASS_TO_ETG)) {
            const price = d[`price${cls}` as 'priceE'];
            if (price == null) continue;
            const { data: rows, error } = await supabase
              .from('etg_rate_cards')
              .update({ base_price: price })
              .eq('route_key', `${prefix}-${cat === 'business' ? 'business' : cat === 'business_van' ? 'business-van' : 'first'}`)
              .select('id');
            if (error) { missed++; continue; }
            updated += rows?.length ?? 0;
          }
        }
      }
      notice(`✓ API partenaires : ${updated} rate card(s) alignée(s) sur la grille.${missed ? ` (${missed} échec(s))` : ''}`);
    } catch (e) { notice(`Échec : ${(e as Error).message}`); }
    finally { setSyncing(false); }
  }

  const num = (v: unknown): number | '' => (v == null || v === '' ? '' : Number(v));

  /* Application des filtres (recherche + catégorie) */
  const needle = q.trim().toLowerCase();
  const matchQ = (...vals: (string | undefined)[]) =>
    !needle || vals.some((v) => (v ?? '').toLowerCase().includes(needle));

  const filteredRoutes = routes.filter((r) => {
    const d = r.data as RouteRow;
    if (catFilter !== 'all' && (d.category || 'city-to-city') !== catFilter) return false;
    return matchQ(d.label, d.routeId);
  });
  const filteredGreeters = greeters.filter((g) => {
    const d = g.data as GreeterRow;
    return matchQ(d.airport, d.rateId);
  });

  const showRoutes = typeFilter === 'all' || typeFilter === 'routes';
  const showGreeter = typeFilter === 'all' || typeFilter === 'greeter';
  const showRates = (typeFilter === 'all' || typeFilter === 'rates') && !needle;

  const grouped = filteredRoutes.reduce<Record<string, CmsEntry[]>>((acc, r) => {
    const cat = ((r.data as RouteRow).category as string) || 'city-to-city';
    (acc[cat] ||= []).push(r);
    return acc;
  }, {});

  if (loading) return <div className="card"><div className="card-body text-muted">Chargement de la tarification globale…</div></div>;

  return (
    <>
      {/* En-tête */}
      <div className="alert alert-light border d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <strong><i className="bi bi-gem me-2 text-warning" />Tarification globale — grille {PRICE_LIST_VERSION}</strong>
          <div className="small text-muted">
            Source unique de TOUS les prix. Chaque enregistrement est répliqué automatiquement :
            site public (calculateur, grille, itinéraires, Meet & Greeter), montants officiels
            calculés par le serveur (réservations, greeter) <b>et API partenaires (ETG)</b> pour les
            trajets mappés. Le bouton ci-contre force une resynchronisation complète si besoin.
          </div>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={syncEtg} disabled={syncing || !writable}
          title="Repousse toute la grille vers les rate cards de l'API partenaires">
          <i className={`bi ${syncing ? 'bi-hourglass-split' : 'bi-arrow-repeat'} me-1`} />Resynchroniser tout (API ETG)
        </button>
      </div>
      {flash && <div className="alert alert-info py-2">{flash}</div>}
      {!writable && <div className="alert alert-warning py-2">Lecture seule — votre rôle ne permet pas la modification.</div>}

      {/* ————— Filtres ————— */}
      <div className="card mb-4">
        <div className="card-body py-3 d-flex flex-wrap align-items-center gap-2">
          <div className="btn-group btn-group-sm" role="group" aria-label="Type de tarifs">
            {([['all', 'Tous les tarifs'], ['routes', 'Grille des trajets'], ['greeter', 'Meet & Greeter'], ['rates', 'Horaires & km']] as const).map(([v, l]) => (
              <button key={v} type="button"
                className={`btn ${typeFilter === v ? 'btn-warning' : 'btn-outline-secondary'}`}
                onClick={() => setTypeFilter(v)}>
                {l}
              </button>
            ))}
          </div>
          <select className="form-select form-select-sm" style={{ maxWidth: 190 }}
            value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            disabled={typeFilter === 'greeter' || typeFilter === 'rates'}
            aria-label="Catégorie de trajets">
            <option value="all">Toutes les catégories</option>
            {Object.entries(CATS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input className="form-control" placeholder="Rechercher un trajet, un aéroport…"
              value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="btn btn-outline-secondary" onClick={() => setQ('')}>×</button>}
          </div>
          {(typeFilter !== 'all' || catFilter !== 'all' || q) && (
            <span className="small text-muted ms-auto">
              {showRoutes ? `${filteredRoutes.length} trajet(s)` : ''}
              {showRoutes && showGreeter ? ' · ' : ''}
              {showGreeter ? `${filteredGreeters.length} tarif(s) M&G` : ''}
              <button className="btn btn-link btn-sm p-0 ms-2" onClick={() => { setTypeFilter('all'); setCatFilter('all'); setQ(''); }}>
                Réinitialiser
              </button>
            </span>
          )}
        </div>
      </div>

      {/* ————— 1 · Grille des trajets ————— */}
      {showRoutes && (
      <Card title="Grille des trajets (E / V / S)"
        sub={routes.length ? `${routes.length} trajets pilotés depuis cette page` : 'Aucun trajet en base — la grille statique du code fait foi'}
        right={routes.length === 0 && writable ? (
          <button className="btn btn-sm btn-warning" onClick={seedRoutes} disabled={saving === 'seed-routes'}>
            <i className="bi bi-download me-1" />{saving === 'seed-routes' ? 'Import…' : `Importer la grille statique (${ROUTE_RATES.length})`}
          </button>
        ) : (
          <a className="btn btn-sm btn-outline-secondary" href="/admin/content/route">
            <i className="bi bi-list-ul me-1" />Fiches complètes
          </a>
        )}>
        {routes.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th style={{ minWidth: 260 }}>Trajet</th><th>Catégorie</th><th>E-Class €</th><th>V-Class €</th><th>S-Class €</th><th /></tr></thead>
              <tbody>
                {Object.entries(grouped).map(([cat, rows]) => (
                  <>
                    <tr key={`h-${cat}`} className="table-light"><td colSpan={6} className="fw-semibold small text-uppercase">{CATS[cat] ?? cat}</td></tr>
                    {rows.map((r) => {
                      const d = r.data as RouteRow;
                      return (
                        <tr key={r.id}>
                          <td>
                            <input className="form-control form-control-sm" value={d.label ?? ''} disabled={!writable}
                              onChange={(e) => setRouteField(r.id, 'label', e.target.value)} />
                            <small className="text-muted">{d.routeId}</small>
                          </td>
                          <td>
                            <select className="form-select form-select-sm" value={d.category ?? 'city-to-city'} disabled={!writable}
                              onChange={(e) => setRouteField(r.id, 'category', e.target.value)}>
                              {Object.entries(CATS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                          </td>
                          {(['priceE', 'priceV', 'priceS'] as const).map((k) => (
                            <td key={k} style={{ maxWidth: 110 }}>
                              <input type="number" className="form-control form-control-sm" value={num(d[k])} disabled={!writable}
                                onChange={(e) => setRouteField(r.id, k, e.target.value === '' ? null : Number(e.target.value))} />
                            </td>
                          ))}
                          <td className="text-end pe-3">
                            {writable && (
                              <button className="btn btn-sm btn-warning" onClick={() => saveRoute(r)} disabled={saving === r.id}>
                                <i className={`bi ${saving === r.id ? 'bi-hourglass-split' : 'bi-check-lg'}`} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {routes.length === 0 && (
          <div className="p-3 text-muted small">
            Importez la grille statique pour la piloter d'ici : chaque prix devient modifiable et
            répliqué en direct sur le site et les montants serveur.
          </div>
        )}
        {routes.length > 0 && filteredRoutes.length === 0 && (
          <div className="p-3 text-muted small">Aucun trajet ne correspond aux filtres.</div>
        )}
      </Card>
      )}

      {/* ————— 2 · Meet & Greeter ————— */}
      {showGreeter && (
      <Card title="Tarifs Meet & Greeter (hors véhicule / chauffeur)"
        sub={greeters.length ? `${greeters.length} aéroports — base vide = « sur devis »` : 'Aucun tarif en base — les tarifs statiques du code font foi'}
        right={writable && (greeters.length === 0 ? (
          <button className="btn btn-sm btn-warning" onClick={seedGreeters} disabled={saving === 'seed-greeters'}>
            <i className="bi bi-download me-1" />{saving === 'seed-greeters' ? 'Import…' : `Importer les tarifs actuels (${MEET_GREET_RATES.length})`}
          </button>
        ) : (
          <button className="btn btn-sm btn-outline-warning" onClick={addGreeter} disabled={saving === 'add-greeter'}>
            <i className="bi bi-plus-lg me-1" />Ajouter un aéroport
          </button>
        ))}>
        {greeters.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th style={{ minWidth: 240 }}>Aéroport</th><th>Base € (vide = devis)</th><th>Pax inclus</th><th>Suppl. / pax €</th><th /></tr></thead>
              <tbody>
                {filteredGreeters.map((g) => {
                  const d = g.data as GreeterRow;
                  return (
                    <tr key={g.id}>
                      <td>
                        <input className="form-control form-control-sm" value={d.airport ?? ''} disabled={!writable}
                          onChange={(e) => setGreeterField(g.id, 'airport', e.target.value)} />
                        <small className="text-muted">{d.rateId}</small>
                      </td>
                      <td style={{ maxWidth: 140 }}>
                        <input type="number" className="form-control form-control-sm" value={num(d.base)} disabled={!writable}
                          onChange={(e) => setGreeterField(g.id, 'base', e.target.value === '' ? null : Number(e.target.value))} />
                      </td>
                      <td style={{ maxWidth: 110 }}>
                        <input type="number" className="form-control form-control-sm" value={num(d.includedPax)} disabled={!writable}
                          onChange={(e) => setGreeterField(g.id, 'includedPax', e.target.value === '' ? null : Number(e.target.value))} />
                      </td>
                      <td style={{ maxWidth: 130 }}>
                        <input type="number" className="form-control form-control-sm" value={num(d.extraPaxSurcharge)} disabled={!writable}
                          onChange={(e) => setGreeterField(g.id, 'extraPaxSurcharge', e.target.value === '' ? null : Number(e.target.value))} />
                      </td>
                      <td className="text-end pe-3">
                        {writable && (
                          <button className="btn btn-sm btn-warning" onClick={() => saveGreeter(g)} disabled={saving === g.id}>
                            <i className={`bi ${saving === g.id ? 'bi-hourglass-split' : 'bi-check-lg'}`} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3 text-muted small">
            Tarifs actuellement servis (statiques) : {MEET_GREET_RATES.map((m) => `${m.airport} — ${m.base != null ? `${m.base} €` : 'sur devis'}`).join(' · ')}.
            Importez-les pour les piloter d'ici.
          </div>
        )}
      </Card>
      )}

      {/* ————— 3 · Horaires, kilomètre, minimum ————— */}
      {showRates && (
      <Card title="Mise à disposition & au kilomètre"
        sub="Tarifs horaires (E/V/S), minimum d'heures et €/km — utilisés par le calculateur, le wizard et le serveur"
        right={writable && (
          <button className="btn btn-sm btn-warning" onClick={saveRates} disabled={saving === 'rates'}>
            <i className={`bi ${saving === 'rates' ? 'bi-hourglass-split' : 'bi-check-lg'} me-1`} />Enregistrer
          </button>
        )}>
        <div className="p-3">
          <div className="row g-3">
            {([
              ['hourlyE', 'Horaire E-Class (€/h)'], ['hourlyV', 'Horaire V-Class (€/h)'], ['hourlyS', 'Horaire S-Class (€/h)'],
              ['hourlyMin', 'Minimum d’heures'],
              ['kmE', 'Au km E-Class (€/km)'], ['kmV', 'Au km V-Class (€/km)'], ['kmS', 'Au km S-Class (€/km)'],
            ] as const).map(([k, label]) => (
              <div key={k} className="col-6 col-md-3">
                <label className="form-label small text-muted mb-1">{label}</label>
                <input type="number" step="0.1" className="form-control form-control-sm" disabled={!writable}
                  value={num(rates[k])}
                  onChange={(e) => setRates((rt) => ({ ...rt, [k]: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
            ))}
          </div>
          <small className="text-muted d-block mt-2">
            Laisser un champ vide = valeur par défaut de la grille embarquée.
          </small>
        </div>
      </Card>
      )}
    </>
  );
}
