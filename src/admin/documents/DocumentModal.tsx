import { useMemo, useRef, useState } from 'react';
import { useSingleton } from '@/lib/cms';
import { supabase } from '@/lib/supabase';
import { createEntry } from '@/admin/cms/api';
import { useAuth } from '@/admin/auth/AuthContext';
import { DOC_CSS } from './docStyles';

/** Données normalisées d'un document affichable/imprimable. */
export interface DocItem { label: string; sub?: string; qty: number; unit: number }
export interface DocData {
  kind: 'invoice' | 'quote' | 'order' | 'mission';
  reference: string;
  number: string;
  date: string;
  client: { name: string; email?: string; phone?: string };
  vatRate?: number;   // 0.10 transport (défaut) | 0.20 autres prestations
  items?: DocItem[];
  mission?: {
    date: string; time?: string; pickup?: string; destination?: string;
    vehicle?: string; driver?: string; flight?: string;
    passengers?: number; luggage?: number; notes?: string;
  };
  footNote?: string;
}

const TITLES: Record<DocData['kind'], string> = {
  invoice: 'FACTURE', quote: 'DEVIS', order: 'BON DE COMMANDE', mission: 'ORDRE DE MISSION',
};
const API_TYPES: Record<DocData['kind'], string> = {
  invoice: 'invoice', quote: 'quote', order: 'purchase_order', mission: 'mission_sheet',
};
const VAT = 0.10;

interface Props { doc: DocData; onClose: () => void }

