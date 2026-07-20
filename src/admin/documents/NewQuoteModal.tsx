import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import ClientPicker from '../ui/ClientPicker';
import { ensureClient, type ClientDraft } from '../lib/clients';

/**
 * Nouveau devis créé au back-office : client en saisie assistée (fiche
 * auto-créée si inconnu), prestation, dates, véhicules, estimation.
 */
interface Props {
  onClose: () => void;
  onCreated: (quoteId: string) => void;
}

export default function NewQuoteModal({ onClose, onCreated }: Props) {
  const [client, setClient] = useState<ClientDraft>({ name: '' });
  const [eventType, setEventType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicles, setVehicles] = useState('1');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!supabase) { setError('Supabase non configuré.'); return; }
    if (!client.name.trim()) { setError('Le nom du client est requis.'); return; }
    if (!eventType.trim()) { setError('Précisez la prestation (ex. Mariage, Roadshow, Transferts VIP…).'); return; }
    setBusy(true); setError(null);
    try {
      const clientId = await ensureClient(client);
      const rand = [...crypto.getRandomValues(new Uint8Array(3))].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const reference = `DEV-${new Date().getFullYear()}-${rand}`;
      const payload: Record<string, unknown> = {
        reference,
        company: client.company?.trim() || null,
        contact_name: client.name.trim(),
        email: client.email?.trim() || null,
        phone: client.phone?.trim() || null,
        event_type: eventType.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        vehicles_count: Math.max(1, Number(vehicles) || 1),
        details: details.trim() || null,
        channel: 'backoffice',
        status: 'new',
        amount_estimated: Number(amount) > 0 ? Number(amount) : null,
      };
      if (clientId) payload.client_id = clientId; // colonne absente si 0009 non migrée
      let ins = await supabase.from('quotes').insert(payload).select('id').single();
      if (ins.error && clientId && /client_id/i.test(ins.error.message)) {
        delete payload.client_id;
        ins = await supabase.from('quotes').insert(payload).select('id').single();
      }
      if (ins.error) throw ins.error;
      onCreated(ins.data.id);
    } catch (e) {
      setError(`Création impossible : ${(e as Error).message}`);
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
              <h5 className="modal-title"><i className="bi bi-file-earmark-text me-2" />Nouveau devis</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <ClientPicker value={client} onChange={setClient} withCompany autoFocus />

              <hr className="my-3" />
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small mb-1">Prestation *</label>
                  <input className="form-control" placeholder="Mariage, Roadshow, Transferts VIP, Séminaire…"
                    value={eventType} onChange={(e) => setEventType(e.target.value)} list="os-quote-events" />
                  <datalist id="os-quote-events">
                    <option value="Mariage" /><option value="Roadshow" /><option value="Séminaire" />
                    <option value="Transferts VIP" /><option value="Fashion Week" /><option value="Mise à disposition" />
                    <option value="Congrès / Salon" /><option value="Tournée artistique" />
                  </datalist>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small mb-1">Du</label>
                  <input className="form-control" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small mb-1">Au</label>
                  <input className="form-control" type="date" value={endDate} min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small mb-1">Véhicules</label>
                  <input className="form-control" type="number" min={1} value={vehicles}
                    onChange={(e) => setVehicles(e.target.value)} />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label small mb-1">Estimation TTC</label>
                  <div className="input-group">
                    <input className="form-control" type="number" min={0} step="0.01" placeholder="Optionnel"
                      value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <span className="input-group-text">€</span>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label small mb-1">Détails du programme</label>
                  <textarea className="form-control" rows={3}
                    placeholder="Itinéraires, horaires, exigences particulières…"
                    value={details} onChange={(e) => setDetails(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer py-2">
              <button className="btn btn-outline-secondary" onClick={onClose}>Annuler</button>
              <button className="btn btn-warning" disabled={busy} onClick={create}>
                <i className={`bi ${busy ? 'bi-hourglass-split' : 'bi-file-earmark-plus'} me-1`} />
                {busy ? 'Création…' : 'Créer le devis'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
