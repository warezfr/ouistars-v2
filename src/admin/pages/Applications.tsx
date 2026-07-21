import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createEntry } from '../cms/api';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';
import DataTable, { type Column } from '../ui/DataTable';

/**
 * Gestion complète des candidatures chauffeurs (table chauffeur_applications).
 * - Pièces jointes obligatoires déposées depuis le site (bucket privé `applications`)
 * - Fiche détaillée : photo du chauffeur, véhicule (infos + photo), documents consultables
 * - Statuts : Incomplète (dépôt interrompu) → Nouvelle → En examen → Approuvée / Refusée
 * - « Approuver » crée la fiche Chauffeur enrichie (photo copiée en médiathèque, véhicule, carte VTC)
 */

interface DocMeta { bucket: string; path: string; name?: string; type?: string; size?: number }
interface Vehicle { make?: string; model?: string; year?: string; plate?: string; seats?: number; color?: string }

interface Row {
  id: string; reference: string; name: string; firstName?: string; lastName?: string;
  city?: string; country?: string; vtcCard?: string; phone?: string; email?: string; message?: string;
  experience?: string; languages?: string; vehicleClass?: string;
  vehicle?: Vehicle | null; docs: Record<string, DocMeta>;
  status: string; createdAt?: string; demo?: boolean;
}

const DEMO: Row[] = [
  { id: 'd1', reference: 'CA-1041', name: 'Amadou Diallo', city: 'Paris', vtcCard: 'VTC-075-2214', status: 'new', docs: {}, demo: true },
  { id: 'd2', reference: 'CA-1042', name: 'Marek Kowalski', city: 'Paris', vtcCard: 'VTC-075-2287', status: 'reviewing', docs: {}, demo: true },
];

const LABELS: Record<string, string> = {
  draft: 'Incomplète', new: 'Nouvelle', reviewing: 'En examen', approved: 'Approuvée', rejected: 'Refusée',
};
const badge = (s: string) =>
  s === 'approved' ? 'text-bg-success'
  : s === 'rejected' ? 'text-bg-secondary'
  : s === 'draft' ? 'text-bg-light border' : 'text-bg-warning';

const DOC_LABELS: Record<string, string> = {
  profile_photo: 'Photo de profil',
  driving_licence: 'Permis de conduire',
  vtc_card_doc: 'Carte professionnelle VTC',
  vehicle_photo: 'Photo du véhicule',
  vehicle_photo_2: 'Photo du véhicule (2)',
  carte_grise: 'Carte grise',
  maintenance_control: 'Contrôle technique',
  insurance: 'Attestation d’assurance',
};
const DOCS_BASE = ['profile_photo', 'driving_licence', 'vtc_card_doc'];
const DOCS_VEHICLE = ['vehicle_photo', 'carte_grise', 'maintenance_control', 'insurance'];
const requiredDocs = (r: Row) => [...DOCS_BASE, ...(r.vehicle ? DOCS_VEHICLE : [])];

const CLASS_LABELS: Record<string, string> = {
  business: 'Berline Business (E)', van: 'Van (V)', first: 'First (S)', other: 'Autre',
};

/** URL temporaire de consultation d'une pièce (bucket privé → URL signée ; repli public). */
async function docUrl(d: DocMeta): Promise<string | null> {
  if (!supabase) return null;
  const signed = await supabase.storage.from(d.bucket).createSignedUrl(d.path, 600);
  if (signed.data?.signedUrl) return signed.data.signedUrl;
  return supabase.storage.from(d.bucket).getPublicUrl(d.path).data.publicUrl ?? null;
}

