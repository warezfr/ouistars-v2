// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientPicker from '@/admin/ui/ClientPicker';
import NewInvoiceModal from '@/admin/documents/NewInvoiceModal';
import NewQuoteModal from '@/admin/documents/NewQuoteModal';

/**
 * Back-office — création de devis & factures avec saisie assistée du client :
 * - ClientPicker : suggestions depuis l'annuaire, préremplissage à la sélection ;
 * - NewInvoiceModal : émission RPC (lignes, TVA, fiche client auto-créée) ;
 * - NewQuoteModal : insertion `quotes` + rattachement de la fiche existante.
 */

/* ————— Fausse base Supabase (chaînable, journalise les écritures) ————— */
vi.mock('@/lib/supabase', () => {
  const state = {
    tables: {
      clients: [{
        id: 'c-1', name: 'Amel Karim', company: 'Karim & Co', email: 'amel@ex.com',
        phone: '+33 6 11 22 33 44', address: '1 rue de la Paix, Paris', created_at: '2026-05-01',
      }],
      website_bookings: [{
        first_name: 'Paul', last_name: 'Rey', email: 'paul@ex.com', phone: '06 55 66 77 88',
        price_amount: 120, created_at: '2026-06-01',
      }],
      etg_orders: [],
      quotes: [],
    } as Record<string, Record<string, unknown>[]>,
    rpc: [] as Array<[string, Record<string, unknown>]>,
    inserts: [] as Array<[string, Record<string, unknown>]>,
    updates: [] as Array<[string, Record<string, unknown>]>,
  };
  const NEW_IDS: Record<string, string> = { clients: 'c-77', quotes: 'q-9' };

  function makeQuery(table: string) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const q: any = {
      select: () => q,
      eq: (k: string, v: unknown) => { q._eq = [k, v]; return q; },
      ilike: (k: string, v: string) => { q._ilike = [k, v]; return q; },
      not: () => q,
      insert: (payload: Record<string, unknown>) => { state.inserts.push([table, payload]); q._inserted = true; return q; },
      update: (payload: Record<string, unknown>) => { state.updates.push([table, payload]); return q; },
      limit: async () => {
        let rows = state.tables[table] ?? [];
        if (q._ilike) {
          const [k, v] = q._ilike;
          rows = rows.filter((r) => String(r[k] ?? '').toLowerCase() === String(v).toLowerCase());
        }
        return { data: rows };
      },
      maybeSingle: async () => {
        if (q._eq) {
          const [k, v] = q._eq;
          return { data: (state.tables[table] ?? []).find((r) => r[k] === v) ?? null };
        }
        return { data: null };
      },
      single: async () => q._inserted
        ? { data: { id: NEW_IDS[table] ?? 'x-1' }, error: null }
        : { data: null, error: null },
      then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }), // update().eq() await
    };
    return q;
  }

  const supabase = {
    from: (table: string) => makeQuery(table),
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
      state.rpc.push([fn, args]);
      return { data: { id: 'inv-9', number: 'FA-2026-0007' }, error: null };
    }),
    storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  };
  return { supabase, hasSupabase: true, __state: state };
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — export de test du mock
import { __state as db } from '@/lib/supabase';

beforeEach(() => {
  db.rpc.length = 0; db.inserts.length = 0; db.updates.length = 0;
  globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
});

/* ————— ClientPicker ————— */
describe('ClientPicker (saisie assistée)', () => {
  it('suggère les clients connus et préremplit tous les champs à la sélection', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<ClientPicker value={{ name: '' }} onChange={onChange} />);
    const name = screen.getByPlaceholderText(/Nom du client/);
    fireEvent.change(name, { target: { value: 'am' } });
    rerender(<ClientPicker value={{ name: 'am' }} onChange={onChange} />);

    await waitFor(() => expect(screen.getByText(/Amel Karim/)).toBeTruthy());
    expect(screen.getByText('Fiche')).toBeTruthy(); // badge fiche réelle

    fireEvent.mouseDown(screen.getByText(/Amel Karim/));
    const filled = onChange.mock.calls.at(-1)![0];
    expect(filled).toMatchObject({ id: 'c-1', name: 'Amel Karim', email: 'amel@ex.com', phone: '+33 6 11 22 33 44' });
  });

  it("client agrégé des réservations (sans fiche) : suggéré, badge résa", async () => {
    const onChange = vi.fn();
    render(<ClientPicker value={{ name: 'paul' }} onChange={onChange} />);
    fireEvent.focus(screen.getByPlaceholderText(/Nom du client/)); // ouvre la liste
    await waitFor(() => expect(screen.getByText(/Paul Rey/)).toBeTruthy());
    expect(screen.getByText('1 résa')).toBeTruthy();
  });
});

