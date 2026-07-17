import { supabase } from '@/lib/supabase';
import type { CmsEntry } from './types';

function db() {
  if (!supabase) throw new Error('Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  return supabase;
}

export async function listEntries(collection: string): Promise<CmsEntry[]> {
  const { data, error } = await db()
    .from('cms_entries')
    .select('*')
    .eq('collection', collection)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CmsEntry[];
}

export async function getEntry(id: string): Promise<CmsEntry | null> {
  const { data, error } = await db().from('cms_entries').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as CmsEntry) ?? null;
}

export interface EntryInput {
  collection: string;
  title?: string | null;
  slug?: string | null;
  status?: 'draft' | 'published';
  position?: number;
  data: Record<string, unknown>;
}

export async function createEntry(input: EntryInput): Promise<CmsEntry> {
  const { data, error } = await db().from('cms_entries').insert(input).select('*').single();
  if (error) throw error;
  return data as CmsEntry;
}

export async function updateEntry(id: string, patch: Partial<EntryInput>): Promise<CmsEntry> {
  const { data, error } = await db()
    .from('cms_entries')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as CmsEntry;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await db().from('cms_entries').delete().eq('id', id);
  if (error) throw error;
}

/* ————— Singletons ————— */
export async function getSingleton(key: string): Promise<Record<string, unknown>> {
  const { data, error } = await db().from('cms_singletons').select('data').eq('key', key).maybeSingle();
  if (error) throw error;
  return (data?.data as Record<string, unknown>) ?? {};
}

export async function saveSingleton(key: string, value: Record<string, unknown>): Promise<void> {
  const { error } = await db()
    .from('cms_singletons')
    .upsert({ key, data: value, updated_at: new Date().toISOString() });
  if (error) throw error;
}
