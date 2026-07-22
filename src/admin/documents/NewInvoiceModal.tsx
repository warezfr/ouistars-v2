import { authHeaders } from '@/admin/lib/authFetch';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import ClientPicker from '../ui/ClientPicker';
import { ensureClient, type ClientDraft } from '../lib/clients';
import type { DocItem } from './DocumentModal';

/**
 * Facture libre (hors réservation) : client en saisie assistée (fiche auto-créée
 * si inconnu), lignes multiples, TVA 10 % (transport) ou 20 % (autres prestations).
 * L'émission passe par la RPC issue_invoice → numérotation continue FA-AAAA-NNNN.
 */
interface Line { label: string; sub: string; qty: string; unit: string }

const EMPTY_LINE: Line = { label: '', sub: '', qty: '1', unit: '' };

interface Props {
  onClose: () => void;
  onCreated: (invoiceId: string) => void;
}

export default function NewInvoiceModal({ onClose, onCreated }: Props) {
  const [client, setClient] = useState<ClientDraft>({ name: '' });
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [serviceDate, setServiceDate] = useState('');
  const [serviceTime, setServiceTime] = useState('');
  const [vat, setVat] = useState('0.10');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const parsed: DocItem[] = lines
    .filter((l) => l.label.trim() && Number(l.unit) > 0)
    .map((l) => ({ label: l.label.trim(), sub: l.sub.trim() || undefined, qty: Math.max(1, Number(l.qty) || 1), unit: Number(l.unit) }));
  const total = parsed.reduce((s, l) => s + l.qty * l.unit, 0);

  async function issue() {
    if (!supabase) { setError('Supabase non configuré.'); return; }
    if (!client.name.trim()) { setError('Le nom du client est requis.'); return; }
    if (parsed.length === 0) { setError('Ajoutez au moins une ligne avec désignation et prix.'); return; }
    setBusy(true); setError(null);
    try {
      // 1) Fiche client : retrouvée ou créée automatiquement.
      const clientId = await ensureClient(client);

      // 2) Émission atomique (numéro continu).
      const rand = [...crypto.getRandomValues(new Uint8Array(3))].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const reference = `MAN-${new Date().getFullYear()}-${rand}`;
      const { data, error } = await supabase.rpc('issue_invoice', {
        p_reference: reference,
        p_source: 'manual',
        p_client_name: client.name.trim(),
        p_client_email: client.email?.trim() || null,
        p_client_phone: client.phone?.trim() || null,
        p_route: parsed[0].label,
        p_service_date: [serviceDate, serviceTime].filter(Boolean).join(' '),
        p_amount: total,
        p_items: parsed,
        p_client_id: clientId,
        p_vat_rate: Number(vat),
      });
      if (error) {
        // Migration 0009 absente → RPC sans les nouveaux paramètres.
        if (/p_items|p_client_id|p_vat_rate|function/i.test(error.message)) {
          throw new Error(`${error.message} — exécutez la migration 0009_clients_manual_docs.sql dans Supabase.`);
        }
        throw error;
      }
      const row = data as { id: string; number: string };

      // 3) Archive le PDF officiel dans le Storage (best-effort).
      try {
        const res = await fetch('/api/documents/generate', {
          method: 'POST', headers: await authHeaders(),
          body: JSON.stringify({ reference, type: 'invoice', number: row.number }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const r2 = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
          const path = `invoices/${row.number}-${r2}.pdf`;
          const up = await supabase.storage.from('cms').upload(path, blob, { upsert: true, contentType: 'application/pdf' });
          if (!up.error) await supabase.from('invoices').update({ pdf_path: path }).eq('id', row.id);
        }
      } catch { /* archivage best-effort */ }

      onCreated(row.id);
    } catch (e) {
      setError(`Émission impossible : ${(e as Error).message}`);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal d-block" tabIndex={-1} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header py-2">
              <h5 className="modal-title"><i className="bi bi-receipt me-2" />Nouvelle facture</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <ClientPicker value={client} onChange={setClient} withAddress autoFocus />

              <hr className="my-3" />
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Prestations</h6>
                <button type="button" className="btn btn-sm btn-outline-secondary"
                  onClick={() => setLines((ls) => [...ls, { ...EMPTY_LINE }])}>
                  <i className="bi bi-plus-lg me-1" />Ajouter une ligne
                </button>
              </div>
              {lines.map((l, i) => (
                <div className="row g-2 align-items-start mb-2" key={i}>
                  <div className="col-md-5">
                    <input className="form-control" placeholder="Désignation * (ex. Transfert CDG → Paris)"
                      value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} />
                    <input className="form-control form-control-sm mt-1" placeholder="Détail (date, véhicule, précisions…)"
                      value={l.sub} onChange={(e) => setLine(i, { sub: e.target.value })} />
                  </div>
                  <div className="col-4 col-md-2">
                    <input className="form-control" type="number" min={1} placeholder="Qté" title="Quantité"
                      value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                  </div>
                  <div className="col-5 col-md-3">
                    <div className="input-group">
                      <input className="form-control" type="number" min={0} step="0.01" placeholder="Prix unit. TTC *"
                        value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} />
                      <span className="input-group-text">€</span>
                    </div>
                  </div>
                  <div className="col-3 col-md-2 text-end">
                    <span className="form-control-plaintext fw-semibold text-nowrap">
                      {Number(l.unit) > 0 ? `${(Math.max(1, Number(l.qty) || 1) * Number(l.unit)).toFixed(2)} €` : '—'}
                    </span>
                    {lines.length > 1 && (
                      <button type="button" className="btn btn-sm btn-outline-danger" title="Supprimer la ligne"
                        onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>
                        <i className="bi bi-trash" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="row g-2 mt-2">
                <div className="col-md-4">
                  <label className="form-label small mb-1">Date de prestation</label>
                  <input className="form-control" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small mb-1">Heure</label>
                  <input className="form-control" type="time" value={serviceTime} onChange={(e) => setServiceTime(e.target.value)} />
                </div>
                <div className="col-md-5">
                  <label className="form-label small mb-1">TVA</label>
                  <select className="form-select" value={vat} onChange={(e) => setVat(e.target.value)}>
                    <option value="0.10">10 % — transport de personnes</option>
                    <option value="0.20">20 % — autres prestations</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer py-2 d-flex justify-content-between align-items-center">
              <div className="fw-semibold">
                Total TTC : <span className="text-warning-emphasis">{total.toFixed(2)} €</span>
                <small className="text-muted ms-2">dont TVA {(total - total / (1 + Number(vat))).toFixed(2)} €</small>
              </div>
              <div>
                <button className="btn btn-outline-secondary me-2" onClick={onClose}>Annuler</button>
                <button className="btn btn-warning" disabled={busy} onClick={issue}>
                  <i className={`bi ${busy ? 'bi-hourglass-split' : 'bi-receipt'} me-1`} />
                  {busy ? 'Émission…' : 'Émettre la facture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