export default function Applications() {
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [view, setView] = useState<Row | null>(null);

  async function load() {
    setLoading(true); setError(null);
    if (supabase) {
      const { data, error } = await supabase.from('chauffeur_applications').select('*')
        .order('created_at', { ascending: false }).limit(300);
      if (!error && data && data.length > 0) {
        setRows(data.map((a) => ({
          id: a.id, reference: a.reference,
          name: [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email || '—',
          firstName: a.first_name ?? undefined, lastName: a.last_name ?? undefined,
          city: a.city ?? undefined, country: a.country ?? undefined,
          vtcCard: a.vtc_card ?? undefined,
          phone: a.phone ?? undefined, email: a.email ?? undefined,
          message: a.message ?? undefined, experience: a.experience ?? undefined,
          languages: a.languages ?? undefined, vehicleClass: a.vehicle_class ?? undefined,
          vehicle: (a.vehicle ?? null) as Vehicle | null,
          docs: ((a.docs ?? {}) as Record<string, DocMeta>),
          status: a.status, createdAt: (a.created_at ?? '').slice(0, 10),
        })));
        setLoading(false);
        return;
      }
      if (error) setError(error.message);
    }
    setRows(DEMO);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(r: Row, status: string) {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status } : x)));
    setView((v) => (v && v.id === r.id ? { ...v, status } : v));
    if (supabase && !r.demo) {
      const { error } = await supabase.from('chauffeur_applications').update({ status }).eq('id', r.id);
      if (error) setError(error.message);
    }
  }

  /** Approuver : fiche Chauffeur enrichie — photo copiée en médiathèque publique,
      carte VTC, langues, véhicule dans les notes. */
  async function approve(r: Row) {
    setInfo(null); setError(null);
    await setStatus(r, 'approved');
    try {
      // Photo de profil → copie dans le bucket public cms (URL stable pour la fiche).
      let image = '';
      const photo = r.docs.profile_photo;
      if (photo && supabase) {
        try {
          const dl = await supabase.storage.from(photo.bucket).download(photo.path);
          if (dl.data) {
            const dest = `media/drivers/${r.reference.toLowerCase()}.jpg`;
            const up = await supabase.storage.from('cms').upload(dest, dl.data, {
              upsert: true, contentType: photo.type ?? 'image/jpeg',
            });
            if (!up.error) image = supabase.storage.from('cms').getPublicUrl(dest).data.publicUrl;
          }
        } catch { /* photo best-effort */ }
      }

      const v = r.vehicle;
      const vehicleLine = v
        ? `<p>Véhicule : ${v.make ?? ''} ${v.model ?? ''}${v.year ? ` (${v.year})` : ''} — ${v.plate ?? ''}${v.seats ? ` · ${v.seats} places` : ''}${r.vehicleClass ? ` · ${CLASS_LABELS[r.vehicleClass] ?? r.vehicleClass}` : ''}</p>`
        : '<p>Sans véhicule personnel.</p>';
      await createEntry({
        collection: 'driver',
        title: r.name,
        status: 'published',
        position: 0,
        data: {
          name: r.name, phone: r.phone ?? '', whatsapp: r.phone ?? '', email: r.email ?? '',
          state: r.city ?? '', country: r.country || 'France', title: 'Chauffeur VTC',
          image,
          notes: `<p>Créé depuis la candidature ${r.reference}${r.vtcCard ? ` — carte VTC ${r.vtcCard}` : ''}.</p>` +
            vehicleLine +
            (r.languages ? `<p>Langues : ${r.languages}</p>` : '') +
            (r.experience ? `<p>Expérience : ${r.experience}</p>` : '') +
            (r.message ? `<p>${r.message}</p>` : ''),
        },
      });
      setInfo(`Fiche chauffeur créée pour ${r.name}${image ? ' (photo reprise)' : ''} — les pièces restent consultables ici.`);
    } catch (e) {
      setError(`Candidature approuvée mais création de la fiche impossible : ${(e as Error).message}`);
    }
  }

  const pending = rows.filter((a) => a.status === 'new' || a.status === 'reviewing').length;

  const columns: Column<Row>[] = [
    { key: 'reference', header: 'Réf.', value: (a) => a.reference,
      render: (a) => <button className="btn btn-link p-0 fw-semibold" onClick={() => setView(a)}>{a.reference}</button> },
    { key: 'name', header: 'Candidat', value: (a) => a.name,
      render: (a) => (
        <>
          <span className="fw-semibold">{a.name}</span>
          <div className="small text-muted">{[a.city, a.country].filter(Boolean).join(', ') || '—'}</div>
        </>
      ) },
    { key: 'vtcCard', header: 'Carte VTC', value: (a) => a.vtcCard ?? '—' },
    { key: 'vehicle', header: 'Véhicule', filterable: true,
      value: (a) => a.vehicle ? 'Avec véhicule' : 'Sans véhicule',
      render: (a) => a.vehicle
        ? <span className="badge text-bg-dark">{[a.vehicle.make, a.vehicle.model].filter(Boolean).join(' ') || 'Véhicule'}</span>
        : <span className="badge text-bg-light border">Sans</span> },
    { key: 'docs', header: 'Pièces', sortable: false,
      value: (a) => `${requiredDocs(a).filter((k) => a.docs[k]).length}/${requiredDocs(a).length}`,
      render: (a) => {
        const need = requiredDocs(a);
        const got = need.filter((k) => a.docs[k]).length;
        return <span className={`badge ${got >= need.length ? 'text-bg-success' : 'text-bg-danger'}`}>{got}/{need.length}</span>;
      } },
    { key: 'createdAt', header: 'Déposée le', value: (a) => a.createdAt ?? '' },
    { key: 'status', header: 'Statut', filterable: true, value: (a) => LABELS[a.status] ?? a.status,
      render: (a) => <span className={`badge ${badge(a.status)}`}>{LABELS[a.status] ?? a.status}</span> },
    { key: 'actions', header: 'Actions', sortable: false, className: 'text-end pe-3', value: () => '',
      render: (a) => (
        <span className="text-nowrap">
          <button className="btn btn-sm btn-outline-secondary me-1" title="Ouvrir le dossier" onClick={() => setView(a)}>
            <i className="bi bi-folder2-open" />
          </button>
          {writable && (a.status === 'new' || a.status === 'reviewing') && (
            <>
              <button className="btn btn-sm btn-success me-1" title="Approuver — crée la fiche chauffeur" onClick={() => approve(a)}>
                <i className="bi bi-person-plus" />
              </button>
              <button className="btn btn-sm btn-outline-danger" title="Refuser" onClick={() => setStatus(a, 'rejected')}>
                <i className="bi bi-x-lg" />
              </button>
            </>
          )}
        </span>
      ) },
  ];

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Candidatures chauffeurs
          <span className="badge text-bg-secondary ms-2">{rows.length}</span>
        </h3>
        <span className="badge text-bg-warning">{pending} en attente</span>
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {info && <div className="alert alert-success m-3">{info} <a href="/admin/content/driver">Ouvrir les chauffeurs →</a></div>}
        {!loading && (
          <DataTable columns={columns} rows={rows} rowKey={(a) => a.id}
            searchPlaceholder="Rechercher réf., nom, ville, immatriculation…" empty="Aucune candidature." />
        )}
      </div>
      {view && (
        <ApplicationModal row={view} writable={writable} onClose={() => setView(null)}
          onStatus={(s) => setStatus(view, s)} onApprove={() => { approve(view); setView(null); }} />
      )}
    </div>
  );
}