export default function DocumentModal({ doc, onClose }: Props) {
  const st = useSingleton('settings', {
    logo: '/logo-ouistars.png', brandName: 'OUISTARS', phone: '+33 6 51 03 03 06',
    email: 'info@ouistars.com', whatsapp: '33651030306',
  });
  const { profile } = useAuth();
  const areaRef = useRef<HTMLDivElement>(null);

  /** Journal des documents émis (collection doc_log). */
  const logDoc = (action: string, detail?: string) => {
    createEntry({
      collection: 'doc_log', title: doc.number, status: 'draft', position: 0, // draft = admins seulement (RLS)
      data: { number: doc.number, kind: doc.kind, reference: doc.reference,
        client: doc.client.name, action, detail: detail ?? '',
        by: profile?.email ?? '—', at: new Date().toISOString() },
    }).catch(() => { /* silencieux */ });
  };
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(false);

  const brand = (st.brandName as string) || 'OUISTARS';
  const title = TITLES[doc.kind];
  const items = doc.items ?? [];
  const vat = doc.vatRate ?? VAT;
  const ttc = useMemo(() => items.reduce((s, i) => s + i.qty * i.unit, 0), [items]);
  const ht = ttc / (1 + vat);

  async function downloadPdf() {
    setBusy('pdf'); setNotice(null);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: doc.reference, type: API_TYPES[doc.kind], number: doc.number }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${doc.number}.pdf`; a.click();
      logDoc('PDF téléchargé');
      URL.revokeObjectURL(url);
    } catch { setNotice('Génération PDF impossible.'); }
    finally { setBusy(null); }
  }

  function print() {
    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w || !areaRef.current) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${doc.number}</title>
      <style>body{margin:0;background:#fff}${DOC_CSS}</style></head>
      <body>${areaRef.current.outerHTML}</body></html>`);
    w.document.close();
    w.focus();
    logDoc('Impression');
    setTimeout(() => { w.print(); }, 350);
  }

  async function sendEmail() {
    if (!doc.client.email) { setNotice('Aucun e-mail client sur ce document.'); return; }
    setBusy('send'); setNotice(null);
    try {
      const res = await fetch('/api/documents/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: doc.reference, type: API_TYPES[doc.kind], to: doc.client.email }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setNotice(`✓ Envoyé à ${doc.client.email}`); logDoc('E-mail envoyé', doc.client.email); }
      else if (res.status === 501) {
        // Pas de clé e-mail serveur → repli client mail
        window.location.href = mailto();
        setNotice('Envoi serveur non configuré — brouillon ouvert dans votre messagerie.');
      } else setNotice(j.error ?? 'Échec de l’envoi.');
    } catch { setNotice('Échec de l’envoi.'); }
    finally { setBusy(null); }
  }

  const mailto = () =>
    `mailto:${doc.client.email ?? ''}?subject=${encodeURIComponent(`${title} ${doc.reference} — Oui Stars`)}` +
    `&body=${encodeURIComponent(`Bonjour ${doc.client.name},\n\nVeuillez trouver votre ${title.toLowerCase()} ${doc.number} (réf. ${doc.reference}).\n\nBien cordialement,\nOui Stars`)}`;

  const waDigits = (doc.client.phone ?? '').replace(/\D/g, '').replace(/^0/, '33');

  /** WhatsApp ne permet pas de joindre un fichier via lien : on téléverse le PDF
   *  dans le Storage (public) et on joint son URL dans le message. */
  async function shareWhatsApp() {
    setBusy('wa'); setNotice(null);
    let link = '';
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: doc.reference, type: API_TYPES[doc.kind] }),
      });
      if (res.ok && supabase) {
        const blob = await res.blob();
        const rand = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
        const path = `docs/${doc.number}-${rand}.pdf`;
        const { error } = await supabase.storage.from('cms').upload(path, blob, {
          upsert: true, contentType: 'application/pdf', cacheControl: '60',
        });
        if (!error) link = supabase.storage.from('cms').getPublicUrl(path).data.publicUrl;
      }
    } catch { /* lien absent → message texte seul */ }
    const text = encodeURIComponent(
      `Bonjour ${doc.client.name}, votre ${title.toLowerCase()} ${doc.number} (réf. ${doc.reference}) — Oui Stars.` +
      (link ? `\n\nDocument PDF : ${link}` : ''),
    );
    window.open(`https://wa.me/${waDigits}?text=${text}`, '_blank');
    logDoc('WhatsApp', doc.client.phone);
    if (!link) setNotice('PDF non joint (lien indisponible) — message texte envoyé.');
    setBusy(null);
  }

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal d-block" tabIndex={-1} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header py-2">
              <h5 className="modal-title">{title} — {doc.number}</h5>
              <div className="d-flex gap-2 align-items-center flex-wrap no-print">
                <button className="btn btn-sm btn-warning" onClick={downloadPdf} disabled={busy === 'pdf'}>
                  <i className={`bi ${busy === 'pdf' ? 'bi-hourglass-split' : 'bi-file-earmark-pdf'} me-1`} />PDF
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={print}>
                  <i className="bi bi-printer me-1" />Imprimer
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={sendEmail} disabled={busy === 'send' || !doc.client.email}
                  title={doc.client.email ? `Envoyer à ${doc.client.email}` : 'Pas d’e-mail client'}>
                  <i className={`bi ${busy === 'send' ? 'bi-hourglass-split' : 'bi-envelope'} me-1`} />Envoyer
                </button>
                {waDigits && (
                  <button className="btn btn-sm btn-outline-success" onClick={shareWhatsApp} disabled={busy === 'wa'}
                    title="Envoie le message avec le lien du PDF">
                    <i className={`bi ${busy === 'wa' ? 'bi-hourglass-split' : 'bi-whatsapp'} me-1`} />WhatsApp
                  </button>
                )}
                {doc.kind === 'mission' && (
                  <button className="btn btn-sm btn-dark" onClick={() => setWelcome(true)}>
                    <i className="bi bi-tablet-landscape me-1" />Écran d’accueil
                  </button>
                )}
                <button type="button" className="btn-close ms-1" onClick={onClose} />
              </div>
            </div>
            <div className="modal-body bg-secondary-subtle p-3">
              {notice && <div className="alert alert-info py-2 no-print">{notice}</div>}
              <style>{DOC_CSS}</style>

              <div className="osdoc" ref={areaRef}>
                <div className="osdoc__band">
                  <div className="osdoc__brand">
                    <img src={(st.logo as string) || '/logo-ouistars.png'} alt="" />
                    <div>
                      <div className="osdoc__brand-name">{brand.slice(0, 3)}<span>{brand.slice(3)}</span></div>
                      <div className="osdoc__brand-sub">PREMIUM MOBILITY • DESTINATION MANAGEMENT</div>
                    </div>
                  </div>
                  <div className="osdoc__contacts">
                    <div><b>TÉLÉPHONE</b>{st.phone as string}</div>
                    <div><b>E-MAIL</b>{st.email as string}</div>
                    <div><b>SITE WEB</b>ouistars.com</div>
                  </div>
                </div>

                <div className="osdoc__body">
                  <div className="osdoc__top">
                    <div className="osdoc__to">
                      <h5>À</h5>
                      <div className="name">{doc.client.name}</div>
                      {doc.client.phone && <div className="line">T. {doc.client.phone}</div>}
                      {doc.client.email && <div className="line">E. {doc.client.email}</div>}
                    </div>
                    <div className="osdoc__title">
                      <h2 className={title.length > 10 ? 'long' : undefined}>{title}</h2>
                      <div className="osdoc__meta">
                        <div>Date : <b>{doc.date}</b></div>
                        <div>N° document : <b>{doc.number}</b></div>
                        <div>Réf. réservation : <b>{doc.reference}</b></div>
                      </div>
                    </div>
                  </div>

                  {doc.kind === 'mission' && doc.mission ? (
                    <>
                      <div className="osdoc__mission">
                        <div className="cell"><b>DATE</b><span>{doc.mission.date || '—'}</span></div>
                        <div className="cell"><b>HEURE DE PRISE EN CHARGE</b><span>{doc.mission.time || '—'}</span></div>
                        <div className="cell"><b>DÉPART</b><span>{doc.mission.pickup || '—'}</span></div>
                        <div className="cell"><b>DESTINATION</b><span>{doc.mission.destination || '—'}</span></div>
                        <div className="cell"><b>VÉHICULE</b><span>{doc.mission.vehicle || '—'}</span></div>
                        <div className="cell"><b>CHAUFFEUR</b><span>{doc.mission.driver || 'Non assigné'}</span></div>
                        <div className="cell"><b>VOL</b><span>{doc.mission.flight || '—'}</span></div>
                        <div className="cell"><b>PASSAGERS / BAGAGES</b><span>{doc.mission.passengers ?? '—'} pax · {doc.mission.luggage ?? '—'} bagages</span></div>
                      </div>
                      {doc.mission.notes && <div className="osdoc__notes"><b>Consignes :</b> {doc.mission.notes}</div>}
                    </>
                  ) : (
                    <>
                      <table className="osdoc__table">
                        <thead>
                          <tr><th>DÉSIGNATION</th><th className="num">PRIX UNIT.</th><th className="num">QTÉ</th><th className="num">TOTAL</th></tr>
                        </thead>
                        <tbody>
                          {items.map((it, i) => (
                            <tr key={i}>
                              <td><b>{it.label}</b>{it.sub && <span className="sub">{it.sub}</span>}</td>
                              <td className="num">{it.unit.toFixed(2)} €</td>
                              <td className="num">{it.qty}</td>
                              <td className="num"><b>{(it.qty * it.unit).toFixed(2)} €</b></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="osdoc__bottom">
                        <div className="osdoc__pay">
                          <h6>Règlement</h6>
                          <div className="gold">Virement · Carte bancaire · Lien de paiement</div>
                          <h6 style={{ marginTop: 10 }}>Conditions & notes</h6>
                          <div>{doc.footNote ?? 'TVA sur le transport de personnes : 10 %. Document généré électroniquement — valable sans signature.'}</div>
                        </div>
                        <div className="osdoc__totals">
                          <div className="row"><span>Sous-total HT</span><span>{ht.toFixed(2)} €</span></div>
                          <div className="row"><span>TVA ({Math.round(vat * 100)} %)</span><span>{(ttc - ht).toFixed(2)} €</span></div>
                          <div className="osdoc__grand"><span>{doc.kind === 'quote' ? 'ESTIMATION TTC :' : 'TOTAL TTC :'}</span><span>{ttc.toFixed(2)} €</span></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="osdoc__wave">
                  <div className="gold" />
                  <div className="night">
                    <b>{doc.kind === 'quote' ? 'Merci pour votre demande' : 'Merci de votre confiance'}</b>
                    <small>Oui Stars — Premium Chauffeur Service · ouistars.com</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {welcome && doc.mission && (
        <WelcomeScreen
          clientName={doc.client.name}
          reference={doc.reference}
          flight={doc.mission.flight}
          logo={(st.logo as string) || '/logo-ouistars.png'}
          brand={brand}
          onClose={() => setWelcome(false)}
        />
      )}
    </>
  );
}

/** Écran d'accueil nominatif plein écran (tablette, paysage). */
function WelcomeScreen({ clientName, reference, flight, logo, brand, onClose }: {
  clientName: string; reference: string; flight?: string; logo: string; brand: string; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else ref.current?.requestFullscreen().catch(() => {});
  };
  return (
    <div className="oswel" ref={ref}>
      <style>{DOC_CSS}</style>
      <span className="oswel__corner tl" /><span className="oswel__corner tr" />
      <span className="oswel__corner bl" /><span className="oswel__corner br" />
      <div className="oswel__bar no-print">
        <button onClick={toggleFs}><i className="bi bi-arrows-fullscreen me-1" />Plein écran</button>
        <button onClick={onClose}><i className="bi bi-x-lg" /></button>
      </div>
      <div className="oswel__brandrow">
        <img className="oswel__logo" src={logo} alt="" />
        <div className="oswel__brand">{brand.slice(0, 3)}<span>{brand.slice(3)}</span></div>
      </div>
      <div className="oswel__hello">WELCOME · BIENVENUE</div>
      <div className="oswel__name">{clientName}</div>
      <div className="oswel__rule" />
      <div className="oswel__sub">Votre chauffeur vous attend · Your chauffeur is waiting</div>
      <div className="oswel__ref">Réf. {reference}{flight && flight !== 'No flight' ? ` · Vol ${flight}` : ''}</div>
      <div className="oswel__foot">PREMIUM MOBILITY · DESTINATION MANAGEMENT · EVENT SOLUTIONS</div>
    </div>
  );
}
