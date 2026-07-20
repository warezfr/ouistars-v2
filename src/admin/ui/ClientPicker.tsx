import { useEffect, useMemo, useRef, useState } from 'react';
import { type ClientDraft, type DirectoryClient, loadClientDirectory, matchClient } from '../lib/clients';

/**
 * Saisie assistée du client (devis & factures manuels).
 * - Le champ « Nom » propose les clients connus (fiches + réservations + devis)
 *   dès 2 caractères : nom, société, e-mail ou téléphone.
 * - Sélection → tous les champs se préremplissent.
 * - Client inconnu → un bandeau annonce que la fiche sera créée automatiquement.
 */
interface Props {
  value: ClientDraft;
  onChange: (v: ClientDraft) => void;
  withCompany?: boolean;
  withAddress?: boolean;
  autoFocus?: boolean;
}

export default function ClientPicker({ value, onChange, withCompany, withAddress, autoFocus }: Props) {
  const [directory, setDirectory] = useState<DirectoryClient[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadClientDirectory().then(setDirectory); }, []);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = value.name.trim().toLowerCase();
  const matches = useMemo(() => {
    if (q.length < 2) return [];
    return directory.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    ).slice(0, 8);
  }, [directory, q]);

  const pick = (c: DirectoryClient) => {
    onChange({
      id: c.id, name: c.name, company: c.company ?? value.company,
      email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? value.address,
    });
    setOpen(false);
  };

  const set = (patch: Partial<ClientDraft>) => onChange({ ...value, ...patch, id: undefined });

  // État de la fiche : sélectionnée / retrouvée par e-mail ou téléphone / à créer.
  const known = value.id ? directory.find((c) => c.id === value.id) : matchClient(directory, value);
  const hasInput = value.name.trim().length > 1;

  return (
    <div ref={wrapRef}>
      <div className="row g-2">
        <div className={withCompany ? 'col-md-6' : 'col-12'} style={{ position: 'relative' }}>
          <label className="form-label small mb-1">Client *</label>
          <input
            className="form-control"
            placeholder="Nom du client — tapez pour rechercher…"
            value={value.name}
            autoFocus={autoFocus}
            autoComplete="off"
            onChange={(e) => { set({ name: e.target.value }); setOpen(true); setHi(0); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!open || matches.length === 0) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, matches.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); pick(matches[hi]); }
              else if (e.key === 'Escape') setOpen(false);
            }}
          />
          {open && matches.length > 0 && (
            <div className="list-group shadow position-absolute w-100" style={{ zIndex: 1080, top: '100%' }}>
              {matches.map((c, i) => (
                <button
                  key={c.key} type="button"
                  className={`list-group-item list-group-item-action py-2${i === hi ? ' active' : ''}`}
                  onMouseEnter={() => setHi(i)}
                  onMouseDown={(e) => { e.preventDefault(); pick(c); }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">{c.name}{c.company ? ` · ${c.company}` : ''}</span>
                    <span>
                      {c.id && <span className={`badge ${i === hi ? 'text-bg-light' : 'text-bg-warning'} ms-1`}>Fiche</span>}
                      {c.bookings > 0 && <span className={`badge ${i === hi ? 'text-bg-light' : 'text-bg-secondary'} ms-1`}>{c.bookings} résa</span>}
                    </span>
                  </div>
                  <small className={i === hi ? '' : 'text-muted'}>
                    {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
        {withCompany && (
          <div className="col-md-6">
            <label className="form-label small mb-1">Société</label>
            <input className="form-control" placeholder="Société (optionnel)"
              value={value.company ?? ''} onChange={(e) => set({ company: e.target.value })} />
          </div>
        )}
        <div className="col-md-6">
          <label className="form-label small mb-1">E-mail</label>
          <input className="form-control" type="email" placeholder="client@exemple.com"
            value={value.email ?? ''} onChange={(e) => set({ email: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label small mb-1">Téléphone</label>
          <input className="form-control" placeholder="+33 6 12 34 56 78"
            value={value.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        {withAddress && (
          <div className="col-12">
            <label className="form-label small mb-1">Adresse de facturation</label>
            <input className="form-control" placeholder="Adresse (optionnel)"
              value={value.address ?? ''} onChange={(e) => set({ address: e.target.value })} />
          </div>
        )}
      </div>

      {hasInput && (
        <div className={`small mt-2 ${known ? 'text-success' : 'text-muted'}`}>
          {known?.id ? (
            <><i className="bi bi-person-check me-1" />Fiche client existante{known.bookings > 0 ? ` · ${known.bookings} réservation(s)` : ''}.</>
          ) : known ? (
            <><i className="bi bi-person-plus me-1" />Client connu ({known.sources.join(', ')}) — sa fiche sera créée automatiquement.</>
          ) : (
            <><i className="bi bi-person-plus me-1" />Nouveau client — la fiche sera créée automatiquement à l'enregistrement.</>
          )}
        </div>
      )}
    </div>
  );
}