/* ————— Nouvelle facture ————— */
describe('NewInvoiceModal', () => {
  it('émet via RPC : lignes multiples, TVA choisie, fiche client auto-créée', async () => {
    const onCreated = vi.fn();
    render(<NewInvoiceModal onClose={() => {}} onCreated={onCreated} />);

    fireEvent.change(screen.getByPlaceholderText(/Nom du client/), { target: { value: 'Nouvelle Cliente' } });
    fireEvent.change(screen.getByPlaceholderText('client@exemple.com'), { target: { value: 'new@ex.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Désignation \*/), { target: { value: 'Mise à disposition journée' } });
    fireEvent.change(screen.getByPlaceholderText('Qté'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText(/Prix unit/), { target: { value: '300' } });
    // TVA 20 %
    fireEvent.change(screen.getByDisplayValue(/10 % — transport/), { target: { value: '0.20' } });

    expect(screen.getAllByText(/600\.00 €/).length).toBeGreaterThan(0); // total ligne + pied de modal

    fireEvent.click(screen.getByRole('button', { name: /Émettre la facture/ }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('inv-9'));

    // Fiche client créée automatiquement (inconnue de l'annuaire).
    const clientIns = db.inserts.find(([t]) => t === 'clients');
    expect(clientIns?.[1]).toMatchObject({ name: 'Nouvelle Cliente', email: 'new@ex.com' });

    // RPC d'émission : montant, lignes, TVA, source manuelle, fiche rattachée.
    const [fn, args] = db.rpc[0];
    expect(fn).toBe('issue_invoice');
    expect(args).toMatchObject({
      p_source: 'manual', p_amount: 600, p_vat_rate: 0.20, p_client_id: 'c-77',
      p_client_name: 'Nouvelle Cliente',
    });
    expect(args.p_items).toEqual([{ label: 'Mise à disposition journée', sub: undefined, qty: 2, unit: 300 }]);
    expect(String(args.p_reference)).toMatch(/^MAN-\d{4}-[0-9A-F]{6}$/);
  });

  it('sans ligne valide : erreur explicite, aucune émission', async () => {
    render(<NewInvoiceModal onClose={() => {}} onCreated={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Nom du client/), { target: { value: 'X Y' } });
    fireEvent.click(screen.getByRole('button', { name: /Émettre la facture/ }));
    await waitFor(() => expect(screen.getByText(/au moins une ligne/)).toBeTruthy());
    expect(db.rpc.length).toBe(0);
  });
});

/* ————— Nouveau devis ————— */
describe('NewQuoteModal', () => {
  it('client existant sélectionné → devis rattaché à sa fiche (client_id)', async () => {
    const onCreated = vi.fn();
    render(<NewQuoteModal onClose={() => {}} onCreated={onCreated} />);

    fireEvent.change(screen.getByPlaceholderText(/Nom du client/), { target: { value: 'amel' } });
    await waitFor(() => expect(screen.getByText(/Amel Karim/)).toBeTruthy());
    fireEvent.mouseDown(screen.getByText(/Amel Karim/));
    await waitFor(() => expect(screen.getByText(/Fiche client existante/)).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText(/Mariage, Roadshow/), { target: { value: 'Roadshow' } });
    fireEvent.change(screen.getByPlaceholderText('Optionnel'), { target: { value: '2400' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer le devis/ }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('q-9'));
    const quoteIns = db.inserts.find(([t]) => t === 'quotes');
    expect(quoteIns?.[1]).toMatchObject({
      contact_name: 'Amel Karim', company: 'Karim & Co', email: 'amel@ex.com',
      event_type: 'Roadshow', amount_estimated: 2400, channel: 'backoffice', status: 'new',
      client_id: 'c-1', // fiche existante retrouvée — pas de doublon créé
    });
    expect(db.inserts.some(([t]) => t === 'clients')).toBe(false);
    expect(String(quoteIns?.[1].reference)).toMatch(/^DEV-\d{4}-[0-9A-F]{6}$/);
  });

  it('prestation manquante → erreur, aucune insertion', async () => {
    render(<NewQuoteModal onClose={() => {}} onCreated={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Nom du client/), { target: { value: 'Quelqu’un' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer le devis/ }));
    await waitFor(() => expect(screen.getByText(/Précisez la prestation/)).toBeTruthy());
    expect(db.inserts.length).toBe(0);
  });
});