/** Dossier de candidature : photos, véhicule, documents consultables. */
function ApplicationModal({ row, writable, onClose, onStatus, onApprove }: {
  row: Row; writable: boolean; onClose: () => void;
  onStatus: (s: string) => void; onApprove: () => void;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [vehicleUrl, setVehicleUrl] = useState<string | null>(null);
  const [busyDoc, setBusyDoc] = useState<string | null>(null);
  const need = requiredDocs(row);
  const missing = need.filter((k) => !row.docs[k]);

  useEffect(() => {
    let on = true;
    if (row.docs.profile_photo) docUrl(row.docs.profile_photo).then((u) => on && setPhotoUrl(u));
    if (row.docs.vehicle_photo) docUrl(row.docs.vehicle_photo).then((u) => on && setVehicleUrl(u));
    return () => { on = false; };
  }, [row]);

  async function open(key: string) {
    const d = row.docs[key];
    if (!d) return;
    setBusyDoc(key);
    const u = await docUrl(d);
    setBusyDoc(null);
    if (u) window.open(u, '_blank', 'noopener');
  }

  const v = row.vehicle;
  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal d-block" tabIndex={-1} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header py-2">
              <h5 className="modal-title">
                <i className="bi bi-person-badge me-2" />Candidature {row.reference}
                <span className={`badge ms-2 ${badge(row.status)}`}>{LABELS[row.status] ?? row.status}</span>
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="d-flex gap-3 align-items-start flex-wrap">
                <div style={{ width: 96, height: 96, borderRadius: 12, overflow: 'hidden', background: '#e9ecef', flex: '0 0 auto' }}>
                  {photoUrl
                    ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div className="d-flex align-items-center justify-content-center h-100 text-muted"><i className="bi bi-person fs-1" /></div>}
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1">{row.name}</h4>
                  <div className="text-muted small mb-1">{[row.city, row.country].filter(Boolean).join(', ') || '—'} · Déposée le {row.createdAt || '—'}</div>
                  <div className="small">
                    {row.phone && <span className="me-3"><i className="bi bi-telephone me-1" />{row.phone}</span>}
                    {row.email && <a className="me-3" href={`mailto:${row.email}`}><i className="bi bi-envelope me-1" />{row.email}</a>}
                  </div>
                  <div className="small mt-1">
                    <span className="me-3">Carte VTC : <strong>{row.vtcCard ?? '—'}</strong></span>
                    {row.languages && <span className="me-3">Langues : {row.languages}</span>}
                    {row.experience && <span>Expérience : {row.experience}</span>}
                  </div>
                </div>
              </div>

              <hr className="my-3" />
              <h6 className="mb-2"><i className="bi bi-truck-front me-2" />Véhicule</h6>
              {v ? (
                <div className="d-flex gap-3 align-items-start flex-wrap">
                  {vehicleUrl && (
                    <img src={vehicleUrl} alt="" style={{ width: 150, height: 96, objectFit: 'cover', borderRadius: 10 }} />
                  )}
                  <div className="small">
                    <div><strong>{[v.make, v.model].filter(Boolean).join(' ')}</strong>{v.year ? ` — ${v.year}` : ''}</div>
                    <div>Immatriculation : <strong>{v.plate ?? '—'}</strong></div>
                    <div>
                      {row.vehicleClass && <span className="me-3">Classe : {CLASS_LABELS[row.vehicleClass] ?? row.vehicleClass}</span>}
                      {v.seats != null && <span className="me-3">{v.seats} places</span>}
                      {v.color && <span>{v.color}</span>}
                    </div>
                  </div>
                </div>
              ) : <p className="text-muted small mb-0">Sans véhicule personnel — affectation sur la flotte Oui Stars.</p>}

              <hr className="my-3" />
              <h6 className="mb-2"><i className="bi bi-paperclip me-2" />Pièces jointes
                <span className={`badge ms-2 ${missing.length === 0 ? 'text-bg-success' : 'text-bg-danger'}`}>
                  {need.length - missing.length}/{need.length}
                </span>
              </h6>
              <div className="list-group">
                {need.map((k) => (
                  <div key={k} className="list-group-item d-flex justify-content-between align-items-center py-2">
                    <span>
                      <i className={`bi me-2 ${row.docs[k] ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle text-danger'}`} />
                      {DOC_LABELS[k] ?? k}
                      {row.docs[k]?.name && <span className="text-muted small ms-2">{row.docs[k].name}</span>}
                    </span>
                    {row.docs[k] ? (
                      <button className="btn btn-sm btn-outline-secondary" disabled={busyDoc === k} onClick={() => open(k)}>
                        <i className={`bi ${busyDoc === k ? 'bi-hourglass-split' : 'bi-eye'} me-1`} />Voir
                      </button>
                    ) : <span className="badge text-bg-danger">Manquante</span>}
                  </div>
                ))}
              </div>
              {row.message && (
                <>
                  <hr className="my-3" />
                  <h6 className="mb-1">Message du candidat</h6>
                  <p className="small text-muted mb-0">{row.message}</p>
                </>
              )}
            </div>
            <div className="modal-footer py-2 d-flex justify-content-between align-items-center">
              {writable && !row.demo ? (
                <select className="form-select form-select-sm w-auto" value={row.status} onChange={(e) => onStatus(e.target.value)}>
                  {Object.entries(LABELS).map(([s, l]) => <option key={s} value={s}>{l}</option>)}
                </select>
              ) : <span />}
              <div>
                <button className="btn btn-outline-secondary me-2" onClick={onClose}>Fermer</button>
                {writable && !row.demo && row.status !== 'approved' && (
                  <button className="btn btn-success" disabled={missing.length > 0}
                    title={missing.length > 0 ? 'Pièces obligatoires manquantes' : 'Crée la fiche chauffeur'}
                    onClick={onApprove}>
                    <i className="bi bi-person-plus me-1" />Approuver
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
